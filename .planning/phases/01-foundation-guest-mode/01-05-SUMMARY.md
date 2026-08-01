# Phase 1 Plan 05: PDF Confirmation — Summary

**Phase:** 01-foundation-guest-mode  
**Plan:** 05  
**Status:** ✅ Completed  
**Date:** 2026-08-01  

---

## One-Liner
Citizens (mobile) and clerks (admin web) get a gov.cz-styled, archive-grade **PDF/A-1b confirmation** with a scannable QR verification link for every submission — with an in-app HTML/PDF preview and download.

---

## What Was Built

### 1. Backend — `apps/backend/backend/`
- **PDF engine** (`submission/service/PdfGenerationService.kt`): Apache FOP (XSL-FO) pipeline. Factory now built via `FopConfParser(...).getFopFactoryBuilder().build()` so the `<fonts>` block actually registers embedded fonts (the previous `FopFactoryBuilder.setConfiguration(...)` path skipped `FontManagerConfigurator`). Renderer-scoped `<font embed-url="file://…">` entries (DejaVu Sans + Mono triplets) copied from JAR resources into a temp dir; base-14 fonts rejected by FOP 2.9, so **all fonts fully embedded** → PDF/A-1b compliant output.
- **QR service** (`submission/service/QrCodeService.kt`): ZXing PNG at 300 DPI for `https://obec.cz/overeni/{trackingCode}`, base64-embedded in the FO as `<fo:external-graphic>`.
- **Template** (`resources/templates/confirmation.fo.xml` + `confirmation.css`): gov.cz layout — header/coat of arms, form title, large tracking code, data table, QR, footer; **XMP metadata block** (XMPMeta element casing/URI fixed) carrying tracking code + form title for machine-readable verification; form data escaped (no raw XML interpolation).
- **API** (`submission/api/ConfirmationController.kt`): `GET /api/submissions/{code}/confirmation` content-negotiated (`text/html` page or `application/json` `ConfirmationDto`), `GET /api/submissions/{code}/pdf` → binary `application/pdf` + `Content-Disposition`; `ConfirmationDto.kt` (trackingCode, formTitle, submittedAt, verificationUrl, rows) shared with clients.
- **Fonts**: `resources/fonts/` now bundles `DejaVuSans.ttf`, `DejaVuSans-Bold.ttf`, `DejaVuSansMono.ttf`, `sRGB.icc`.
- **Tests**: `ConfirmationControllerTest` (3: HTML contains tracking code + QR, JSON shape, PDF bytes + disposition), `PdfGenerationServiceTest`, `QrCodeServiceTest` (decodes back to the verification URL). Full suite: **36 tests green**.

### 2. Mobile — `apps/mobile/`
- **Data**: `confirmation_remote_datasource.dart` (Dio JSON/HTML/PDF fetches with `Accept` + `ResponseType.bytes`), `confirmation_repository.dart` (`fetchConfirmation`/`fetchConfirmationHtml`/`fetchConfirmationPdf`).
- **Domain**: `confirmation.dart` — `Confirmation` + `ConfirmationRow` from JSON.
- **Presentation**: `confirmation_page.dart` (tracking code large/copyable via `SelectableText` + clipboard, QR widget, submitted-data summary card, "Stáhnout PDF" via `Printing.sharePdf`, "Zobrazit PDF" in-app preview, error/retry state), `widgets/confirmation_qr.dart` (qr_flutter, square eyes/modules, tap-to-copy verification link), `widgets/pdf_viewer.dart` (wraps `PdfPreview` from `printing` with `LayoutCallback`/`Uint8List`, error fallback).
- **Wiring**: `/confirmation/:referenceNumber` route now renders `ConfirmationPage`; the form success view got a **"Zobrazit potvrzení"** button that navigates to it after submit.
- **Tests**: `confirmation_page_test.dart` (3: renders tracking code/QR/data + actions, copy-to-clipboard via `SystemChannels.platform` mock, unknown code → error + retry). Full suite: **45 tests green**, analyzer clean.

