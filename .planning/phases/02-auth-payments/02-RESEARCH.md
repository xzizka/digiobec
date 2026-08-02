# Phase 2: Auth & Payments - Research

**Researched:** 2026-08-02
**Domain:** Czech eGovernment identity federation (eIdentita/NIA), Czech payment rails (GP WebPay, SPAYD QR), ISDS datové schránky, mobile app hardening, and two carried-over Phase 1 infrastructure gaps (RÚIAN, staging)
**Confidence:** MEDIUM overall — HIGH on payments/RÚIAN/ISDS protocol shape, LOW on procedural details (registration lead times, exact LoA-to-act legal mapping) that no public source states plainly

---

## Summary

Phase 2 bundles five genuinely new external integrations (NIA/eIdentita, GP WebPay, ISDS, a
device-integrity check, and a real RÚIAN connection) into a single 6-sprint phase for a
1,500-person municipality with no dedicated integration team. That is an aggressive scope. The
good news: Keycloak (already running, already realm-imported per Phase 1) is the correct place
for all of NIA, and it does 90% of the hard cryptographic/protocol work for you — this phase is
mostly *configuration and plumbing*, not building a SAML/OIDC stack from scratch. The bad news:
three of the five integrations gate on an **external registration whose lead time nobody on this
project's side controls** (NIA/SZR accreditation, a merchant contract for GP WebPay, an ISDS
production mailbox with signed API access). None of those can be shortened by writing code faster.

**What is buildable right now, with no external party's permission:**
- A real, working ČÚZK RÚIAN address-lookup integration. This was fabricated in Phase 1
  (`RuianClient` pointed at a guessed, unregistered URL). This session found and **live-verified**
  a genuine, free, no-registration ČÚZK REST endpoint
  (`https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/exts/GeocodeSOE`) that returns
  real suggestions today. This is the single highest-confidence, fastest win in the whole phase —
  it closes E2.6's RÚIAN gap in days, not sprints.
- A minimal, real staging deployment target (docker-compose-over-SSH to one VPS), using the
  Docker images the CD pipeline already builds and pushes to GHCR but never deploys.
- SPAYD QR-platba generation (pure math/string formatting, zero external dependency).
- Keycloak realm scaffolding for NIA as an identity provider (SAML or OIDC broker config, SP
  metadata, ACR→LoA mapping) — buildable and testable against NIA's **test environment**
  (`czebox.cz` test mailboxes) without waiting for production accreditation.
- Certificate pinning and device-integrity plumbing in Flutter/Dio — no external dependency.

**What is blocked on someone outside this codebase saying yes:**
- NIA/eIdentita production access (SZR accreditation as an OVM service provider).
- A GP WebPay merchant contract + production credentials (acquirer/bank relationship).
- ISDS production API credentials for the municipality's own datová schránka (this may already
  exist administratively — check before assuming it needs "registering").

**The single biggest risk in this phase is not any one integration — it's sequencing.** All
three blocked items should be filed as registration requests in week 1, in parallel with mock-based
development, or the 6-sprint estimate will be consumed entirely by paperwork lead time that nobody
here can control. The second-biggest risk is the **in-app WebView card-payment acceptance
criterion**, which is in real tension with how GP WebPay actually implements PSD2 SCA (see
Payments section) — this needs a decision, not a hope that it'll work out.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| NIA/eIdentita protocol handling (SAML/OIDC, LoA, signature validation) | Keycloak (IAM broker) | Backend (reads resulting JWT claims) | Anti-Pattern 3 in project's own `ARCHITECTURE.md`: never hand-roll SAML/OIDC against NIA. Keycloak is already the resource server's trust root (`SecurityConfig.kt`), so it's the only correct place. |
| LoA-based authorization (which acts require Substantial vs High) | Backend (Spring Security `@PreAuthorize` / method security) | Keycloak (carries `acr`/LoA claim into JWT) | Keycloak transports the LoA; the *business rule* of "this act needs High" is domain logic, not IAM config — belongs in the backend act/form-catalog service. |
| GP WebPay redirect + DIGEST signing/verification | Backend | — | DIGEST uses a merchant private key that must never reach the client (mobile/web); server-to-server signing only. |
| In-app card payment UI | Mobile (Flutter, WebView) / Citizen-Web (browser-native, no WebView needed) | Backend (payment session init/confirm) | The WebView constraint is mobile-specific; citizen-web can do a normal top-level redirect since it's already inside a browser. |
| QR platba (SPAYD) generation | Backend | Mobile/Web (renders the QR image client-side from a string the backend returns) | SPAYD is just a formatted string; generating it needs no external call, but validated business data (variable symbol, amount) should come from the backend, not be assembled client-side. |
| ISDS send/receive/evidence | Backend (SOAP client, scheduled poller) | — | Anti-Pattern 1 in `ARCHITECTURE.md`: never do SOAP/MTOM from the mobile app. Backend owns the WSDL-generated client and stores the signed ZFO blob. |
| Certificate pinning | Mobile (Dio/`HttpClient`) | — | Client-side only; backend has no role here beyond serving a stable TLS chain. |
| Play Integrity / App Attest | Mobile (attestation) + Backend (server-side token verification) | — | The token is worthless unless verified server-side against Google's/Apple's verification endpoints — this is not a client-only feature. |
| RÚIAN address autocomplete | Backend (`RuianClient` → real ČÚZK endpoint) | Mobile/Web (renders suggestions) | Already the existing pattern from Phase 1; only the endpoint/response-shape needs to change. |
| Staging deploy | CI/CD (GitHub Actions) + a single VPS | — | Small-municipality scale explicitly rules out Kubernetes; a single always-on VM matches the CD pipeline's existing GHCR image output. |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FR-02.1 | eIdentita (NIA) 5 methods | See "1. eIdentita / NIA" — all 5 surface behind **one** NIA login endpoint from Keycloak's perspective; do not build 5 separate IdP configs. |
| FR-02.2 | LoA Substantial minimum, High for payments/personal data | See "1. eIdentita / NIA — LoA mapping"; the specific "which act needs which LoA" legal mapping is an **open question (category c)**, not resolved by any source found this session. |
| FR-02.3 | Keycloak as Identity Broker (OIDC federation) | See "1. eIdentita / NIA — protocol ambiguity"; sources conflict on SAML2-only vs. SAML2+OIDC availability from NIA — needs confirmation before locking Keycloak IdP type. |
| FR-02.4 | Biometrie/PIN pro znovu-otevření aplikace | Not deeply researched this session (app-local re-auth, not a NIA concern); standard `local_auth` package already in `pubspec.yaml`. Low risk, low novelty. |
| FR-02.5 | Profil: fyzická osoba, podnikatel (IČO), zástupce | Partially covered by NIA attribute release (RČ, IČO where applicable); "zástupce"/power-of-attorney is flagged in `FEATURES.md` as high-complexity, deferred-candidate. |
| FR-05.1 | QR platba (Czech Banking Standard) | See "2. Payments — SPAYD"; fully specified, buildable now. |
| FR-05.2 | GP WebPay / GoPay integrace | See "2. Payments — GP WebPay"; protocol confirmed, sandbox path documented, WebView/SCA tension flagged. |
| FR-05.3 | Chytrá složenka | Combines FR-05.1 (SPAYD) + existing Phase 1 PDF pipeline (Plan 05) — no new integration, just composition. |
| FR-05.5 | Idempotency | See "2. Payments — Idempotency" pattern. |
| FR-06.3 | Datové schránky (ISDS) doručování | See "3. ISDS doručenky". |
| FR-07 (GDPR) | Legal basis for identity data processing | See "6. Legal/Compliance framing" — marked `[ASSUMED]`, needs legal sign-off, not just engineering judgment. |

</phase_requirements>

---

## 1. eIdentita / NIA (E2.1) — the highest-risk item

### 1.1 Registration / accreditation path

`[CITED: nia.otevrenamesta.cz/sep-info]` A municipality (an OVM — orgán veřejné moci) registers
as a **SeP (Service Provider)** as follows:

1. Log into **eidentita.cz** using the **statutory representative's own datová schránka**
   (the mayor's/starosta's official mailbox, not a generic municipal account).
2. Follow the "Přihlásit se jako poskytovatel služby" (log in as a service provider) link and
   complete SeP registration.
3. A private company would instead need prior written permission from SZR
   (`eidentita@szrcr.cz`) based on a specific legal justification — **not applicable here**,
   since a municipality is itself an OVM and doesn't need this extra step.
4. The SP must supply: a metadata URL / SP certificate, an Assertion Consumer Service (ACS)
   URL, a logout URL, and a unique issuer identifier.

`[CITED: nia.otevrenamesta.cz/sep-info]` **Test and production are fully separate systems with
no shared accounts.** Test-environment mailboxes for development are obtained from
**czebox.cz** (a separate test-databox provisioning site), not from the municipality's real
datová schránka. This means: **development against the NIA test environment can start
immediately, without waiting for production accreditation** — this is the parallel-track
opportunity referenced in ROADMAP.md's own risk table ("Parallelní dev proti mock serveru").

`[UNKNOWN — needs a human]` **No source found this session states a concrete lead time or SLA
for SeP accreditation approval.** `STATE.md`'s Open Questions already flags this as unresolved.
Do not let a plan assume "a few days" or "a sprint" — budget it as unknown and start the request
in week 1 regardless of when the engineering work is scheduled.

`[ASSUMED]` Given that this is a routine, well-trodden path for Czech municipalities (hundreds
already use NIA via their national portal integrations), a reasonable planning assumption is
**weeks, not months** — but this is training-knowledge inference, not a verified fact, and
should not be treated as a locked estimate.

### 1.2 Protocol: SAML2 vs OIDC — a real ambiguity, flagged honestly

