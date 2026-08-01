# UX Research: Municipal Citizen Portal — Czech Context

**Project:** Municipal Citizen Portal (Czech Republic)
**Research Date:** 2025-07-31
**Research Mode:** Ecosystem
**Overall Confidence:** HIGH

---

## Executive Summary

This research maps the UX landscape for a municipal citizen portal in the Czech Republic. The Czech eGovernment ecosystem is mature: the national **Citizen Portal (Portál občana)** provides 600+ state services via **eIdentita** (bank identity, Mobile eGovernment Key, NIA ID, MojeID, data box). Municipalities must integrate with this federation while serving diverse local needs.

Key findings:
- **20.8% of population is 65+** (2.27M seniors); only ~60% of senior households have internet, ~40% mobile internet — **offline/assisted channels are mandatory**
- **WCAG 2.1 AA is legally required** (Act 99/2019 + EAA Act 424/2023); design system gov.cz provides compliant components
- **eIdentita is the gateway** — portal must support progressive onboarding: guest mode → bank identity → full eIdentita
- **Trust signals are critical**: visible request timeline, databox integration, payment proof (doručky), GDPR rights UI
- **Plain Czech (jednoduchý jazyk)** must replace úřední jazyk; terminology explanations inline
- **Competitive gap**: National portal does state services; MojeObec covers municipal comms/payments; no unified "my municipality + state" experience exists

---

## 1. User Personas

| Persona | % Population | Digital Literacy | Device | Accessibility Needs | Key Motivations | Pain Points |
|---------|-------------|------------------|--------|---------------------|-----------------|-------------|
| **Senior (65+)** | 20.8% (2.27M) | Low–Medium; 60% households online, 40% mobile | Desktop > tablet > phone; prefers large text | High contrast, 200% zoom, screen reader, voice control, simple language, **assisted channel (Czech POINT, phone, in-person)** | Avoid queues, get pension info, pay waste/dog fees, health docs | Complex login, jargon, small tap targets, no fallback |
| **Rodič dětí (Parent, 30–45)** | ~15% | High; mobile-first, app-savvy | Phone (iOS/Android), pushes | Moderate; color-blind safe, one-hand use | School enrollment, child benefits, kindergarten queue, vaccination records | Fragmented portals (school vs municipality vs state), repeated data entry |
| **Podnikatel (Entrepreneur/OSVČ)** | ~12% (self-employed) | High; multi-device, databox daily user | Desktop + phone, databox integration | Low; efficiency-focused | Trade license, taxes (Moje daně), social security (CSSZ), invoicing, permits | Switching contexts (national vs municipal), databox UX, deadline tracking |
| **Student (18–26)** | ~8% | Very high; mobile-only, expects instant | Phone only, PWA OK | Low; dark mode, fast load | Residence registration, ISIC, transport subsidies, part-time work registration | No eIdentita yet (bank identity only), guest mode critical |
| **Úředník (Municipal clerk)** | N/A (internal) | Medium; legacy IS (TIS, KEO, ISOS) | Desktop dual-monitor, scanner | Medium; keyboard nav, high contrast | Process requests fast, reduce manual work, audit trail, CSP compliance | Disconnected systems, duplicate entry, unclear citizen status |

### Persona-Specific Design Implications

- **Senior-first**: Every flow must work at 200% zoom, 4.5:1 contrast, with `prefers-reduced-motion`, voice-over labels, and **Czech POINT handoff button** visible
- **Parent**: Push notifications for deadlines (school enrollment, vaccinations), family account linking
- **Entrepreneur**: Databox inbox embedded, bulk payment generation, API for accounting SW
- **Student**: Guest mode + bank identity → progressive eIdentita upgrade prompt after first success
- **Úředník**: Admin dashboard with SLA timers, bulk actions, CSV export, CSP audit log

---

## 2. Core User Journeys

### Journey 1: "Chci podat žádost o informace" (Request Information / InfZ)

