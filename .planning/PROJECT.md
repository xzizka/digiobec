# PROJECT: Municipal Citizen Portal (Občanský portál obce)

## Vision
Digitální komunikace mezi občanem a obecním úřadem – kompletní mobilní aplikace pro agendu, platby a komunikaci.

## Core Problem
Občané potřebují jednoduchý způsob, jak řešit úřední záležitosti bez osobní návštěvy úřadu: podat žádost, zaplatit poplatek, komunikovat s úředníky, sledovat stav.

## Target Users
- **Primární:** Občané obce (všechny věkové kategorie, přístupnost WCAG 2.1 AA)
- **Sekundární:** Úředníci (webový portál pro správu žádostí, komunikaci)
- **Cílová obec:** do 1 500 obyvatel, **obec I. typu bez rozšířené působnosti (ORP)** – aplikace pokrývá jen samostatnou působnost + základní přenesenou působnost

## Scope (MVP)
- **Komunikace:** Zprávy, oznámení, formuláře, přílohy
- **Platby:** Integrace s platební bránou (karta, QR platba, GP webpay), historie plateb
- **Agenda:** Katalog úkonů, podání žádosti, evidence, tracking stavu (podáno → zpracovává se → hotovo)
- **Autentizace:** eIdentita (NIA), Datové schránky (ISDS), SMS/Email OTP fallback
- **Backend:** Nový full-stack (Spring Boot + PostgreSQL) nasazený na vlastní infrastruktuře / cloud

## Platform
- **Mobile:** Flutter (Android + iOS) – sdílený kód, Material 3 / Cupertino
- **Backend:** Spring Boot 3, Kotlin, PostgreSQL, Keycloak (IAM)
- **Admin Web:** React + TypeScript (pro úředníky)

## Czech Specifics (Doporučení)
1. **eIdentita (NIA)** – primární přihlášení, úroveň LoA Substantial/High
2. **Datové schránky (ISDS)** – doručování úředních dokumentů, Evidence doručení
3. **ISVS** – registr úkonů, předvyplnění formulářů z rejstříků
4. **Platby** – GP webpay / GoPay / Comgate, QR platba (Czech Banking Standard)
5. **Přístupnost** – Zákon o přístupnosti webů a mobilních aplikací veřejných subjektů (WCAG 2.1 AA)

## Constraints
- GDPR / ÚOOÚ compliance
- Audit trail pro úřední řízení
- Offline-first možnost (čtení zpráv, historie)
- CI/CD s automatickými testy, nasazení do Play Store / App Store / vlastní server

## Success Metrics
- > 60 % občanů obce používá aplikaci do 12 měsíců
- < 24h reakční doba úředníků na zprávu
- > 80 % plateb proběhne přes aplikaci
- 0 kritických bezpečnostních incidentů ročně

## Risks
- Nízká adopce seniorů → nutná podpora/pomoc, alternativní kanály
- Integrace se staršími IS úřadu → API façade vrstva
- Zákonodárné změny (eIdentita, ISDS) → modulární architektura