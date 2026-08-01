---
phase: 01-foundation-guest-mode
plan: 06
subsystem: auth
tags: [keycloak, oidc, pkce, spring-security, jwt, react, tanstack-query, tanstack-table, kotlin, jpa, hibernate, postgresql, csv, sla, audit-log]

requires:
  - phase: 01-foundation-guest-mode (plan 03)
    provides: Submission entity/repository/service, SubmissionStatus, forms catalog
  - phase: 01-foundation-guest-mode (plan 05)
    provides: PDF/A-1b confirmation endpoints + ConfirmationPreview/ConfirmationDownload admin-web components
provides:
  - Keycloak OIDC (Authorization Code + PKCE) resource-server auth for the admin API and admin-web SPA
  - Clerk role-gated admin submissions dashboard (list/filter/sort/paginate, detail, state change, CSV export, SLA badges)
  - Append-only status-change audit trail
  - Declarative Keycloak realm import (zero manual Admin Console steps)
affects: [01-07-citizen-web-mvp, any future phase touching Submission persistence or admin-web auth]

tech-stack:
  added:
    - "spring-boot-starter-security + spring-boot-starter-oauth2-resource-server (backend JWT validation)"
    - "org.jetbrains.kotlin.plugin.jpa (Kotlin JPA compiler plugin - see Deviations)"
    - "keycloak-js (admin-web PKCE session)"
  patterns:
    - "SpEL boolean-literal null-checks in Spring Data @Query strings (:#{#param == null} = true OR ...) instead of bare `:param IS NULL` - required for Postgres to type-infer ambiguous optional filter params"
    - "@JdbcTypeCode(SqlTypes.JSON) on Hibernate-mapped jsonb String columns"
    - "Capture pre-mutation entity state into a local val before calling repository.save() on a shared managed instance (Hibernate merge mutates the loaded instance in place)"
    - "Module-level auth token holder (authToken.ts) bridging a React Context (AuthProvider) and a module-scope axios instance created outside any component"

