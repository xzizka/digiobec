# REQUIREMENTS: Municipal Citizen Portal (Občanský portál obce)

## Functional Requirements

### FR-01: Guest Submission (Bez přihlášení)
- **FR-01.1** Podání žádosti / oznámení bez registrace (jen e-mail/telefon pro kontakt)
- **FR-01.2** Autocomplete adresy z RÚIAN (API ČÚZK)
- **FR-01.3** Vyhledání nejbližšího Czech POINT pro osobní ověření
- **FR-01.4** Stažení potvrzení o podání (PDF) + sledovací kód

### FR-02: Autentizace a Identita
- **FR-02.1** eIdentita (NIA) – 5 metod: Bankovní identita, Datová schránka, eObčan, IČO, Občanský průkaz s čipem
- **FR-02.2** LoA Substantial minimum, High pro plateby/osobní údaje
- **FR-02.3** Keycloak jako Identity Broker (OIDC federation)
- **FR-02.4** Biometrie / PIN pro Wieder-öffen aplikace
- **FR-02.5** Správa profilů: fyzická osoba, podnikatel (IČO), zástupce

### FR-03: Agenda a Úkony (ISVS integrace)
- **FR-03.1** Katalog úkonů z ISVS (předvyplnění z rejstříků)
- **FR-03.2** Dynamické formuláře (JSON Schema + UI Schema)
- **FR-03.3** Přílohy: foto, PDF, sken (max 25 MB, antivir scan)
- **FR-03.4** Podpis: eIdentita (kvalifikovaný) / rukopisný na obrazovce
- **FR-03.5** Evidence podání: doručka (ISDS), SMS, e-mail, v aplikaci

### FR-04: Správa Řízení (Case Management)
- **FR-04.1** Timeline: Podáno → Přijato → Zpracovává se → Vyžaduje doplnění → Rozhodnuto → Doručeno
- **FR-04.2** Komunikace: vláknované zprávy s úředníkem (přílohy, interní poznámky neviditelné)
- **FR-04.3** SLA sledování: termín vyřízení, eskalace
- **FR-04.4** Historie verzí rozhodnutí, důvodová zpráva
- **FR-04.5** Export do PDF / Datové schránky (ISDS)

### FR-05: Platby
- **FR-05.1** QR platba (Czech Banking Standard) – generování z účtenky/rozhodnutí
- **FR-05.2** GP WebPay / GoPay integrace (karta, Apple/Google Pay)
- **FR-05.3** Chytrá složenka (PDF + QR + platební údaje)
- **FR-05.4** Historie plateb, potvrzení (PDF), daňové doklady
- **FR-05.5** Idempotency – opakované platby gleiche ID neudělají dvojitou úhradu

### FR-06: Komunikace a Notifikace
- **FR-06.1** Push notifikace (FCM / APNs) – nová zpráva, změna stavu, blížící se termín
- **FR-06.2** E-mail / SMS fallback (nastavitelné preference)
- **FR-06.3** Datové schránky (ISDS) – doručování úředních dokumentů
- **FR-06.4** Centrum oznámení v aplikaci (filtrovatelné, částečně offline)

### FR-07: GDPR a Práva Občanů
- **FR-07.1** Přístup k údajům (export JSON/PDF)
- **FR-07.2** Oprava nesprávných údajů
- **FR-07.3** Omezení zpracování / výmaz (kde zákony dovolují)
- **FR-07.4** Přenositelnost dat (standardní formát)
- **FR-07.5** Audit trail přístupů (kdo, kdy, co)

### FR-08: Přístupnost (WCAG 2.1 AA)
- **FR-08.1** Kontrast 4.5:1 (text), 3:1 (UI prvky)
- **FR-08.2** Škálování textu do 200 % bez ztráty funkčnosti
- **FR-08.3** Screen reader podpora (TalkBack, VoiceOver) – semantika, popisky
- **FR-08.4** Ovladatelnost klávesnicí / přepínači
- **FR-08.5** Jednoduchý jazyk (tooltips k úředním termínům)
- **FR-08.6** Prohlášení o přístupnosti v aplikaci i na webu

### FR-09: Offline Režim
- **FR-09.1** Čtení zpráv, historie, stažených dokumentů offline
- **FR-09.2** Frontování odchozích zpráv/plateb (synchronizace online)
- **FR-09.3** Konflikt resolution (last-write-wins + uživatelský výběr)

### FR-10: Administrace (Web pro úředníky)
- **FR-10.1** Dashboard: fronta úkonů, SLA rizika, statistiky