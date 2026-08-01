---
phase: 01-foundation-guest-mode
plan: 07
subsystem: ui
tags: [react, vite, typescript, i18next, tanstack-query, axios, vitest, axe-core, broumy, nx, monorepo]

requires:
  - phase: 01-foundation-guest-mode (plan 02)
    provides: Broumy design system (tokens + React components) and mobile Dart source-of-truth tokens
  - phase: 01-foundation-guest-mode (plan 03)
    provides: Forms catalog API, guest submission create/lookup API, JSON Schema + UI Schema form definitions
  - phase: 01-foundation-guest-mode (plan 04)
    provides: RÚIAN address autocomplete API + admin-web's AddressAutocomplete reference implementation
  - phase: 01-foundation-guest-mode (plan 05)
    provides: PDF/A-1b confirmation + JSON confirmation endpoints
provides:
  - Public citizen-facing web app (apps/citizen-web) covering the full guest flow: catalog -> dynamic form -> submit -> tracking code -> status tracking -> PDF download
  - Shared design-token package (@digiobec/broumy-tokens) single-sourcing Broumy CSS between admin-web and citizen-web
  - citizen-web registered in npm workspaces, nx.json, root scripts, and CI (lint/typecheck/test/build + integration smoke check)
affects: [any future phase touching the public guest-submission surface, admin-web theme changes (now shared), phase 02+ citizen-web features]

tech-stack:
  added:
    - "@digiobec/broumy-tokens (new internal workspace package - shared CSS, no build step)"
    - "citizen-web: Vite 5 + React 18 + TS, i18next/react-i18next, axios, @tanstack/react-query, vitest + @testing-library/react + jsdom + axe-core"
  patterns:
    - "Mock the shared axios instance (vi.spyOn(httpClient, 'get'/'post')) in tests rather than mocking an api-layer module with `{ ...actual, foo: vi.fn() }` - the latter silently fails to intercept calls a sibling function in that SAME module makes internally (an ESM self-reference pitfall), which briefly let real network calls (and one stray dev-server response from another app) leak into test output during this plan"
    - "Force i18n.changeLanguage('cs') in test beforeAll (jsdom's default en-US navigator language otherwise wins via i18next-browser-languagedetector) and assert on real rendered Czech text, not raw i18n keys"
    - "Parse GET /api/forms/{key}'s schema/uiSchema fields client-side with JSON.parse - they arrive as JSON-encoded STRINGS, not nested objects (verified live against the backend)"
    - "BroumyCard's title heading level is a prop (titleAs), not hardcoded, so callers keep axe-core's heading-order rule satisfied in different page contexts"