| Step | Current State (National Portal) | Municipal Portal Opportunity |
|------|--------------------------------|------------------------------|
| 1. Discover | Search "žádost o informace" on gov.cz | Municipal homepage → "Nejčastější žádosti" tile |
| 2. Auth | **eIdentita required** (bank ID / mobile key / NIA ID / MojeID / databox) | **Guest mode**: pre-fill form with RÚIAN address autocomplete → offer eIdentita at submit |
| 3. Form | Prefilled from registers (ROB, RÚIAN) | Same + municipal-specific registers (dog registry, waste registry) |
| 4. Pay | Card / bank transfer / QR code (Czech POINT) | **QR platba** on screen + email + databox; save payment method |
| 5. Delivery | Citizen Portal inbox + databox + email | **Unified inbox**: portal + databox + email + push; PDF with **dorucka** (delivery receipt) |
| 6. Track | Timeline in Citizen Portal | Municipal timeline + **SMS/email at each state change** |

**Key UX Decision**: Support **guest submission with deferred identity** — user fills form, gets reference number, completes eIdentita within 48h to receive result. Reduces drop-off for first-time users.

### Journey 2: "Chci zaplatit poplatek za psa / odpad / parkování" (Pay Fees)

| Step | Current (MojeObec / portal) | Target Experience |
|------|----------------------------|-------------------|
| 1. Notify | SMS/email/push from MojeObec | **Unified notification** with deep link to specific fee |
| 2. View | List of fees with variabilní symbol | **Smart složenka**: prefilled amount, QR code, Apple/Google Pay, card saved |
| 3. Pay | Redirect to bank / GPay | **In-portal payment** (PSD2/GP WebPay) + QR for offline |
| 4. Confirm | PDF in portal / databox | **Instant dorucka** in portal + databox + email; push "Uhrazeno" |
| 5. History | Scattered | **Platební historie** filterable by type/year with export CSV |

**Differentiator**: **Samoodečet vodného** (self-read water meter) — photo OCR → auto-calculate → generate složenka → pay in one flow.

### Journey 3: "Chci napsat úředníkovi ohledně stavu mého řízení" (Contact Official re Case Status)

| Step | Current | Target |
|------|---------|--------|
| 1. Find case | Search by spisová značka / databox | **My Cases dashboard** — all submissions (municipal + state via federation) |
| 2. Compose | Email / databox / contact form | **In-portal messaging** threaded per case; attachments; rich text |
| 3. Send | No tracking | **Read receipt** + SLA timer visible to citizen |
| 4. Reply | Email / databox / phone | **Push + email + databox**; reply in same thread |
| 5. Archive | Manual | **Auto-archive** with GDPR retention tags |

### Journey 4: "Chci dostat oznámení o změně termínu / nové povinnosti" (Notifications)

| Channel | Current | Target |
|---------|---------|--------|
| **Push (app)** | Citizen Portal app only | Municipal app + PWA push (Service Worker) |
| **Email** | Opt-in | Default on for deadlines; granular preferences |
| **SMS** | MojeObec paid module | **Free tier**: 3 SMS/month for critical deadlines |
| **Databox** | Automatic for official delivery | **Mirrored** to portal inbox; user chooses primary |
| **In-portal** | Notification bell | **Timeline feed** with filters (unread, action required, done) |

**Preference Center**: Single page — toggle per channel per category (taxes, waste, construction, elections, emergencies).

---

## 3. Accessibility (WCAG 2.1 AA) — Legal Baseline

**Law**: Act 99/2019 Sb. (transposes EU Web Accessibility Directive) + Act 424/2023 Sb. (EAA, effective 28.6.2025). **Monitoring**: Ministry of Interior (public sector) / ČOI (private sector).

