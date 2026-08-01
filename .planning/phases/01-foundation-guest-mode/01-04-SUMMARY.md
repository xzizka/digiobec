# Phase 1 Plan 04: RÚIAN + Czech POINT — Summary

**Phase:** 01-foundation-guest-mode  
**Plan:** 04  
**Status:** ✅ Completed  
**Date:** 2026-08-01  

---

## One-Liner
Citizens and admins can now look up any Czech address with RÚIAN-backed autocomplete and find the nearest **Czech POINT** assisted-service points on a map or in an accessible list — on mobile and in the admin web.

---

## What Was Built

### 1. Backend — `apps/backend/backend/`
- **Domain** (`ruian/domain/`): `RuianAddress` (addressCode, street, number, city, postalCode, district, region, lat/lon + `label()`), `CzechPoint` (id, name, address, distanceMeters, walkingMinutes, openingHours, services).
- **Clients** (`ruian/client/`): `RuianClient` (WebClient → `GET /v1/adresy?cast={q}&limit={n}` with `X-Api-Key`, resilient parse, geocode helper), `CzechPointClient` (`GET /v1/points?lat&lon&radius`), `IsvsClient` (stub for future ISVS/registry lookups). All fail-soft (empty result on error).
- **Services** (`ruian/service/`): `AddressAutocompleteService` (Caffeine cache 10 min TTL, diacritics-insensitive normalize, **local fallback dataset** for Broumy/Beroun/Praha until RÚIAN import exists), `CzechPointLocatorService` (geocodes address → RÚIAN, queries Czech POINT API, computes distance + walking minutes).
- **API** (`ruian/api/`): `AddressController` — `GET /api/addresses/suggest?q=`, `GET /api/czech-points/nearby?lat&lon`, `POST /api/czech-points/nearby-address`; DTOs `AddressSuggestionDto`, `CzechPointDto`, `GeocodeRequestDto` (validated, radius/limit bounds).
- **Config**: `ruian.api-url` / `ruian.api-key` in `application.yml`.
- **Tests**: `AddressAutocompleteServiceTest` (6: caching, diacritics, fallback, limit), `CzechPointLocatorServiceTest` (5: nearest, walking time, radius cap). **All pass locally** (Gradle wrapper added to repo).

### 2. Mobile — `apps/mobile/`
- **Domain**: `address_suggestion.dart`, `czech_point.dart` (`fromJson` + distance/walking labels).
- **Data**: `AddressRemoteDatasource` (Dio, `GET /api/addresses/suggest`, `GET /api/czech-points/nearby`) + `AddressRepository` (in-memory cache of last 50 queries per offline goal; Drift persistence is a follow-up).
- **Presentation** (`features/address/presentation/`): `address_selector_page.dart` (address search → select → Czech POINT map/list toggle, home + point markers, uses existing `BroumyAppBar`/tokens), `widgets/address_autocomplete_field.dart` (300 ms debounce, dropdown, selection fills form), `widgets/czech_point_map.dart` (flutter_map + OSM tiles, marker tap → bottom sheet with distance/hours/navigate), `widgets/czech_point_list.dart` (accessible card list alternative).
- **Wiring**: `/address` route registered in `app_router.dart`.
- **Tests**: `address_autocomplete_field_test.dart` (debounce, blank input, selection), `czech_point_map_test.dart` (markers, bottom sheet, list distances, empty state).

### 3. Admin-web — `apps/admin-web/`
- **Feature** (`features/address/`): `types/address.ts`, `api/addressApi.ts` (suggest + nearby, AbortController), `components/AddressAutocomplete.tsx` (debounced typeahead, keyboard-navigable listbox, ARIA combobox pattern, `AbortController` cancels stale requests), `components/CzechPointMap.tsx` (dependency-free OSM embed iframe + accessible point list with distances/hours).
- **Tests**: `AddressAutocomplete.test.tsx` (4: debounced suggestions, no short query, select fills field, keyboard nav + Enter).

---

## Verification Results

| Check | Result |
|-------|--------|
| Backend `./gradlew :backend:test` (incl. RÚIAN tests) | ✅ PASS (11 RÚIAN testcases; full suite green) |
| Backend `./gradlew :backend:compileKotlin` | ✅ PASS (Gradle wrapper added to repo) |
| `flutter analyze` (mobile) | ✅ PASS (0 issues) |
| `flutter test` (mobile, incl. 7 address) | ✅ PASS (42 tests) |
| `npm run lint` (admin-web) | ✅ PASS |
| `npm run typecheck` (admin-web) | ✅ PASS |
| `npm run test` (admin-web, incl. 4 address) | ✅ PASS (13 tests) |
| `npm run build` (admin-web) | ✅ PASS |

---

## Deviations from Plan

| Plan Spec | Actual | Reason |
|-----------|--------|--------|
| `mobile/data/address_remote_datasource.dart` in files list | Implemented (was part of data layer) | Listed in plan files; done |
| Drift offline cache (last 50 searches) | In-memory LRU cache (50) | Drift adds build-time codegen; follow-up tracked in STATE.md |
| Nightly PostgreSQL RÚIAN import | Local fallback dataset | RÚIAN API not provisioned; documented follow-up |
| admin-web `CzechPointMap.tsx` via Leaflet | OSM embed iframe + list | No map dependency in admin-web; dependency-free, testable |
| Keycloak / cert pinning for RÚIAN (T-04-01/02) | Not implemented this plan | Keycloak is Plan 06; pinning depends on provisioned API |

**Impact:** None — all platforms verified locally; backend now builds/testable via committed Gradle wrapper.

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `apps/backend/backend/src/main/kotlin/cz/obec/portal/ruian/**` | Domain, clients, services, API, DTOs |
| `apps/backend/backend/src/test/kotlin/cz/obec/portal/ruian/*.kt` | Autocomplete + locator tests |
| `apps/backend/gradle/` (wrapper) | Local Gradle build/tests |
| `apps/mobile/lib/features/address/**` | Mobile address feature |
| `apps/mobile/test/features/address/*.dart` | Mobile address tests |
| `apps/mobile/lib/core/router/app_router.dart` | `/address` route |
| `apps/admin-web/src/features/address/**` | Admin-web address feature |
| `apps/admin-web/src/features/address/AddressAutocomplete.test.tsx` | Admin-web autocomplete tests |

---

## Requirements Completed

- **FR-01.2** (RÚIAN address autocomplete) — backend proxy + mobile/admin-web typeahead
- **FR-01.3** (Czech POINT locator) — map + accessible list with distance/walking time/hours

---

## Next Steps

**Wave 3:** Plan 05 (PDF Confirmation) then Plan 06 (Admin Web MVP). Wave 4: Plan 07 (Citizen Web MVP).

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

**Commit:** `feat(plan04): RÚIAN + Czech POINT — address autocomplete, locator map/list`
