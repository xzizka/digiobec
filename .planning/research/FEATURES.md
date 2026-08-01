# Feature Landscape: Czech eGovernment Mobile App

**Domain:** Municipal citizen portal (Czech eGovernment integrations)
**Researched:** 2026-07-31

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **eIdentita login (LoA Substantial)** | Primary auth for all public admin services; citizens expect gov.cz-level login | Medium | OIDC `acr_values=http://eidas.europa.eu/LoA/substantial`; Keycloak identity broker; test env onboarding required |
| **eIdentita login (LoA High)** | Required for sensitive operations (health data, tax, voting) | Medium | `acr_values=http://eidas.europa.eu/LoA/high`; step-up auth flow; eOP or chip card required |
| **Datové schránky - receive messages** | Official document delivery (doručenka) is legal requirement for administrative decisions | High | ISDS SOAP polling + async notifications; ZFO format parsing; delivery evidence (doručenka/odmítnutí) |
| **Datové schránky - send messages** | Citizens must submit applications, appeals, attachments officially | High | CreateMessage / CreateMultipleMessage; attachments up to 100 (10 container); VoDZ for >20MB |
| **Message status tracking** | Citizens need to know: delivered, read, rejected, expired | Medium | GetDeliveryInfo / GetSignedDeliveryInfo; GetMessageStateChanges for polling |
| **Form catalog (ISVS registry of acts)** | "What can I do at this office?" - core citizen need | Low | ISVS REST `/ukony` endpoint; map to municipal competences (RPP) |
| **Form prefill from registries** | Reduces errors, speeds up submission; expected from gov.cz | Medium | ISZR/ISSS via eGON: RÚIAN (address), RZP (identity), RES (business); requires AIS certification |
| **QR payment (Czech Banking Standard)** | Standard for invoices/fees; citizens scan from banking app | Low | Embedded in Comgate/GoPay/GP webpay; PAYMETHOD=APM-BCQR; instant notification via webhook |
| **Card payment (Apple Pay / Google Pay)** | Dominant payment method (>80% transactions) | Low | Comgate native SDK supports both in-app; GP webpay/GoPay via redirect |
| **Payment history & receipts** | Proof of payment for administrative proceedings | Low | Local cache + backend sync; PDF receipt generation |
| **Offline message reading** | Connectivity not guaranteed; seniors often offline | Medium | Drift local cache; sync on reconnect; conflict resolution for unread flags |
| **Push notifications** | Real-time alerts for new messages, payment confirmations, status changes | Medium | FCM/APNs; ISDS RegisterForNotifications webhook → backend → push |
| **Accessibility (WCAG 2.1 AA)** | Legal requirement (Zákon 99/2019); seniors, disabilities | High | Semantics, contrast, font scaling, TalkBack/VoiceOver, focus order, ARIA labels |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Smart form wizard with validation** | Guide citizens through complex forms step-by-step; client-side validation before submit | Medium | React-like form state in Flutter; schema-driven from ISVS act definitions |
| **Document scanner + OCR (Czech)** | Attach photos of paper docs; auto-extract text for form prefill | High | ML Kit / Google ML Kit Czech OCR; offline capable; GDPR-compliant (no cloud) |
| **Unified timeline (messages + payments + acts)** | Single chronological view of all citizen↔office interactions | Medium | Merge ISDS messages, payment records, act submissions; local sort + backend sync |
| **Agent handoff with context** | Seamless escalation to human officer; full history transferred | Medium | WebSocket/long-poll for chat; context bundle (identity, act, attachments, history) |
| **Family/shared account management** | Senior citizens helped by relatives; power of attorney support | High | NIA attribute `PowerOfAttorney`; delegated access in Keycloak; audit trail |
| **Multilingual (CZ/EN/UA/VN)** | Foreign residents, tourists, minorities | Low | Flutter intl/arb; ISVS CzechVoc terminology supports some translations |
| **Digital wallet for received documents** | Store doručenky, decisions, certificates locally with search | Medium | Drift FTS5 full-text search on ZFO XML content; categorize by act type |
| **Appointment booking integration** | Link to office calendar for in-person follow-up | Low | ISVS act metadata includes `osobni-prilezitost` flag; redirect to booking system |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Custom ISDS client (raw SOAP/XML)** | WSDL changes (3.05→3.09); MTOM/XOP complex; maintenance burden | Use Spring WS / Apache CXF WSDL-first code generation; regenerate on WSDL update |
| **WebView payment integration** | Google Pay broken in WebView; PCI DSS scope expands to app; poor UX (redirects) | Use Comgate native Mobile Checkout SDK (Android/iOS); keeps PCI at SAQ-A |
| **Custom eIdentita SAML2 SP** | Complex XML signing/encryption; metadata rotation; Keycloak does this natively | Configure Keycloak as OIDC client → NIA identity broker; Keycloak handles protocol |
| **Direct basic registry (ZR) access** | Requires separate AIS certification per registry; complex auth; rate limits | Use ISVS/ISZR composite services (eGON) - single certification, unified interface |
| **Custom accessibility overlay/widget** | Overlays don't fix root cause; often worsen screen reader experience | Build semantic Flutter widgets from start; test with TalkBack/VoiceOver daily |
| **SMS/Email OTP as primary auth** | Not eIDAS compliant; cannot reach LoA Substantial/High; phishing risk | Use only as fallback for non-eIdentita users (tourists, foreigners); mark clearly |
| **Storing card data locally** | PCI DSS violation; massive security risk; no business need | Tokenization via Comgate SDK; only payment reference IDs stored locally |

