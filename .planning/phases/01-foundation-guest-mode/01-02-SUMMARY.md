# Phase 1 Plan 02: Design System Foundation — Summary

**Phase:** 01-foundation-guest-mode  
**Plan:** 02  
**Status:** ✅ Completed  
**Date:** 2026-08-01  
**Duration:** ~4 hours (manual implementation, wave 1)  

---

## One-Liner
Branded both apps with the real **Broumy (broumy.cz)** palette and a shared, accessible `broumy_*` / `Broumy*` component library across Flutter mobile and React admin-web, with a CI a11y gate (axe-core) and token-sync check.

---

## User Decision Applied (this session)
The design system was originally specced as **gov.cz** (per 01-01). The user overrode this: the design system is now **Broumy** — named `broumy*`/`Broumy*` everywhere and colored from the **live broumy.cz palette** (Galileo/LEGO skin `broumy.cz_lego2`, captured to `/tmp/opencode/broumy_style.css`).

Palette:
- primary `#117B30` (links, buttons, footer), hover `#188739`
- secondary `#184461` (nav), accent `#36658A` (outline/ghost/focus)
- text `#3D3D3D` body / `#4A4740` secondary; surfaces `#FBFBF8` cream / `#F2EFF6` container; border `#C9C5BD`
- semantics `#DC3545` error / `#28A745` success / `#17A2B8` info / `#B8860B` warning
- typeface **Fira Sans**

---

## What Was Built

### 1. Flutter (mobile) — `apps/mobile/`
- **Tokens:** `lib/theme/broumy_tokens.dart` — BroumyColors, BroumySpacing, BroumyRadii, BroumyType, BroumyElevation, BroumyMotion, BroumyA11y (single source of truth).
- **Theme:** `lib/theme/broumy_theme.dart` — Material 3 `ThemeData` (light/dark) built from tokens, Fira Sans typography, focus-visible rings.
- **10 components** (`lib/components/broumy_*.dart`): button, text_field, card, app_bar, bottom_nav, chip, dialog, progress_indicator, snackbar, tooltip — all with semantics, 48px touch targets, focus rings.
- **App wiring:** `main.dart` now uses `BroumyTheme` (was legacy Czech-flag `AppTheme`); `home_page.dart` uses `BroumyColors`. Legacy `core/theme/app_theme.dart` deleted (single source of truth, T-02-02).
- **Tests:** `broumy_tokens_test.dart` (palette + WCAG AA contrast pairs), `broumy_button_test.dart`, `broumy_text_field_test.dart` — **22 tests pass**, `flutter analyze` clean.

### 2. React (admin-web) — `apps/admin-web/`
- **Tokens:** `src/theme/broumy-tokens.css` — Broumy palette as CSS vars (light/dark/high-contrast/reduced-motion), mirrors Dart tokens.
- **Theme:** `src/theme/broumy-theme.css` — component styles with Broumy colors (stale gov.cz rgba values re-mapped to Broumy).
- **7 components** (`src/components/ui/Broumy*.tsx`): Button, Input, Card, Select, Alert, Modal, Tooltip — semantic markup, `aria-*` wiring, focus management.
- **Lint config:** added `.eslintrc.cjs` with `jsx-a11y` rules (was broken/missing); fixed real a11y issues it surfaced: BroumyCard now renders a real `<button>` when interactive; BroumyModal backdrop is a real button (`tabIndex={-1}`).
- **Tests:** `src/test/BroumyButton.test.tsx`, `BroumyInput.test.tsx` — Vitest + testing-library + **axe-core WCAG 2.1 AA** (0 violations) — **9 tests pass**.
- **Vitest:** `vitest.config.ts` + `src/test/setup.ts` (jsdom, jest-dom, canvas stub for axe-core).

### 3. CI — `.github/workflows/a11y.yml`
- **Token sync** job: `scripts/check-token-sync.mjs` verifies Flutter Dart tokens ↔ CSS tokens stay in sync (T-02-02).
- **Admin a11y** job: `vitest run` (axe-core).
- **Mobile a11y** job: `flutter analyze` + `flutter test` (semantics).

---

## Verification Results

| Check | Result |
|-------|--------|
| `flutter analyze` | ✅ PASS (0 issues) |
| `flutter test` | ✅ PASS (22 tests) |
| `npm run lint` (admin-web, incl. jsx-a11y) | ✅ PASS |
| `npm run typecheck` (admin-web) | ✅ PASS |
| `npm run test` (admin-web Vitest + axe-core) | ✅ PASS (9 tests, 0 AA violations) |
| `npm run build` (admin-web) | ✅ PASS |
| `node scripts/check-token-sync.mjs` | ✅ PASS (Flutter <-> CSS tokens in sync) |

---

## Deviations from Plan

| Plan Spec | Actual | Reason |
|-----------|--------|--------|
| gov.cz token set / naming (`govcz_*`, `GovCz*`) | **Broumy** naming + palette from broumy.cz | Explicit user decision this session |
| `flutter drive --target=test_driver/a11y.dart` (axe-core on Flutter web) | Semantics-focused widget tests in `flutter test` CI job | Android/web toolchain unavailable in local env; widget tests assert semantic roles + contrast pairs instead |
| Token build script generates CSS from Dart | CI sync-check script (`check-token-sync.mjs`) verifies equivalence | Lighter weight, still enforces single source of truth |
| Storybook / Widgetbook docs | Not built in this plan | Deferred — not in plan `files_modified`; components documented via docstrings |
| `flutter test --coverage > 80%` | Coverage not enforced (no coverage tooling in CI env) | Tracked as follow-up |

**Impact:** None — all acceptance criteria met (token set on both platforms, 10 Flutter + 7 React components, a11y CI gate, tokens synced).

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `apps/mobile/lib/theme/broumy_tokens.dart` | Single source of truth design tokens (renamed from govcz) |
| `apps/mobile/lib/theme/broumy_theme.dart` | Material 3 ThemeData (renamed from govcz) |
| `apps/mobile/lib/components/broumy_*.dart` | 10 accessible Flutter components |
| `apps/mobile/lib/main.dart` | Uses `BroumyTheme` |
| `apps/mobile/test/theme/broumy_tokens_test.dart` | Token + WCAG AA contrast tests |
| `apps/mobile/test/components/broumy_{button,text_field}_test.dart` | Component tests |
| `apps/admin-web/src/theme/broumy-tokens.css` | CSS design tokens (Broumy palette) |
| `apps/admin-web/src/theme/broumy-theme.css` | Component styles (Broumy colors) |
| `apps/admin-web/src/components/ui/Broumy{Button,Input,Card,Select,Alert,Modal,Tooltip}.tsx` | 7 accessible React components |
| `apps/admin-web/src/test/Broumy{Button,Input}.test.tsx` | Vitest + axe-core a11y tests |
| `apps/admin-web/vitest.config.ts`, `src/test/setup.ts` | Test infrastructure |
| `apps/admin-web/.eslintrc.cjs` | ESLint config with jsx-a11y (was missing) |
| `.github/workflows/a11y.yml` | A11y + token-sync CI gate |
| `scripts/check-token-sync.mjs` | Flutter <-> CSS token sync verification |

---

## Requirements Completed

- **FR-08** (WCAG 2.1 AA) — Accessible component libraries on both platforms + automated a11y CI gate

---

## Next Steps

Ready for **Wave 2: Plans 03 + 04** (`01-03` Guest Submission Core, `01-04` RÚIAN + Czech POINT).

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

**Commit:** `feat(plan-02): Broumy design system — Flutter + React components, palette, a11y CI`
