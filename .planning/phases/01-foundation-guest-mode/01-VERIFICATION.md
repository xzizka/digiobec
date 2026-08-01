---
phase: 01-foundation-guest-mode
verified: 2026-08-01T19:32:50Z
status: gaps_found
score: 3/5 acceptance criteria fully verified (2 more partially/not met)
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "Autocomplete adresy funguje pro 95 % adres RÚIAN"
    status: failed
    reason: "RuianClient targets an unregistered, unconfirmed URL (https://api.ruian.cz, guessed default) with an empty API key (ruian.api-key defaults to \"\"). Every call fails/returns nothing and the service silently falls back to a hard-coded 7-address list (Broumy/Beroun/Praha only). Backend tests mock RuianClient entirely — the real network path has never been exercised, and there is no evidence it would work even if exercised (URL not verified against ČÚZK's actual API contract)."
    artifacts:
      - path: "apps/backend/backend/src/main/kotlin/cz/obec/portal/ruian/client/RuianClient.kt"
        issue: "Default base URL is a guess, not a verified ČÚZK endpoint; no API key ever provisioned (STATE.md Open Questions still lists RÚIAN API access as unresolved)"
      - path: "apps/backend/backend/src/main/kotlin/cz/obec/portal/ruian/service/AddressAutocompleteService.kt"
        issue: "FALLBACK_ADDRESSES is a 7-entry hard-coded list — this is the address coverage actually delivered, not 95% of Czech addresses"
    missing:
      - "Register with ČÚZK RÚIAN API, obtain real endpoint + API key, and prove at least one live suggest() call against the real service"
      - "Or formally descope this AC for Phase 1 and replace with an honest interim AC (e.g. 'local demo dataset covers the pilot municipality')"
  - truth: "CI/CD: build, test, deploy do staging za < 15 min"
    status: failed
    reason: "cd.yml's deploy-staging job only echoes strings; the kubectl commands that would actually deploy are commented out. No staging environment is ever actually updated, so there is nothing to time against the < 15 min target."
    artifacts:
      - path: ".github/workflows/cd.yml"
        issue: "deploy-staging step body is 'echo \"Deploy to staging environment\"' + commented-out kubectl lines"
    missing:
      - "A real deploy target (even a minimal one: docker-compose over SSH, a single k8s manifest apply, or a PaaS webhook) with an actual health check gate"
      - "A measured end-to-end pipeline duration against the < 15 min target"
missing_backup_pattern_finding:
  - "apps/mobile/integration_test/health_test.dart is referenced by .github/workflows/ci.yml's `integration` job but the file/directory does not exist in the repo. The step is written as `flutter test integration_test/health_test.dart -d linux || echo \"Integration test requires emulator - skipped in CI\"` — the `|| echo` swallows the failure unconditionally, so this CI step can never fail regardless of whether the referenced test exists or passes. This is a silent CI gap not recorded in WINDOWS.md."
behavior_unverified_items:
  - truth: "Guest uživatel podá žádost 'Žádost o informace' v < 3 min (mobile)"
    test: "Run the mobile app against the real backend (docker compose up postgres + ./gradlew bootRun), navigate to /form/info-request, and observe whether the form renders at all"
    expected: "Form should render from the live GET /api/forms/info-request response"
    why_human: "Static analysis proves the crash is reachable (see gaps/code evidence below) but a human running the actual Flutter app end-to-end is the authoritative confirmation the code review claims it never got in Plans 01/03/05/07"