## Feature Dependencies

```
eIdentita (LoA Substantial) 
    → User profile prefill (RZP via ISZR)
    → ISDS access (HSSU consent requires verified identity)
    → Payment authorization (verified identity for recurring)
    → Act submission (authorization via NIA)

ISDS HSSU consent
    → Receive official messages (doručenka)
    → Send submissions with legal effect
    → Delivery evidence (GetSignedDeliveryInfo)

ISVS act registry
    → Form catalog UI
    → Form prefill mapping (which registry fields for which act)
    → Channel mapping (digital vs in-person vs datová schránka)

Payment integration
    → Fee payment for acts (poplatky)
    → QR on invoices (Comgate PUSH payment links)
    → Receipt attachment to ISDS message

Accessibility (cross-cutting)
    → All UI components
    → Form wizard steps
    → Notification content
    → Error states
```

## MVP Recommendation

Prioritize:
1. **eIdentita LoA Substantial login** - Foundation for everything; test env first
2. **ISDS receive messages + delivery evidence** - Core legal requirement; doručenka is mandatory
3. **Act catalog (ISVS) + basic form submission** - Citizen's primary "what can I do" need
4. **QR payment + card payment (Comgate SDK)** - Revenue collection; native UX
5. **Accessibility baseline (WCAG 2.1 AA)** - Legal blocker for launch; test continuously

Defer:
- **LoA High step-up**: Only needed for specific sensitive acts; add when act requires it
- **ISDS send (CreateMessage)**: Can start with receive-only; send requires more complex attachment handling
- **Form prefill from registries**: Requires AIS certification (weeks-months); launch with manual entry first
- **Document scanner + OCR**: Nice-to-have; high complexity, privacy review needed
- **Family/delegated access**: Complex authorization model; Phase 2+
- **Multilingual beyond CZ/EN**: UA/VN translations need act metadata updates
- **Appointment booking**: Separate system integration; link out initially

## Sources

- eIdentita/NIA: https://nia.otevrenamesta.cz/, MojeID OIDC docs https://www.mojeid.cz/documentation/html/ImplementacePodporyMojeid/OpenidConnect/ZadostOvereniNIA/index.html
- ISDS: Provozní řád https://mojedatovaschranka.cz/info/files/2245_Provozni_rad_ISDS_26_06_2026.pdf, developer info 2025/03 https://mojedatovaschranka.cz/info/files/2194_Info_pro_vyvojare_2025_3.pdf
- ISVS: Katalog ISVS https://archi.gov.cz/znalostni_baze:aisp_editace_udaju, SZR services https://www.szrcr.cz/cs/sluzby/spravci-a-vyvojari, RPP kompendium https://www.dia.gov.cz/media/411/download/RPP_kompendium_AIS_pripojeni_EO_EOP_ECD.pdf
- Payments: Comgate SDK https://help.comgate.cz/docs/en/payment-gateway-in-a-mobile-application, GoPay QR https://www.gopay.com/en/qr-payment/, GP webpay API https://www.gpwebpay.cz/wp-content/uploads/2025/06/GP_webpay_HTTP_API_v1.19_EN.pdf, comparison https://www.puxdesign.cz/en/payment-gateways-for-e-shops-their-implementation-and-comparison-of-7-of-them/
- Accessibility: Zákon 99/2019 Sb. https://ceskezakony.cz/en/zakon/99-2019, DIA metodický pokyn https://www.ddpardubice.cz/media/cache/file/28/Metodicky_pokyn_-_pristupnost_internetovych_stranek_a_mobilnich_aplikaci_v1-6-DIA.pdf, gov.cz design system https://designsystem.gov.cz/pravidla/pristupnost-webovych-stranek.html