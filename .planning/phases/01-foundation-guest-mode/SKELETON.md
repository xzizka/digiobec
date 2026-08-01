# Walking Skeleton Architecture Decisions — Phase 1: Foundation & Guest Mode

**Project:** Municipal Citizen Portal (Občanský portál obce)
**Phase:** 01-foundation-guest-mode
**Date:** 2026-08-01
**Status:** ESTABLISHED — These decisions are binding for all subsequent phases

---

## 1. Technology Stack (Locked)

| Layer | Technology | Version | Decision ID |
|-------|------------|---------|-------------|
| **Mobile** | Flutter | 3.24+ | D-01 |
| **Backend** | Spring Boot + Kotlin | 3.3+ | D-02 |
| **Admin Web** | React + TypeScript + Vite | 18+ | D-03 |
| **Database** | PostgreSQL | 16+ | D-04 |
| **IAM** | Keycloak | 26.x | D-05 |
| **Payments** | Comgate Mobile Checkout SDK | Latest | D-06 |
| **CI/CD** | GitHub Actions + Fastlane | - | D-07 |
| **Containerization** | Docker / Podman | Latest | D-08 |
| **Orchestration** | Kubernetes / k3s | 1.29+ | D-09 |

**Source:** `.planning/config.json`, `.planning/research/STACK.md`

---

## 2. Architectural Patterns (Locked)

| Pattern | Application | Decision ID |
|---------|-------------|-------------|
| **Backend-for-Frontend (BFF)** | All eGov integrations (ISDS, ISVS, RÚIAN, Czech POINT) proxied through Spring Boot | D-10 |
| **Keycloak Identity Broker** | eIdentita (NIA) via OIDC; Keycloak handles SAML/OIDC complexity | D-11 |
| **Offline-First (Drift + SQLCipher)** | Local cache for messages, forms, payments; background sync | D-12 |
| **Comgate via Platform Channels** | Native Android/iOS SDK bridged to Flutter; PCI DSS SAQ-A scope | D-13 |
| **API Gateway / Actuator Health** | `/actuator/health` with custom DB/Keycloak indicators | D-14 |
| **Liquibase Migrations** | Version-controlled DB schema; contexts for test/prod | D-15 |

**Source:** `.planning/research/ARCHITECTURE.md` (Patterns 1-4)

---

## 3. Project Structure (Locked)

```
municipal-citizen-portal/
├── mobile/                          # Flutter app
│   ├── lib/
│   │   ├── core/                    # Shared: network, health, theme, a11y
│   │   ├── features/                # Feature modules (submission, address, auth, etc.)
│   │   │   ├── submission/
│   │   │   ├── address/
│   │   │   └── ...
│   │   ├── theme/                   # gov.cz tokens, themes
│   │   └── components/              # Shared gov.cz components
│   ├── test/                        # Unit + widget tests
│   └── integration_test/            # Driver tests (a11y, e2e)
├── backend/                         # Spring Boot BFF
│   ├── src/main/kotlin/cz/obec/portal/
│   │   ├── health/                  # Actuator extensions
│   │   ├── submission/              # Guest submission domain
│   │   ├── ruian/                   # RÚIAN + Czech POINT
│   │   ├── admin/                   # Clerk admin API
│   │   └── config/                  # Security, OpenAPI, WebClient
│   ├── src/main/resources/
│   │   ├── db/changelog/            # Liquibase migrations
│   │   └── templates/               # PDF templates (FO)
│   └── src/test/                    # Integration tests (Testcontainers)
├── admin-web/                       # React admin portal
│   ├── src/
│   │   ├── features/
│   │   │   ├── admin/               # Clerk dashboard
│   │   │   ├── submissions/         # Shared submission components
│   │   │   └── address/             # Shared address components
│   │   ├── components/ui/           # gov.cz React components
│   │   ├── theme/                   # CSS variables from tokens
│   │   └── api/                     # Axios + react-query
│   └── test/                        # Vitest + testing-library
├── docker-compose.yml               # Local dev stack
├── .github/workflows/               # CI/CD
│   ├── ci.yml                       # Build, test, lint all apps
│   └── a11y.yml                     # Accessibility gate
└── .planning/                       # GSD planning artifacts
```

**Convention:** Feature-first organization. Shared code in `core/` (mobile) or `components/ui/` (web). No circular dependencies between features.

---

## 4. API Contracts (Locked)

### 4.1 Health & Discovery
```
GET  /actuator/health                    → { status, components: {db, keycloak, ...} }
GET  /actuator/info                      → { build, git, version }
GET  /api/forms/{formKey}                → JSON Schema + UI Schema
```