### Checklist (Must Pass)

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| **1.1.1 Non-text Content** | All images/icons have `alt`; decorative `alt=""` | Design system gov.cz components compliant |
| **1.3.1 Info & Relationships** | Semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`, headings h1–h6 | Storybook/Pattern Lab components enforce |
| **1.4.3 Contrast (Minimum)** | 4.5:1 text, 3:1 large text/UI components | Design tokens: `--color-text-primary`, `--color-border` |
| **1.4.4 Resize Text** | 200% zoom no loss of content/function | `rem` units, fluid typography, test at 400% |
| **1.4.10 Reflow** | 320px width no horizontal scroll | Mobile-first CSS Grid/Flexbox |
| **1.4.11 Non-text Contrast** | 3:1 UI components, icons, focus indicators | Focus ring: `outline: 3px solid --color-focus` |
| **2.1.1 Keyboard** | All functionality via keyboard | Tab order logical; skip links; focus visible |
| **2.1.2 No Keyboard Trap** | Modals trap focus, ESC closes | `focus-trap` utility |
| **2.4.3 Focus Order** | Logical sequence | Test with screen reader (NVDA/JAWS/Orca) |
| **2.4.6 Headings & Labels** | Descriptive, unique | `aria-label` where visual label absent |
| **2.4.7 Focus Visible** | Always visible | Never `outline: none` without replacement |
| **3.1.2 Language of Parts** | `lang="cs"` on `<html>`; `lang="en"` on EN pages | `lang` attribute switching |
| **3.2.1 On Focus** | No context change on focus | No auto-submit, no modal open on focus |
| **3.3.1 Error Identification** | Errors announced, linked to field | `aria-describedby` + `aria-invalid` + error summary |
| **3.3.2 Labels/Instructions** | Visible labels + instructions | Placeholder ≠ label |
| **4.1.2 Name, Role, Value** | Custom components expose ARIA | Storybook a11y addon in CI |

### Czech-Specific Requirements

| Requirement | Detail |
|-------------|--------|
| **Diacritics (háčky/čárky)** | UTF-8 throughout; screen readers read correctly with `lang="cs"` |
| **Czech number formatting** | `1 234,56 Kč` (space thousands, comma decimal) — not `1,234.56` |
| **Date format** | `DD. MM. YYYY` (e.g., `31. 7. 2025`) |
| **Accessibility Statement (Prohlášení o přístupnosti)** | Required by law; must include: conformance level, known gaps, remediation plan, feedback contact (`pristupnost@dia.gov.cz` pattern) |
| **Czech POINT fallback** | Visible "Osobně na úřadě / Czech POINT" CTA on every transactional page |

### Testing Protocol

1. **Automated**: axe-core in CI (target: 0 violations AA)
2. **Manual**: NVDA + Firefox, VoiceOver + Safari, Orca + Firefox
3. **Zoom test**: 200%, 400% browser zoom + text-only zoom
4. **Keyboard-only**: Tab through every flow
5. **Real users**: Include seniors (65+), blind, motor-impaired in UAT

---

## 4. Trust & Transparency

### Visible Request Timeline (Stav žádosti)

```
┌─────────────────────────────────────────────────────────────┐
│  Žádost #2025-045-123  •  Žádost o informace (InfZ)           │
├─────────────────────────────────────────────────────────────┤
│  ● 25.7. 10:15  Podána (Guest mode)                          │
│  ● 25.7. 10:17  Platba uhrazena (QR kód, 200 Kč)             │
│  ○ 25.7. 14:00  Přidělena úředník (čeká na eIdentita)        │
│  ○ 28.7.      Očekované vyřízení (SLA: 3 dny)                │
│  ○ —          Doručena do datové schránky / portálu          │
└─────────────────────────────────────────────────────────────┘
```

- **Real-time** via WebSocket/polling
- **SLA badge**: "Vyřízení do 3 dnů" with countdown
- **History**: Expandable audit log (who did what when)

### Communication History (Historie komunikace)

| Column | Data |
|--------|------|
| Datum/čas | ISO 8601 + localized |
| Kanál | 📩 Databox / 📧 Email / 📱 Push / 📞 Telefon / 👤 Osobně |
| Směr | Příchozí / Odchozí |
| Předmět | Krátký popis |
| Přílohy | Ikony + počet |
| Stav | ✅ Doručeno / 👁 Přečteno / ⏳ Čeká na odeslání |

**Export**: "Stáhnout celou historii (PDF/A)" — legally valid archive.

### Doručky & Důkazy Platby (Delivery Receipts & Payment Proof)

- **Doručka** (legal delivery receipt): Generated automatically when message hits databox/portal inbox; shows timestamp, message ID, hash
- **Potvrzení platby**: QR payment → instant PDF with `Variabilní symbol`, `Částka`, `Datum`, `ID transakce`, `QR kód pro ověření`
- **Audit trail**: Immutable log (append-only) with SHA-256 chaining; exportable for CSP audit

### GDPR Rights UI (Práva dle GDPR)

| Right | UI Entry Point | Flow |
|-------|----------------|------|
| **Přístup (Art. 15)** | Profil → "Moje data" → "Stáhnout vše (JSON/PDF)" | One-click export; includes metadata (source, purpose, retention) |
| **Oprava (Art. 16)** | Inline "Upravit" on each field in profile | Changes logged; sync to ROB/RÚIAN via eGSB |
| **Výmaz (Art. 17)** | Profil → "Smazat účet" — warns about legal retention | Soft delete; anonymize after statutory periods |
| **Omezení (Art. 18)** | "Zastavit zpracování" per purpose | Toggle per consent/legal basis |
| **Přenositelnost (Art. 20)** | "Exportovat pro jiného správce" → machine-readable ZIP (CSV/JSON) | Structured, documented schema |
| **Námět (Art. 21)** | "Namítnout" on marketing/profiling | Immediate stop; record kept for compliance |

**Contact DPO**: Persistent link `gdpr@[obec].cz` + link to ÚOOÚ complaint form.

---

## 5. Onboarding: eIdentita First vs Guest Mode

### Progressive Profiling Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. GUEST MODE (no login)                                    │
│     ├── Homepage → "Podat žádost" → Prefilled form (RÚIAN)   │
│     ├── Submit → Reference number + "Dokončit přihlášením"   │
│     └── 48h window to authenticate                           │
├──────────────────────────────────────────────────────────────┤
│  2. BANK IDENTITY (quick win)                                │
│     ├── "Přihlásit přes banku" → Bank selector (9 banks)    │
│     ├── Redirect → Bank app/confirm → Return to portal      │
│     └── Limited LOA (substantial) — sufficient for most     │
├──────────────────────────────────────────────────────────────┤
│  3. FULL eIDENTITA (high assurance)                          │
│     ├── Mobile eGovernment Key (app + Czech POINT)          │
│     ├── NIA ID (web + Czech POINT)                          │
│     ├── MojeID (app + Czech POINT / databox / eObčanka)     │
│     └── eObčanka (card + reader) — highest LOA              │
├──────────────────────────────────────────────────────────────┤
│  4. DATABOX (for entrepreneurs)                              │
│     └── Login via ISDS → Full access to municipal + state   │
└──────────────────────────────────────────────────────────────┘
```