This is exactly the kind of thing Phase 1 got burned by treating as settled when it wasn't, so
it's being called out explicitly rather than picked silently:

- The project's own `STACK.md` (Phase 1 research) documents an **OIDC** flow, with concrete
  endpoints: `https://tnia.identitaobcana.cz/FPSTS/oauth2/authorize` /
  `.../oauth2/token` / `.../oauth2/jwks`, and an example Keycloak IdP config using
  `"providerId": "oidc"` with `acr_values=http://eidas.europa.eu/LoA/substantial`.
- This session's fresh check of **nia.otevrenamesta.cz** (a widely-cited Czech reference
  implementation maintained for municipalities integrating with NIA) states the protocol is
  **SAML 2.0** (HTTP-REDIRECT/HTTP-POST bindings), and describes SP registration purely in SAML
  terms (metadata, ACS URL, entity ID) — no OIDC client registration step is mentioned.
- A separate search surfaced a claim that NIA "can be used with SAML2 Core / eIDAS
  WS-Federation" for IdP-side integration, and, in the same result set, a different snippet
  claiming both SAML and OIDC are usable — internally inconsistent search-result text.

`[ASSUMED — plausible reconciliation, NOT verified]` The `/FPSTS/` path segment in the OIDC URLs
(Federation Provider Security Token Service) is an ADFS-style naming convention, which is
consistent with NIA's underlying STS product exposing **multiple protocol endpoints
simultaneously** (WS-Federation, SAML2, and an OAuth2/OIDC profile) rather than the two sources
actually contradicting each other. This is a reasonable engineering inference, not confirmation.

