# Technology Stack: Czech eGovernment Integrations

**Project:** Municipal Citizen Portal (Občanský portál obce)
**Researched:** 2026-07-31

## Recommended Stack

### Core Identity & Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Keycloak** | 26.x | IAM / OIDC Provider | Central auth, supports OIDC/SAML, integrates with eIdentita as identity broker, MFA, user federation |
| **eIdentita (NIA)** | Current | National eIDAS node | LoA Substantial/High via OIDC `acr_values`, SAML2, WS-Federation; test env: `tnia.identitaobcana.cz` |
| **MojeID** | Current | Backup IdP for NIA pairing | OIDC/SAML2, supports NIA pairing for LoA Substantial/High, widely adopted by citizens |

### Datové schránky (ISDS) Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **SOAP Client (Spring WS / Apache CXF)** | 4.x / 4.x | ISDS web services consumer | WSDL-first code generation, handles SOAP 1.1 (classic) and SOAP 1.2 + MTOM/XOP (VoDZ) |
| **ISDS Test Environment** | VT (Veřejný test) | Development/testing | `ws1.mojedatovaschranka.cz` (classic), `ws2.mojedatovaschranka.cz` (VoDZ) |
| **ISDS Production** | PROD | Production | `ws1.mojedatovaschranka.cz` / `ws1c.mojedatovaschranka.cz` (cert), `ws2` / `ws2c` for VoDZ |

### ISVS / Registry Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **ISVS REST Client (Spring WebClient / OpenFeign)** | 3.x | Registry of acts, form prefill | JSON/REST, CzechVoc terminology, RÚIAN address lookup via ISZR |
| **eGON / ISZR Services** | Current | Basic registries access | Requires AIS registration in ISVS + SZR certification; endpoint: `https://www.szrcr.cz/cs/sluzby/spravci-a-vyvojari` |

### Payment Gateway

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Comgate Mobile Checkout SDK** | Latest | Native in-app payments | **Only Czech provider with native Android/iOS SDK**; Apple Pay, Google Pay, 3DS in-app; card form; PCI DSS SAQ-A scope |
| **Comgate REST API** | v2.0 | Server-side payment management | Refunds, status checks, webhook notifications, PUSH payments (payment links + QR) |
| **QR Platba (Czech Banking Standard)** | ČNB standard | Bank transfer via QR | Embedded in Comgate/GoPay/GP webpay; auto-detected in payment gateway |

### Mobile Application (Flutter)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Flutter** | 3.24+ | Cross-platform UI | Single codebase Android/iOS, Material 3 / Cupertino, strong accessibility support |
| **Drift (sqlcipher)** | 2.x | Local offline database | SQLCipher encryption, type-safe queries, migrations, reactive streams |
| **dio** | 5.x | HTTP client | Interceptors, retry, certificate pinning, OpenAPI code generation |
| **flutter_secure_storage** | 9.x | Keychain/Keystore | Biometric auth, token storage, certificate pinning config |
| **Comgate SDK (Platform Channels)** | Latest | Native payment UI | Android (Kotlin) + iOS (Swift) via MethodChannel / Pigeon |
| **axe-core / flutter_test** | Latest | Accessibility testing | Automated WCAG 2.1 AA regression, semantics verification |

### Backend (Spring Boot)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Spring Boot** | 3.3+ | Application framework | Kotlin, GraalVM native image ready, Spring Security OIDC client |
| **Spring WebFlux / WebClient** | 6.x | Reactive HTTP client | Non-blocking ISDS/ISVS calls, backpressure, retry/timeout policies |
| **PostgreSQL** | 16+ | Primary database | JSONB for flexible eGov payloads, advisory locks for distributed coordination |
| **Liquibase** | 4.x | DB migrations | Version-controlled, rollback support, contexts for test/prod |
| **Spring Doc OpenAPI** | 2.x | API documentation | Generates OpenAPI 3.1 for frontend contract |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Docker / Podman** | Latest | Containerization | Multi-arch builds, rootless, security |
| **Kubernetes / k3s** | 1.29+ | Orchestration | Self-hosted or cloud, GitOps via ArgoCD/Flux |
| **GitHub Actions** | - | CI/CD | Build flavors (dev/staging/prod), Fastlane for store deployment |
| **Cert Manager / Let's Encrypt** | - | TLS certificates | Automated cert rotation for ISDS client cert endpoints |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Payment SDK** | Comgate Mobile Checkout SDK | GoPay (WebView redirect) | GoPay requires WebView/browser redirect; Google Pay broken in WebView; no native 3DS |
| | | GP webpay (WebView redirect) | Bank-backed but same WebView limitations; no native mobile SDK |
| | | Custom WebView integration | PCI DSS scope expands to app; Google Pay/Apple Pay unreliable; poor UX |
| **ISDS Client** | Spring WS / Apache CXF (WSDL-first) | Manual SOAP XML construction | WSDL changes frequently (3.05→3.09); code gen handles versioning; MTOM/XOP complex manually |
| **eIdentita Protocol** | OpenID Connect (OIDC) | SAML2 / WS-Federation | OIDC simpler, JWT tokens, mobile-friendly, Keycloak native support; MojeID recommends OIDC |
| **Local DB** | Drift + SQLCipher | Isar / ObjectBox / Hive | Drift: SQLCipher encryption (FIPS-ready), migrations, compile-time safety, reactive streams |
| **Accessibility Testing** | axe-core + manual audit | Only automated / only manual | Automated catches ~30-50% issues; manual required for screen reader, cognitive, motor testing |