### Onboarding UX Rules

| Rule | Rationale |
|------|-----------|
| **Never block guest start** | 40% drop-off at login wall (Citizen Portal analytics) |
| **Show value before auth** | "Už máte předvyplněno: adresa, DS, auto" — preview result |
| **Explain LOA simply** | "Bankovní identita = vše okrom zdravotnictví a dotací" |
| **Czech POINT locator** | Map + "Nejbližší: 200 m, otevřeno do 17:00" on activation screen |
| **Progressive consent** | Ask for notifications *after* first successful submission |
| **Family linking** | "Přidat příslušníka" → invite via email/phone → they authenticate |

---

## 6. Competitive Analysis

| Solution | Type | Strengths | Weaknesses | Gaps for Municipal Portal |
|----------|------|-----------|------------|---------------------------|
| **Portál občana (Citizen Portal)** | National (state) | 600+ services, eIdentita SSO, databox, notifications, mobile app, design system gov.cz | No municipal fees/waste/dogs, no local news/events, generic UI | **Core gap**: Municipal services not federated |
| **MojeObec (TOPSPIN)** | Municipal SaaS | SMS/email/push comms, smart složenka, water meter, low cost, 20 yrs exp | No state services, no eIdentita SSO, limited self-service, dated UI | **Core gap**: No state federation, no GDPR UI |
| **ePortal (Úřady)** | Municipal IS (TIS, KEO, ISOS, Munis) | Deep backend integration, CSP compliant, used by 3000+ offices | Citizen-facing UX weak/nonexistent, no mobile, no design system | **Core gap**: Citizen portal missing |
| **Cleverlance** | SI / custom build | Large SI, eGov references (MLSA portal, CSSZ), cloud, security | Product? Mostly integration services | **Gap**: No off-the-shelf citizen portal product |
| **Moravia IT** | SI / custom build | Regional strong, custom portals | No standardized product | **Gap**: Same as Cleverlance |
| **Asseco Central Europe** | Vendor (built Citizen Portal) | Built national portal, design system, portal federation | Expensive, enterprise sales cycle | **Opportunity**: White-label municipal portal? |
| **Digiregion / Obecní síť** | Municipal web+app | Simple, comms-focused, events, surveys | No payments, no eIdentita, no state services | **Gap**: Transactional depth |