key-files:
  created:
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/config/SecurityConfig.kt
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/admin/domain/{SlaStatus,SubmissionAdminView,SubmissionAuditLog}.kt
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/admin/repository/{AdminSubmissionRepository,SubmissionAuditLogRepository}.kt
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/admin/service/{AdminSubmissionService,CsvExportService}.kt
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/admin/api/AdminSubmissionController.kt
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/admin/api/dto/*.kt
    - apps/backend/backend/src/main/resources/db/changelog/v1.2.0__admin_audit_log.yaml
    - keycloak/realm-portal.json
    - apps/admin-web/src/features/auth/{AuthProvider,LoginPage,RequireClerk,authToken}.tsx|ts
    - apps/admin-web/src/features/submissions/components/{SubmissionsTable,SubmissionDetailPanel,StateChangeModal,CsvExportButton}.tsx
    - apps/admin-web/src/features/submissions/{api/adminSubmissionsApi.ts,hooks/useSubmissions.ts,types/admin.ts}
    - apps/admin-web/src/components/ui/BroumyTextarea.tsx
  modified:
    - apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/domain/{Submission,SubmissionStatus}.kt
    - apps/backend/build.gradle.kts, apps/backend/backend/build.gradle.kts
    - apps/admin-web/src/{App.tsx,main.tsx,api/client.ts,components/Layout.tsx,i18n/index.ts}
    - apps/admin-web/src/pages/SubmissionsPage.tsx
    - docker-compose.yml

key-decisions:
  - "Design system components used: BroumySelect/BroumyModal/BroumyTextarea/BroumyAlert/BroumyButton (plan text said Gov* - stale per STATE.md 2026-08-01 Broumy decision)"
  - "New BroumyTextarea.tsx component added (didn't exist yet) following BroumyInput's exact pattern"
  - "SLA computed at read time (createdAt + 30 days, no new DB column) instead of a stored due_at column - simpler, no backfill needed, still satisfies the 4-tier risk badge requirement"
  - "CSV export hand-written (no kotlinx-csv/other library added) - T-06-SC minimizes new dependency surface for a small, well-understood format"
  - "Keycloak realm import fully automated per explicit user instruction - no user_setup checkpoint"
  - "MFA for clerks (T-06-01) deferred - enforcing it would require an interactive TOTP enrollment flow that contradicts full automation of the seeded test user for this plan; tracked as a follow-up"

patterns-established:
  - "Admin-only REST namespace /api/admin/** secured by SecurityConfig + @PreAuthorize('hasRole(CLERK)') in depth, separate from public /api/submissions|forms|address"
  - "Realm import via docker-compose volume mount + --import-realm for reproducible local Keycloak setup"

requirements-completed: [FR-10, FR-10.1]

coverage:
  - id: D1
    description: "Clerk authenticates via Keycloak OIDC (Authorization Code + PKCE) and reaches the submissions dashboard; ROLE_CLERK required on the whole /api/admin/** namespace"
    requirement: "FR-10"
    verification:
      - kind: integration
        ref: "Live e2e against real Keycloak 26 + Postgres: password-grant + full PKCE token issuance verified to carry realm_access.roles=[clerk]; curl 401 without token, 200 with token, against a running backend"
        status: pass
      - kind: unit
        ref: "AdminSubmissionControllerTest (backend, 6 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Submissions dashboard: paginated/sortable/filterable (status multi-select, formKey, date range, tracking-code/email search) with SLA risk badges"
    requirement: "FR-10"
    verification:
      - kind: unit
        ref: "SubmissionsPage.test.tsx (5 tests, incl. axe-core 0 violations)"
        status: pass
      - kind: integration
        ref: "Live GET /api/admin/submissions against real Postgres with a seeded row - SLA/status fields verified in the JSON response"
        status: pass
    human_judgment: false
  - id: D3
    description: "Clerk state changes (SUBMITTED->PROCESSING->COMPLETED/REJECTED/NEEDS_INFO) server-validated, mandatory audit comment, immutable audit trail with clerk id/username/timestamp"
    requirement: "FR-10.1"
    verification:
      - kind: unit
        ref: "AdminSubmissionControllerTest > state change with valid/invalid transition, missing comment"
        status: pass
      - kind: integration
        ref: "Live PATCH .../state twice against real Postgres - verified correct old/new status and clerk UUID/username persisted in submission_audit_log"
        status: pass
    human_judgment: false
  - id: D4
    description: "Streaming CSV export, UTF-8 BOM, Czech date format, filtered to match the visible table"
    requirement: "FR-10.1"
    verification:
      - kind: unit
        ref: "CsvExportServiceTest (5 tests: BOM, header, Czech date, SLA label, RFC4180 escaping)"
        status: pass
      - kind: integration
        ref: "Live GET /api/admin/submissions/export against real Postgres - byte-verified BOM + Czech header + Czech-formatted row"
        status: pass
    human_judgment: false
  - id: D5
    description: "Keycloak realm/role/clients/seeded clerk user fully reproducible via `docker compose up` alone, no manual Admin Console steps"
    verification:
      - kind: integration
        ref: "keycloak/realm-portal.json - verified via fresh `docker compose down -v && up`, DB row checks (realm/user/role-mapping/clients), and full PKCE token exchange"
        status: pass
    human_judgment: false
  - id: D6
    description: "WCAG 2.1 AA on the new admin surfaces (login, access-denied, submissions dashboard, state-change modal)"
    verification:
      - kind: unit
        ref: "LoginPage.test.tsx > passes axe-core WCAG 2.1 AA checks; SubmissionsPage.test.tsx > passes axe-core WCAG 2.1 AA checks"
        status: pass
    human_judgment: false

duration: ~3h
completed: 2026-08-01
status: complete
---

# Phase 1 Plan 06: Admin Web MVP Summary

**Keycloak OIDC (PKCE) clerk auth + a full admin submissions dashboard (SLA badges, state machine, audit trail, streaming CSV export) - built against a fully-automated, zero-manual-step Keycloak realm import, and hardened through live end-to-end verification against real Postgres and Keycloak rather than mocked tests alone.**

## Performance

- **Started:** 2026-08-01 ~18:50 (session start)
- **Completed:** 2026-08-01 20:38
- **Commits:** 5 (`2f79cbe`, `53ddc1e`, `bdc904b`, `c338a5b`, `94d1761`)
- **Files created/modified:** ~45

## Accomplishments

- **Backend security:** `spring-boot-starter-security` + `oauth2-resource-server` validating Keycloak bearer JWTs; `/api/admin/**` requires the `clerk` realm role (mapped from `realm_access.roles` → `ROLE_CLERK`), everything else stays public.
- **Admin submissions REST API:** `GET /api/admin/submissions` (multi-status/formKey/date-range/free-text filter, server-side sort+paginate), `GET /{id}` (full detail + audit history + valid next states), `PATCH /{id}/state` (server-validated transition, mandatory audit comment), `GET /export` (streaming CSV).
- **Server-side state machine:** `SUBMITTED → PROCESSING → COMPLETED/REJECTED/NEEDS_INFO`, `NEEDS_INFO → PROCESSING/REJECTED`; anything else is rejected with 409, regardless of client input.
- **Immutable audit trail:** `submission_audit_log` table (clerk id/username from the JWT, old/new status, mandatory comment, timestamp) — never updated, only appended.
- **SLA risk badges:** computed at read time (createdAt + 30-day default administrative deadline) → `OK` / `DUE_THIS_WEEK` / `DUE_TODAY` / `OVERDUE` / `CLOSED`, no schema change needed.
- **Streaming CSV export:** hand-written writer (no new dependency), UTF-8 BOM, `;`-delimited, Czech `dd. MM. yyyy HH:mm` dates and status/SLA labels, RFC4180 escaping, cursor-backed `Stream<Submission>` so a 10k-row export never buffers in memory.
- **Keycloak, fully automated:** `keycloak/realm-portal.json` declares the `portal` realm, the `clerk` realm role, the `admin-web` public PKCE client, the `portal-backend` bearer-only client, and a seeded test clerk user — wired into `docker-compose.yml` via `--import-realm`. `docker compose up` alone reproduces the whole auth stack.
- **Admin-web auth:** `AuthProvider` (keycloak-js, Authorization Code + PKCE, silent-SSO check, in-memory-only token, proactive refresh), `RequireClerk` route guard (loading/login/access-denied/protected states), wired into `App.tsx`/`Layout.tsx` (real username + working logout).
- **Admin submissions dashboard:** `SubmissionsTable` (sortable columns with `aria-sort`, SLA/status badges, keyboard row navigation, live-region SLA summary), `SubmissionDetailPanel` (slide-over with form data, audit history, embedded Plan 05 confirmation preview/download), `StateChangeModal` (restricted to the server's `validNextStates`, mandatory comment), `CsvExportButton`.
- **Live end-to-end verification** against a real running Keycloak 26 + Postgres + Spring Boot stack (not just mocked unit tests) — this is what surfaced and let me fix five real, load-bearing bugs (see Deviations) that every prior plan's mocked-repository tests had never caught.

## Task Commits

1. **Keycloak resource server + status workflow** — `2f79cbe` (feat)
2. **Admin submissions REST API + tests** — `53ddc1e` (feat)
3. **Keycloak realm automation + live-verification bugfixes** — `bdc904b` (feat/fix)
4. **Admin-web Keycloak PKCE auth + i18n namespace fix** — `c338a5b` (feat/fix)
5. **Admin submissions dashboard (table/detail/state-change/CSV)** — `94d1761` (feat)

## Files Created/Modified

See frontmatter `key-files`. Full list also visible via `git show --stat` on the five commits above.

## Decisions Made

- **Design system:** used the real Broumy components (`BroumySelect`, `BroumyModal`, `BroumyAlert`, `BroumyButton`) and added `BroumyTextarea` (didn't exist yet) rather than the plan's stale `Gov*` names — per STATE.md's 2026-08-01 Broumy decision.
- **SLA:** computed at read time from a fixed 30-day default (Czech administrative procedure code deadline) instead of a stored `due_at` column — simpler, no migration/backfill, still satisfies the 4-tier badge requirement. Per-form configurable deadlines deferred.
- **CSV export:** hand-written streaming writer instead of adding `kotlinx-csv` (or similar) — keeps new dependency surface minimal for a well-understood, small format (T-06-SC).
- **Keycloak automation:** fully declarative realm import per explicit user instruction (no manual Admin Console `user_setup` checkpoint). Seeded credentials: `jana.klerkova` / `Klerk123!` (realm role `clerk`).
- **MFA for clerks (T-06-01):** deferred. Enforcing it here would require an interactive TOTP enrollment step for the seeded test user, which contradicts the "no manual steps" automation goal for this plan. Tracked as a follow-up alongside per-form SLA config.

## Deviations from Plan

Plan frontmatter had stale file paths (no `apps/` monorepo prefix, gov.cz component names) — translated per the critical-facts brief, no separate write-up needed for that mechanical part. Substantive deviations below, in the order discovered:

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nullable admin-filter query params broke Postgres type inference**
- **Found during:** Live verification of `GET /api/admin/submissions` against real Postgres.
- **Issue:** `AdminSubmissionRepository`'s HQL used bare `(:formKey IS NULL OR s.formKey = :formKey)`-style checks for `formKey`/`from`/`to`/`query`. Postgres's extended query protocol can't infer a type for an isolated `? IS NULL` comparison — it either mis-infers `bytea` (breaking `LOWER()`) or fails outright with "could not determine data type of parameter".
- **Fix:** Moved each null-check into a SpEL boolean literal (`:#{#formKey == null} = true OR ...`), matching the pattern already used for `:statuses`; added `CAST(:query AS string)` inside the `CONCAT`/`LOWER` search expression.
- **Files modified:** `AdminSubmissionRepository.kt`.
- **Verification:** Live `GET /api/admin/submissions?formKey=...&q=...` against real Postgres returns 200 with correct filtering; unit tests unaffected (they mock the repository, so this class of bug was invisible to them).

**2. [Rule 1 - Bug] `Submission.formData` had no JDBC type hint for jsonb**
- **Found during:** Live `PATCH .../state` against real Postgres.
- **Issue:** Hibernate bound the `jsonb`-columned `formData` field as plain `varchar`. Postgres tolerates the implicit cast on `INSERT` but rejects it on `UPDATE` ("column form_data is of type jsonb but expression is of type character varying") — silently breaking every status change, a Plan 03 regression only visible once a row is actually re-saved against a real database.
- **Fix:** Added `@JdbcTypeCode(SqlTypes.JSON)` to `Submission.formData`.
- **Files modified:** `Submission.kt`.
- **Verification:** Live two-step state transition (SUBMITTED→PROCESSING→COMPLETED) against real Postgres succeeded; `AdminSubmissionControllerTest`/`SubmissionControllerTest` (mocked) unaffected either way.

**3. [Rule 1 - Bug] Missing `kotlin("plugin.jpa")` compiler plugin — every entity read of ≥1 row failed**
- **Found during:** Live `GET /api/admin/submissions` after inserting a test row (and, separately, `POST /api/submissions`).
- **Issue:** Neither `build.gradle.kts` applied the Kotlin JPA compiler plugin, which generates the synthetic no-arg constructor Hibernate needs for `@Entity` data classes with non-default-valued properties. Every query returning ≥1 row failed with `org.hibernate.InstantiationException: No default constructor for entity`. This affected the *entire* Submission read/write path, not just Plan 06 — meaning no prior plan's Submission persistence had ever actually been exercised against a real database (all prior tests mock the repository).
- **Fix:** Added `id("org.jetbrains.kotlin.plugin.jpa")` to both the root and `backend` module `build.gradle.kts`.
- **Files modified:** `apps/backend/build.gradle.kts`, `apps/backend/backend/build.gradle.kts`.
- **Verification:** Live list/detail/create/update against real Postgres all succeeded after the fix; full backend test suite (50 tests) still green.

**4. [Rule 1 - Bug] Audit log recorded no-op transitions (oldStatus == newStatus)**
- **Found during:** Live two-step state transition, inspecting `submission_audit_log` rows directly.
- **Issue:** `AdminSubmissionService.changeState` read `submission.status` (for the audit log's `oldStatus`) *after* calling `submissionRepository.save(updated)`. Because `submission` and `updated` share the same `@Id`, Hibernate's merge mutates the already-loaded managed instance backing `submission` in place — even though it's a Kotlin `val` — so "old" silently became "new" (e.g. every entry logged `PROCESSING → PROCESSING` instead of `SUBMITTED → PROCESSING`).
- **Fix:** Captured `previousStatus` into a local `val` immediately after loading the entity, before any `save()` call.
- **Files modified:** `AdminSubmissionService.kt`.
- **Verification:** Live two-step transition against real Postgres produced correct `SUBMITTED → PROCESSING` then `PROCESSING → COMPLETED` audit rows with the real clerk UUID.

**5. [Rule 1 - Bug] Keycloak JWTs never carried a `sub` claim**
- **Found during:** Decoding a real password-grant token to verify `clerkId`/`clerkUsername` extraction.
- **Issue:** Reproducible even against Keycloak's own built-in `admin-cli` client — the imported `portal` realm never set realm-level `defaultDefaultClientScopes`, so no client got the built-in `basic` client scope, which is what actually carries the `oidc-sub-mapper`. (An earlier attempt to fix this by adding a literal `"openid"` entry to `admin-web`'s `defaultClientScopes` had no effect — `"openid"` isn't a real named Keycloak client scope, it's implicit to the OIDC protocol.)
- **Fix:** Added `defaultDefaultClientScopes`/`defaultOptionalClientScopes` at the realm level (including `basic`), and added `basic` explicitly to `admin-web`'s own `defaultClientScopes` override.
- **Files modified:** `keycloak/realm-portal.json`.
- **Verification:** Fresh `docker compose down -v && up` + full PKCE/password-grant token decode confirmed `sub` present; `AdminSubmissionService.changeState`'s `clerk_id` audit column then correctly recorded the real UUID instead of the `"unknown"` fallback.

**6. [Rule 3 - Blocking] `./gradlew bootRun` couldn't start — missing `BuildProperties` bean**
- **Found during:** First attempt to run the backend locally for live verification.
- **Issue:** `HealthController` requires a `BuildProperties` bean that packaged jars get for free but `bootRun` doesn't, without the `bootBuildInfo` Gradle task wired in.
- **Fix:** Added `springBoot { buildInfo() }` to `apps/backend/backend/build.gradle.kts`.
- **Files modified:** `apps/backend/backend/build.gradle.kts`.
- **Verification:** `./gradlew bootRun` now starts successfully; used for all subsequent live verification in this plan.

**7. [Rule 1 - Bug, app-wide] Broken i18n namespace configuration — every namespaced `t()` call rendered raw keys**
- **Found during:** First run of `LoginPage.test.tsx`/`RequireClerk.test.tsx` asserting on actual Czech text.
- **Issue:** `i18n/index.ts` wrapped every translation key under a single `translation` namespace (`resources: { cs: { translation: cs } }`), but every page (`DashboardPage`, `Layout`, the new `LoginPage`/`RequireClerk`) calls `useTranslation('auth')`/`useTranslation('dashboard')`/etc. expecting each top-level key in `cs.json`/`en.json` to be its own namespace — which they already structurally are. Every namespaced `t()` call across the *entire app* silently rendered the raw key instead of translated text; this predates Plan 06 but was undetected because no prior test asserted on translated output.
- **Fix:** Pass `cs`/`en` directly as the per-language resource bundle (already namespace-shaped) instead of wrapping in `{ translation: ... }`; added `defaultNS`/`ns`.
- **Files modified:** `apps/admin-web/src/i18n/index.ts`.
- **Verification:** `LoginPage.test.tsx`/`RequireClerk.test.tsx` assert real Czech strings and pass; existing tests (which never checked translated text) unaffected.

**8. [Rule 1 - Bug] Non-functional per-status/SLA badge CSS classes**
- **Found during:** Writing `SubmissionsTable`/`SubmissionDetailPanel`.
- **Issue:** The Plan 03 `SubmissionList.tsx` (now removed) built badge classes as `badge-${status.toLowerCase()}` (e.g. `badge-in_progress`), but `broumy-theme.css` only defines generic `badge-primary/secondary/success/warning/error/info/neutral`. Those per-status classes never matched any rule.
- **Fix:** New components map each `SubmissionStatus`/`SlaStatus` explicitly to one of the real generic badge classes.
- **Files modified:** `SubmissionsTable.tsx`, `SubmissionDetailPanel.tsx` (new files; the old broken code was deleted, not patched).

---

**Total deviations:** 8 auto-fixed (7 Rule 1 bugs, 1 Rule 3 blocking issue). **Impact on plan:** all were necessary for the admin dashboard to function against a real database/Keycloak instance rather than only against mocks; several (items 2, 3, 7) were latent, app-wide defects from earlier plans that this plan's live end-to-end verification was the first to exercise. No scope creep — no feature beyond the plan's `must_haves` was added.

## Issues Encountered

- **Keycloak's `KC_BOOTSTRAP_ADMIN_USER`/`PASSWORD` env vars don't create a persistent `admin` user in this Keycloak 26.0.8 image/config** (a `temp-admin` is created instead, reproducible even without any of my realm changes on a completely vanilla `start-dev`). Pre-existing, unrelated to Plan 06's scope — the realm import itself works correctly and doesn't depend on the master-realm admin at all. Verified realm/role/client/user state via direct Postgres queries instead of the Admin Console/API. Logged as a deferred item below.
- **`docker-compose.yml`'s Keycloak healthcheck uses `curl`, which isn't present in the `keycloak:26.0` image** — pre-existing (unrelated to this plan's changes), makes `docker compose ps` show the container as unhealthy even though it's fully functional. Confirmed by checking `docker exec portal-keycloak which curl` (not found).

## Known Stubs / Deferred Items

- **MFA for clerks (T-06-01 disposition: mitigate)** — not enforced in this plan; would need an interactive TOTP enrollment step that conflicts with fully-automated realm seeding. Follow-up: either a scripted TOTP secret provisioning via Keycloak's admin REST API, or accept password-only auth behind the network perimeter for the pilot and revisit before wider clerk rollout.
- **Per-form SLA deadlines** — currently a single realm-wide 30-day default; the `info-request` form and any future forms with different statutory deadlines will need per-`formKey` configuration.
- **Rate limiting on `/api/admin/**`** — not added this plan; tracked alongside the Plan 05 T-05-04 rate-limit follow-up for the public confirmation/PDF endpoints.
- **Keycloak `KC_BOOTSTRAP_ADMIN_USER` not producing a persistent admin** and **missing `curl` in the Keycloak image breaking the compose healthcheck** — both pre-existing infra issues, unrelated to this plan, logged here for visibility.

## User Setup Required

None — Keycloak realm/role/clients/test user are fully provisioned by `docker compose up` via `keycloak/realm-portal.json` (`--import-realm`). Seeded credentials: username `jana.klerkova`, password `Klerk123!`, realm role `clerk`.

## Next Phase Readiness

- Backend `/api/admin/**` and the admin-web dashboard are functionally complete and verified end-to-end against a real Keycloak + Postgres stack, not just mocks.
- **Plan 07 (Citizen Web MVP)** is next (Wave 4) — no direct dependency on this plan's admin surface, but should reuse the now-fixed `i18n/index.ts` namespace configuration and the `kotlin("plugin.jpa")` Gradle fix if it touches any JPA entities.
- Backend: 50/50 tests passing (`./gradlew test`). Admin-web: 29/29 tests passing, typecheck/lint/build all clean (`npm run typecheck && npm run lint && npm run test && npm run build`).

## Commands to Verify Locally

```bash
# Backend
cd apps/backend && ./gradlew test

# Admin Web
cd apps/admin-web && npm run lint && npm run typecheck && npm run test && npm run build

# Full stack (Keycloak + Postgres + backend + admin-web dev server)
docker compose up -d postgres keycloak
cd apps/backend && DATABASE_URL=jdbc:postgresql://localhost:5432/portal DATABASE_USER=portal \
  DATABASE_PASSWORD=portal KEYCLOAK_ISSUER_URI=http://localhost:8080/realms/portal ./gradlew bootRun
cd apps/admin-web && npm run dev   # http://localhost:3000, login: jana.klerkova / Klerk123!
```

---
*Phase: 01-foundation-guest-mode*
*Completed: 2026-08-01*
