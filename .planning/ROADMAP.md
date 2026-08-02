# ROADMAP: Municipal Citizen Portal

## Phase Overview

| Phase | Name | Focus | Duration | Key Deliverable |
|-------|------|-------|----------|-----------------|
| 1 | Foundation & Guest Mode | IA, Design System, Guest submission, RÚIAN, Czech POINT | 6 sprints | Guest pode submit žádost, stažení potvrzení |
| 2 | Auth & Payments | eIdentita (5 metod), Keycloak, QR/GP WebPay, doručky | 6 sprints | Přihlášený uživatel, platby, chytrá složenka |
| 3 | Case Mgmt & Notifications | Timeline, chat, SLA, multi-channel notif, GDPR dashboard | 5 sprints | Plný životní cyklus řízení |
| 4 | Municipal Services Pack | Psi, odpad, voda OCR, trhy/zábory, události, rodinné profily | 6 sprints | Diferencující služby pro konkrétní agendu |
| 5 | Federation & Admin | Citizen Portal API, Clerk dashboard, analytics, multi-tenant | 5 sprints | Provozovatelné pro více obcí |

> **Scope constraint:** Portál je určen pro **obec do 1 500 obyvatel (obec I. typu) bez rozšířené působnosti**.
> Aplikace pokrývá výhradně **samostatnou působnost obce** (místní poplatky, svoz odpadu, trhy/zábory, události, obecní rozpočet, hlášení závad) a **základní rozsah přenesené působnosti** (Czech POINT odkaz, matrika tam, kde ji obec vede).
> **Mimo rozsah — agendy ORP (obce III. typu):** občanské průkazy a cestovní pasy, řidičské průkazy, evidence motorových vozidel a bodů, živnostenskoprávní agenda a živnostenský rejstřík, evidence zemědělských podnikatelů, sociálně-právní ochrana dětí, vodoprávní řízení, stavební povolení (stavební úřad), státní správa lesů/myslivosti/rybářství, silniční a dopravní správní úřad, koordinace sociálních služeb. Tyto úkony uživatel řeší přes **portál občana (federace, E5.1)** nebo na **Czech POINTu**.

---

## Phase 1: Foundation & Guest Mode (6 sprints)

### Goals

- Validovat informační architekturu s reálnými uživateli
- Bezpříprava guest flow pro nejčastější úkony
- Design system gov.cz compliant components

### Epics

- **E1.1** Project Setup: Flutter (mobile), Spring Boot (backend), React (admin), CI/CD, PostgreSQL, Keycloak dev
- **E1.2** Design System: gov.cz tokens, komponenty, WCAG 2.1 AA audit baseline
- **E1.3** Guest Submission: formulář builder (JSON Schema), RÚIAN autocomplete, Czech POINT locator, PDF potvrzení
- **E1.4** Backend Core: domain model (citizen, submission, attachment), REST API, OpenAPI spec, Testcontainers
- **E1.5** Admin Web MVP: seznam podání, detail, změna stavu, export CSV
- **E1.6** Citizen Web MVP: webová verze portálu pro občany (React), guest submission, sledování stavu, stažení potvrzení

### Acceptance Criteria

> **Descoped 2026-08-02.** Verifikace fáze 1 (`phases/01-foundation-guest-mode/01-VERIFICATION.md`)
> ukázala, že tři z původních kritérií byly napsané ambiciózněji, než na co byly ve fázi 1
> podmínky — vyžadovaly externí registrace, infrastrukturu a měření, které v tomto rozsahu
> nebyly dostupné. Přeformulována na to, co fáze skutečně dodává; odložená práce je
> zavedena jako explicitní položky fáze 2 (E2.6), ne jako tichý dluh.
> Původní znění je dohledatelné v git historii tohoto souboru.

- [x] Guest uživatel podá žádost "Žádost o informace" end-to-end (mobile i citizen-web)
      — citizen-web živě ověřen proti běžícímu stacku; mobil ověřen 50/50 testy včetně
      kontraktních (`apps/mobile/test/features/submission/wire_contract_test.dart`)
- [x] Autocomplete adresy funguje nad demo datasetem pilotní obce (Broumy a okolí)
      — *plné pokrytí RÚIAN vyžaduje registraci u ČÚZK, viz E2.6*
