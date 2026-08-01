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

### Research Completed
- [x] Czech eGov integrations (eIdentita, ISDS, ISVS, payments, accessibility law)
- [x] Flutter architecture (state mgmt, navigation, local DB, security, a11y, CI/CD)
- [x] Spring Boot backend (modular monolith, Keycloak, multi-tenancy, integrations, observability)
- [x] UX research (personas, journeys, WCAG 2.1 AA, trust, competitive analysis)

### Requirements Status
- **REQUIREMENTS.md** created with 10 functional areas (FR-01 to FR-10)
- **ROADMAP.md** created with 5 phases, 28 sprints, milestones, team structure

### Next Actions
1. **Run `/gsd-plan-phase 1`** – Create detailed PLAN.md for Phase 1 (Foundation & Guest Mode)
2. **Sprint 0 Setup** – Provision repos, CI/CD, dev environments, design system tokens
3. **Stakeholder Alignment** – Present roadmap to municipality IT/management

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
└── STATE.md            # This file
```

### Git History
- Initial commit: PROJECT.md, config.json, REQUIREMENTS.md, ROADMAP.md, STATE.md