### 4.2 Guest Submission
```
POST /api/submissions                    → { trackingCode, status: "SUBMITTED" }
GET  /api/submissions/{trackingCode}     → Submission detail
GET  /api/submissions/{trackingCode}/confirmation  → HTML confirmation page
GET  /api/submissions/{trackingCode}/pdf             → PDF/A-1b binary
```

### 4.3 Address & Czech POINT
```
GET  /api/addresses/suggest?q={query}&limit=10  → AddressSuggestion[]
GET  /api/czech-points/nearby?lat={lat}&lon={lon}&radius=5000  → CzechPoint[]
```

### 4.4 Admin (ROLE_CLERK required)
```
GET    /api/admin/submissions?page=0&size=20&status=...&formKey=...&dateFrom=...&dateTo=...&q=...
GET    /api/admin/submissions/{id}
PATCH  /api/admin/submissions/{id}/state     → { newState, comment }
GET    /api/admin/submissions/export         → text/csv (streaming)
```

**OpenAPI Spec:** Generated by springdoc-openapi at `/v3/api-docs` → `/swagger-ui.html`

---

## 5. Data Model (Locked)

### 5.1 Submission (PostgreSQL)
```sql
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code   UUID NOT NULL UNIQUE DEFAULT uuid_generate_v7(),  -- time-ordered, unguessable
    form_key        VARCHAR(100) NOT NULL,                            -- e.g. "vypis-z-rejstriku"
    form_data       JSONB NOT NULL,                                   -- validated against schema
    status          VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',         -- SUBMITTED, PROCESSING, COMPLETED, REJECTED, NEEDS_INFO
    guest_contact   JSONB,                                            -- {email, phone}
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_submissions_tracking ON submissions(tracking_code);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_form_key ON submissions(form_key);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_form_data_gin ON submissions USING GIN(form_data);
```

### 5.2 Audit Log (Append-Only)
```sql
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    submission_id   UUID NOT NULL REFERENCES submissions(id),
    actor_type      VARCHAR(20) NOT NULL,     -- 'CLERK', 'SYSTEM', 'CITIZEN'
    actor_id        VARCHAR(100),             -- clerk user_id or 'anonymous'
    action          VARCHAR(50) NOT NULL,     -- 'STATE_CHANGE', 'PDF_DOWNLOAD', ...
    old_value       JSONB,
    new_value       JSONB,
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_submission ON audit_log(submission_id, created_at);
```

### 5.3 State Machine (Locked Transitions)
```
SUBMITTED → PROCESSING
PROCESSING → COMPLETED
PROCESSING → REJECTED
PROCESSING → NEEDS_INFO
NEEDS_INFO → PROCESSING
```
**No other transitions allowed.** Enforced in `AdminSubmissionService`.

---

## 6. Authentication & Authorization (Locked)

| Actor | Method | Token | Scopes/Roles |
|-------|--------|-------|--------------|
| **Guest (Citizen)** | None (anonymous) | — | Public endpoints only |
| **Clerk (Admin)** | Keycloak OIDC (PKCE) | JWT (RS256) | `ROLE_CLERK` |
| **Backend → Keycloak** | Service account | Client credentials | `admin-cli` |
| **Backend → eIdentita (Phase 2)** | Keycloak Identity Broker | SAML2/OIDC | LoA Substantial/High |

**Keycloak Realm:** `obec-portal`
- Client `mobile-app`: public, PKCE, redirect `obecportal://callback`
- Client `admin-web`: confidential, PKCE, redirect `https://admin.obec.cz/callback`
- Client `backend-service`: service account, client credentials

---

## 7. Accessibility Baseline (Locked — WCAG 2.1 AA)

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| **Contrast 4.5:1** | gov.cz tokens: `--color-text-primary` on `--color-background` | axe-core CI gate |
| **Focus Visible** | `outline: 3px solid var(--color-focus)` on all interactive | axe-core + manual |
| **200% Zoom** | Fluid typography `clamp()`, `rem` units, CSS Grid/Flexbox | CI: Chrome 200% zoom test |
| **Screen Reader** | Semantic HTML/Flutter semantics; `aria-label`, `aria-describedby` | NVDA/VoiceOver manual |
| **Czech Formats** | `1 234,56 Kč`, `DD. MM. YYYY`, `lang="cs"` | Unit tests + manual |
| **Diacritics** | UTF-8 everywhere; DejaVu Sans font | PDF generation test |