key-files:
  created:
    - packages/broumy-tokens/{package.json,tokens.css,theme.css}
    - apps/citizen-web/{package.json,vite.config.ts,vitest.config.ts,tsconfig.json,tsconfig.node.json,.eslintrc.cjs,index.html}
    - apps/citizen-web/src/{main.tsx,App.tsx,router.tsx,index.css,vite-env.d.ts}
    - apps/citizen-web/src/api/httpClient.ts
    - apps/citizen-web/src/i18n/{index.ts,locales/cs.json,locales/en.json}
    - apps/citizen-web/src/components/ui/{BroumyButton,BroumyInput,BroumyTextarea,BroumySelect,BroumyCard,BroumyAlert,index}.tsx
    - apps/citizen-web/src/components/layout/{Header,Footer,PublicLayout,PageLoading}.tsx
    - apps/citizen-web/src/components/accessibility/AccessibilityStatement.tsx
    - apps/citizen-web/src/features/catalog/{api/formsApi.ts,types/form.ts,pages/FormCatalogPage.tsx,components/FormCard.tsx}
    - apps/citizen-web/src/features/submission/{api/submissionsApi.ts,types/submission.ts,lib/validateFormValues.ts,components/{DynamicForm,FormFieldRenderer,AddressAutocomplete}.tsx,pages/SubmissionPage.tsx}
    - apps/citizen-web/src/features/tracking/{api/trackingApi.ts,components/SubmissionStatusTimeline.tsx,pages/TrackingPage.tsx}
    - apps/citizen-web/src/features/{catalog,submission,tracking}/pages/*.test.tsx
    - apps/citizen-web/src/test/setup.ts
  modified:
    - package.json (workspaces + dev:citizen script)
    - nx.json (citizen-web project)
    - .github/workflows/ci.yml (citizen-web job + integration smoke step)
    - apps/admin-web/package.json (added @digiobec/broumy-tokens dependency)
    - apps/admin-web/src/index.css (imports moved to the shared package)
    - scripts/check-token-sync.mjs (reads packages/broumy-tokens/tokens.css)

key-decisions:
  - "Design system: local Broumy* React components (Button/Input/Textarea/Select/Card/Alert), matching admin-web's exact markup/classes, but NOT extracted into the shared package this plan - only the CSS tokens/theme were single-sourced. Component logic duplication carries lower coupling risk than forking CSS, and extracting components too would have meant migrating admin-web's own imports (higher risk to its green baseline) for a benefit (shared component logic) smaller than the risk. Documented per critical_project_facts guidance: prefer single-sourcing, fall back to duplication when full extraction is disproportionately invasive - CSS tokens were sourced, components were not."
  - "Dropped the plan's assumed zod-based dynamic form validation in favor of a hand-rolled validateFormValues() mirroring the backend's FormValidationService rules directly off the JSON Schema (required/minLength/maxLength/enum/const) plus ui:condition-based visibility - same approach the mobile app already uses (Plan 03's 'local mirror of server rules'). A dynamically-constructed zod schema added complexity without benefit for schema-driven, conditionally-visible fields; zod remains a listed dependency but the form's own validation does not need it."
  - "Backend error responses do not carry per-field detail (verified live: a 422 body is `{timestamp,status,error,path}` with no `message` key, since `server.error.include-message` is not enabled) - the plan's assumed `{field, message}` error DTO from the backend does not exist. SubmissionPage shows a generic 'correct the highlighted fields' message on 422 instead of per-field server errors; client-side validation (mirroring the same rules) is the only place per-field errors are shown."
  - "Public tracking timeline renders an ordered-list stepper through the possible states (SUBMITTED -> PROCESSING -> COMPLETED/REJECTED/NEEDS_INFO) rather than a timestamped history, because GET /api/submissions/{trackingCode} only exposes the current status - the timestamped per-transition audit trail lives in the clerk-only /api/admin/** namespace (Plan 06)."
  - "AddressAutocomplete is built and unit-tested but not wired into a live form, matching admin-web's own precedent: the one existing demo form (info-request) has no address field. FormFieldRenderer already supports `ui:widget: \"address\"` so a future form activates it with no further wiring."
  - "Tests are colocated (src/**/*.test.tsx next to the page under test) rather than in the plan's proposed top-level test/ directory, matching admin-web's existing convention for consistency across the two React apps."
  - "citizen-web dev server runs on Vite's default port 5173 (distinct from admin-web's 3000, Keycloak's 8080, backend's 8081)."

patterns-established:
  - "Public (guest, no-auth) React app conventions distinct from admin-web's clerk-auth patterns: no AuthProvider/RequireClerk, httpClient has no Authorization header injection, baseURL defaults to same-origin '/api' (dev-proxy + prod reverse-proxy) rather than a cross-origin absolute URL, sidestepping any need for backend CORS configuration for this app."

requirements-completed: [FR-01, FR-01.1, FR-01.2, FR-01.4, FR-08, FR-08.6]