- [x] PDF potvrzení obsahuje sledovací kód, QR pro ověření
- [x] axe-core hlásí 0 WCAG 2.1 AA porušení v CI (admin-web, citizen-web)
      — *měření Lighthouse ≥ 95 vyžaduje běžící deployment, viz E2.6*
- [x] CI: build + test zelené na každém PR (backend, admin-web, citizen-web, mobile)
      — *deploy do staging za < 15 min vyžaduje staging prostředí, viz E2.6*

---

## Phase 2: Auth & Payments (6 sprints)

### Goals

- eIdentita integrace (vše 5 metod)
- Platby (QR, karta, GP WebPay)
- Doručky (ISDS, SMS, e-mail)

### Epics

- **E2.1** Keycloak + eIdentita: OIDC federation, LoA mapping, token exchange, session management
- **E2.2** Profil uživatele: fyzická osoba, podnikatel (IČO), zástupce, rodinné profily
- **E2.3** Payments: GP WebPay integrace, QR platba generování, chytrá složenka PDF, idempotency
- **E2.4** Doručky: ISDS odesílání doručenek, evidence doručení, SMS/e-mail fallback
- **E2.5** Security hardening: certificate pinning, Play Integrity / App Attest, secure storage
- **E2.6** Infrastruktura a externí registrace *(přeneseno z fáze 1 při descope 2026-08-02)*:
  registrace u ČÚZK pro RÚIAN API (reálný endpoint + API klíč, nahrazení demo datasetu),
  staging prostředí a funkční CD pipeline, měření Lighthouse na běžícím deploymentu.
  Fáze 2 je pro tuto práci přirozené místo — už tak stojí na externích registracích
  (eIdentita/NIA, ISDS, GP WebPay), takže procurement běží souběžně.

### Acceptance Criteria

- [ ] Přihlášení Bankovní identitou < 30 s end-to-end
- [ ] Platba kartou proběhne v aplikaci (WebView) bez přesměrování do prohlížeče
- [ ] QR platba skenovatelná z obrazovky / vytištěná
- [ ] Doručka v ISDS doručena do 1 min po změně stavu
- [ ] Penetrace test: 0 kritických/high findings
- [ ] **(z fáze 1)** Autocomplete adresy funguje pro 95 % adres RÚIAN proti reálnému
      ČÚZK API — doloženo aspoň jedním živým `suggest()` voláním, ne mockem
- [ ] **(z fáze 1)** CI/CD: build, test, deploy do staging za < 15 min proti skutečnému
      staging prostředí
- [ ] **(z fáze 1)** Lighthouse accessibility score ≥ 95 (mobile/web i citizen-web)

---

## Phase 3: Case Management & Notifications (5 sprints)

### Goals

- Plný životní cyklus řízení
- Komunikace občan–úředník
- GDPR dashboard

### Epics

- **E3.1** Timeline & SLA: stavový automat, eskalace, termíny, historie verzí
- **E3.2** Threaded chat: zprávy, přílohy, interní poznámky, read receipts
- **E3.3** Notifikace: push (FCM/APNs), e-mail, SMS, ISDS – preference, tichý režim
- **E3.4** GDPR Dashboard: export dat, oprava, výmaz, přenositelnost, audit log přístupů
- **E3.5** Offline-first sync: drift/Isar local DB, conflict resolution, background sync

### Acceptance Criteria

- [ ] Občan vidí kompletní timeline včetně interních termínů úřadu
- [ ] Zpráva doručena push < 10 s, fallback e-mail < 1 min
- [ ] GDPR export generovaný < 30 s (JSON + PDF)
- [ ] Offline: čtení historie funguje v letadle, odeslání se frontuje

---

## Phase 4: Municipal Services Pack (6 sprints)

### Goals

- Konkrétní diferencující služby
- OCR / automatizace
- Rodinné profily

### Epics

- **E4.1** Psi: registrace, poplatky,-chip, expirace, upomínky
- **E4.2** Odpad: kalendář vývozu, velkoobjemový, kompostéry
- **E4.3** Voda/kanalizace: OCR údajů z měřiče (ML Kit), spotřeba, fakturace
- **E4.4** Místní povolení: trhy a zábory veřejného prostranství – formuláře z ISVS
- **E4.5** Události a deska: místní akce, volby, výluky – kalendář, mapy
- **E4.6** Rodinné profily: sdílení přístupu k dětem/seniorům, delegace

