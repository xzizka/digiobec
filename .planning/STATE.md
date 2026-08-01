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
| 01-02: Design System Foundation | 1 | ⏳ PENDING | — |
| 01-03: Guest Submission Core | 2 | ⏳ PENDING | — |
| 01-04: RÚIAN + Czech POINT | 2 | ⏳ PENDING | — |
| 01-05: PDF Confirmation | 3 | ⏳ PENDING | — |
| 01-06: Admin Web MVP | 3 | ⏳ PENDING | — |
| 01-07: Citizen Web MVP | 4 | ⏳ PENDING | — |

### Next Actions
1. **Run `/gsd-execute-phase 01-foundation-guest-mode --wave 1`** — Execute Plan 02 (Design System Foundation) in parallel with Plan 01 (already done)
2. Then Wave 2: Plans 03 + 04
3. Then Wave 3: Plans 05 + 06
4. Then Wave 4: Plan 07 (Citizen Web MVP)
5. **Rozsah:** Agendy ORP vynechány z ROADMAP/REQUIREMENTS/plánů (epic E4.4 "Místní povolení: trhy a zábory" místo stavebních povolení; demo formulář "Žádost o informace")

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
│   └── SKELETON.md
└── STATE.md            # This file
```

### Git History
- `f5e6c88` — Initial commit: PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md
- `c8124d7` — .gitignore + remove build artifacts
- `a226c1d` — Remove duplicate top-level dirs, keep monorepo apps/ structure
- `00ac7ea` — Remove admin-web/dist build artifact
- `ee57358` — **Plan 01 complete: Walking Skeleton**