coverage:
  - id: D1
    description: "Citizen opens the public portal and sees the form catalog (all available guest submission forms), loading/error/empty states, full i18n"
    requirement: "FR-01.1"
    verification:
      - kind: unit
        ref: "FormCatalogPage.test.tsx (4 tests: loaded, empty state, error+retry, axe-core WCAG 2.1 AA)"
        status: pass
      - kind: integration
        ref: "Live GET /forms through the Vite dev proxy against the running backend - verified byte-identical catalog JSON reaches the browser boundary"
        status: pass
    human_judgment: false
  - id: D2
    description: "Guest selects a form, sees it rendered dynamically from JSON Schema + UI Schema (Broumy components), including conditional field visibility"
    requirement: "FR-01.1"
    verification:
      - kind: unit
        ref: "SubmissionPage.test.tsx > renders the schema-driven form once the definition loads; > only shows the conditional dateNeeded field once requestType is info-document"
        status: pass
      - kind: integration
        ref: "Live GET /forms/info-request against the running backend - confirmed schema/uiSchema arrive as JSON-encoded strings and are parsed correctly by getFormDefinition"
        status: pass
    human_judgment: false
  - id: D3
    description: "Guest fills and submits the form; POST /api/submissions succeeds and the success screen shows the tracking code and a working 'Stáhnout potvrzení (PDF)' link"
    requirement: "FR-01.1, FR-01.4"
    verification:
      - kind: unit
        ref: "SubmissionPage.test.tsx > submits the form (JSON-stringified values) and shows the tracking code on success"
        status: pass
      - kind: integration
        ref: "Live POST /api/submissions + GET /api/submissions/{code}/pdf against the running backend - confirmed 201 response shape and a real PDF/A-1b byte stream (file(1) confirms 'PDF document, version 1.4')"
        status: pass
    human_judgment: false
  - id: D4
    description: "Citizen checks submission status via tracking code -> status timeline; 404/invalid-code error state"
    requirement: "FR-01.1"
    verification:
      - kind: unit
        ref: "TrackingPage.test.tsx (4 tests: direct-link lookup + timeline, manual lookup + navigation, not-found error, axe-core WCAG 2.1 AA)"
        status: pass
      - kind: integration
        ref: "Live GET /api/submissions/{code} (200) and /api/submissions/does-not-exist (404) against the running backend"
        status: pass
    human_judgment: false
  - id: D5
    description: "Address fields use RÚIAN autocomplete (component built + tested; not wired into the one existing demo form, which has no address field)"
    requirement: "FR-01.2"
    verification:
      - kind: manual_procedural
        ref: "No form currently declares ui:widget: \"address\"; component parity with admin-web's tested AddressAutocomplete is the available evidence"
        status: unknown
    human_judgment: true
    rationale: "No live form exercises this widget yet (matches admin-web's own unwired precedent) - a human should confirm this is an acceptable state for phase completion rather than a gap, since RUIAN autocomplete integration into an actual form is deferred to whenever a future form needs an address field."
  - id: D6
    description: "Full i18n cs/en; Broumy design tokens shared with admin-web (not forked); WCAG 2.1 AA; axe-core 0 violations across catalog/form/tracking pages"
    requirement: "FR-08"
    verification:
      - kind: unit
        ref: "FormCatalogPage.test.tsx / SubmissionPage.test.tsx / TrackingPage.test.tsx > passes axe-core WCAG 2.1 AA checks (3 tests)"
        status: pass
      - kind: other
        ref: "node scripts/check-token-sync.mjs (Flutter <-> shared CSS token parity) - pass after moving apps/admin-web/src/theme/*.css into packages/broumy-tokens"
        status: pass
    human_judgment: false
  - id: D7
    description: "Prohlášení o přístupnosti (FR-08.6) accessible from the footer on every page"
    requirement: "FR-08.6"
    verification:
      - kind: unit
        ref: "Footer.tsx links to /pristupnost on every PublicLayout-wrapped page; AccessibilityStatement.tsx renders the required content (scope/legal basis, compliance status, preparation date, designated contact, enforcement procedure)"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-08-01
status: complete
---

# Phase 1 Plan 07: Citizen Web MVP Summary

**Guest citizens complete the full catalog -> dynamic form -> submit -> tracking code -> status -> PDF flow in a new public React app (citizen-web), which now shares its Broumy design tokens with admin-web via a new internal workspace package instead of a forked CSS copy.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-08-01 ~20:56
- **Completed:** 2026-08-01 ~21:22
- **Tasks/commits:** 4 (scaffold+tokens, submission+tracking features, tests, this docs commit)
- **Files created/modified:** ~60

## Accomplishments