### Acceptance Criteria

- [ ] OCR měřiče rozpozná 90 % číslic za ideálních podmínek
- [ ] Upomínka na expiraci psa dorazí 30 dní předem (push + e-mail)
- [ ] Rodič vidí žádosti dítěte, může ji doplnit/podpsat

---

## Phase 5: Federation & Admin (5 sprints)

### Goals

- Federace s Citizen Portal (DIA/NAKIT API)
- Multi-tenant pro více obcí
- Clerk dashboard + analytics

### Epics

- **E5.1** Citizen Portal API: přehled úkonů státu v aplikaci, jednotné přihlášení
- **E5.2** Multi-tenant: schema-per-tenant vs RLS, onboarding nové obce < 1 den
- **E5.3** Clerk Dashboard: kanban board, SLA reporty, hromadné akce, šablony odpovědí
- **E5.4** Analytics: adopce, funely, chyby, výkon – GDPR compliant (Matomo / Plausible)
- **E5.5** Hardening: load test, chaos engineering, disaster recovery runbook

### Acceptance Criteria

- [ ] Občan v aplikaci vidí své úkony u státu i obce jednotně
- [ ] Nová obec nasazená přes admin UI bez code deploy
- [ ] Clerk zpracuje 50 žádostí/den s SLA < 24h
- [ ] RTO < 4h, RPO < 1h (DB backup + WAL archiving)

---

## Cross-Cutting Concerns (All Phases)

| Concern | Implementation |
|---------|----------------|
| **Accessibility** | WCAG 2.1 AA audit každý sprint, axe-core v CI, manuální test screen readerem |
| **Security** | SAST (SonarQube), DAST (OWASP ZAP), dependency check, pentest před go-live |
| **Performance** | Flutter: 60 fps, cold start < 2s; Backend: p95 < 500ms, 1000 RPS |
| **Observability** | OpenTelemetry, structured logs, dashboards, alerty (SLA breach) |
| **Documentation** | OpenAPI (backend), Storybook (Flutter/React), ADR v `.planning/adr/` |
| **Compliance** | GDPR DPIA, přístupnost prohlášení, bezpečnostní audit (NIS2 pokud platí) |

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| eIdentita sandbox dostupnost | Parallelní dev proti mock serveru, smlouva s NIA |
| ISDS API změny | Anti-corruption layer, contract testing (Pact) |
| Nízká adopce seniorů | Guest mode + Czech POINT + telefonická linka + školení |
| Multi-tenant data isolation | RLS + integration testy, third-party audit |
| Zákonodárné změny (eIdentita 2.0) | Modulární auth, feature flags, sledování legislativy |

---

## Milestones

| Milestone | Target Sprint | Criteria |
|-----------|---------------|----------|
| **M1: Guest MVP** | Sprint 6 | Uživatel podá žádost guest, dostane PDF |
| **M2: Auth & Payments** | Sprint 12 | eIdentita + platba funguje end-to-end |
| **M3: Full Case Cycle** | Sprint 17 | Timeline, chat, notifikace, GDPR |
| **M4: Services Pack** | Sprint 23 | 3+ konkrétní agendy v provozu |
| **M5: Federation Ready** | Sprint 28 | Citizen Portal API, multi-tenant, clerk dashboard |

---

## Team Structure (Navržené)

| Role | Phase 1-2 | Phase 3-5 |
|------|-----------|-----------|
| Flutter Dev | 2 | 3 |
| Backend Dev (Kotlin/Spring) | 2 | 3 |
| Frontend Dev (React/Admin) | 1 | 2 |
| QA / Accessibility | 1 | 1 |
| DevOps / SecOps | 1 | 1 |
| UX / Content Designer | 1 | 0.5 |
| PO / Domain Expert (úředník) | 1 | 1 |

---

## Budget Estimate (Indikativní)

| Položka | Odhad (CZK) |
|---------|-------------|
| Vývoj (28 sprintů × 5 FTE × 1.5M) | ~210 M |
| Infrastruktura (cloud, DB, Keycloak, monitoring) | 3 M / rok |
| eIdentita / ISDS onboarding + certifikace | 2 M |
| Pentest + accessibility audit | 1.5 M |
| **Celkem prvních 18 měsíců** | **~220 M CZK** |

*Presouvá se do detailního PLAN.md pro každou fázi.*