**CI Gate:** `.github/workflows/a11y.yml` runs axe-core on Flutter web build + React build. **Fail on any AA violation.**

---

## 8. Czech eGov Integration Contracts (Locked for Phase 1)

| Integration | Protocol | Environment | Phase |
|-------------|----------|-------------|-------|
| **RÚIAN (Addresses)** | REST (ČÚZK) | Test/Prod API key | 1 (Plan 04) |
| **Czech POINT** | REST (MVČR) | Test/Prod API key | 1 (Plan 04) |
| **ISDS (Datové schránky)** | SOAP 1.1/1.2 + MTOM | VT (ws1/ws2.mojedatovaschranka.cz) | 2 |
| **ISVS (Act Registry)** | REST | Test/Prod (AIS cert required) | 2 |
| **eIdentita (NIA)** | OIDC via Keycloak | tnia.identitaobcana.cz (test) | 2 |
| **Payments (Comgate)** | Native SDK + REST | Test/Prod merchant ID | 2 |

**Anti-Pattern Enforcement:** Direct SOAP from mobile = FORBIDDEN. All eGov via BFF.

---

## 9. CI/CD Pipeline (Locked)

### 9.1 GitHub Actions Workflows
```yaml
# .github/workflows/ci.yml
jobs:
  backend:
    - gradle test (Testcontainers: postgres, keycloak)
    - gradle build
    - dependency-check (OWASP)
  mobile:
    - flutter pub get
    - flutter analyze (strict)
    - flutter test (coverage > 80%)
    - flutter build apk --debug (artifact)
  admin-web:
    - npm ci
    - npm run lint (eslint + jsx-a11y)
    - npm run test (vitest + axe-core)
    - npm run build (artifact)

# .github/workflows/a11y.yml
jobs:
  a11y-flutter:
    - flutter build web
    - axe-core CLI on build/web
  a11y-react:
    - npm run build
    - axe-core CLI on dist/
```

### 9.2 Quality Gates (Blocking)
- ✅ All tests pass
- ✅ 0 lint errors (strict)
- ✅ 0 axe-core AA violations
- ✅ OWASP dependency-check: 0 critical/high
- ✅ Build artifacts uploaded

---

## 10. Local Development (Locked)

### 10.1 docker-compose.yml Services
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: obec_portal
      POSTGRES_USER: portal
      POSTGRES_PASSWORD: portal
    ports: ["5432:5432"]
    healthcheck: pg_isready -U portal -d obec_portal

  keycloak:
    image: quay.io/keycloak/keycloak:26
    command: start-dev --import-realm
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    ports: ["8080:8080"]
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
    depends_on: [postgres]

  backend:
    build: ./backend
    ports: ["8081:8080"]
    environment:
      SPRING_PROFILES_ACTIVE: dev
      POSTGRES_HOST: postgres
      KEYCLOAK_URL: http://keycloak:8080
    depends_on:
      postgres: {condition: service_healthy}
      keycloak: {condition: service_started}

  admin-web:
    build: ./admin-web
    ports: ["3000:80"]
    depends_on: [backend]
```

### 10.2 Startup Sequence
```bash
# 1. Start infrastructure
docker-compose up -d postgres keycloak

# 2. Wait for health (≈30s)
curl -f http://localhost:8080/actuator/health  # keycloak
curl -f http://localhost:8081/actuator/health  # backend

# 3. Start backend + admin-web
docker-compose up -d backend admin-web