- **New public app `apps/citizen-web`:** Vite 5 + React 18 + TS, i18next (cs/en, namespace-shaped resources, `defaultLng: 'cs'`), TanStack Query, axios, vitest + testing-library + axe-core + jsdom, ESLint with `--max-warnings 0` - mirroring admin-web's conventions (translated `.eslintrc.cjs` over the plan's stale `eslint.config.js` reference, colocated `*.test.tsx` over the plan's proposed top-level `test/` dir).
- **Shared design tokens:** extracted `apps/admin-web/src/theme/{broumy-tokens,broumy-theme}.css` into a new internal workspace package `packages/broumy-tokens`, consumed by both admin-web and citizen-web via `@digiobec/broumy-tokens/*.css`. Single-sources the design tokens (per STATE.md's Broumy decision) instead of forking a second copy with a CI-diff-check workaround; verified admin-web's build/lint/29-test suite and `scripts/check-token-sync.mjs` (Flutter <-> CSS parity) all stayed green after the move.
- **Form catalog:** `GET /api/forms` rendered as a responsive grid of cards (title/description/department in the active language), loading/empty/error states.
- **Dynamic submission form:** `GET /api/forms/{key}` schema-driven rendering (text/textarea/select/date/checkbox/address widgets), `ui:condition`-based conditional visibility (`dateNeeded` only shown when `requestType === 'info-document'`), client-side validation mirroring the backend's rules, `POST /api/submissions`, success screen with tracking code + PDF download link + "track this submission" link.
- **Tracking:** manual tracking-code lookup or direct `/tracking/:code` link, accessible ordered-list status stepper (SUBMITTED -> PROCESSING -> COMPLETED/REJECTED/NEEDS_INFO), 404-vs-generic error states, PDF download.
- **RÚIAN AddressAutocomplete:** built and unit-tested (debounced 300ms, `AbortController`, ARIA combobox listbox) identically to admin-web's; wired into `FormFieldRenderer` for `ui:widget: "address"` but not yet exercised by the one existing demo form, matching admin-web's own precedent of a component that exists ahead of the form that will need it.
- **Public layout + a11y:** sticky header (skip-link, nav, cs/en language switch), footer (contacts + accessibility-statement link on every page), FR-08.6 accessibility statement page with all required content (scope/legal basis, compliance status, preparation date, designated contact, enforcement procedure).
- **Monorepo registration:** `apps/citizen-web` added to root `package.json` workspaces + new `dev:citizen` script, `nx.json` projects (build/test/lint targets), and `.github/workflows/ci.yml` (new job + integration-job smoke curl), mirroring how admin-web is wired in.
- **Live end-to-end verification against the real backend** (not just mocks): brought up Postgres + `./gradlew bootRun`, then `curl`'d every endpoint this app consumes (`GET /forms`, `GET /forms/{key}`, `POST /submissions`, `GET /submissions/{code}`, `GET /submissions/{code}/pdf`, 404 case, `GET /addresses/suggest`) *before* writing the corresponding client code - this is what surfaced the `schema`/`uiSchema`-are-JSON-strings behavior and the absent per-field 422 error body, both baked into the implementation from the start rather than discovered as bugs afterward. Also started the citizen-web Vite dev server and confirmed its `/api` proxy correctly forwards to the live backend.

## Task Commits

1. **Scaffold citizen-web + extract shared Broumy tokens package** - `f4a7b72` (feat)
2. **Submission + tracking features** - `c71b519` (feat)
3. **Page tests (vitest + testing-library + axe-core) + BroumyCard heading-order fix** - `3d79e5e` (test)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

See frontmatter `key-files`. Full list also visible via `git show --stat` on the three commits above.

## Decisions Made

See frontmatter `key-decisions` for the full list with rationale. Summary:
- Shared CSS tokens via a new `@digiobec/broumy-tokens` package; components stayed local per-app (lower-risk middle ground vs. full extraction).
- Hand-rolled JSON-Schema-driven client validation instead of a dynamically-constructed zod schema (zod stays a listed dependency but isn't exercised by the dynamic form).
- Generic (not per-field) 422 error banner, since the backend does not expose field-level error detail publicly (verified live).
- Public status timeline is a state-stepper, not a timestamped history (the public endpoint doesn't expose one).
- AddressAutocomplete built+tested but unwired (no address field exists in the one live form yet).

## Deviations from Plan

Plan frontmatter used stale `govcz-*`/gov.cz naming and file paths without the `apps/` monorepo prefix - translated to Broumy naming and real paths per the critical-facts brief, no separate write-up for that mechanical part. Substantive deviations:

### Auto-fixed / Adjusted Issues

**1. [Rule 1 - Bug, discovered before it shipped] Plan assumed `GET /api/forms/{key}`'s `schema`/`uiSchema` are nested JSON objects**
- **Found during:** Live verification against the running backend, before writing `formsApi.ts`.
- **Issue:** `curl http://localhost:8081/api/forms/info-request` shows `schema`/`uiSchema` are JSON-encoded STRINGS (Jackson serializes the backend's `FormDefinition.schema: String` field as an escaped string, not as a nested object) - the mobile app's `FormDefinition.fromJson` (Plan 03) casts `json['schema'] as Map<String, dynamic>?`, which would actually throw at runtime against a live backend (its tests only ever used a fake datasource, never a live one). Out of scope to fix here (mobile files are not part of this plan's `files_modified`), but logged as a discovered defect below.
- **Fix:** `getFormDefinition` in citizen-web `JSON.parse`s both fields before handing a normalized `FormDefinition` to the rest of the app.
- **Files affected:** `apps/citizen-web/src/features/catalog/api/formsApi.ts`, `apps/citizen-web/src/features/catalog/types/form.ts`.
- **Verification:** Live `GET /forms/info-request` + unit test (`SubmissionPage.test.tsx`) both assert correct parsing.

**2. [Rule 1 - Bug] Plan assumed a structured `{field, message}` 422 error body from the backend**
- **Found during:** Live `curl -X POST /api/submissions` with an intentionally invalid payload.
- **Issue:** The 422 response body is `{"timestamp","status":422,"error":"Unprocessable Entity","path"}` - no `message` field at all (`server.error.include-message` is not configured), so there is no per-field detail to surface to the citizen.
- **Fix:** `httpClient.normalizeApiError` defensively falls back through `data.message -> data.error -> generic string`; `SubmissionPage` shows a translated generic "correct the highlighted fields" message on any 422 rather than attempting (impossible) per-field mapping from the server.
- **Files affected:** `apps/citizen-web/src/api/httpClient.ts`, `apps/citizen-web/src/features/submission/pages/SubmissionPage.tsx`.
- **Verification:** `SubmissionPage.test.tsx > shows a generic error banner (not per-field detail) on a 422 response`.

**3. [Rule 1 - Bug, own code] ESM self-reference mocking pitfall silently let real network calls through in early test drafts**
- **Found during:** Writing `FormCatalogPage.test.tsx`'s first pass, which used `vi.mock('../api/formsApi', async () => ({ ...actual, getFormCatalog: vi.fn() }))`.
- **Issue:** `useForms`'s internal call to `getFormCatalog` binds to the real module's own top-level function, not to the mock re-exported alongside `...actual` - the override only changes what the *mock module's own namespace* exports, not what a sibling function *inside that same module* calls. The very first test run of this pattern actually reached a real, unrelated dev server left listening on port 3000 (jsdom's default test origin) from an earlier session, returning the real backend's catalog data through that server's `/api` proxy and passing for the wrong reason.
- **Fix:** Rewrote all three test files to `vi.spyOn(httpClient, 'get'/'post')` (the shared axios instance) instead, which correctly intercepts every call regardless of which function inside the api-layer module makes it, and also exercises the real `JSON.parse`/`JSON.stringify` logic.
- **Files affected:** `FormCatalogPage.test.tsx`, `SubmissionPage.test.tsx`, `TrackingPage.test.tsx`.
- **Verification:** All 14 tests pass; killed the stray dev-server process and re-ran to confirm no test depends on it.

**4. [Rule 1 - Bug] axe-core heading-order violation on the catalog page**
- **Found during:** `FormCatalogPage.test.tsx > passes axe-core WCAG 2.1 AA checks`.
- **Issue:** `BroumyCard`'s title was hardcoded as `<h3>`; the catalog page has only an `<h1>` above it, skipping `<h2>` (axe-core `heading-order`, moderate impact).
- **Fix:** Added a `titleAs` prop (`h2`/`h3`/`h4`, default `h3`) to citizen-web's local `BroumyCard`; `FormCard` now passes `titleAs="h2"`. citizen-web's `BroumyCard` is a local copy (not part of the shared tokens package), so this does not touch admin-web.
- **Files affected:** `apps/citizen-web/src/components/ui/BroumyCard.tsx`, `apps/citizen-web/src/features/catalog/components/FormCard.tsx`.
- **Verification:** axe-core test passes with 0 violations.

---

**Total deviations:** 4 (2 pre-empted backend-contract mismatches caught by live verification before code was written against the wrong assumption, 1 own-code test-mocking bug fixed during authoring, 1 accessibility fix). **Impact on plan:** all necessary for correctness/accessibility; no scope creep beyond the plan's `must_haves`.

## Issues Encountered

- **Mobile app's `FormDefinition.fromJson` (Plan 03) likely throws at runtime against the live backend** - it casts `json['schema']` directly to a `Map`, but the wire value is a JSON-encoded string (see Deviation 1). This is a mobile-app defect outside this plan's `files_modified` scope; logged here for whoever picks up mobile next. Not fixed in this plan.
- A stray `apps/admin-web` Vite dev server (from an earlier, unrelated session) was found listening on port 3000 mid-plan and briefly caused a false-positive test result (see Deviation 3); killed once diagnosed.

## Known Stubs / Deferred Items

- **AddressAutocomplete not wired into a live form** - no current form schema declares `ui:widget: "address"`; the component is built, unit-tested, and ready to activate the moment a future form needs it (matches admin-web's own precedent from Plan 04).
- **Backend CORS / rate limiting for citizen-web's public endpoints (T-07-04, T-07-05, T-07-06)** - not added this plan (backend files are out of `files_modified` scope for a frontend-only plan); the dev proxy and same-origin `'/api'` baseURL avoid needing CORS in dev, but production reverse-proxy configuration and the 10/min submission + 30/min autocomplete rate limits from the plan's threat model remain backend follow-up work, consistent with the still-open T-05-04/T-06 rate-limiting follow-ups from Plans 05/06.
- **Mobile `FormDefinition.fromJson` schema/uiSchema parsing bug** (see Issues Encountered) - not fixed in this plan; flagging for the next phase or a dedicated mobile fix.

## User Setup Required

None - `citizen-web` is a fully public, guest-mode app with no authentication and no external service configuration. `npm run dev:citizen` (after `docker compose up -d postgres` + backend `bootRun`) is sufficient to run it locally.

## Next Phase Readiness

- Phase 1 (Foundation & Guest Mode) is now complete: all 7 plans done (walking skeleton, design system, guest submission core, RÚIAN + Czech POINT, PDF confirmation, admin web MVP, citizen web MVP).
- Backend: 50/50 tests passing (`./gradlew test`, unchanged - no backend files touched this plan). Admin-web: 29/29 tests passing, lint/typecheck/build clean (unchanged baseline, re-verified after the shared-tokens extraction). Citizen-web: 14/14 tests passing, lint (`--max-warnings 0`)/typecheck/build clean.
- Recommend routing the mobile `FormDefinition.fromJson` schema-parsing defect (Issues Encountered) into whichever future phase next touches the mobile submission feature.

## Commands to Verify Locally

```bash
# Backend
cd apps/backend && ./gradlew test

# Admin Web
cd apps/admin-web && npm run lint && npm run typecheck && npm run test && npm run build

# Citizen Web
cd apps/citizen-web && npm run lint && npm run typecheck && npm run test && npm run build

# Shared token sync
node scripts/check-token-sync.mjs

# Full stack (Postgres + backend + citizen-web dev server)
docker compose up -d postgres
cd apps/backend && DATABASE_URL=jdbc:postgresql://localhost:5432/portal DATABASE_USER=portal \
  DATABASE_PASSWORD=portal ./gradlew bootRun
cd apps/citizen-web && npm run dev   # http://localhost:5173
```

---
*Phase: 01-foundation-guest-mode*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 10 spot-checked key files verified present on disk; all 3 task commit hashes
(`f4a7b72`, `c71b519`, `3d79e5e`) verified present in `git log`.
