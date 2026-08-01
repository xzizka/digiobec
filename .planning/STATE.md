# STATE: Municipal Citizen Portal

## Project Memory

### Initialized
- **Date:** 2025-07-31
- **Initiator:** User request via opencode
- **Method:** gsd-new-project workflow

### Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Platform: Flutter (Android + iOS) | Single codebase, gov.cz design system web components adaptable, team can hire Flutter devs | 2025-07-31 |
| Backend: Spring Boot 3 + Kotlin | Strong Czech enterprise ecosystem, Keycloak native, PostgreSQL, team expertise | 2025-07-31 |
| Auth: eIdentita (NIA) + Keycloak broker | Legal requirement for public admin, 5 auth methods cover 99% citizens | 2025-07-31 |
| Payments: GP WebPay + QR platba | Czech banking standard, widely supported, municipal procurement friendly | 2025-07-31 |
| Database: PostgreSQL + JSONB | Flexible forms, fulltext search, mature, no vendor lock-in | 2025-07-31 |
| Admin Web: React + TypeScript | Separate team possible, rich ecosystem for data grids, forms | 2025-07-31 |
| CI/CD: GitHub Actions + Fastlane | Free for public repos, good Flutter/Android/iOS support | 2025-07-31 |
| Target: obec do 1 500 obyvatel (I. typu), bez rozšířené působnosti | Portál je pro malou obec; agendy ORP (občanky/pasy, řidičáky, registr vozidel, živnostenská agenda, OSPOD, stavební povolení aj.) mimo rozsah – přes portál občana / Czech POINT | 2026-08-01 |
| Demo formulář: "Žádost o informace" (InfZ) | Univerzální úkon každé obce; nahradil "Výpis z rejstříku" (živnostenský = ORP agenda) | 2026-08-01 |
| Design system: **Broumy** (ne gov.cz) | Paleta + názvy z živé broumy.cz; komponenty `broumy_*`/`Broumy*`, Fira Sans; gov.cz design byl jen výchozí bod | 2026-08-01 |
| Keycloak realm import plně automatizovaný (`keycloak/realm-portal.json` + `--import-realm`) | Uživatel explicitně žádal žádné manuální kroky v Admin Console; `docker compose up` reprodukuje celý auth stack (realm, role `clerk`, oba OIDC klienty, seed test uživatel) | 2026-08-01 |
| SubmissionStatus rozšířen: SUBMITTED→PROCESSING→COMPLETED/REJECTED/NEEDS_INFO | Nahradil Plan 03 IN_PROGRESS/APPROVED; odpovídá skutečnému clerk workflow (Plan 06) | 2026-08-01 |
| MFA pro úředníky (T-06-01) odloženo | Vyžadovalo by interaktivní TOTP enrollment, což je v rozporu s plnou automatizací seed uživatele; sledováno jako follow-up | 2026-08-01 |

### Research Completed
- [x] Czech eGov integrations (eIdentita, ISDS, ISVS, payments, accessibility law)
- [x] Flutter architecture (state mgmt, navigation, local DB, security, a11y, CI/CD)
- [x] Spring Boot backend (modular monolith, Keycloak, multi-tenancy, integrations, observability)
- [x] UX research (personas, journeys, WCAG 2.1 AA, trust, competitive analysis)

### Requirements Status
- **REQUIREMENTS.md** created with 10 functional areas (FR-01 to FR-10)
- **ROADMAP.md** created with 5 phases, 28 sprints, milestones, team structure

### Phase 1 Progress (Foundation & Guest Mode)

| Plan | Wave | Status | Summary |
|------|------|--------|---------|
| 01-01: Walking Skeleton | 1 | ✅ **DONE** | [01-01-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-01-SUMMARY.md) |
| 01-02: Design System Foundation | 1 | ✅ **DONE** | [01-02-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-02-SUMMARY.md) |
| 01-03: Guest Submission Core | 2 | ✅ **DONE** | [01-03-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-03-SUMMARY.md) |
| 01-04: RÚIAN + Czech POINT | 2 | ✅ **DONE** | [01-04-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-04-SUMMARY.md) |
| 01-05: PDF Confirmation | 3 | ✅ **DONE** | [01-05-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-05-SUMMARY.md) |
| 01-06: Admin Web MVP | 3 | ✅ **DONE** | [01-06-SUMMARY.md](.planning/phases/01-foundation-guest-mode/01-06-SUMMARY.md) |
| 01-07: Citizen Web MVP | 4 | ⏳ PENDING | — |

