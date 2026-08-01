# Research Summary: Czech eGovernment Integrations for Municipal Citizen Portal

**Domain:** Municipal citizen portal mobile app (Czech eGovernment integrations)
**Researched:** 2026-07-31
**Overall confidence:** HIGH

## Executive Summary

This research covers five critical Czech eGovernment integration domains required for a municipal citizen portal mobile app built with Flutter (Android/iOS) and Spring Boot backend with Keycloak IAM. The research reveals a mature but complex integration landscape with well-documented APIs, test environments, and specific compliance requirements.

**eIdentita (NIA)** provides OAuth2/OpenID Connect and SAML2 authentication with eIDAS LoA Substantial/High levels. Test environment (tnia.identitaobcana.cz) and production metadata endpoints are available. Integration with Keycloak is straightforward via OIDC provider configuration.

**Datové schránky (ISDS)** uses SOAP-based web services (WSDL) with Basic auth or client certificates. Two endpoints exist: classic (ws1) for messages ≤20MB and VoDZ (ws2) for messages up to 100MB using SOAP 1.2 + MTOM/XOP. Test environment (Veřejný test) available at ws1/ws2.mojedatovaschranka.cz.

**ISVS** (Informační systém veřejné správy) provides REST APIs for registry of acts (úkony), form prefill from basic registries (ISZR), and CzechVoc terminology services. Access requires registration in AIS RPP and certification by SZR.

**Payment gateways**: GP webpay (bank-backed, 19 languages, QR via APM-BCQR), GoPay (55+ methods, native QR, Czech company), Comgate (native mobile SDK with Apple Pay/Google Pay/3DS in-app, only Czech provider with native SDK). All are PCI DSS Level 1 certified.

**Accessibility**: Zákon 99/2019 Sb. mandates WCAG 2.1 AA (EN 301 549 V3.2.1) for public sector mobile apps. Requires accessibility statement (prohlášení o přístupnosti) published on website. DIA oversees compliance monitoring.

## Key Findings

**Stack:** Keycloak OIDC + eIdentita (LoA Substantial for most cases, High for sensitive operations) → Spring Boot backend → ISDS SOAP client → ISVS REST client → Comgate native mobile SDK (recommended for best UX/PCI scope) → Flutter with WCAG 2.1 AA compliance

**Architecture:** API Gateway pattern for eGovernment integrations; backend-for-frontend (BFF) isolates SOAP/WS complexity; native mobile SDK for payments keeps PCI scope minimal; offline-first local cache with Drift/SQLCipher

**Critical pitfall:** ISDS SOAP/WSDL integration complexity and rate limiting (3008 errors) require robust retry/backoff; eIdentita LoA mismatches cause silent provider filtering failures; accessibility audit must be done by certified auditor before launch

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Core Auth & Identity** - eIdentita OIDC integration with Keycloak, LoA Substantial flow, test environment onboarding
   - Addresses: Authentication, user registration, profile prefill
   - Avoids: Silent LoA filtering failures, production onboarding delays

2. **Phase 2: Communication & Data Boxes** - ISDS integration (send/receive messages, delivery evidence), HSSU consent flow
   - Addresses: Official document delivery, message tracking, doručenka/odmítnutí evidence
   - Avoids: Rate limiting (3008), VoDZ vs classic message handling complexity

3. **Phase 3: Forms & Registry Integration** - ISVS REST APIs for act registry, form prefill from ZR, CzechVoc
   - Addresses: Catalog of acts, pre-filled forms, RÚIAN address lookup
   - Avoids: AIS certification delays, SZR approval process

4. **Phase 4: Payments** - Comgate native Mobile Checkout SDK integration (Android/iOS), QR payment, Apple Pay/Google Pay, 3DS in-app
   - Addresses: Fee payments, QR platba (Czech Banking Standard), PCI DSS compliance
   - Avoids: WebView Google Pay issues, PCI scope expansion, redirect UX friction

5. **Phase 5: Accessibility & Compliance** - WCAG 2.1 AA implementation, automated testing (axe-core), manual audit, accessibility statement publication
   - Addresses: Legal compliance (Zákon 99/2019), senior usability, DIA monitoring readiness
   - Avoids: Post-launch remediation costs, legal challenges, exclusion of users with disabilities

**Phase ordering rationale:**
- Auth first (everything depends on verified identity)
- Communication second (core citizen↔office interaction)
- Forms third (builds on auth + communication)
- Payments fourth (requires auth, can reuse ISDS for payment confirmations)
- Accessibility last but tested continuously (cross-cutting, validates all prior phases)

**Research flags for phases:**
- Phase 1: Likely needs deeper research on Keycloak↔NIA attribute mapping and LoA step-up flow
- Phase 2: Likely needs deeper research on VoDZ migration timeline and async notification handling
- Phase 3: Standard patterns, unlikely to need research (well-documented REST)
- Phase 4: Standard patterns (Comgate SDK well-documented), but verify QR platba bank coverage
- Phase 5: Likely needs deeper research on EN 301 549 V3.2.1 specific mobile criteria vs WCAG 2.1

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| eIdentita (NIA) | HIGH | Official docs, metadata endpoints, MojeID OIDC examples, test env confirmed |
| ISDS | HIGH | WSDL docs, endpoint URLs, auth methods, VoDZ specs, rate limits documented |
| ISVS | MEDIUM | Registry/REST APIs documented but AIS certification process less detailed; need SZR contact |
| Payments | HIGH | All three gateways documented with APIs, SDKs, PCI DSS info, QR support confirmed |
| Accessibility | HIGH | Law text, EN 301 549 mapping, DIA methodology, statement template available |

## Gaps to Address

- ISVS AIS registration/certification timeline and SZR contact process for municipal scope
- eIdentita production onboarding timeline (SeP registration with MVČR)
- Comgate Mobile Checkout SDK Flutter plugin availability (native Android/iOS only, may need platform channels)
- Exact EN 301 549 V3.2.1 Chapter 11 (software) criteria mapping to Flutter widgets
- ISDS async notification (RegisterForNotifications) reliability in mobile context
- Offline-first sync strategy for ISDS messages (conflict resolution when coming online)