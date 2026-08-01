# Municipal Citizen Portal (Občanský portál obce)

Digitální komunikační kanál mezi občanem a obecním úřadem – kompletní mobilní aplikace pro agendu, platby a komunikaci.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | Flutter 3.24+ (Material 3, Riverpod, go_router, Drift/SQLCipher) |
| **Backend** | Spring Boot 3.3 + Kotlin (PostgreSQL, Liquibase, OpenAPI, Keycloak) |
| **Admin Web** | React 18 + TypeScript + TanStack Query + Vite |
| **CI/CD** | GitHub Actions + Docker |
| **Database** | PostgreSQL 16 + JSONB |
| **Auth** | Keycloak 26.x (eIdentita OIDC federation) |
| **Payments** | Comgate Mobile Checkout SDK |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Flutter   │────▶│  Spring Boot     │────▶│ PostgreSQL  │
│   Mobile    │     │  BFF / API       │     │  16 + JSONB │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌───────────┐    ┌───────────┐
              │  Keycloak │    │  Comgate  │
              │  (Auth)   │    │ (Payments)│
              └───────────┘    └───────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Flutter 3.24+
- JDK 21
- Node.js 20+

### One-Command Local Development

```bash
# Start all services (PostgreSQL, Keycloak, Backend, Admin Web)
docker-compose up -d

# Backend (in separate terminal)
cd apps/backend && ./gradlew :backend:bootRun

# Admin Web (in separate terminal)
cd apps/admin-web && npm run dev

# Mobile (in separate terminal)
cd apps/mobile && flutter run
```

### Services
- **Backend API**: http://localhost:8081
- **OpenAPI Spec**: http://localhost:8081/api/v3/api-docs
- **Admin Web**: http://localhost:3000
- **Keycloak**: http://localhost:8080 (admin/admin)
- **PostgreSQL**: localhost:5432 (portal/portal)

## Project Structure

```
municipal-citizen-portal/
├── apps/
│   ├── mobile/          # Flutter application
│   ├── backend/         # Spring Boot application
│   │   └── backend/     # Main module
│   └── admin-web/       # React admin application
├── .github/workflows/   # CI/CD pipelines
├── .planning/           # GSD planning artifacts
├── docker-compose.yml   # Local development stack
├── nx.json              # Nx workspace config
└── package.json         # Root workspace config
```

## Development Workflow

1. **Planning**: `/gsd-plan-phase <phase>` → creates PLAN.md
2. **Execution**: `/gsd-execute-phase <phase>` → implements plans
3. **Verification**: `/gsd-verify-work <phase>` → UAT validation
4. **Review**: `/gsd-code-review <phase>` → code quality
5. **Ship**: `/gsd-ship <phase>` → PR creation

## Key Features (MVP)

- **Guest Submission**: Podání žádostí bez registrace (48h window pro eIdentita)
- **eIdentita Login**: 5 metod (Bankovní identita, Datová schránka, eObčan, IČO, Občanský průkaz)
- **Payments**: QR platba + GP WebPay / Comgate (karta, Apple/Google Pay)
- **Case Management**: Timeline, chat s úředníkem, SLA sledování
- **Notifications**: Push, e-mail, SMS, Datové schránky (ISDS)
- **GDPR Dashboard**: Export, oprava, výmaz, přenositelnost
- **Accessibility**: WCAG 2.1 AA (zákon 99/2019 Sb.)

## Czech eGov Integrations

- **eIdentita (NIA)**: OIDC federation via Keycloak
- **Datové schránky (ISDS)**: SOAP client for message receive/send
- **ISVS**: Registry of acts, form prefill from registries
- **RÚIAN**: Address autocomplete via ČÚZK API
- **Czech POINT**: Assisted channel locator

## License

Proprietary - Municipal use only.