### Competitive Positioning Map

```
                    HIGH STATE INTEGRATION
                          ▲
                          │
        Asseco (national) │  Cleverlance/Moravia (custom SI)
                          │
                          │
        ──────────────────┼──────────────────►
        LOW MUNICIPAL     │     HIGH MUNICIPAL
        DEPTH             │     DEPTH
                          │
        MojeObec          │     [OUR TARGET]
        Digiregion        │
                          │
                    LOW STATE INTEGRATION
```

**Our Sweet Spot**: **High Municipal Depth + High State Integration** — federate state services via Citizen Portal API, own municipal transactions (fees, waste, dogs, permits, comms).

---

## 7. Wireframe Descriptions (Text Specs)

### 7.1 Homepage (Desktop)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo obec]                    [Search]  [Login/Profile] [CS|EN]  │
├────────────────────────────────────────────────────────────────────┤
│  HERO: "Vše pro vaši obec na jednom místě"                        │
│  [CTA Primary] Podat žádost        [CTA Secondary] Zaplatit poplatky│
├────────────────────────────────────────────────────────────────────┤
│  ══════════════════════════════════════════════════════════════════  │
│  NEJČASTĚJŠÍ SLUŽBY (6 tiles, 2 rows × 3)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ 📄 Žádost o  │ │ 💰 Poplatky  │ │ 🐕 Pes /     │                │
│  │    informace │ │    a platby  │ │    odpad     │                │
│  │ [Podat]      │ │ [Přehled]    │ │ [Spravovat]  │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ 🏘 Trhy &    │ │ 📅 Události  │ │ 📨 Datová    │                │
│  │    zábory    │ │    a novinky │ │    schránka  │                │
│  │ [Podat]      │ │ [Kalendář]   │ │ [Připojit]   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
├────────────────────────────────────────────────────────────────────┤
│  MANÁŽER MÉCH PŘÍPADŮ (logged in)                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ #2025-045 Žádost o informace ● Čeká na platbu      [Detaily]│  │
│  │ #2025-043 Poplatek za psa      ✅ Uhrazeno 15.7.     [PDF]    │  │
│  │ #2025-041 Zábory prostranství  ○ Ve řízení (den 12/30) [Chat] │  │
│  └──────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│  FOOTER: Kontakt | Otevřená data | Přístupnost | GDPR | Cookies   │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 Request Form — Guest Mode (Mobile First)

```
┌─────────────────────────────┐
│ ◀ Zpět    Žádost o informace │
├─────────────────────────────┤
│                             │
│  ✅ Adresa předvyplněna     │
│  📍 Ulice 123/45, Praha 1   │
│  [Upravit]                  │
│                             │
│  ┌────────────────────────┐ │
│  │ Typ výpisu *           │ │
│  │ ▼ Obchodní rejstřík    │ │
│  │   Živnostenský rejstřík│ │
│  │   Rejstřík záruk       │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ Určení osoby *         │ │
│  │ [Jméno a příjmení]     │ │
│  │ [Rodné číslo / IČO]    │ │
│  └────────────────────────┘ │
│                             │
│  [Pokračovat jako host]     │  ← Primary CTA
│  [Přihlásit se a předvyplnit]│ ← Secondary
│                             │
│  ℹ️ Jako host zadáte údaje ručně.│
│  Po odeslání máte 48h na    │
│  dokončení přihlášením pro  │
│  doručení do portálu.       │
└─────────────────────────────┘
```

### 7.3 Payment Flow — Smart Složenka (Mobile)

```
┌─────────────────────────────┐
│ ◀ Zpět    Platba poplatků    │
├─────────────────────────────┤
│                             │
│  📋 NEUHRAZENO (3)          │
│  ┌────────────────────────┐ │
│  │ 🐕 Poplatek za psa     │ │
│  │ 2025 • 1 ks • 1 500 Kč │ │
│  │ [Zaplatit 1 500 Kč]    │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ 🗑 Poplatek za odpad   │ │
│  │ Q3 2025 • 2 200 Kč     │ │
│  │ [Zaplatit 2 200 Kč]    │ │
│  └────────────────────────┘ │
│                             │
│  ✅ UHRAZENO (2)            │
│  [Zobrazit historii]        │
│                             │
│  ─────────────────────────  │
│  CELKEM K ZAPLACENÍ: 3 700 Kč│
│  [Zaplatit vše naraz]       │
│                             │
│  💳 Uložené karty: •••• 1234 │
│  [Přidat Apple/Google Pay]  │
└─────────────────────────────┘
```