human_verification:
  - test: "Launch apps/mobile against a running backend (not FakeSubmissionDatasource) and attempt the full guest flow: open catalog -> open 'Žádost o informace' -> fill -> submit -> view confirmation"
    expected: "Form renders and submission succeeds, matching the citizen-web flow that was live-verified in Plan 07"
    why_human: "FormDefinition.fromJson (form_field.dart) and Submission.fromJson (submission.dart) both cast json['schema']/json['uiSchema']/json['formData'] directly `as Map<String, dynamic>?`. The backend (FormController.kt/SubmissionResponseDto.kt) sends all three fields as JSON-encoded STRINGS (Jackson serializing Kotlin String-typed fields), not nested objects — confirmed by reading both the Kotlin DTOs and the Dart domain classes side by side. A non-null String cast to Map in Dart throws a TypeError at runtime, not a silent null. No test in the mobile suite exercises this path (every submission/form test uses FakeSubmissionDatasource, which returns schema/uiSchema as native Maps — the wrong shape). Static evidence strongly indicates a crash; a live run is the final confirmation."
  - test: "Run Lighthouse (or an equivalent automated accessibility+performance audit) against mobile web build, admin-web, and citizen-web and record the score"
    expected: "Accessibility score >= 95 on all three, per ROADMAP.md's Phase 1 acceptance criterion"
    why_human: "Lighthouse is never invoked anywhere in the repository (no CI step, no script, no config) — the AC has substantial supporting evidence (axe-core 0 AA violations across both web apps' test suites, Flutter semantics widget tests) but no Lighthouse score has ever actually been produced"
---

# Phase 1: Foundation & Guest Mode Verification Report

**Phase Goal:** Validate the information architecture with real users via a guest-mode flow (no login) for the most common municipal act, backed by a gov.cz/Broumy-compliant design system, a working backend, and admin tooling — for a small municipality (obec do 1 500 obyvatel, I. typu, bez rozšířené působnosti), demoed via "Žádost o informace".

**Verified:** 2026-08-01T19:32:50Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Overall Verdict: **PASS WITH GAPS**

The phase delivers a genuinely solid, live-verified foundation for **one full guest channel (citizen-web) + the admin side + the backend**, with unusually good evidence quality: Plans 06 and 07 both ran real end-to-end verification against a live Postgres + Keycloak + Spring Boot stack (not just mocked unit tests), and that live verification caught and fixed real, load-bearing defects that had been invisible to every prior plan's mocked tests (see "Mock-Blindspot Findings" below). That is exactly the right process and it worked.

However, the phase's own Acceptance Criteria explicitly require **both** mobile and citizen-web, and mobile's guest flow is provably broken against a real backend (not merely "unverified" — the type mismatch is verifiable by reading the code on both sides of the wire). Two of five phase Acceptance Criteria fail outright (RÚIAN 95% coverage, CI/CD staging deploy), and a third (Lighthouse ≥95) has never been measured at all. This is not a rubber-stamp PASS.

---

## Acceptance Criteria (ROADMAP.md, Phase 1)