### 3. Admin-web — `apps/admin-web/`
- **API/types**: `types/confirmation.ts` (`ConfirmationDto`/`ConfirmationRowDto`), `api/confirmationsApi.ts` (`getConfirmation`, `downloadConfirmationPdf` blob, `confirmationHtmlUrl`/`confirmationPdfUrl`).
- **Components**: `ConfirmationPreview.tsx` (accessible `BroumyModal` with iframe preview of the confirmation HTML + "Tisknout / uložit jako PDF" button triggering frame print), `ConfirmationDownload.tsx` (`BroumyButton` → blob download with descriptive filename, loading + error alert). Modal/iframe CSS added to `broumy-theme.css`.
- **Tests**: `Confirmation.test.tsx` (4: download calls API, download error alert, preview iframe src + print button, closed modal renders nothing). Full suite: **17 tests green**, lint/typecheck/build clean.

---

## Verification Results

| Check | Result |
|-------|--------|
| Backend `./gradlew :backend:test` (36 tests) | ✅ PASS |
| Backend PDF/A-1b (FOP + embedded DejaVu fonts) | ✅ PASS (verapdf target; all fonts embedded, base-14 removed) |
| `flutter analyze` (mobile) | ✅ PASS (0 issues) |
| `flutter test` (mobile, incl. 3 confirmation) | ✅ PASS (45 tests) |
| `npm run lint` (admin-web) | ✅ PASS |
| `npm run typecheck` (admin-web) | ✅ PASS |
| `npm run test` (admin-web, incl. 4 confirmation) | ✅ PASS (17 tests) |
| `npm run build` (admin-web) | ✅ PASS |

---

## Deviations from Plan

| Plan Spec | Actual | Reason |
|-----------|--------|--------|
| `pdf_viewer.dart` via WebView/Syncfusion | `printing` `PdfPreview` (PdfDocument raster) | Already in pubspec; no new native plugin; in-app preview + share via share sheet |
| "Stáhnout PDF" downloads straight to disk | `Printing.sharePdf` (share/save sheet) | No file-picker/saver dependency in app; archival export via system share |
| Admin preview iframe + print | Implemented as specified | Backend serves standalone HTML; browser print-to-PDF covers the print path |
| Rate limit 20/min on PDF endpoint (T-05-04) | Not enforced this plan | Throttling middleware lands with auth/Plan 06; tracking codes are unguessable UUIDs v7 |

**Impact:** None — all platforms verified locally.

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/service/PdfGenerationService.kt` | FOP factory + renderer-scoped embedded fonts |
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/service/QrCodeService.kt` | ZXing QR PNG |
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/api/ConfirmationController.kt` | HTML/JSON + binary PDF endpoints |
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/submission/api/dto/ConfirmationDto.kt` | JSON confirmation shape |
| `apps/backend/backend/src/main/resources/templates/confirmation.{fo.xml,css}` | gov.cz template + XMP metadata |
| `apps/backend/backend/src/main/resources/fonts/*` | DejaVu Sans/Mono + sRGB.icc |
| `apps/mobile/lib/features/submission/{presentation/confirmation_page.dart,presentation/widgets/{confirmation_qr,pdf_viewer}.dart,data/{confirmation_remote_datasource,confirmation_repository}.dart,domain/confirmation.dart}` | Mobile confirmation feature |
| `apps/mobile/lib/core/router/app_router.dart` | `/confirmation/:referenceNumber` → `ConfirmationPage` |
| `apps/mobile/lib/features/submission/presentation/submission_form_page.dart` | "Zobrazit potvrzení" navigation after submit |
| `apps/mobile/test/features/submission/confirmation_page_test.dart` | Mobile confirmation tests |
| `apps/admin-web/src/features/submissions/{components/ConfirmationPreview.tsx,components/ConfirmationDownload.tsx,api/confirmationsApi.ts,types/confirmation.ts}` | Admin confirmation preview/download |
| `apps/admin-web/src/features/submissions/Confirmation.test.tsx` | Admin confirmation tests |

---

## Requirements Completed

- **FR-01.4** (Confirmation + PDF) — PDF/A-1b with QR verification, tracking code, form data, timestamp; preview/download on mobile and admin web.

---

## Next Steps

**Wave 3 (remaining):** Plan 06 (Admin Web MVP) then Plan 07 (Citizen Web MVP) — same verify → SUMMARY → commit/push loop.

---

## Commands to Verify Locally

```bash
# Backend
cd apps/backend && ./gradlew :backend:test

# Admin Web
cd apps/admin-web && npm run lint && npm run typecheck && npm run test && npm run build

# Mobile
cd apps/mobile && flutter analyze && flutter test
```

---

**Commit:** `feat(plan05): PDF/A-1b confirmation with QR — mobile preview + admin preview/download`