### 7.4 Case Detail — Timeline + Chat

```
┌────────────────────────────────────────┐
│ ◀ Zpět    #2025-045 Žádost o informace │
├────────────────────────────────────────┤
│  STAV: ⏳ Čeká na vaši identifikaci     │
│  SLA: Zbývá 1 den 14 hodin             │
│                                        │
│  ────────────────────────────────────  │
│  ČASOVÁ OSOV                          │
│  ● 25.7. 10:15  Podána (Host)         │
│  ● 25.7. 10:17  Platba 200 Kč ✅       │
│  ○ 25.7. 14:00  Čeká na eIdentita     │  ← CURRENT
│  ○ 28.7.      Očekované vyřízení       │
│                                        │
│  ────────────────────────────────────  │
│  KOMUNIKACE                            │
│  ┌──────────────────────────────────┐ │
│  │ 📨 Úředník Nováková  25.7. 14:05 │ │
│  │ "Pro doručení potřebuji ověřenou │ │
│  │  identitu. Přihlašte se prosím." │ │
│  │ [Odpovědět] [Přihlásit se]       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 👤 Vy (host)       25.7. 10:15  │ │
│  │ Žádost o výpis z OR            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Napsat zprávu]  [Přidat přílohu]    │
└────────────────────────────────────────┘
```

### 7.5 Profile / GDPR Dashboard

```
┌────────────────────────────────────────┐
│ ◀ Zpět    Můj profil                  │
├────────────────────────────────────────┤
│  👤 Jan Novák                          │
│  📍 Ulice 123/45, Praha 1             │
│  📧 jan@email.cz  📱 +420 777 123 456 │
│  🔐 eIdentita: Bankovní identita (KB) │
│  📬 Datová schránka: abc123 (připojena)│
│                                        │
│  ────────────────────────────────────  │
│  PRIŠLUSNÍCI (rodina)                 │
│  [+ Přidat partnera/dítě]             │
│                                        │
│  ────────────────────────────────────  │
│  GDPR - MOJE DATA                     │
│  ┌──────────────────────────────────┐ │
│  │ [Stáhnout všechna data (JSON)]   │ │
│  │ [Stáhnout pro jiného správce]    │ │
│  │ [Opravit údaje]                  │ │
│  │ [Zastavit zpracování marketing]  │ │
│  │ [Smazat účet]                    │ │
│  └──────────────────────────────────┘ │
│                                        │
│  KONTAKT DPO: gdpr@obec.cz            │
│  ÚOOÚ: www.uoou.cz/podatelna          │
└────────────────────────────────────────┘
```

---

## 8. Accessibility Checklist (Condensed for Handoff)

| Category | Item | Status | Owner |
|----------|------|--------|-------|
| **Visual** | 4.5:1 text contrast, 3:1 UI contrast | ☐ | Design |
| **Visual** | Focus ring visible (3px, --color-focus) | ☐ | Frontend |
| **Visual** | 200% zoom no horizontal scroll | ☐ | Frontend |
| **Visual** | `prefers-reduced-motion` respected | ☐ | Frontend |
| **Semantic** | Landmarks: header, nav, main, footer, aside | ☐ | Frontend |
| **Semantic** | Heading hierarchy h1→h6 no gaps | ☐ | Content |
| **Semantic** | Form labels + `aria-describedby` for errors | ☐ | Frontend |
| **Keyboard** | All interactive elements reachable | ☐ | Frontend |
| **Keyboard** | Skip to main content link | ☐ | Frontend |
| **Keyboard** | Modal focus trap + ESC close | ☐ | Frontend |
| **Screen Reader** | `lang="cs"` on `<html>` | ☐ | Frontend |
| **Screen Reader** | Live regions for status updates | ☐ | Frontend |
| **Screen Reader** | ARIA labels on icon-only buttons | ☐ | Frontend |
| **Content** | Plain Czech (jednoduchý jazyk) — no úřední jazyk | ☐ | Content |
| **Content** | Terminology tooltips (e.g., "Složka = datová zpráva") | ☐ | Content |
| **Content** | Czech number/date formats | ☐ | Frontend |
| **Legal** | Accessibility statement published | ☐ | Legal |
| **Legal** | Czech POINT fallback visible on all transactions | ☐ | UX |
| **Testing** | axe-core in CI (0 AA violations) | ☐ | DevOps |
| **Testing** | Manual NVDA/VoiceOver/Orca per release | ☐ | QA |
| **Testing** | Real user testing with seniors + disabilities | ☐ | UX |