| # | Acceptance Criterion | Verdict | Evidence |
|---|----------------------|---------|----------|
| 1 | Guest uživatel podá žádost "Žádost o informace" v < 3 min (mobile i citizen-web) | **PARTIAL / FAILED for mobile** | citizen-web: live-verified end-to-end (`01-07-SUMMARY.md` D1-D3; `apps/citizen-web/src/features/submission/pages/SubmissionPage.tsx` + `.test.tsx`, real `POST /api/submissions` + PDF byte stream confirmed). mobile: `apps/mobile/lib/features/submission/domain/form_field.dart:74` (`json['schema'] as Map<String, dynamic>?`) and `apps/mobile/lib/features/submission/domain/submission.dart:27` (`json['formData'] as Map<String, dynamic>?`) both crash against the real backend, which returns these fields as JSON-encoded strings (`apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/domain/FormDefinition.kt` — `schema: String`, `uiSchema: String`; `SubmissionResponseDto.kt` — `formData: String`). No mobile test ever exercises the real datasource (`apps/mobile/test/helpers/fake_submission_datasource.dart` returns native Maps, the wrong shape). Timing (<3 min) was never measured for either platform. |
| 2 | Autocomplete adresy funguje pro 95 % adres RÚIAN | **FAILED** | `apps/backend/backend/src/main/kotlin/cz/obec/portal/ruian/client/RuianClient.kt` targets an unconfirmed default URL (`https://api.ruian.cz`) with an empty API key by default; `apps/backend/backend/src/main/kotlin/cz/obec/portal/ruian/service/AddressAutocompleteService.kt`'s `FALLBACK_ADDRESSES` is a hard-coded 7-address list (Broumy/Beroun/Praha). `AddressAutocompleteServiceTest.kt` mocks `RuianClient` entirely — the live network path has never been exercised even once. STATE.md's Open Questions still lists RÚIAN registration as unresolved. |
| 3 | PDF potvrzení obsahuje sledovací kód, QR pro ověření | **VERIFIED** | `PdfGenerationServiceTest.kt` asserts tracking code + embedded QR image (`/XObject`) present in generated PDF bytes; Plan 07 live-verified a real `GET /api/submissions/{code}/pdf` byte stream (`file(1)` confirmed "PDF document, version 1.4"). |
| 4 | Lighthouse accessibility score ≥ 95 (mobile/web i citizen-web) | **NOT MEASURED** | No occurrence of "lighthouse" anywhere in the repo outside `.planning/ROADMAP.md` itself (`grep -rli lighthouse apps .github .planning` finds only the requirement doc). Substituted evidence exists (axe-core 0 AA violations in admin-web + citizen-web Vitest suites; Flutter widget-level semantics tests) but this is not what the AC asks for, and no score has ever been produced. |
| 5 | CI/CD: build, test, deploy do staging za < 15 min | **FAILED** | `.github/workflows/cd.yml`'s `deploy-staging` job body is `echo "Deploy to staging environment"` with the actual `kubectl set image` commands commented out. There is no staging environment being deployed to, so there is nothing to time. |