---

## Installation

```bash
# Backend (Spring Boot + Kotlin)
# build.gradle.kts dependencies
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.security:spring-security-oauth2-client")
    implementation("org.springframework.ws:spring-ws-core")           // ISDS SOAP
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-xml") // ISDS XML
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("io.r2dbc:r2dbc-postgresql")
    implementation("org.liquibase:liquibase-runtime")
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.5.0")
}

# Frontend (Flutter) - pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  drift: ^2.18.0
  drift_db_viewer: ^1.2.0
  sqlcipher_flutter_libs: ^0.3.0  # SQLCipher for encryption
  dio: ^5.5.0
  flutter_secure_storage: ^9.2.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0
  riverpod: ^2.5.0
  go_router: ^14.0.0
  package_info_plus: ^8.0.0
  device_info_plus: ^11.0.0
  local_auth: ^2.2.0
  # Comgate SDK via platform channels (Android: comgate-android-sdk, iOS: ComgateSDK)

dev_dependencies:
  build_runner: ^2.4.0
  freezed: ^2.5.0
  json_serializable: ^6.8.0
  drift_dev: ^2.18.0
  axe_core: ^1.0.0  # Accessibility testing
  flutter_test:
    sdk: flutter
```

---

## Sources

- **eIdentita/NIA**: https://nia.otevrenamesta.cz/ (metadata: `https://tnia.identitaobcana.cz/fpsts/FederationMetadata/2007-06/FederationMetadata.xml` test, `https://nia.identitaobcana.cz/fpsts/FederationMetadata/2007-06/FederationMetadata.xml` prod), MojeID OIDC docs: https://www.mojeid.cz/documentation/
- **ISDS**: Provozní řád ISDS https://mojedatovaschranka.cz/info/files/2245_Provozni_rad_ISDS_26_06_2026.pdf, WSDL docs https://mojedatovaschranka.cz/sds/p/download/sds_webove_sluzby.pdf, developer info https://mojedatovaschranka.cz/info/files/2194_Info_pro_vyvojare_2025_3.pdf
- **ISVS**: Katalog ISVS https://archi.gov.cz/znalostni_baze:aisp_editace_udaju, SZR developer portal https://www.szrcr.cz/cs/sluzby/spravci-a-vyvojari, RPP kompendium https://www.dia.gov.cz/media/411/download/RPP_kompendium_AIS_pripojeni_EO_EOP_ECD.pdf
- **Comgate**: Mobile Checkout SDK docs https://help.comgate.cz/docs/en/payment-gateway-in-a-mobile-application, PCI DSS https://help.comgate.cz/docs/en/pci-dss-compliance, native SDK blog https://www.comgate.eu/cs/blog/mobilni-checkout-v-aplikaci-pro-android-a-ios
- **GoPay**: QR payment https://www.gopay.com/en/qr-payment/, comparison https://www.gopay.com/cs/srovnani-platebnich-bran/
- **GP webpay**: HTTP API v1.19 https://www.gpwebpay.cz/wp-content/uploads/2025/06/GP_webpay_HTTP_API_v1.19_EN.pdf
- **Accessibility**: Zákon 99/2019 Sb. https://ceskezakony.cz/en/zakon/99-2019, DIA metodický pokyn https://www.ddpardubice.cz/media/cache/file/28/Metodicky_pokyn_-_pristupnost_internetovych_stranek_a_mobilnich_aplikaci_v1-6-DIA.pdf, gov.cz design system https://designsystem.gov.cz/pravidla/pristupnost-webovych-stranek.html