---

## 9. Sources & Confidence

| Area | Confidence | Key Sources |
|------|------------|-------------|
| **National Portal (Portál občana)** | HIGH | portalobcana.gov.cz, chcidatovku.gov.cz, Asseco case study, expats.cz 2023 |
| **eIdentita Auth Flow** | HIGH | identita.gov.cz, mojeid.cz, portalobcana help |
| **WCAG 2.1 AA Legal** | HIGH | Act 99/2019, Act 424/2023, W3C WAI Czech Republic, CompliScan, disabilityworld.org |
| **Design System gov.cz** | HIGH | designsystem.gov.cz, DIA.gov.cz, GitLab gov-cz/design-system |
| **Digital Literacy (Seniors)** | HIGH | ČSÚ (csu.gov.cz) 2025 data: 20.8% 65+, 60% households online, 40% mobile |
| **MojeObec** | HIGH | mojeobec.cz (TOPSPIN), pricing, modules |
| **Municipal IS Landscape** | MEDIUM | VSOL articles, mhuml.cz (KEO), munis.cz, ortex.cz, digiregion.cz |
| **Cleverlance/Moravia** | LOW-MED | CIOtrends references, Asseco dominates national portal build |
| **GDPR Czech Implementation** | HIGH | DLA Piper, White & Case, gov.cz privacy notice, ÚOOÚ |
| **Plain Language / Úřední Jazyk** | MEDIUM | GLOBSEC handbook 2026, IPC language rules, settemilalingue.com |

---

## 10. Gaps Requiring Phase-Specific Research

| Phase | Research Needed | Why |
|-------|-----------------|-----|
| **Discovery** | Municipal API federation spec (Citizen Portal → municipality) | Technical integration unknown; need DIA/NAKIT spec |
| **Discovery** | Czech POINT 2.0 API for municipal services | Assisted channel integration |
| **Design** | Senior usability testing (65+ with low digital literacy) | Validate guest mode, font sizes, voice flow |
| **Design** | Screen reader testing with Czech NVDA/JAWS users | Diacritics, ARIA live regions |
| **Build** | PSD2/GP WebPay integration for municipal payments | PCI DSS scope, acquirer selection |
| **Build** | Databox ISDS API for municipal message types | Message schemas, delivery receipts |
| **Launch** | Accessibility audit by Ministry methodology | Legal compliance certification |

---

## 11. Roadmap Implications (for SUMMARY.md)

**Suggested Phase Structure:**

1. **Foundation & Guest Mode** — Core IA, design system adoption, guest submission flow, RÚIAN autocomplete, Czech POINT locator. *Addresses: Senior onboarding, low barrier entry.*
2. **eIdentita + Payments** — Bank identity / Mobile Key / NIA ID / MojeID integration, QR payment + GP WebPay, smart složenka, dorucka generation. *Addresses: Trust, payment completion, legal delivery.*
3. **Case Management + Notifications** — Timeline, threaded chat, SLA badges, multi-channel prefs (push/email/SMS/databox), GDPR dashboard. *Addresses: Transparency, trust, retention.*
4. **Municipal Services Pack** — Dog registry, waste, water meter OCR, construction permits, events/news, family linking. *Addresses: Differentiators, daily utility.*
5. **Federation & Admin** — Citizen Portal API federation (state services in municipal UI), clerk dashboard (SLA, bulk actions, audit), analytics. *Addresses: Úředník efficiency, unified citizen view.*

**Phase Ordering Rationale**: Guest mode first validates IA and lowers barrier; auth second unlocks trust signals; case mgmt third retains users; services fourth differentiates; federation last (depends on DIA API readiness).

---

*End of UX Research Document*