# 4. Run Flutter on host (not containerized)
cd mobile && flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8081
```

---

## 11. Security Hardening Baseline (Locked)

| Control | Implementation | Phase |
|---------|----------------|-------|
| **TLS 1.3** | Terminated at ingress (nginx/Traefik); mTLS backend→Keycloak in prod | 1 |
| **Certificate Pinning** | dio/OkHttp pinning for RÚIAN, Czech POINT, Comgate APIs | 1 |
| **Rate Limiting** | Gateway: 100 req/min/IP (health), 30/min (autocomplete), 10/min (submit) | 1 |
| **Request Size Limit** | 1MB for submissions; 10MB for attachments (Phase 2) | 1 |
| **Security Headers** | CSP, HSTS, X-Frame-Options, Referrer-Policy via Spring Security | 1 |
| **Dependency Scanning** | OWASP dependency-check in CI; slopcheck for [ASSUMED]/[SUS] | 1 |
| **Secrets Management** | GitHub Actions secrets; Doppler/HashiCorp Vault for prod | 1 |

---

## 12. Observability Baseline (Locked)

| Signal | Implementation |
|--------|----------------|
| **Logs** | Structured JSON (logback-spring); correlation ID via `X-Request-ID` |
| **Metrics** | Micrometer + Prometheus (`/actuator/prometheus`); custom: submission.count, pdf.generation.duration |
| **Traces** | OpenTelemetry Java agent → Tempo/Jaeger (Phase 2) |
| **Alerts** | PrometheusRule: health DOWN > 1min, submission rate drop > 50%, PDF p95 > 5s |

---

## 13. Decision Registry (Reference)

| ID | Decision | Rationale | Reversible? |
|----|----------|-----------|-------------|
| D-01 | Flutter for mobile | Single codebase, gov.cz web components adaptable, team hiring | No (major rewrite) |
| D-02 | Spring Boot + Kotlin | Czech enterprise ecosystem, Keycloak native, team expertise | No |
| D-03 | React + TS for admin | Separate team possible, rich data grid ecosystem | No |
| D-04 | PostgreSQL + JSONB | Flexible forms, fulltext, mature, no vendor lock-in | Yes (with migration) |
| D-05 | Keycloak for IAM | Battle-tested eIdentita broker, MFA, federation | No |
| D-06 | Comgate SDK | Only Czech provider with native mobile SDK + Apple/Google Pay | Yes (but PCI scope changes) |
| D-07 | GitHub Actions | Free for public, good Flutter/Fastlane support | Yes |
| D-08 | Docker/Podman | Standard, rootless, multi-arch | Yes |
| D-09 | k3s for orchestration | Lightweight, GitOps ready, self-hosted or cloud | Yes |
| D-10 | BFF pattern | Isolates SOAP/WS complexity from mobile | No (architectural) |
| D-11 | Keycloak broker | Avoids custom SAML/OIDC implementation | No |
| D-12 | Drift + SQLCipher | SQLCipher encryption, migrations, reactive, compile-safe | Yes (Isar alternative) |
| D-13 | Platform channels | Keeps card data out of Flutter (PCI SAQ-A) | No (PCI requirement) |
| D-14 | Actuator health | Standard Spring Boot ops interface | No |
| D-15 | Liquibase | Version-controlled, rollback, contexts | Yes (Flyway alternative) |

---

## 14. Handoff to Subsequent Phases

### Phase 2 (Auth & Payments) MUST:
- Extend Keycloak realm with eIdentita identity provider (NIA OIDC/SAML2)
- Implement LoA step-up flow (Substantial → High)
- Integrate Comgate Mobile Checkout SDK via platform channels
- Add payment domain: Payment, PaymentMethod, Receipt entities
- Maintain all Phase 1 contracts (health, submission, address APIs unchanged)

### Phase 3 (Case Mgmt) MUST:
- Extend Submission with timeline, messages, attachments
- Add ISDS client (Spring WS) for message send/receive
- Implement push notifications (FCM/APNs) via BFF
- Add GDPR dashboard endpoints
- Maintain Phase 1-2 contracts

### Phase 4 (Services) MUST:
- Add municipal service domains (dogs, waste, water, permits)
- Integrate ISVS act registry for form prefill
- Implement OCR for water meter (ML Kit)
- Maintain all prior contracts

### Phase 5 (Federation) MUST:
- Implement Citizen Portal API federation
- Add multi-tenant (RLS or schema-per-tenant)
- Build Clerk Dashboard enhancements
- Maintain all prior contracts

---

## 15. Verification Checklist (Phase 1 Complete)

- [ ] `docker-compose up -d` → all 4 services healthy
- [ ] `curl localhost:8081/actuator/health` → UP + db + keycloak
- [ ] `open http://localhost:3000` → Admin web loads, health green
- [ ] `flutter run -d chrome` → Mobile web shows health check
- [ ] Guest submits "Žádost o informace" → gets tracking code → PDF downloads
- [ ] RÚIAN autocomplete works for "Václavské nám" → selects → form fills
- [ ] Czech POINT locator shows 5 nearest points on map + list
- [ ] Admin clerk logs in → sees submission → changes state → CSV exports
- [ ] CI pipeline: push → all 3 apps build, test, lint, a11y pass
- [ ] axe-core: 0 AA violations on Flutter web + React build
- [ ] PDF validation: verapdf confirms PDF/A-1b compliance
- [ ] QR code scans to verification URL

---

**This SKELETON.md is the architectural contract for Phase 1. All subsequent phases MUST honor these decisions without renegotiation. Changes require explicit ADR in `.planning/adr/`.**