### Next Actions
1. **Run `/gsd-execute-phase 01-foundation-guest-mode --wave 4`** — remaining Plan 07 (Citizen Web MVP)
3. **Rozsah:** Agendy ORP vynechány z ROADMAP/REQUIREMENTS/plánů (epic E4.4 "Místní povolení: trhy a zábory" místo stavebních povolení; demo formulář "Žádost o informace")
4. **Follow-ups (Plan 02):** `flutter test --coverage > 80%` gating; Storybook (React) / Widgetbook (Flutter) docs; `flutter drive` axe-core web a11y v CI
5. **Follow-ups (Plan 04):** Drift offline cache (last 50 searches); nightly PostgreSQL RÚIAN import; cert pinning pro RÚIAN/Czech POINT; Český POINT API provisioning (Ministry)
6. **Follow-ups (Plan 05):** Rate limit na PDF/confirmation endpointech; digitální podpis PDF (fáze 2, T-05-01); PDF/UA tagged a11y + verapdf do CI; generování PDF přes `CompletableFuture` + cache 1h (T-05-05)
7. **Follow-ups (Plan 06):** MFA pro úředníky (T-06-01, TOTP enrollment); per-form SLA lhůty (aktuálně jednotných 30 dní pro všechny formuláře); rate limit na `/api/admin/**`; Keycloak `KC_BOOTSTRAP_ADMIN_USER` nevytváří perzistentní admin uživatele (Keycloak 26.0.8 quirk, netýká se realm importu); docker-compose Keycloak healthcheck používá `curl`, který v image chybí (pre-existing, healthcheck hlásí unhealthy i když kontejner funguje)

### Open Questions
- [ ] Citizen Portal federation API spec (DIA/NAKIT) – need contact
- [ ] Czech POINT 2.0 API for municipal service types – research
- [ ] PSD2 acquirer selection for municipal payments – procurement
- [ ] Databox ISDS message schemas for municipal agenda types – request from provider
- [ ] Senior usability validation (65+ low digital literacy) – plan user testing

### Artifacts Location
```
.planning/
├── PROJECT.md          # Vision, scope, constraints
├── config.json         # Workflow config, tech stack
├── REQUIREMENTS.md     # FR-01 to FR-10
├── ROADMAP.md          # 5 phases, 28 sprints
├── research/
│   ├── czech-egov-integrations.md  (created by researcher)
│   ├── flutter-architecture.md     (created by researcher)
│   ├── backend-architecture.md     (created by researcher)
│   └── ux-research.md              (created by researcher)
├── phases/01-foundation-guest-mode/
│   ├── 01-01-PLAN.md ... 01-07-PLAN.md
│   ├── 01-01-SUMMARY.md ✅
│   ├── 01-02-SUMMARY.md ✅
│   ├── 01-03-SUMMARY.md ✅
│   ├── 01-04-SUMMARY.md ✅
│   ├── 01-05-SUMMARY.md ✅
│   ├── 01-06-SUMMARY.md ✅
│   └── SKELETON.md
└── STATE.md            # This file
```

### Git History
- `f5e6c88` — Initial commit: PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md
- `c8124d7` — .gitignore + remove build artifacts
- `a226c1d` — Remove duplicate top-level dirs, keep monorepo apps/ structure
- `00ac7ea` — Remove admin-web/dist build artifact
- `ee57358` — **Plan 01 complete: Walking Skeleton**
- `726b64b` — Scope to small municipality (no ORP) + citizen-web plan
- `9f1b824` — Plan 02: Flutter theme foundation (tokens + ThemeData)
- `7d794dc` — Plan 02: Flutter components (10) + widget tests
- `f25fa03` — **Plan 02 complete: Broumy design system — Flutter + React components, palette, a11y CI**
- `2ac4515` — **Plan 03 complete: Guest submission core — forms catalog, validation, tracking**
- *(next)* — **Plan 04: RÚIAN + Czech POINT — autocomplete, locator map/list (mobile + admin-web)**
- *(next)* — **Plan 05: PDF/A-1b confirmation with QR — mobile preview + admin preview/download**
- **Plan 06 complete: Keycloak PKCE auth + admin submissions dashboard (SLA badges, state machine, audit trail, streaming CSV export)** — commits `2f79cbe`, `53ddc1e`, `bdc904b`, `c338a5b`, `94d1761`, `d008c24`