**Score: 1/5 fully VERIFIED, 1/5 PARTIAL (citizen-web only, mobile fails), 2/5 FAILED, 1/5 not measured.**

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| FR-01 | Guest Submission (Bez přihlášení) | **PARTIAL** | Backend + admin-web + citizen-web: full working guest submission pipeline, live-verified. Mobile: form-loading and submit-response parsing both provably crash (see AC #1). |
| FR-01.1 | Podání žádosti bez registrace | **SATISFIED (citizen-web/backend), BLOCKED (mobile)** | citizen-web `SubmissionPage.tsx`/`.test.tsx` D1-D3 live-verified. Mobile blocked by the schema/formData string-vs-map mismatch. |
| FR-01.2 | Autocomplete adresy z RÚIAN | **FAILED (as delivered)** | See AC #2. Additionally unwired: `AddressAutocomplete.tsx` exists and passes unit tests in both `apps/admin-web` and `apps/citizen-web`, but the only live form (`info-request`) has no field with `ui:widget: "address"` (confirmed in `apps/backend/backend/src/main/resources/forms/info-request/ui-schema.json` — no address widget present), so even the fallback dataset is never exercised in the actual product surface. Logged as WINDOWS.md item #1. |
| FR-01.4 | Stažení potvrzení (PDF) + sledovací kód | **SATISFIED (citizen-web/admin-web), UNCERTAIN (mobile)** | See AC #3. Mobile's `confirmation_page.dart` calls `ConfirmationRemoteDatasource`, which is untouched by the schema/formData bug (confirmation JSON fields are plain strings per `ConfirmationDto.kt`) — this path is more likely to work than the form-loading path, but it has never been run against a live backend either (mobile confirmation tests also use fakes). |
| FR-08 | Přístupnost (WCAG 2.1 AA) | **SATISFIED at the unit-test level; Lighthouse unmeasured** | axe-core 0 AA violations in `apps/admin-web/src/test/*.test.tsx` and `apps/citizen-web/src/features/**/*.test.tsx`; Flutter widget tests assert semantic roles/contrast pairs (`flutter drive` + real axe-core-on-web was deferred per `01-02-SUMMARY.md` "Deviations from Plan" — toolchain unavailable in the dev env). |
| FR-08.6 | Prohlášení o přístupnosti v aplikaci i na webu | **PARTIAL** | citizen-web: `apps/citizen-web/src/components/accessibility/AccessibilityStatement.tsx`, linked from `Footer.tsx` on every page — present and content-complete (D7 in `01-07-SUMMARY.md`). Mobile app: **no accessibility statement page exists anywhere in `apps/mobile/lib`** (`grep -rli "pristupnost|accessibility.statement|prohlas" apps/mobile/lib` returns nothing) — the requirement explicitly says "v aplikaci i na webu" (in the app AND on the web); the "v aplikaci" half is missing. admin-web also has none, but admin-web is an internal clerk tool, not the public-facing surface FR-08.6 is aimed at. |
| FR-10 | Administrace: Dashboard, fronta úkonů, SLA rizika, statistiky | **VERIFIED** | `01-06-SUMMARY.md` documents 6 concrete live-verification items (D1-D6) against a real Keycloak 26 + Postgres stack, each with a specific curl/DB-row check described, not just "tests pass." Spot-checked in code: `SecurityConfig.kt` (real ROLE_CLERK gate on `/api/admin/**`), `Submission.kt` (`@JdbcTypeCode(SqlTypes.JSON)` fix present), `apps/backend/backend/build.gradle.kts` (`kotlin("plugin.jpa")` fix present), `keycloak/realm-portal.json` (exists, wired via `docker-compose.yml --import-realm`). Admin dashboard components (`SubmissionsTable.tsx` 226 lines, `SubmissionDetailPanel.tsx` 219 lines, etc.) are substantive, not stubs. |
| FR-10.1 | Dashboard: fronta úkonů, SLA rizika, statistiky | **VERIFIED** | SLA badges computed in `AdminSubmissionService` (createdAt + 30-day default → OK/DUE_THIS_WEEK/DUE_TODAY/OVERDUE/CLOSED), rendered in `SubmissionsTable.tsx`; live-verified per D2 in `01-06-SUMMARY.md`. |

**Note:** `.planning/REQUIREMENTS.md` itself is truncated — it ends abruptly after FR-10.1 (line 71 of 71) with no FR-10.2 onward and no FR-02 through FR-09 detail beyond what's quoted above already existing higher in the file. This is a planning-document gap, not a phase-1 code gap, but should be fixed before Phase 2 requirements review.

---

## Proven Against a Real Running Stack

- **Backend `/api/admin/**` (Keycloak PKCE, state machine, audit trail, CSV export, SLA badges)** — Plan 06 ran a real Keycloak 26 + Postgres + Spring Boot stack and verified via curl + direct Postgres row inspection. This is the strongest evidence in the phase.
- **Citizen-web full guest flow (catalog → dynamic form → submit → tracking code → status → PDF)** — Plan 07 curl'd every backend endpoint the app consumes *before* writing client code against it, catching the schema/uiSchema/formData JSON-string contract and the absent per-field 422 error body pre-emptively.
- **JPA/Hibernate persistence path for `Submission`** — proven working only as of Plan 06's live verification; the missing `kotlin("plugin.jpa")` compiler plugin meant every entity read of ≥1 row failed with `InstantiationException` — this affected Plans 03/04/05's Submission code from the moment it was written, entirely undetected because every prior test mocked the repository.
- **Keycloak realm/role/client provisioning** — verified via a fresh `docker compose down -v && up` + direct DB checks + full PKCE/password-grant token exchange (Plan 06).
- **Admin CSV export** — byte-verified BOM + Czech-formatted rows against a live Postgres-backed export (Plan 06, D4).

## Only Proven Against Mocks (or Not Proven At All)

- **RÚIAN address autocomplete** — `RuianClient` has never made one real successful call in this codebase's history; `AddressAutocompleteServiceTest` mocks the client itself. The 95%-coverage AC is not just unverified, it is *actively false* as currently deployable (real coverage = 7 hard-coded addresses).
- **Czech POINT locator** — same pattern: `CzechPointClient` targets an unconfirmed URL (`https://czechpoint.gov.cz/api`) with no API key, `CzechPointLocatorServiceTest` mocks the client entirely, and — unlike RÚIAN — there is **no local fallback dataset at all**, so in the actual running application `nearby()` silently returns an empty list every time. A citizen tapping "Najít Czech POINT" today would see zero results.
- **Mobile guest submission flow (entire vertical)** — every mobile test for forms/submissions uses `FakeSubmissionDatasource`, which returns `schema`/`uiSchema`/`formData` as native Dart Maps. The real backend returns these three fields as JSON-encoded strings. This mismatch has been present since Plan 03 and was never caught by mobile's own test suite — it was only discovered as a side-effect of Plan 07's citizen-web live verification (documented in `01-07-SUMMARY.md`'s "Issues Encountered" and in WINDOWS.md item #2), and never fixed (correctly out of scope for a citizen-web-only plan, but it remains unfixed at phase close).
- **PDF/A-1b compliance** — `PdfGenerationServiceTest` checks for string markers (`/OutputIntent`, `sRGB`) as a heuristic proxy for PDF/A-1b validity; no real `verapdf` (or equivalent) validation tool is ever invoked anywhere in the codebase or CI, despite being named as a verification step in `01-05-PLAN.md`. (The phase's actual Acceptance Criterion — "PDF potvrzení obsahuje sledovací kód, QR" — does not require PDF/A-1b, so this doesn't block that AC, but the "PDF/A-1b compliant" claim in the SUMMARY is unverified beyond string-presence heuristics.)
- **Mobile Flutter integration test** — `.github/workflows/ci.yml`'s `integration` job runs `flutter test integration_test/health_test.dart -d linux || echo "... skipped in CI"`; the referenced `integration_test/` directory does not exist anywhere in the repository. The `|| echo` means this CI step reports success unconditionally, regardless of whether the file exists.
- **Lighthouse accessibility scoring** — never invoked; axe-core unit tests are a partial substitute but not equivalent evidence.
- **Staging deployment timing** — `cd.yml`'s deploy step is a placeholder; there is no staging environment to measure against the < 15 min target.

---

## The 2 Open WINDOWS.md Items

| # | Item | Blocks phase goal? | Assessment |
|---|------|--------------------|------------|
| 1 | `AddressAutocomplete.tsx` (citizen-web) built + unit-tested but not wired into a live form | **No, legitimately deferrable** | The one existing demo form ("Žádost o informace") has no address field by design (per STATE.md's demo-form decision). The component is ready; activation is a one-line `ui:widget` change whenever a future form needs an address. Correctly scoped as a follow-up, not a phase-1 blocker. |
| 2 | Mobile `FormDefinition.fromJson` casts `schema`/`uiSchema` directly to `Map`, but backend returns JSON-encoded strings — "likely throws at runtime" | **Yes — this blocks Acceptance Criterion #1 for mobile** | Verification in this report upgrades WINDOWS.md's "likely throws" (hedged) to **confirmed**: reading `FormDefinition.fromJson` (form_field.dart) alongside `FormController.kt`/`FormDefinition.kt` shows an unconditional type mismatch (String cast to Map), which is a Dart `TypeError`, not a graceful null. WINDOWS.md's description is also **narrower than the actual defect**: it only names `form_field.dart`'s `schema`/`uiSchema`. The same bug independently exists in `submission.dart`'s `Submission.fromJson` for the `formData` field (confirmed against `SubmissionResponseDto.kt`'s `formData: String`), meaning the submit-response parsing path is *also* broken, not just the form-loading path. Recommend updating the WINDOWS.md description to cover both files, or filing it as two linked items. |

## Additional Finding WINDOWS.md Should Have Recorded But Does Not

- **`apps/mobile/integration_test/health_test.dart` referenced by CI but does not exist**, and the CI step's `|| echo "... skipped in CI"` means this will never surface as a CI failure even when/if someone expects it to gate mobile integration health. This is a silent, permanently-green no-op step that should either be implemented or removed — currently it gives false confidence that "mobile integration is CI-covered."
- **Czech POINT locator has zero live-path evidence and zero fallback data** (unlike RÚIAN's 7-address fallback) — in the deployed app today, "Najít Czech POINT" always returns an empty result set. This is arguably a more severe user-facing gap than the RÚIAN autocomplete AC failure (which at least returns *something* for 7 known addresses), yet it isn't tracked anywhere.
- **No rate limiting anywhere in the backend** (`grep -rli "ratelimit|rate-limit|bucket4j" apps/backend/backend/src/main/kotlin` returns nothing) despite being called out as a mitigation in the threat models of Plans 03, 04, 05, and 06 (T-03-05, T-04-05/06, T-05-04, T-06-05 partially). Individually tracked as "follow-up" text in several SUMMARYs and STATE.md, but not centrally in WINDOWS.md as an open item.
- **No CORS configuration exists in the backend** (`grep -rln "CorsConfiguration|@CrossOrigin" apps/backend/backend/src/main/kotlin` returns nothing). Fine for local dev (Vite proxy avoids the issue) but will block citizen-web/admin-web from calling the backend directly in any production topology without a reverse proxy. Noted as a Plan 07 follow-up in prose but not in WINDOWS.md.

---

## Scope Honesty Check

**Confirmed matching STATE.md's locked scope.** `apps/backend/backend/src/main/resources/forms/` contains exactly one form directory (`info-request`), matching the "Žádost o informace" demo-form decision. `FormCatalogService.kt`'s doc comment explicitly states "Only acts within the competence of an obec I. typu are published; ORP/state agendas are excluded by construction." No trace of any ORP-scope agenda (živnostenský rejstřík, řidičské průkazy, stavební povolení, etc.) anywhere in the codebase. Scope has not silently drifted.

---

## Gaps / Risks Carried Into Phase 2

1. **Mobile guest flow is non-functional against a real backend.** *Recommended action:* Before Phase 2 mobile work proceeds, fix `FormDefinition.fromJson` and `Submission.fromJson` to `jsonDecode()` the `schema`/`uiSchema`/`formData` string fields (mirroring citizen-web's `getFormDefinition` pattern), then add at least one widget test using the real `SubmissionRemoteDatasource` against a fixture that mimics the actual wire shape (JSON-encoded string fields), not `FakeSubmissionDatasource`'s native-Map shape.
2. **RÚIAN integration is not real.** *Recommended action:* Either complete ČÚZK API registration and prove one live call, or explicitly descope/rewrite AC #2 to reflect the interim local-dataset approach so the phase's own acceptance criteria stop asserting something false.
3. **Czech POINT locator returns nothing in practice.** *Recommended action:* Add a small local fallback dataset (same pattern as RÚIAN's `FALLBACK_ADDRESSES`) so the feature is at least demoable, or clearly flag it as non-functional in user-facing UI copy until the real API is provisioned.
4. **CI/CD staging deploy is a stub.** *Recommended action:* Wire up a minimal real deploy target (even a single-VM docker-compose-over-SSH or a bare k8s manifest apply) so the < 15 min AC can actually be measured, or formally revise the AC for Phase 1's actual infra maturity.
5. **No Lighthouse measurement exists.** *Recommended action:* Add a Lighthouse CI step (there are GitHub Actions for this) against admin-web and citizen-web builds, and a Flutter-web equivalent for mobile, to actually produce the score the AC requires.
6. **Mobile app has no accessibility statement (FR-08.6 partial).** *Recommended action:* Add an equivalent in-app page/screen, matching citizen-web's `AccessibilityStatement.tsx` content.
7. **No rate limiting or CORS configuration anywhere in the backend.** *Recommended action:* Address before any non-dev deployment; currently only tracked informally across multiple SUMMARYs, not centrally.
8. **The mobile CI integration step is a permanent no-op** (`|| echo` swallows a missing test file). *Recommended action:* Either implement `integration_test/health_test.dart` or remove the misleading CI step.

---

_Verified: 2026-08-01T19:32:50Z_
_Verifier: Claude (gsd-verifier)_
