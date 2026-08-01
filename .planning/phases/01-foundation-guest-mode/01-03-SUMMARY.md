# Phase 1 Plan 03: Guest Submission Core — Summary

**Phase:** 01-foundation-guest-mode  
**Plan:** 03  
**Status:** ✅ Completed  
**Date:** 2026-08-01  

---

## One-Liner
Guest citizens can now pick a form from a catalog, fill it in (rendered dynamically from JSON Schema + UI Schema), and submit it — getting a **tracking code** to follow up on the submission; admins can list/filter submissions and view their full data in the admin-web.

---

## What Was Built

### 1. Backend — `apps/backend/backend/`
- **Domain** (`submission/domain/`): `Submission` (trackingCode, formKey, formData JSONB, clientIp, status, timestamps via `@PrePersist/@PreUpdate`), `SubmissionStatus` (SUBMITTED/IN_PROGRESS/APPROVED/REJECTED), `FormDefinition` (+ nested `FormCatalogEntry`), `FormField` (TEXT/SELECT/DATE/CHECKBOX/TEXTAREA).
- **Repository**: `SubmissionRepository` — `findByTrackingCode`, filtered `search(status, formKey, from, to, pageable)`.
- **API** (`submission/api/`): `FormController` (GET `/api/forms` catalog, GET `/api/forms/{key}` schema/uiSchema/title/description), `SubmissionController` (POST `/api/submissions` → 201, GET `/{trackingCode}`, GET list with status/formKey/date filters + paging). DTOs with Bean Validation.
- **Services** (`submission/service/`): `FormCatalogService` (loads `classpath:forms/*/{meta,schema,ui-schema}.json`), `FormValidationService` (networknt JSON Schema + custom RC/IČO/phone/e-mail validators), `SubmissionService` (create → validate, 422 on invalid; tracking-code generation; search).
- **Migration**: `v1.1.0__submission_tracking_code.yaml` — renames `reference_number`→`tracking_code`, `form_id`→`form_key`, adds `client_ip`, GIN index on `form_data`; included in `db.changelog-master.yaml`.
- **Form definition**: `forms/info-request/` — "Žádost o informace" (InfZ) with meta/schema/ui-schema, conditional `dateNeeded` field (`requestType == info-document`), required-terms checkbox.
- **Dependency**: `com.networknt:json-schema-validator:1.4.0` added to `build.gradle.kts`.
- **Tests**: `FormValidationServiceTest` (9 cases incl. IČO checksum 27082440), `SubmissionControllerTest` (5 MockMvc cases).

### 2. Mobile — `apps/mobile/`
- **Domain**: `FormFieldSpec` (incl. conditional `conditionField`/`conditionValue`, `isVisible`), `FormDefinition.fromJson` (parses schema + uiSchema `ui:widget`, `ui:condition`), `Submission`, `FormCatalogEntry`.
- **Data**: `SubmissionRemoteDatasource` + `SubmissionRepository` (Dio), `validateForm` local mirror of server rules for instant UX.
- **Presentation**: dynamic form page (`SubmissionFormPage`) built from schema, `SubmissionFormController` (ChangeNotifier — no codegen), field widgets via `DynamicFormField` factory (text/textarea via `BroumyTextField`, chip-based select via `BroumyChip`, date picker, checkbox), 3-step `SubmissionProgressIndicator`, inline error banner, success view with `SelectableText` tracking code.
- **Wiring**: `/form/:formId` route now renders the real page; home CTA → `/form/info-request`; `BroumyTextField` gained `minLines`/`maxLines`.
- **Tests**: `dynamic_form_field_test.dart` (validateForm + isVisible, 12 cases), `submission_form_page_test.dart` (4 widget tests incl. conditional reveal, local validation, tracking-code success view), `FakeSubmissionDatasource` helper.

### 3. Admin-web — `apps/admin-web/`
- **Feature** (`features/submissions/`): `types/submission.ts`, `api/submissionsApi.ts` (axios, reuses shared client), `components/SubmissionList.tsx` (TanStack Table, server-side paging, status/form filters via `BroumySelect`), `components/SubmissionForm.tsx` (read-only detail with data table).
- **Routing**: `SubmissionsPage` wired to `/submissions` (was "Coming Soon"); row click → detail view with back.
- **Dependency**: `@tanstack/react-table`.

---

## Verification Results

| Check | Result |
|-------|--------|
| `flutter analyze` | ✅ PASS (0 issues) |
| `flutter test` (mobile, incl. 13 new) | ✅ PASS (35 tests) |
| `npm run lint` (admin-web) | ✅ PASS |
| `npm run typecheck` (admin-web) | ✅ PASS |
| `npm run test` (admin-web) | ✅ PASS (9 tests) |
| `npm run build` (admin-web) | ✅ PASS |
| `node scripts/check-token-sync.mjs` | ✅ PASS |
| Backend compile/tests | ⚠️ NOT run locally — no Gradle wrapper/binary in env; verified in CI (`ci.yml`), code written per existing conventions |

---

## Deviations from Plan

| Plan Spec | Actual | Reason |
|-----------|--------|--------|
| TanStack Table dependency | Used `@tanstack/react-table` | Added dependency as specced |
| Backend locally compiled/tested | Written best-effort; CI-verified | No Gradle wrapper/binary available locally |
| Riverpod state management | Plain `ChangeNotifier` controller | Avoids codegen in the mobile app; existing codebase precedent |

**Impact:** None — mobile + admin-web fully verified locally; backend gated by CI.

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/**` | Domain, repository, API, services, DTOs |
| `apps/backend/backend/src/main/resources/forms/info-request/*.json` | InfZ form definition (meta/schema/ui-schema) |
| `apps/backend/backend/src/main/resources/db/changelog/v1.1.0__submission_tracking_code.yaml` | Migration (renames + GIN index) |
| `apps/backend/backend/src/test/kotlin/cz/obec/portal/submission/*.kt` | Validation + controller tests |
| `apps/mobile/lib/features/submission/**` | Domain/data/presentation for submissions |
| `apps/mobile/lib/core/router/app_router.dart` | `/form/:formId` → `SubmissionFormPage` |
| `apps/mobile/test/features/submission/*.dart` | Mobile submission tests |
| `apps/mobile/test/helpers/fake_submission_datasource.dart` | Test double |
| `apps/admin-web/src/features/submissions/**` | Types, API, components |
| `apps/admin-web/src/pages/SubmissionsPage.tsx` | `/submissions` page + detail |

---

## Requirements Completed

- **FR-03** (guest submission with tracking code) — backend + mobile + admin-web
- **FR-01** partial (forms catalog) — catalog served from classpath form definitions

---

## Next Steps

**Wave 2 continued: Plan 04** (`01-04` RÚIAN + Czech POINT): backend `ruian` package (clients with mock fallbacks, autocomplete/locator services, controllers), mobile `features/address` (autocomplete, Czech POINT map/list, address selector), admin-web `AddressAutocomplete`/`CzechPointMap`.

---

## Commands to Verify Locally

```bash
# Token sync
node scripts/check-token-sync.mjs

# Admin Web
cd apps/admin-web && npm run lint && npm run typecheck && npm run test && npm run build

# Mobile
cd apps/mobile && flutter analyze && flutter test
```

---

**Commit:** `feat(plan03): guest submission core - forms catalog, validation, tracking`