**What the planner should do with this:** before writing a Keycloak IdP config task, add a
`checkpoint:human-verify` step to download and read the current
**`SeP_PriruckaKvalifikovanehoPoskytovatele.pdf`** (Příručka k využití služeb národní identitní
autority pro kvalifikované poskytovatele — linked from nia.otevrenamesta.cz's search results) and
confirm which protocol(s) are actually offered today. Keycloak supports both SAML and OIDC
identity brokering natively, so either is buildable — but the **realm JSON shape is completely
different** between the two, and picking wrong means redoing the whole IdP config.

### 1.3 The five authentication methods — how they surface

`[CITED: info.identita.gov.cz/idp, mixed with ux-research.md]` **They surface as ONE federated
login endpoint, not five separate IdPs.** NIA itself is the identity broker for the five methods
(Mobilní klíč eGovernmentu, NIA ID, eObčanka — the three "state" methods — plus Bankovní identita
and other privately-operated methods like MojeID/I.CA). A relying party (this project's Keycloak)
integrates with **NIA once**; the user picks their preferred method on **NIA's own hosted login
page** after being redirected there.

**Implication for the plan:** do not build 5 Keycloak identity providers. Build **one** Keycloak
IdP alias (e.g. `nia-eidentita`) pointing at NIA; NIA's own UI handles the bank/eObčanka/MojeID
selection. This matches the existing `ARCHITECTURE.md` Pattern 2 example already in the repo's
research and should be followed as-is.

### 1.4 LoA mapping

`[CITED: keycloak.org docs + blog.please-open.it]` Keycloak has native ACR↔LoA mapping at the
realm level: an admin defines which `acr` value (from the assertion NIA returns) maps to which
numeric LoA. The `acr` claim ends up in the issued JWT, so the **backend** can read it (e.g. a
custom claim mapper putting it into `realm_access` or a dedicated claim) and gate specific
endpoints/actions on LoA ≥ Substantial or ≥ High via `@PreAuthorize`, mirroring the existing
`SecurityConfig.kt` pattern (`extractRealmRoles` already demonstrates reading a nonstandard
Keycloak claim shape — the same technique extends naturally to an LoA claim).

`[MEDIUM confidence, from GitHub discussion]` Keycloak's **step-up authentication** support
(re-prompting for a higher LoA mid-session, e.g. when a citizen tries to make a payment after
logging in at Substantial) is **still an evolving area of the product**, per an open Keycloak
GitHub discussion questioning whether current per-client `acr.values` config is the "idiomatic"
way to do this. **Do not assume step-up is a solved, one-line config.** Budget explicit test time
for it; a fallback if it proves too fragile is: require High LoA at initial login for any citizen
who might touch a payment or personal-data act, rather than mid-session step-up.

`[UNKNOWN — genuine legal research gap, category (c)]` **Which specific municipal acts legally
require High vs Substantial LoA was not found in any source checked this session.** This is a
legal/regulatory question (likely governed by the eIDAS LoA assurance-level regulation and/or
Czech implementing legislation on elektronická identifikace), not an engineering one. Do not let
a plan hard-code "payments = High, everything else = Substantial" as if it were settled law —
flag it for the domain expert (PO / úředník role in ROADMAP's team table) to confirm per-act.

### 1.5 What can be built against a mock while accreditation is pending

- Keycloak realm scaffolding: the `nia-eidentita` IdP alias, ACR→LoA realm mapping, and the
  Keycloak-side attribute mappers (RČ, name, address from the NIA assertion) can all be built
  and unit-tested against **Keycloak's own test IdP** or a hand-rolled mock SAML/OIDC IdP
  (Keycloak ships a "Test SAML IdP" pattern commonly used in its own test suite) before NIA
  test-env access even exists.
- The **NIA test environment itself (via czebox.cz test mailboxes)** is available without
  production accreditation — prefer testing against the real NIA test node over a home-grown
  mock once czebox.cz access is obtained, since it exercises the real assertion shape.
- Backend LoA-gating logic (`@PreAuthorize` on act endpoints) can be built and tested with a
  fabricated JWT claim in integration tests — this needs zero external dependency.

---

## 2. Payments (E2.3)

### 2.1 GP WebPay — protocol shape

`[CITED: gpwebpay.cz HTTP API spec v1.18, cross-referenced with v1.19 changelog references]`
GP WebPay is a classic **redirect-based** payment gateway:

1. Backend builds a signed request (merchant ID, order number, amount, currency, a `DIGEST`
   computed over the concatenated parameters with the merchant's private key) and redirects the
   payer to GP WebPay's hosted payment page.
2. GP WebPay handles card entry and, for 3-D Secure, redirects again to the **card issuer's ACS**
   (Access Control Server) for the SCA challenge.
3. After completion, GP WebPay redirects back to a merchant-configured **return URL** with a
   response `DIGEST` the backend must verify (GP WebPay's public key is provisioned on their
   server automatically once the merchant relationship exists; the merchant never needs to fetch
   it manually per the spec).
4. There is a **DIGEST1 vs DIGEST** distinction in older/newer spec revisions worth confirming
   against whichever version the actual merchant contract references (v1.18 was the most recent
   version this session could retrieve in full; v1.19 was referenced only via a changelog
   mention in a third-party PrestaShop module, not confirmed against the primary PDF).

`[UNKNOWN — needs a human with procurement access]` **Merchant account setup requires a
contractual relationship with an acquiring bank** (GP WebPay is operated by Global Payments,
tied to specific Czech acquiring banks). This is a procurement action, not something the dev
team can self-service — matches `STATE.md`'s Open Question "PSD2 acquirer selection for
municipal payments – procurement." A sandbox/test merchant ID may be obtainable directly from
GP WebPay/Global Payments without the full production contract — worth asking explicitly when
initiating the procurement conversation, since it would unblock development immediately.

### 2.2 QR platba — SPAYD, fully specified

`[CITED: qr-platba.cz/pro-vyvojare/specifikace-formatu, cross-checked against Czech Banking
Association adoption (2012 standard)]`

- Format: `SPD*1.0*KEY:VALUE*KEY:VALUE*...`
- Required: `ACC` (IBAN, optionally `+BIC`, max 46 chars).
- Common optional fields: `AM` (amount, decimal, 2 places), `CC` (currency, ISO 4217 — `CZK` for
  domestic), `MSG` (message, max 60 chars), `X-VS` (variabilní symbol, Czech-specific, max 10
  digits), `X-SS` (specifický symbol), `X-KS` (konstantní symbol), `DT` (due date, `YYYYMMDD`),
  `RN` (recipient name).
- Character set for QR efficiency: uppercase `0-9A-Z`, space, and `` $%*+-./: ``; values needing
  other characters must percent-encode (`%2A` for a literal asterisk, etc.).
- Example: `SPD*1.0*ACC:CZ9106000000000000000123*AM:450.00*CC:CZK*MSG:PLATBA ZA ZBOZI*X-VS:1234567890`

**Implementation:** this is pure string formatting + a QR-code renderer. The backend already
depends on `com.google.zxing:core`/`javase` (used for Phase 1's PDF QR codes) — **reuse it**;
no new library needed for QR generation. `X-VS` should be a deterministic, unique value per fee
instance (e.g. derived from the submission/payment record ID) to make reconciliation
possible — this ties directly into idempotency (2.4 below).

### 2.3 The WebView / SCA tension — flagged plainly, per the task's instruction to challenge
unrealistic ACs

**ROADMAP.md's AC:** *"Platba kartou proběhne v aplikaci (WebView) bez přesměrování do
prohlížeče."*

`[MEDIUM confidence, cross-referenced across GP WebPay's own PSD2RTS page and general PSD2/3DS2
literature]` GP WebPay has **no native mobile SDK**. Its whole integration model is: redirect →
GP WebPay hosted page → (for 3DS) redirect again to the issuer's ACS → redirect back. There is
no way to avoid this redirect chain entirely with GP WebPay — the SCA challenge is fundamentally
a page the issuer serves, not something GP WebPay or the merchant can render natively.

**This is a genuine tension with the AC as literally read**, but it is resolvable, not fatal:
- **Technically achievable interpretation:** host the *entire* redirect chain (GP WebPay's page
  + the issuer's ACS challenge) inside an **in-app WebView component**, so the user never leaves
  the app to an external browser (Chrome Custom Tab / Safari). This satisfies the AC's literal
  wording ("v aplikaci... bez přesměrování do prohlížeče" — in the app, without redirecting to
  the browser) even though under the hood it's still web content, just embedded rather than
  externally launched.
- **What it does NOT give you:** the polished native card-entry UI, native Apple Pay/Google Pay
  sheets, and PCI-scope reduction (SAQ-A) that a true native SDK (Comgate's, per this project's
  own `STACK.md`/`ARCHITECTURE.md`) provides. The project's own Phase-1-era research explicitly
  recommended Comgate over GP WebPay/WebView **for exactly this reason**
  (`ARCHITECTURE.md` Anti-Pattern 2: "WebView for Payment Gateway... Google Pay fails in
  WebView... Instead: Comgate native Mobile Checkout SDK").
- **This is a direct conflict between a locked decision (`STATE.md`: "Payments: GP WebPay + QR
  platba") and the project's own prior research recommendation (Comgate).** Neither this
  researcher nor the planner should silently resolve it. Flag it to the user/PO explicitly:
  either (a) proceed with GP WebPay + in-app WebView, accepting the PCI-scope and UX tradeoffs,
  or (b) revisit the STATE.md decision and use Comgate (or add Comgate as the mobile-only path
  while GP WebPay serves citizen-web/admin-web). This is exactly the kind of thing a
  `/gsd-discuss-phase` session should surface as a decision point before planning locks it in.

`[ASSUMED]` Apple Pay/Google Pay inside a WebView is known to be unreliable or outright
non-functional in multiple independent sources (this project's own `ARCHITECTURE.md`, general
industry knowledge) — if GP WebPay is kept, budget for **card-only** in-app payment and treat
Apple/Google Pay as citizen-web/admin-web-only (real browser) or as a deferred mobile feature.

### 2.4 Idempotency and reconciliation

`[ASSUMED — standard payment-system pattern, not Czech-specific]` The standard shape for this,
consistent with what Phase 1 already established for `Submission` (state machine + audit log in
`AdminSubmissionService`/`SubmissionAuditLog`):

- Every payment attempt gets a **backend-generated idempotency key** (e.g. a UUID stored on the
  payment record *before* the redirect to GP WebPay) — never let the client generate or resend
  this key.
- The `X-VS` (variable symbol) used in both SPAYD QR and GP WebPay's order reference should map
  1:1 to this same backend payment record, so a webhook/return-URL callback can be correlated
  even if it arrives twice.
- **A failed/lost callback must be recoverable via polling**, not just push: GP WebPay (like
  most Czech gateways) supports a status-check call — the backend should poll for any payment
  record left in a pending state past a timeout, not rely solely on the return-URL redirect
  firing (redirects can be dropped by flaky mobile networks, especially inside a WebView).
- Mirror the existing `submission_audit_log` append-only pattern for payments: an immutable
  `payment_audit_log` recording every state transition (`INITIATED → REDIRECTED → CONFIRMED /
  FAILED / TIMED_OUT`), so a double-charge investigation has a paper trail. This is the same
  architectural pattern already proven in Plan 06, just applied to a new domain — **don't
  hand-roll a new pattern**, reuse the one that already works.

---

## 3. ISDS doručenky (E2.4)

`[CITED: mojedatovaschranka.cz Provozní řád + application interface docs]` ISDS exposes SOAP web
services, split by environment and version:

- **VT (veřejný test / public test):** `ws1.mojedatovaschranka.cz` (classic SOAP 1.1),
  `ws2.mojedatovaschranka.cz` (VoDZ — SOAP 1.2 + MTOM/XOP, used for larger attachments).
- **PROD:** `ws1.mojedatovaschranka.cz` / `ws1c.mojedatovaschranka.cz` (certificate-authenticated
  variant) and the `ws2`/`ws2c` equivalents for VoDZ.

**Recommended JVM approach — matches the project's own existing research, do not deviate:**
WSDL-first code generation via **Spring-WS** or **Apache CXF's `wsdl2java`**, regenerated
whenever ISDS publishes a new WSDL revision (the project's `ARCHITECTURE.md` already documents
this exact pattern with a working `WebServiceTemplate` example). This is listed as a *Don't
Hand-Roll* item already (see below) — do not write raw SOAP/XML construction.

`[CITED: github.com/xrosecky/JAVA_ISDS, checked this session]` An open-source Java client,
**JAVA_ISDS** (BSD-3-Clause, Maven-based build), exists covering send, integrity verification,
and mailbox search. **It shows no visible recent commit/release activity and is not published to
Maven Central** (must be built from source) — treat it as a *reference implementation to read*,
not a dependency to pull in. The WSDL-codegen approach gives full control and doesn't depend on
an unmaintained third party for something this legally load-bearing.

**Delivery evidence, concretely:**
- `GetSignedDeliveryInfo` (or the equivalent operation in the current WSDL) returns the signed
  proof of delivery — this is the **doručenka**, the legally significant artifact.
- `ARCHITECTURE.md` Anti-Pattern 4 (already in the project's own research, correct, do not
  deviate): store the **full signed ZFO XML blob** (BYTEA in Postgres), not just extracted
  fields — the ISDS signature only has legal/evidentiary value on the original envelope.
- Polling cadence: a scheduled job (`GetListOfReceivedMessages` / `GetMessageStateChanges`) is
  the standard integration shape at this scale; ISDS also supports async notification
  registration, but for a ~1,500-resident municipality's message volume, a 5-minute poll (as
  already documented in `ARCHITECTURE.md`'s data-flow section) is more than sufficient and much
  simpler to operate than a webhook/notification subscription.

`[UNKNOWN]` Whether the municipality already **has** a production ISDS mailbox and API
credentials (most Czech municipalities are legally required to have a datová schránka already,
separate from this project) was not something this research could confirm — this is an
administrative fact-check, not a technical unknown. **Check this first**: if the municipality
already has a datová schránka, the "registration" here may just mean requesting API/webservice
access to an *existing* mailbox, which is a much faster path than the 5-8 month narrative often
associated with new eGov integrations.

`[CITED: mojedatovaschranka.cz]` **Test mailboxes for the VT environment are obtained separately
from production** (this project's team would need to set up test datové schránky specifically
for development, distinct from the municipality's real one) — matches the pattern already
established for NIA's czebox.cz test mailboxes; both integrations can be developed in parallel
against their respective test environments before production access exists.

---

## 4. Security hardening (E2.5)

### 4.1 Certificate pinning (Flutter/Dio)

`[CITED: multiple 2026 Flutter security guides, cross-checked for consistency]` Two realistic
approaches, in order of recommendation for this project's scale:

1. **Public-key (SPKI) pinning rather than full-certificate pinning.** Pin the SHA-256 digest of
   the server's public key, not the whole leaf certificate. This survives routine certificate
   renewal (e.g. Let's Encrypt's 90-day rotation) because the key can be kept stable across
   reissuance, whereas full-cert pinning breaks on every renewal.
2. Pin **multiple digests** — the leaf plus at least one intermediate — so a routine CA-driven
   rotation doesn't hard-brick already-installed app versions; only a full private-key
   compromise/reissue would require an app update.
3. Implementation: either `SecurityContext`/`badCertificateCallback` wired into Dio's underlying
   `HttpClientAdapter` directly (zero new dependency, most control), or the
   `http_certificate_pinning` package (pub.dev, v3.0.1 as of a 2-month-old release check this
   session, Dart-3-compatible) for less boilerplate.

`[ASSUMED — operational risk, explicitly called out per the task's brief]` **The real
operational cost is rotation, not implementation.** If pins are baked into a released app binary
and the backend's certificate/key needs emergency reissue (compromise, CA revocation), every
installed app version older than the fix will hard-fail all API calls until users update — app
store review + rollout time (days) becomes an outage window. Mitigation pattern found in
research: **keep pin digests out of the compiled binary** (remote-config-delivered, or at minimum
structured so a hot patch is possible) rather than hard-coded as a literal string constant — this
is a meaningful design decision the plan should make explicitly, not default into.

`[ASSUMED]` General security guidance found this session states pinning is really only
justified for higher-risk apps (financial-grade) — this project's payment flows plausibly meet
that bar, but pinning the *entire* app (including low-sensitivity endpoints like the RÚIAN
autocomplete proxy) may be unnecessary blast-radius; consider scoping pinning to
auth/payment/ISDS-adjacent endpoints only if rotation risk is a concern.

### 4.2 Play Integrity / App Attest

`[CITED: developer.android.com/Play Integrity + Apple App Attest docs, via pub.dev package
descriptions checked this session]` Both platforms require **server-side verification** — the
client-side token is meaningless until the backend calls Google's/Apple's verification API and
checks the result. This is not a client-only feature; budget backend work (a new
`/api/attestation/verify` endpoint) alongside the mobile-side token generation.

Two Flutter packages found this session:
- `app_device_integrity` (pub.dev, v1.1.0, **verified publisher** badge, last published ~19
  months before this research — worth a freshness check at plan time, since this ecosystem
  moves with OS-version-specific quirks) — unified API for both platforms.
- `app_attest`/`app_attest_integrity` — similar scope, less-established publisher signal.

`[ASSUMED]` Given the 19-month-stale signal on the most established package and the fact that
neither Play Integrity nor App Attest APIs are stable across arbitrary OS versions without
occasional native-side updates, **treat this as a realistic-scope item, not a bolt-on**: budget
time for testing on current OS versions specifically, and have a fallback (e.g. soft-fail —
allow the app to function with reduced trust/logging rather than hard-block — for the pilot
municipality's rollout) rather than a hard gate that could brick access for legitimate users on
an untested device/OS combination.

**Package legitimacy note:** `pub.dev` (Dart/Flutter) is not covered by this project's automated
package-legitimacy gate (`gsd-tools package-legitimacy check` only supports `npm|pypi|crates`).
The verified-publisher badge and version/freshness data above were checked manually via the
package's pub.dev page this session; this is weaker verification than the automated gate
provides for npm — the planner should still gate the actual `pubspec.yaml` addition behind a
`checkpoint:human-verify` step given this gap in tooling coverage.

---

## 5. E2.6 — Infrastructure and external registration (inherited from Phase 1)

### 5.1 ČÚZK RÚIAN — replacing the fabricated endpoint

**This is the single most concrete, verifiable finding in this whole research pass.** Phase 1's
`RuianClient.kt` defaults to `https://api.ruian.cz` with an empty API key — a guessed,
unregistered, non-functional URL (confirmed by reading the code and the Phase 1 verification
report). This session found and **live-tested** the real thing:

`[VERIFIED — live WebFetch this session, official cuzk.gov.cz domain]`
- **Endpoint:** `https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/exts/GeocodeSOE`
  — an Esri ArcGIS Server "Server Object Extension" (a standard, well-known pattern for Czech
  public GIS data services; ČÚZK runs several ArcGIS-based public services).
- **Confirmed live**, `GET .../GeocodeSOE?f=json` returns a real service description (v11.38,
  WKID 5514) listing three operations: **`Geocode`**, **`ReverseGeocode`**, **`Suggest`**.
- **Confirmed live**, `GET .../GeocodeSOE/suggest?text=Broumy&f=json` returned **15 real address
  suggestions** for the pilot municipality (Broumy, Beroun district) — municipality, city-part,
  cadastral-territory, and 11 real street names, each with a `magicKey`/`type`/`text` shape.
- **No API key or registration was used or required** in this live test.
- This is a different, more capable ČÚZK service than the "VDP" (Veřejný dálkový přístup) web
  application, which was also checked and confirmed to be a **bulk VFR-export + map-browsing UI,
  not a live JSON API** — useful for nightly bulk import (already a Phase-1 follow-up: "nightly
  PostgreSQL RÚIAN import"), but not for live autocomplete.
- Terms of use: **Zásady užívání dat a služeb ZÚ** (`geoportal.cuzk.cz/Dokumenty/Podminky.pdf`) —
  the planner should have a task read and confirm this document's actual rate-limit/fair-use
  terms before assuming unlimited free use is safe for a live citizen-facing feature, but
  nothing found this session suggests API-key-gated access is required for this endpoint.

`[UNKNOWN]` A follow-up geocode/full-address-candidate operation (`findAddressCandidates` in
standard ArcGIS geocoder terminology) likely also exists on this service beyond `Suggest` — this
session confirmed `Suggest` works and matches the autocomplete use case exactly, but did not
exhaustively test `Geocode`/`ReverseGeocode`'s exact parameter shape. A quick spike task to read
the linked "Popis rozhraní" / "Využití extenze GeocodeSOE" PDFs at `geoportal.cuzk.gov.cz/Dokumenty/`
before writing the new `RuianClient` is worth the hour.

**Recommended fix, concretely:** replace `RuianClient`'s base URL/path and response-mapping
logic to target `.../GeocodeSOE/suggest` (mapping ArcGIS's `suggestions[].text`/`magicKey`/`type`
shape into the existing `RuianAddress` domain type) — this is a same-shape swap, not a redesign;
the existing Caffeine cache, fallback-on-exception pattern, and `AddressAutocompleteService`
structure all still apply.

### 5.2 Staging deployment

`[VERIFIED — read directly from the repo this session]` The CD pipeline
(`.github/workflows/cd.yml`) **already builds and pushes real Docker images** for backend and
admin-web to GHCR on every push to `main` — the `build-and-push` job is real and functional. The
`deploy-staging` job is the only stub (an `echo` with commented-out `kubectl` commands).

`[CITED, multiple GitHub Marketplace Actions checked this session]` For a small-municipality
scale, do not introduce Kubernetes. Realistic, low-effort options, in order of simplicity:
1. **Docker-compose-over-SSH to a single VPS** (e.g. via `appleboy/ssh-action` or a dedicated
   `docker-compose-deploy` GitHub Action found this session) — copy/pull the GHCR images,
   `docker compose up -d` on a single always-on VM. This directly replaces the commented-out
   `kubectl` lines with an SSH step; matches the project's existing `docker-compose.yml`
   conventions (Postgres + Keycloak already run this way).
2. A managed PaaS with a Docker-image deploy hook (Fly.io, Railway, Render) if the municipality
   is open to a non-self-hosted option — lower ops burden, but introduces a new vendor
   relationship the small-municipality/GDPR context may want to avoid (data residency).
3. **Not recommended:** any Kubernetes variant (k3s included) — explicitly out of scope per the
   locked "small municipality" constraint; the operational overhead (cluster admin, manifests,
   ingress/cert-manager) has no payoff at this user count.

**What actually needs to happen for the phase's AC ("build, test, deploy do staging za < 15
min"):** provision one VM (even a cheap one), add SSH credentials as GitHub Actions secrets,
replace the stub with a real deploy step, and **measure** the end-to-end pipeline duration at
least once — the AC explicitly requires a measured number, not just a working pipeline.

### 5.3 Lighthouse measurement

Not deeply re-researched this session (well-understood, low-risk): a `treosh/lighthouse-ci-action`
(or equivalent) GitHub Action run against the deployed staging admin-web/citizen-web builds is
the standard approach; this only becomes possible once 5.2's staging environment is real, so it
is correctly sequenced *after* the staging deploy task, not in parallel.

---

## 6. Legal/compliance framing

`[ASSUMED — general Czech public-administration/GDPR knowledge, not verified against primary
legal texts this session; flagged exactly per the task's instruction not to present assumed
compliance claims as fact]`

- **eIdentita usage rules:** processing NIA-sourced identity data (RČ, name, verified address)
  for a municipal service has its GDPR legal basis in **Art. 6(1)(c)/(e)** (legal obligation /
  public task), not consent — this matters for the GDPR dashboard being built in Phase 3, but
  Phase 2 should not add a spurious "consent to log in" UI pattern that doesn't apply here.
- **ISDS delivery legal effect:** Czech law (commonly cited as **Act 300/2008 Sb.**, on
  electronic acts and authorized conversion) establishes a **fikce doručení** (deemed-delivery)
  rule — an undelivered/unopened message in a datová schránka is legally considered delivered
  after a fixed period (commonly cited as **10 days**). **This specific figure was not
  re-verified against the primary legal text this session** — treat it as a strong prior, not a
  confirmed fact, and have the domain expert/PO confirm before any code encodes a specific
  day-count as a business rule (e.g. an SLA-timer offset).
- **Payment record retention:** Czech accounting law (zákon o účetnictví) imposes multi-year
  retention on financial records; the exact figure (**commonly cited as 5-10 years depending on
  document type**) was not verified this session — do not hard-code a retention period into a
  payment-record deletion/archival job without legal confirmation of the correct figure for
  *this specific record type* (a municipal fee payment, not a general accounting document, may
  have its own statutory period).
- **LoA-to-act legal mapping:** already flagged in section 1.4 as an open question — this is the
  most consequential unresolved legal item in the phase, since getting it wrong is either an
  access-control failure (too permissive) or a citizen-facing usability failure (too strict,
  forcing unnecessary high-assurance re-auth).

**Recommendation:** none of the above should block *starting* Phase 2 engineering work, but each
should have an explicit verification task (ideally with the municipality's own legal/compliance
contact, not just this research) before the corresponding feature ships to production.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Keycloak | 26.x (already running) | NIA identity broker, LoA claim mapping | Already the project's IAM; extending it is the only pattern consistent with Anti-Pattern 3 in the repo's own research (never hand-roll SAML/OIDC). |
| Spring Security OAuth2 Resource Server | already in `build.gradle.kts` | JWT validation, now also reading an LoA/`acr` claim | Already proven in `SecurityConfig.kt`; extend `extractRealmRoles`-style claim extraction, don't add a second security stack. |
| Spring-WS or Apache CXF (`wsdl2java`) | Spring-WS 4.x (matches `spring-boot-starter-webflux`/WebClient already in the project) | ISDS SOAP client | WSDL-first codegen already documented as the correct pattern in the project's own `ARCHITECTURE.md`/`STACK.md`; regenerate on WSDL revision, don't hand-write XML. |
| `com.google.zxing:core`/`javase` | 3.5.3 (already a backend dependency from Phase 1's PDF QR work) | SPAYD QR code image generation | Already in `build.gradle.kts` — reuse, don't add a second QR library. |
| `http_certificate_pinning` (pub.dev) OR hand-rolled `SecurityContext`/`badCertificateCallback` | 3.0.1 (pub.dev, checked this session) | Flutter cert pinning | Either is fine; the hand-rolled route has zero new-dependency surface, matching the project's stated minimal-dependency preference (see Plan 06's CSV-export decision). |
| `app_device_integrity` (pub.dev) | 1.1.0 (checked this session; ~19 months stale — verify freshness at plan time) | Play Integrity + App Attest, unified API | Verified-publisher badge; covers both platforms with one API, reducing native-channel bespoke code. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GP WebPay HTTP API (no SDK, direct HTTP + DIGEST signing) | v1.18 confirmed spec (v1.19 referenced only indirectly) | Card payment redirect flow | Server-side signing only; never expose the merchant private key to mobile/web clients. |
| Bouncy Castle or JDK's built-in `MessageDigest`/`Signature` | JDK-native preferred | DIGEST computation for GP WebPay | GP WebPay's DIGEST is a standard hash/signature over concatenated params — no special library needed beyond what the JDK provides. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GP WebPay (locked decision) | Comgate Mobile Checkout SDK | Comgate gives a genuinely native in-app card/Apple Pay/Google Pay flow with no WebView/redirect at all, directly satisfying the "no browser redirect" AC — but changes a locked `STATE.md` decision. Flagged as a decision point in section 2.3, not silently substituted. |
| JAVA_ISDS (third-party) | Spring-WS/CXF WSDL-first codegen | JAVA_ISDS is unmaintained-looking and not on Maven Central; codegen against the official WSDL is more maintainable long-term and matches the project's existing pattern. |
| Full-certificate pinning | SPKI/public-key pinning | Full-cert pinning breaks on every routine cert renewal; SPKI pinning survives reissuance as long as the key is stable. |
| Hard step-up re-auth per act | Uniform High-LoA login for any citizen who might touch a sensitive act | Keycloak's step-up support is not mature/idiomatic yet (per the GitHub discussion found); a uniform-LoA fallback trades a slightly worse UX for far less integration risk if step-up proves fragile in testing. |

**Installation:**
```bash
# Backend (Kotlin/Gradle) - no new dependencies needed for ISDS if using Spring-WS,
# which the project's ARCHITECTURE.md already assumes; add explicitly if not present:
implementation("org.springframework.ws:spring-ws-core")
implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-xml")

# Flutter (pubspec.yaml)
dependencies:
  http_certificate_pinning: ^3.0.1   # or hand-roll via SecurityContext/badCertificateCallback
  app_device_integrity: ^1.1.0       # verify current version/freshness before adding
```

**Version verification:** `http_certificate_pinning` v3.0.1 and `app_device_integrity` v1.1.0
were checked via their pub.dev package pages this session (not via an automated registry-check
tool, since `gsd-tools package-legitimacy check` only covers npm/pypi/crates). Re-check both at
plan time with `flutter pub outdated` or the pub.dev page directly, since training-data versions
can be stale.

---

## Package Legitimacy Audit

> This phase's new external packages are on **pub.dev (Dart)** and **Maven (Kotlin/Spring)**,
> neither of which is covered by `gsd-tools query package-legitimacy check` (npm/pypi/crates
> only). The table below is a **manual** best-effort audit using the signals available via
> WebFetch/WebSearch this session — treat it as weaker evidence than the automated npm gate
> would provide, and gate installs behind `checkpoint:human-verify` accordingly.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `http_certificate_pinning` | pub.dev | latest release ~2 months old, Dart 3 compatible | not checked (pub.dev doesn't surface download counts as prominently as npm) | not confirmed this session | `[ASSUMED — manual check only]` | Approved for planning, gate install behind `checkpoint:human-verify` |
| `app_device_integrity` | pub.dev | latest release (1.1.0) ~19 months old | not checked | published by `bubotech.co`, **verified publisher** badge confirmed via WebFetch | `[ASSUMED — manual check only, but verified-publisher signal is positive]` | Approved for planning, gate install behind `checkpoint:human-verify`; recheck freshness at plan time given 19-month gap |
| `org.springframework.ws:spring-ws-core` | Maven Central | mature, multi-year Spring sub-project | large (part of core Spring ecosystem) | github.com/spring-projects/spring-ws | OK (well-established, not independently re-verified via automated tooling this session) | Approved |
| JAVA_ISDS (github.com/xrosecky/JAVA_ISDS) | not a registry package — build-from-source | unclear (no visible recent activity found) | N/A | github.com/xrosecky/JAVA_ISDS, BSD-3-Clause | `[SUS — staleness signal, not a registry-fraud signal]` | **Not recommended as a dependency** — use as reference only; primary path is WSDL-first codegen |

**Packages removed due to `[SLOP]` verdict:** none — nothing this session showed hallmarks of a
hallucinated/typosquatted package.
**Packages flagged as suspicious `[SUS]`:** JAVA_ISDS (staleness/unmaintained signal) — excluded
from the recommended dependency list; not gated as an install since it isn't recommended for use.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─ Citizen (Mobile/Flutter or Citizen-Web/React) ────────────────────────────┐
│                                                                             │
│  [Login: "Přihlásit přes eIdentita"]                                       │
│         │                                                                  │
│         ▼                                                                  │
│  Keycloak /auth/realms/portal/protocol/{oidc|saml}/... ────────────────┐   │
│         │  (broker redirect)                                            │  │
│         ▼                                                                │  │
│  NIA (Národní bod) ── user picks: Bankovní identita / Mobilní klíč /     │  │
│                        NIA ID / eObčanka / MojeID / I.CA (NIA's own UI)  │  │
│         │  (assertion: identity + acr/LoA)                              │  │
│         ▼                                                                │  │
│  Keycloak validates, maps acr→LoA + attributes, issues JWT ──────────────┘  │
│         │                                                                  │
│         ▼                                                                  │
│  Backend (Spring Boot) — SecurityConfig reads JWT, extracts LoA + roles    │
│         │                                                                  │
│    ┌────┼────────────────┬─────────────────────┬───────────────────────┐  │
│    ▼    ▼                ▼                     ▼                       ▼  │
│  RÚIAN  Payment-init      ISDS scheduler        Attestation verify        │
│  (ČÚZK  (GP WebPay        (Spring-WS SOAP        (Play Integrity /        │
│  Geocode redirect + DIGEST → poll for messages   App Attest token          │
│  SOE)    sign/verify)      + doručenka evidence)  verify w/ Google/Apple)  │
│    │        │                    │                        │                │
│    ▼        ▼                    ▼                        ▼                │
│  Postgres (submissions, payments+audit log, isds_messages+ZFO blob,       │
│            attestation results)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

A citizen's primary journey (guest → login → pay a fee): the app opens a browser/Custom-Tab or
in-app WebView to Keycloak → Keycloak brokers to NIA → NIA returns an assertion carrying LoA →
Keycloak issues a JWT the backend already knows how to validate (extending, not replacing,
`SecurityConfig.kt`) → the backend's payment-init endpoint builds a signed GP WebPay redirect →
the WebView renders GP WebPay + the issuer's 3DS challenge → the return-URL callback (or a
polling fallback) confirms payment → the backend generates the SPAYD-QR/PDF confirmation using
the existing Plan-05 pipeline.

### Recommended Project Structure

```
apps/backend/backend/src/main/kotlin/cz/obec/portal/
├── auth/                    # NEW: LoA claim extraction, step-up helpers (extends SecurityConfig)
├── payment/
│   ├── gpwebpay/            # NEW: DIGEST signing/verification, redirect builder
│   ├── spayd/               # NEW: SPAYD string + QR generation (reuses zxing)
│   └── domain/              # Payment, PaymentAuditLog entities (mirrors SubmissionAuditLog)
├── isds/
│   ├── client/               # NEW: WSDL-generated SOAP client wrapper
│   └── service/              # NEW: polling scheduler, ZFO storage, delivery-evidence mapping
├── attestation/              # NEW: Play Integrity / App Attest server-side verification
└── ruian/
    └── client/RuianClient.kt # MODIFIED: point at the real ČÚZK GeocodeSOE endpoint
```

### Pattern 1: Keycloak Identity Broker for NIA

**What:** Configure Keycloak as the SAML or OIDC relying party against NIA (protocol TBD per
section 1.2's open question).
**When to use:** All NIA-mediated logins; never implement SAML/OIDC parsing in the backend or
mobile app directly.
**Example (illustrative shape only — confirm SAML vs OIDC before using literally):**
```json
{
  "alias": "nia-eidentita",
  "providerId": "saml",
  "enabled": true,
  "config": {
    "singleSignOnServiceUrl": "https://<NIA test env SSO URL — confirm from SeP metadata>",
    "nameIDPolicyFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
    "wantAssertionsSigned": "true",
    "signatureAlgorithm": "RSA_SHA256"
  }
}
```

### Pattern 2: Reading a non-standard JWT claim (extends existing code)

**What:** LoA arrives as an `acr` (or realm-specific) claim, same shape-problem `SecurityConfig.kt`
already solved for realm roles.
**When to use:** Any LoA-gated endpoint/action.
**Example:**
```kotlin
// Source: extends the existing extractRealmRoles pattern in SecurityConfig.kt
private fun extractLoa(jwt: Jwt): String? = jwt.getClaimAsString("acr")

// Usage in a service:
fun requireLoa(jwt: Jwt, minimum: LoaLevel) {
    val actual = LoaLevel.fromAcr(extractLoa(jwt))
    if (actual < minimum) throw InsufficientLoaException(minimum, actual)
}
```

### Pattern 3: GP WebPay DIGEST signing (server-side only)

**What:** Concatenate specified parameters in the exact order GP WebPay's spec requires, hash,
sign with the merchant's private key.
**When to use:** Every outbound redirect request and every inbound callback verification.
**Example (illustrative — confirm exact parameter order against the merchant's actual contract
spec version):**
```kotlin
// Source: GP webpay HTTP API v1.18 spec (signing section)
fun buildDigest(params: List<String>, privateKey: PrivateKey): String {
    val message = params.joinToString("|")
    val signature = Signature.getInstance("SHA1withRSA").apply {
        initSign(privateKey)
        update(message.toByteArray(Charsets.UTF_8))
    }.sign()
    return Base64.getEncoder().encodeToString(signature)
}
```

### Pattern 4: SPAYD generation (reuses existing QR pipeline)

```kotlin
// Source: qr-platba.cz format spec, using the project's existing zxing dependency
fun buildSpayd(iban: String, amount: BigDecimal, vs: String, msg: String): String =
    "SPD*1.0*ACC:$iban*AM:${amount.setScale(2)}*CC:CZK*X-VS:$vs*MSG:${msg.take(60)}"

fun toQrImage(spayd: String): ByteArray =
    // reuse the same zxing QRCodeWriter already used in PdfGenerationService (Phase 1, Plan 05)
    QRCodeWriter().encode(spayd, BarcodeFormat.QR_CODE, 300, 300).let { /* ...existing pattern... */ }
```

### Anti-Patterns to Avoid

(Restating what the project's own `ARCHITECTURE.md` already established, since Phase 2 is
exactly where the temptation to violate these is highest.)

- **Custom SAML/OIDC against NIA:** metadata rotation, XML signature validation, and LoA
  mapping are all things Keycloak already does correctly — don't reimplement any of it.
- **WebView for the *entire* payment experience without acknowledging the tradeoff:** see
  section 2.3 — it's an acceptable interpretation of the AC, but ship it as a conscious decision,
  not a default nobody examined.
- **Direct SOAP calls from the mobile app to ISDS:** backend-only, per the existing BFF pattern.
- **Hand-rolled SAML/OIDC parsing of NIA attributes in the mobile app:** the mobile app should
  only ever talk to this project's own backend/Keycloak, never to NIA directly.
- **Storing GP WebPay's merchant private key anywhere reachable by mobile/web clients:** it must
  live only in backend config/secrets.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NIA SAML/OIDC protocol handling | Custom SP/RP implementation | Keycloak identity broker | Metadata rotation, XML-dsig validation, and LoA semantics are exactly what Keycloak already handles correctly for the admin-web PKCE flow — same product, new IdP alias. |
| ISDS SOAP client | Hand-written XML/SOAP envelopes | Spring-WS/CXF `wsdl2java` codegen | WSDL revisions (the project's own research notes 3.05→3.09 churn) are handled by regenerating, not hand-maintaining XML. |
| GP WebPay signature verification | A bespoke crypto routine "close enough" to the spec | The exact DIGEST algorithm/parameter order from the version-matched spec PDF | A subtly wrong parameter order or hash algorithm produces a signature that looks plausible but silently fails verification — this is exactly the kind of thing that must match the spec byte-for-byte. |
| Device attestation verification | A client-only "looks legit" heuristic | Server-side call to Google's Play Integrity verification API / Apple's App Attest verification | The whole point of attestation is that it can't be trusted unless independently verified by the platform vendor's own service. |
| Cert pinning cert-rotation handling | A single hard-coded pin with no rotation plan | Multi-pin (leaf + intermediate) SPKI pinning, digests kept outside the compiled binary | A single stale pin after routine CA rotation bricks every installed app version until a store update ships. |

**Key insight:** every integration in this phase already has a battle-tested library or platform
feature (Keycloak, Spring-WS/CXF, zxing, Google/Apple's own verification APIs) that solves the
hard part. The engineering risk in this phase is almost entirely in **configuration correctness
and sequencing against external registration**, not in needing to invent new client code.

---

## Common Pitfalls

### Pitfall 1: Assuming NIA's protocol without checking the current SP manual
**What goes wrong:** Building a Keycloak OIDC IdP config when NIA only currently offers SAML2
for new SP onboarding (or vice versa), discovering the mismatch only when the first real test
login fails.
**Why it happens:** the project's own prior research (`STACK.md`) and this session's fresh check
disagree on which protocol(s) NIA offers — see section 1.2.
**How to avoid:** a `checkpoint:human-verify` task reading the current SeP manual PDF, before
any Keycloak IdP JSON is written.
**Warning signs:** NIA's metadata endpoint returning a 404/different content-type than the
config assumes; SZR support confirming "we don't support that profile for new SPs."

### Pitfall 2: Building 5 separate Keycloak IdPs for the 5 auth methods
**What goes wrong:** Wasted config effort, and a broken mental model that leaks into the UI
("choose your login method" screen built in this app that duplicates NIA's own selection page).
**Why it happens:** FR-02.1's "5 methods" phrasing reads like 5 separate integrations.
**How to avoid:** section 1.3 — it's one NIA IdP; NIA's hosted page does the method selection.
**Warning signs:** a plan task titled anything like "configure Bankovní identita IdP" as a
distinct item from "configure NIA IdP."

### Pitfall 3: Treating the WebView payment AC as trivially satisfied
**What goes wrong:** shipping a WebView-wrapped GP WebPay flow, discovering post-launch that
Apple/Google Pay silently fail inside the WebView and that PCI scope is larger than assumed.
**Why it happens:** the AC's wording ("v aplikaci (WebView)") sounds like a simple UI choice, not
a payment-architecture decision with PCI/SCA implications.
**How to avoid:** section 2.3 — surface the GP-WebPay-vs-Comgate tension to the PO/user as an
explicit decision before implementation, not after.
**Warning signs:** Apple/Google Pay buttons added to the UI without testing them specifically
inside the chosen WebView component on both platforms.

### Pitfall 4: Repeating the RÚIAN mistake with GP WebPay/ISDS credential defaults
**What goes wrong:** shipping a `@Value("\${gpwebpay.merchant-id:}")`-style default-empty config
the way `RuianClient`/`CzechPointClient` did, silently falling back to a non-functional stub that
passes unit tests (mocked) but does nothing real — exactly the Phase 1 failure mode.
**Why it happens:** it's the path of least resistance when credentials aren't available yet.
**How to avoid:** for GP WebPay/ISDS/NIA, fail loudly (throw at startup, or a clearly-flagged
`/actuator/health` DOWN status) if production config is missing in a production profile, rather
than silently degrading — reserve silent fallback for genuinely optional features like RÚIAN
autocomplete (where "no suggestions" is a reasonable degraded UX), not for payment/legal-delivery
paths where silent failure means a citizen's fee was never actually charged or their document
was never actually delivered.
**Warning signs:** any new client class following the exact `@Value("...:")` empty-default
pattern for a payment or legal-delivery integration.

### Pitfall 5: Ignoring that NIA test and production are fully separate
**What goes wrong:** building against a test IdP config, then discovering production requires an
entirely new IdP alias/metadata/ACS registration, treated as "just flip an environment variable."
**Why it happens:** many OIDC providers do support test/prod via config only; NIA explicitly does
not (section 1.1).
**How to avoid:** design the Keycloak IdP config to be environment-parameterized from the start
(test vs. prod alias, distinct metadata URLs), and budget a distinct "register production SP"
task, not a config toggle.

---

## Code Examples

See inline examples under "Architecture Patterns" above (Patterns 1-4). No additional
verified-from-official-docs code beyond what's shown there was confirmed this session; GP
WebPay's exact parameter concatenation order should be pulled from whichever spec version
(v1.18 vs v1.19) matches the actual merchant contract once procurement completes — do not treat
the illustrative `buildDigest` example as spec-accurate without checking against that document.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Fabricated RÚIAN endpoint (`api.ruian.cz`, guessed) | Real ČÚZK `GeocodeSOE` ArcGIS REST service, live-verified this session | N/A — was never real | Directly unblocks E2.6's RÚIAN acceptance criterion with a same-shape client swap. |
| GP WebPay/most Czech gateways: pre-PSD2 simple redirect | PSD2 RTS-mandated SCA (issuer ACS redirect) baked into the same redirect chain | PSD2 RTS enforcement (already in force for several years) | Any GP WebPay integration built today must already handle the SCA redirect leg — there's no "old" non-SCA mode to accidentally build against. |
| Certificate pinning full-cert | SPKI/public-key pinning | Long-standing industry shift, reflected in 2026 guides checked this session | Avoids the classic "cert renewed, app bricked" failure mode. |

**Deprecated/outdated:** the Phase 1 `RuianClient`'s assumption of an API-key-gated REST service
at a guessed domain — this session found the real service requires no key at all, so any config
plumbing for a RÚIAN API key can likely be removed entirely, not just repointed.

---

## Blocked on External Registration

| Item | Who must register | Expected lead time | What can be built against a mock/test-env meanwhile |
|------|--------------------|--------------------|-------------------------------------------------------|
| NIA/eIdentita production SeP accreditation | Municipality (via statutory representative's datová schránka) + SZR approval | **Unknown** — no source found states a concrete SLA; `[ASSUMED]` weeks-not-months based on this being a routine path for Czech municipalities, not confirmed | Full Keycloak IdP config + LoA mapping + attribute mappers, tested against NIA's **test environment** (czebox.cz test mailboxes) — this can start immediately, independent of production approval. |
| GP WebPay merchant account (production) | Municipality, via an acquiring-bank/Global-Payments commercial relationship (procurement) | **Unknown** — bank/procurement-dependent, not found in any technical source this session | GP WebPay's sandbox/test merchant credentials, if obtainable directly from GP WebPay/Global Payments without the full production contract (worth asking explicitly) — DIGEST signing/verification logic, SPAYD generation, and the payment state machine/audit log are all fully buildable and testable independent of a real merchant ID. |
| ISDS production API access for the municipality's mailbox | Municipality (may already have a datová schránka administratively — verify before assuming a fresh registration is needed) | **Unknown**, but likely faster if a mailbox already exists and only API/webservice access needs enabling | Full WSDL-codegen SOAP client, message parsing, ZFO storage schema, and the polling scheduler — all buildable and testable against the **VT (veřejný test)** environment's separate test mailboxes. |
| Staging VM/hosting | Whoever controls infra budget for this project (internal decision, not a third party) | Not externally gated — this is a purely internal "someone provision a VM" task, could be same-day | N/A — nothing to mock, this should just be done early since it also unblocks E2.6's Lighthouse AC. |
| Play Integrity API / App Attest enrollment | Google Play Console (Play Integrity is enabled per-app, no separate application) / Apple Developer account (App Attest capability toggle) | Low — typically self-service within existing Play Console / Apple Developer accounts already needed for app store distribution, not a new external relationship | Fully buildable now if the project already has Play Console/Apple Developer accounts (check — this is likely already true from Phase 1's CI/CD setup intent). |

---

## Confidence and Open Questions

Classification: **(a)** verified from an authoritative source with a citation this session,
**(b)** reasonable inference from available information, **(c)** unknown / needs a human with
account or legal access.

| # | Question | Classification | Detail |
|---|----------|----------------|--------|
| 1 | Does the real ČÚZK RÚIAN `GeocodeSOE` service require an API key or registration for sustained/production use beyond the free-tier terms found? | (a)/(b) mixed | Live-tested with no key this session (a); whether the "Zásady užívání dat a služeb ZÚ" terms impose a rate limit for high-volume production use was not read in full (b) — read the terms PDF before assuming unlimited free use. |
| 2 | Is NIA's SP-facing protocol SAML2, OIDC, or both, for a new municipality onboarding today? | (c) | Sources actively disagree (section 1.2); needs a direct read of the current SeP manual PDF, not further web search. |
| 3 | What is NIA/SZR's actual accreditation lead time? | (c) | No source found states a number. |
| 4 | What is GP WebPay's actual merchant-onboarding lead time and whether a sandbox account is obtainable without a full production contract? | (c) | Procurement question, not a technical one — `STATE.md` already flags this as an open question. |
| 5 | Which specific municipal acts legally require LoA High vs Substantial? | (c) | Genuine legal research gap; flagged to avoid a plan hard-coding a wrong mapping. |
| 6 | Does the municipality already hold a production ISDS mailbox, or does this need a fresh registration? | (c) | Administrative fact, not found in any technical source — check internally before treating it as a fresh external registration on the same footing as NIA/GP WebPay. |
| 7 | Exact fikce-doručení day-count and payment-record retention period (legal specifics) | (c) | `[ASSUMED]` from general knowledge, not verified against primary legal text this session — needs legal/PO confirmation, not engineering judgment. |
| 8 | Keycloak step-up authentication maturity for this exact use case (re-auth mid-session at higher LoA) | (b) | Inferred from an open Keycloak GitHub discussion questioning the idiomatic approach — not a confirmed limitation, but a real risk signal worth budgeting test time for. |
| 9 | `app_device_integrity`'s continued correctness against current Android/iOS OS versions (19-month-old release) | (b) | Verified-publisher signal is positive, but freshness is a real concern; recheck at plan time. |
| 10 | Whether GP WebPay's exact spec version in the actual merchant contract is v1.18 or v1.19 (and whether the DIGEST algorithm/parameter order differs between them) | (b) | Only v1.18 was fully retrievable this session; v1.19 was referenced only indirectly via a third-party changelog. |

---

## Recommended Sequencing

**Week 1 (do immediately, regardless of when engineering starts):** File the NIA SeP
accreditation request, initiate the GP WebPay merchant/procurement conversation, and check
whether the municipality already has an ISDS mailbox needing only API access enabled. None of
these can be sped up by code; starting them late is the single biggest schedule risk in this
phase.

**Can start immediately, no external dependency (Wave 1, parallel):**
1. **RÚIAN fix (E2.6)** — smallest, highest-confidence win; swap `RuianClient` to the real
   `GeocodeSOE` endpoint. Do this first; it's a fast, real, verifiable success.
2. **Staging deploy (E2.6)** — provision a VM, wire the real deploy step into `cd.yml`.
3. **SPAYD QR generation (E2.3, partial)** — pure logic, zero external dependency.
4. **Certificate pinning (E2.5, partial)** — zero external dependency.

**Can start against test/mock environments (Wave 2, parallel with Wave 1):**
5. **Keycloak NIA IdP scaffolding (E2.1)** — against NIA's test environment (czebox.cz mailboxes)
   once the protocol question (open question #2) is resolved via the SeP manual.
6. **ISDS SOAP client codegen + polling scaffolding (E2.4)** — against the VT test environment.
7. **GP WebPay integration logic (E2.3)** — against a sandbox merchant ID if obtainable, or built
   test-first against the documented spec if not yet available.
8. **Play Integrity/App Attest plumbing (E2.5)** — self-service, no external blocker expected.

**Depends on Wave 1/2 completing (Wave 3):**
9. **LoA-gated authorization logic (E2.1/FR-02.2)** — depends on the NIA IdP actually issuing an
   `acr` claim to test against.
10. **Payment idempotency/reconciliation (E2.3)** — depends on the GP WebPay integration shape
    being settled (especially the WebView-vs-Comgate decision).
11. **Lighthouse measurement (E2.6)** — explicitly depends on the staging deploy being real.

**Must happen before any of the above ships to production, but doesn't block development:**
12. Legal confirmation of LoA-to-act mapping, fikce-doručení day-count, and payment retention
    period (section 6) — route to the domain expert/PO, not engineering.

**Explicitly flagged for a decision, not silent implementation:**
- The GP WebPay-vs-Comgate WebView/SCA tension (section 2.3) should be resolved via
  `/gsd-discuss-phase` or an explicit user decision before Wave 2's payment work is planned in
  detail — this affects PCI scope, UX, and possibly the `STATE.md` locked-decision table itself.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Keycloak | NIA broker, all of E2.1 | ✓ (already running per Phase 1) | 26.0 (image `quay.io/keycloak/keycloak:26.0`) | — |
| Docker / docker-compose | Local dev, staging deploy | ✓ (already used throughout Phase 1) | — | — |
| ČÚZK `GeocodeSOE` RÚIAN endpoint | E2.6 | ✓ — **live-verified this session**, no key needed | ArcGIS Server v11.38 | Existing hard-coded 7-address fallback list already in `AddressAutocompleteService` |
| NIA test environment (czebox.cz) | E2.1 development | Not yet provisioned — self-service signup expected, not confirmed this session | — | Mock SAML/OIDC IdP for pure Keycloak-config unit testing |
| GP WebPay sandbox | E2.3 development | Not yet provisioned — unknown if self-service | — | Build/test signing logic against the published spec's documented digest algorithm without a live sandbox call |
| ISDS VT (test) environment | E2.4 development | Not yet provisioned — separate test mailbox needed | `ws1`/`ws2.mojedatovaschranka.cz` (VT) | — |
| Staging VM | E2.6, Lighthouse measurement | Not yet provisioned | — | None — this genuinely blocks the AC until provisioned; no code-only fallback |
| Google Play Console / Apple Developer account | E2.5 (Play Integrity / App Attest) | Likely already exists (needed for app store distribution regardless) — not directly confirmed this session | — | — |

**Missing dependencies with no fallback:**
- Staging VM — the "< 15 min deploy" and Lighthouse ACs cannot be satisfied without it.
- NIA/GP WebPay/ISDS production credentials — no fallback for shipping to real citizens, but all
  three have viable test/mock fallbacks for development (see table and section 1.5/2.1/3).

**Missing dependencies with fallback:**
- RÚIAN's existing 7-address hard-coded list remains a reasonable fallback for the rare case the
  live `GeocodeSOE` endpoint is unreachable.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | JUnit5 + Kotest 5.9.1 + Mockito-Kotlin (already established, `apps/backend/backend/build.gradle.kts`) |
| Backend integration | Testcontainers (Postgres) 1.19.8, already used for Submission persistence tests |
| Admin-web / Citizen-web framework | Vitest (`vitest.config.ts` present in both apps) + axe-core for a11y |
| Mobile framework | `flutter_test` + `integration_test` (declared in `pubspec.yaml`) |
| Quick run command (backend) | `cd apps/backend && ./gradlew test` |
| Quick run command (admin-web/citizen-web) | `npm run test` (per-app) |
| Quick run command (mobile) | `flutter test` |
| Full suite / CI gate | Existing `ci.yml` (build+test on every PR, per Phase 1's revised AC) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| FR-02.1/.3 | NIA login issues a JWT Keycloak's resource server accepts, carrying expected claims | integration | `./gradlew test --tests "*NiaBrokerIntegrationTest*"` | ❌ Wave 0 — new test class needed |
| FR-02.2 | LoA-gated endpoint rejects a Substantial-only token for a High-required action | unit | `./gradlew test --tests "*LoaAuthorizationTest*"` | ❌ Wave 0 |
| FR-05.1 | SPAYD string matches the spec's format for a known input | unit | `./gradlew test --tests "*SpaydGeneratorTest*"` | ❌ Wave 0 |
| FR-05.2 | GP WebPay DIGEST signs/verifies round-trip correctly against a test key pair | unit | `./gradlew test --tests "*GpWebPayDigestTest*"` | ❌ Wave 0 |
| FR-05.5 | A duplicate payment callback (same idempotency key) does not double-charge/double-record | integration | `./gradlew test --tests "*PaymentIdempotencyTest*"` | ❌ Wave 0 |
| FR-06.3 | ISDS delivery-evidence retrieval stores the full signed ZFO blob | integration | `./gradlew test --tests "*IsdsDeliveryEvidenceTest*"` | ❌ Wave 0 |
| E2.6-RÚIAN | Live `suggest()` call against the real ČÚZK endpoint returns ≥1 real result for a known query | integration (live, not mocked — the exact gap Phase 1's verification flagged) | manual/CI live-call smoke test | ❌ Wave 0 — critically, **must not be mocked-only** given Phase 1's precedent |
| E2.5 | Cert-pinning rejects a connection presenting an untrusted/wrong cert | widget/unit | `flutter test test/security/cert_pinning_test.dart` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the relevant per-app quick-run command above.
- **Per wave merge:** full backend `./gradlew test` + both web apps' `npm run test` + `flutter test`.
- **Phase gate:** full suite green, **plus at least one genuinely live (non-mocked) call** to
  each of the RÚIAN endpoint, the NIA test environment, and the ISDS VT environment before
  `/gsd-verify-work` — Phase 1's verification report exists precisely because "tests pass" and
  "the real integration works" were allowed to diverge silently; this phase should not repeat
  that pattern for its higher-stakes integrations.

### Wave 0 Gaps
- [ ] `NiaBrokerIntegrationTest` — covers FR-02.1/.3
- [ ] `LoaAuthorizationTest` — covers FR-02.2
- [ ] `SpaydGeneratorTest` — covers FR-05.1
- [ ] `GpWebPayDigestTest` — covers FR-05.2
- [ ] `PaymentIdempotencyTest` — covers FR-05.5
- [ ] `IsdsDeliveryEvidenceTest` — covers FR-06.3
- [ ] A live (non-mocked) RÚIAN smoke test — explicitly required given Phase 1's mock-blindspot history
- [ ] `test/security/cert_pinning_test.dart` — covers E2.5

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | Yes | Keycloak + NIA broker; do not add a parallel password-based auth path for citizens (clerks already use Keycloak password auth per Phase 1 — that pattern is not extended to citizens, who go through NIA). |
| V3 Session Management | Yes | Existing Keycloak session config (`accessTokenLifespan`, `ssoSessionIdleTimeout` already set in `realm-portal.json`) — extend, don't replace. |
| V4 Access Control | Yes | LoA-gated `@PreAuthorize` on sensitive endpoints, extending the existing `hasRole("CLERK")` pattern in `SecurityConfig.kt`. |
| V5 Input Validation | Yes | SPAYD field-length/character-set validation (section 2.2) before QR generation; GP WebPay callback parameter validation before trusting any payment-state transition. |
| V6 Cryptography | Yes | GP WebPay DIGEST signing/verification — never hand-roll the algorithm choice; match the spec exactly (SHA1withRSA or whatever the contracted spec version specifies — confirm, don't assume, per open question #10). |
| V9 Communications | Yes | Certificate pinning (section 4.1) is exactly a V9 control. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Forged/replayed GP WebPay callback (fake "payment succeeded" webhook) | Spoofing/Tampering | Verify the response DIGEST server-side before trusting any state transition; never trust a client-supplied "payment succeeded" flag. |
| Double-charge via retried/duplicated payment callback | Tampering (of business state) | Idempotency key + immutable payment audit log (section 2.4). |
| NIA assertion replay | Spoofing | Keycloak's SAML/OIDC broker already validates assertion signatures and (for SAML) `NotOnOrAfter`/audience restrictions — don't disable signature validation for convenience during testing and forget to re-enable it. |
| Forged device-attestation token | Spoofing | Server-side verification against Google's/Apple's own APIs (section 4.2) — never trust a client-reported "integrity: true" without independent verification. |
| Certificate-pin staleness causing a hard app outage (self-inflicted DoS) | (operational, not classic STRIDE) | Multi-pin + externalized pin storage (section 4.1). |
| ISDS ZFO tampering claims (a citizen disputes delivery) | Repudiation | Store the full signed ZFO blob (not just extracted fields) so the original ISDS signature can be independently re-verified if disputed. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | NIA/SZR accreditation lead time is "weeks, not months" | 1.1 | Schedule slip if actually months; mitigated by filing the request in week 1 regardless. |
| A2 | The `/FPSTS/oauth2/...` endpoints in the project's prior research and the SAML-only description found this session both describe real, currently-available NIA capabilities (ADFS-style multi-protocol STS) | 1.2 | If NIA has actually deprecated one protocol, a Keycloak IdP built against it will simply fail to connect — caught early by a test-environment login attempt, not a silent failure. |
| A3 | Which acts require LoA High vs Substantial follows a "payments/personal data = High" rule of thumb | 1.4 | Could be over- or under-restrictive versus the actual legal requirement; needs domain-expert confirmation before shipping. |
| A4 | GP WebPay's redirect-in-WebView approach satisfies the AC's intent, not just its literal wording | 2.3 | If the PO/user intended a fully native experience, this "satisfies the letter" resolution may be rejected — flagged explicitly as a decision point, not assumed silently. |
| A5 | Fikce doručení is 10 days (Act 300/2008 Sb.) | 6 | If wrong, any SLA/timer logic derived from it is legally incorrect — must be confirmed before encoding as a business rule. |
| A6 | Payment record retention period (5-10 years, exact figure unconfirmed) | 6 | A too-short retention could violate accounting law; too-long could conflict with GDPR data-minimization — needs legal confirmation before any deletion/archival job is built. |
| A7 | `app_device_integrity` (19-month-old release) still functions correctly against current Android/iOS versions | 4.2 | If broken by an OS update, attestation silently fails — mitigated by recommending a soft-fail design (section 4.2) rather than a hard gate. |
| A8 | The municipality's GP WebPay merchant contract will use spec v1.18's parameter/digest shape (v1.19 differences unconfirmed) | 2.1 | If the actual contract is v1.19 with different signing details, the digest implementation must be corrected against that document, not v1.18's. |

---

## Open Questions

1. **Which protocol does NIA actually expose for new SP onboarding today (SAML2, OIDC, or
   both)?**
   - What we know: the project's prior research assumed OIDC with concrete endpoints; a fresh
     check this session found an authoritative-looking reference describing SAML2 only.
   - What's unclear: whether both are genuinely available, whether one has been deprecated, or
     whether the sources are simply describing different eras/profiles of the same system.
   - Recommendation: read the current `SeP_PriruckaKvalifikovanehoPoskytovatele.pdf` before
     writing the Keycloak IdP config; add a `checkpoint:human-verify` task for this specifically.

2. **What is the actual GP WebPay-vs-Comgate decision for mobile card payments?**
   - What we know: GP WebPay is locked in `STATE.md`; Comgate was the project's own prior
     recommendation specifically because of the WebView/SCA/PCI-scope issues GP WebPay has.
   - What's unclear: whether the user/PO, seeing this tension spelled out, still wants GP WebPay
     for consistency with QR-platba/citizen-web, or wants to revisit for mobile specifically.
   - Recommendation: surface explicitly in `/gsd-discuss-phase` before planning payment tasks in
     detail; do not let the planner silently default to one or the other.

3. **Does the municipality already hold a production ISDS mailbox?**
   - What we know: Czech municipalities are generally legally required to have one already.
   - What's unclear: whether this project's target municipality already has API/webservice
     access enabled on an existing mailbox, or needs a fresh registration.
   - Recommendation: a same-day administrative check, before treating ISDS as equally
     "blocked" as NIA/GP WebPay in sprint planning.

4. **What specific legal LoA-to-act mapping applies?**
   - What we know: eIDAS defines low/substantial/high; NIA's state methods span
     substantial-to-high.
   - What's unclear: the Czech-specific legal mapping of which municipal acts require which
     level.
   - Recommendation: route to the domain expert/PO role in the project's team structure; do not
     let engineering infer this from general eIDAS reading alone.

---

## Sources

### Primary (HIGH confidence)
- `https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer/exts/GeocodeSOE` — live-verified
  this session via WebFetch (real JSON service description + real `suggest` results for Broumy).
- Repo files read directly this session: `SecurityConfig.kt`, `keycloak/realm-portal.json`,
  `docker-compose.yml`, `.github/workflows/cd.yml`, `RuianClient.kt`, `CzechPointClient.kt`,
  `apps/backend/backend/build.gradle.kts`, `apps/mobile/pubspec.yaml`, `dio_client.dart`.

### Secondary (MEDIUM confidence)
- `https://nia.otevrenamesta.cz/sep-info` — SeP registration process, SAML2 protocol
  description, test-environment (czebox.cz) separation from production.
- `https://qr-platba.cz/pro-vyvojare/specifikace-formatu/` — SPAYD format specification.
- `https://www.gpwebpay.cz/en/PSD2RTS.html` + `GP_webpay_HTTP_API_v1.18_EN.pdf` — GP WebPay
  PSD2/SCA and HTTP API protocol shape.
- `https://github.com/xrosecky/JAVA_ISDS` — ISDS Java library assessment (license, maintenance
  signal).
- `https://pub.dev/packages/app_device_integrity`, `https://pub.dev/packages/http_certificate_pinning`
  — Flutter package version/publisher checks.
- `https://info.identita.gov.cz/idp/` — NIA login method enumeration.
- Keycloak GitHub discussions (`keycloak/keycloak#10120`, `#49276`) and
  `https://blog.please-open.it/posts/acr/` — ACR/LoA mapping mechanics and step-up-auth maturity.
- Project's own prior research: `.planning/research/ARCHITECTURE.md`, `STACK.md`, `FEATURES.md`,
  `ux-research.md` — treated as MEDIUM (was itself research-generated, not primary-source
  verified in all places, e.g. the OIDC-vs-SAML discrepancy this session surfaced).

### Tertiary (LOW confidence)
- General WebSearch snippets on Czech municipal ISDS registration lead time, payment-gateway
  comparison articles (arecenze.cz, etc.), and GDPR/retention specifics not re-verified against
  primary legal texts this session.

---

## Metadata

**Confidence breakdown:**
- RÚIAN replacement: HIGH — live-verified this session, the strongest finding in the phase.
- ISDS/payments protocol shape: MEDIUM — well-documented officially, but exact spec-version and
  merchant-specific details need confirmation against the actual contract.
- NIA registration/protocol: MEDIUM-LOW — genuine unresolved ambiguity found and flagged, not
  papered over.
- Legal/compliance specifics: LOW — explicitly marked `[ASSUMED]`, needs legal sign-off.
- Staging deployment: HIGH — straightforward, low-risk, well-precedented pattern.

**Research date:** 2026-08-02
**Valid until:** ~30 days for the technical/protocol findings (RÚIAN endpoint, SPAYD, ISDS SOAP
shape are stable, slow-moving standards); treat the NIA protocol ambiguity and any registration
lead-time assumptions as needing re-confirmation at plan time regardless of date, since they
were unresolved rather than time-sensitive.
