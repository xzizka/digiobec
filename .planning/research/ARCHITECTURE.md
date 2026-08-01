# Architecture Patterns: Czech eGovernment Mobile App

**Domain:** Municipal citizen portal (Czech eGovernment integrations)
**Researched:** 2026-07-31

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE APP (Flutter)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │   Auth      │  │  Messages   │  │   Forms     │  │    Payments       │  │
│  │  Feature    │  │  Feature    │  │  Feature    │  │    Feature        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬──────────┘  │
│         │                │                │                 │             │
│         └────────────────┼────────────────┼─────────────────┘             │
│                          ▼                ▼                               │
│              ┌─────────────────────────────────────┐                      │
│              │         BFF / API Gateway           │                      │
│              │    (Spring Boot + Spring WebFlux)   │                      │
│              └──────────────┬──────────────────────┘                      │
│                             │                                             │
│         ┌───────────────────┼───────────────────┐                         │
│         ▼                   ▼                   ▼                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │  Keycloak   │    │   ISDS      │    │   ISVS      │                  │
│  │  (OIDC/SAML)│    │  (SOAP/WS)  │    │  (REST)     │                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                  │
│         │                  │                  │                          │
│         ▼                  ▼                  ▼                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │ eIdentita   │    │  ISDS       │    │  ISZR/eGON  │                  │
│  │  (NIA)      │    │  (VT/PROD)  │    │  (RÚIAN,    │                  │
│  │             │    │             │    │   RZP, RES) │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                                                    │
│                    ┌──────────────────────────────────────┐          │
│                    │         Comgate                      │          │
│                    │  Mobile Checkout SDK (native)        │          │
│                    │  REST API (webhooks, refunds)        │          │
│                    └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Mobile App (Flutter)** | UI, offline cache, biometric auth, platform channels for Comgate SDK | BFF (REST/gRPC), Keycloak (OIDC), Comgate SDK (MethodChannel) |
| **BFF / API Gateway (Spring Boot)** | Orchestration, auth token exchange, rate limiting, caching, audit logging | Mobile App, Keycloak, ISDS Client, ISVS Client, Comgate REST, PostgreSQL |
| **Keycloak** | Identity broker, OIDC/SAML federation, MFA, user sessions, token minting | Mobile App (OIDC), eIdentita NIA (SAML2/OIDC), MojeID (OIDC/SAML) |
| **ISDS Client (Spring WS)** | SOAP 1.1/1.2 client, WSDL codegen, MTOM/XOP, async notifications, retry/backoff | BFF, ISDS VT/PROD endpoints (ws1/ws2, ws1c/ws2c) |
| **ISVS Client (WebClient)** | REST client for act registry, form prefill, CzechVoc, RÚIAN address lookup | BFF, ISVS REST endpoints, ISZR/eGON services |
| **Comgate SDK (Native Android/iOS)** | In-app payment UI, Apple Pay/Google Pay, 3DS, card tokenization | Mobile App (platform channel), Comgate gateway (direct, bypasses BFF for card data) |
| **Comgate REST API** | Server-side payment ops: refunds, status, webhooks, PUSH payment links | BFF, Comgate gateway |
| **PostgreSQL** | Persistent storage: users, messages, acts, payments, audit logs, offline sync metadata | BFF (R2DBC) |

### Data Flow

**Authentication (eIdentita LoA Substantial):**
```
1. User taps "Přihlásit se přes eIdentita" in Flutter app
2. App opens ASWebAuthenticationSession / Chrome Custom Tab → Keycloak /auth/realms/{realm}/protocol/openid-connect/auth?client_id=...&redirect_uri=...&scope=openid&acr_values=http://eidas.europa.eu/LoA/substantial
3. Keycloak redirects to NIA (tnia/nia.identitaobcana.cz) → user selects IdP (MojeID, Datová schránka, eObčanka)
4. User authenticates at IdP → NIA returns SAML/OIDC response to Keycloak
5. Keycloak validates, maps attributes (RČ, name, address from NIA), issues JWT (access + refresh)
6. App receives tokens via redirect_uri (universal link / app scheme)
7. App stores tokens in flutter_secure_storage (Keychain/Keystore), fetches user profile from BFF /me
```

**ISDS Message Receive (Polling + Notifications):**
```
1. BFF scheduler (every 5 min) calls ISDS GetListOfReceivedMessages (SOAP 1.1, Basic auth)
2. For each new message: MessageEnvelopeDownload → parse ZFO XML → extract metadata + attachments
3. If message has doručenka: GetSignedDeliveryInfo → store signed delivery evidence (legal proof)
4. BFF stores message in PostgreSQL, publishes event to Kafka/Redis Streams
5. Mobile app receives push (FCM/APNs) → background fetch → sync new messages to Drift local DB
6. User opens app → reads message → app calls BFF MarkMessageAsDownloaded (async, fire-and-forget)
```

**ISDS Message Send (Citizen Submission):**
```
1. User fills form in app → attaches photos/PDFs → taps "Odeslat do datové schránky"
2. App uploads attachments to BFF /attachments (multipart) → BFF stores in S3/MinIO, returns attachment IDs
3. App calls BFF /isds/send with {recipientId, subject, content, attachmentIds, actId}
4. BFF: CreateMessage (SOAP) with attachments → ISDS returns msgId + timestamp
5. BFF stores submission record (msgId, actId, userId, status=SENT) in PostgreSQL
6. BFF schedules GetDeliveryInfo polling for doručenka/odmítnutí
7. When delivery evidence arrives → BFF updates status, pushes notification to user
```

**Form Prefill (ISVS + ISZR):**
```
1. User selects act from catalog → BFF /acts/{id}/prefill
2. BFF calls ISVS REST: GET /ukony/{id}/predvyplneni?rodneCislo={user.rc}
3. ISVS orchestrates eGON calls to ISZR: RZP (identity), RÚIAN (address), RES (business)
4. ISVS returns JSON with prefill data → BFF maps to form schema → returns to app
5. App renders form with prefilled fields (editable, user can correct)
```

**Payment (Comgate Native SDK):**
```
1. User taps "Zaplatit" → App calls BFF /payments/init {amount, currency, orderId, returnUrl}
2. BFF calls Comgate REST /v2.0/payments → returns paymentId + clientToken
3. App passes clientToken to Comgate SDK via MethodChannel
4. Comgate SDK renders native UI: card form / Apple Pay / Google Pay / QR platba
5. User completes payment → SDK returns paymentResult (success/failure + paymentRef)
6. App sends paymentRef to BFF /payments/confirm → BFF verifies with Comgate REST
7. BFF stores payment record, links to act/submission, generates PDF receipt
8. If act requires payment proof → BFF attaches receipt to ISDS CreateMessage
```

---

## Patterns to Follow

### Pattern 1: Backend-for-Frontend (BFF) for eGov Integration
**What:** Dedicated Spring Boot layer between Flutter app and eGovernment SOAP/REST services.
**When:** Always — isolates protocol complexity (SOAP, WSDL, MTOM, SAML) from mobile app.
**Example:**
```kotlin
// ISDS Client - Spring WS with WSDL codegen
@Configuration
class IsdsConfig {
    @Bean
    fun messageFactory(): SaajSoapMessageFactory = SaajSoapMessageFactory().apply {
        setSoapVersion(SoapVersion.SOAP_11) // Classic
    }
    
    @Bean
    fun isdsClient(@Value("\${isds.ws1.url}") url: String): WebServiceTemplate =
        WebServiceTemplate(messageFactory()).apply {
            setDefaultUri(url)
            setMessageSender(HttpComponentsMessageSender().apply {
                setCredentials(UsernamePasswordCredentials(isdsUser, isdsPass))
                // For cert auth: setSslContext(certSslContext)
            })
        }
}

// Usage in service
@Service
class IsdsService(private val template: WebServiceTemplate) {
    fun getReceivedMessages(mailboxId: String): List<ReceivedMessage> {
        val request = GetListOfReceivedMessages().apply { this.mailboxId = mailboxId }
        val response = template.marshalSendAndReceive(request) as GetListOfReceivedMessagesResponse
        return response.messageList.map { mapToDomain(it) }
    }
}
```

### Pattern 2: Keycloak Identity Broker for eIdentita
**What:** Configure Keycloak as OIDC client → NIA SAML2/OIDC identity provider.
**When:** All authentication flows; avoids custom SAML/OIDC implementation in app/backend.
**Example:**
```json
// Keycloak Identity Provider config (import via Admin CLI / Terraform)
{
  "alias": "nia-eidentita",
  "providerId": "oidc",
  "enabled": true,
  "config": {
    "authorizationUrl": "https://tnia.identitaobcana.cz/FPSTS/oauth2/authorize",
    "tokenUrl": "https://tnia.identitaobcana.cz/FPSTS/oauth2/token",
    "jwksUrl": "https://tnia.identitaobcana.cz/FPSTS/oauth2/jwks",
    "clientId": "https://mojeapp.obec.cz@mobile",
    "clientSecret": "${NIA_CLIENT_SECRET}",
    "defaultScopes": "openid",
    "prompt": "login",
    "acrValues": "http://eidas.europa.eu/LoA/substantial",
    "validateSignature": "true",
    "useJwksUrl": "true",
    "syncMode": "FORCE"
  }
}
```

### Pattern 3: Offline-First with Drift + Sync Engine
**What:** Local Drift database as source of truth for reads; background sync to BFF.
**When:** Message reading, form drafts, payment history, act catalog.
**Example:**
```dart
// Drift table with sync metadata
@DataClassName('MessageLocal')
class MessagesLocal extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get remoteId => text().unique()(); // ISDS msgId
  TextColumn get subject => text()();
  BlobColumn get zfoXml => blob()(); // Full ZFO for offline verification
  IntColumn get status => intEnum<MessageStatus>()(); // NEW, READ, ARCHIVED
  DateTimeColumn get receivedAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();
  BoolColumn get dirty => boolean().withDefault(Constant(false))(); // Pending local changes
}

// Sync engine (simplified)
class MessageSyncEngine {
  Future<void> sync() async {
    // 1. Push local dirty changes (mark as read, delete)
    final dirty = await localDb.getDirtyMessages();
    for (msg in dirty) {
      await bff.markAsRead(msg.remoteId);
      await localDb.markSynced(msg.id);
    }
    // 2. Pull new messages since last sync
    final lastSync = await localDb.getLastSyncTime();
    final newMessages = await bff.getMessagesSince(lastSync);
    await localDb.insertAll(newMessages);
    await localDb.setLastSyncTime(DateTime.now());
  }
}
```

### Pattern 4: Comgate SDK via Platform Channels
**What:** Flutter ↔ Native (Kotlin/Swift) bridge for Comgate Mobile Checkout SDK.
**When:** Payment flow; keeps PCI DSS scope at SAQ-A (card data never touches Flutter/Dart).
**Example:**
```dart
// Flutter side
class ComgatePayment {
  static const _channel = MethodChannel('cz.obec.portal/comgate');
  
  Future<PaymentResult> pay(PaymentRequest request) async {
    final result = await _channel.invokeMethod('startPayment', {
      'clientToken': request.clientToken,
      'amount': request.amount,
      'currency': request.currency,
      'orderId': request.orderId,
      'returnUrl': 'obecportal://payment-return',
    });
    return PaymentResult.fromMap(Map<String, dynamic>.from(result));
  }
}

// Android (Kotlin) - MainActivity.kt
class MainActivity : FlutterActivity() {
  private val CHANNEL = "cz.obec.portal/comgate"
  
  override fun configureFlutterEngine(engine: FlutterEngine) {
    super.configureFlutterEngine(engine)
    MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
      if (call.method == "startPayment") {
        val args = call.arguments as Map<String, Any>
        val clientToken = args["clientToken"] as String
        val intent = ComgateCheckoutActivity.createIntent(this, clientToken)
        startActivityForResult(intent, REQUEST_CODE_PAYMENT) { resCode, data ->
          if (resCode == Activity.RESULT_OK) {
            val paymentResult = ComgateCheckoutActivity.getPaymentResult(data)
            result.success(mapOf(
              "success" to paymentResult.isSuccess,
              "paymentRef" to paymentResult.paymentReference,
              "error" to paymentResult.errorMessage
            ))
          } else {
            result.success(mapOf("success" to false, "error" to "User cancelled"))
          }
        }
      } else { result.notImplemented() }
    }
  }
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct SOAP Calls from Mobile App
**What:** Flutter app constructs SOAP XML, handles MTOM/XOP, manages Basic auth headers.
**Why bad:** WSDL changes break app; binary attachment handling complex; no retry/backoff; exposes ISDS credentials in app bundle; app store review rejects network security config issues.
**Instead:** BFF owns ISDS client; app calls simple REST `/api/messages`.

### Anti-Pattern 2: WebView for Payment Gateway
**What:** Embed GP webpay/GoPay payment page in Flutter WebView or launch browser.
**Why bad:** Google Pay fails in WebView; Apple Pay requires SafariViewController; PCI DSS scope expands to app (SAQ-A-EP or SAQ-D); redirect UX breaks flow; no native 3DS.
**Instead:** Comgate native Mobile Checkout SDK (only Czech provider with native SDK).

### Anti-Pattern 3: Custom SAML/OIDC Implementation for eIdentita
**What:** Implement SAML2 SP or OIDC RP in Spring Boot/Flutter directly against NIA.
**Why bad:** Metadata rotation (certificates change yearly); complex XML signature validation; LoA mapping errors; Keycloak does this battle-tested.
**Instead:** Keycloak identity broker → NIA; standard OIDC tokens to app.

### Anti-Pattern 4: Storing ZFO XML Only in Backend
**What:** Backend parses ZFO, stores extracted fields, discards original signed XML.
**Why bad:** Legal proceedings require original ZFO with ISDS pečeť (RSA-PSS signature); doručenka verification needs full signed envelope.
**Instead:** Store full ZFO blob in PostgreSQL (BYTEA) + extracted fields for query; serve original for download/verification.

### Anti-Pattern 5: Accessibility as Afterthought
**What:** Build UI first, run axe-core at end, fix critical issues before launch.
**Why bad:** Semantic structure (heading hierarchy, landmarks, labels) requires design-time decisions; retrofit costs 10-100x more; DIA audit will fail.
**Instead:** Accessibility-first design: semantic widgets, contrast tokens, font scaling from Day 1; automated CI gate on axe-core; manual TalkBack/VoiceOver testing every sprint.

---

## Scalability Considerations

| Concern | At 100 users (pilot municipality) | At 10K users (medium city) | At 1M users (large city / regional) |
|---------|-----------------------------------|----------------------------|-------------------------------------|
| **ISDS Polling** | 5-min cron, single thread | 1-min cron, partitioned by mailbox ID; Redis distributed lock | Event-driven: ISDS RegisterForNotifications webhook → Kafka → consumer pool |
| **Message Storage** | PostgreSQL BYTEA (ZFO ~50KB avg) | PostgreSQL + S3/MinIO for attachments >10MB; partition by month | S3 primary, PostgreSQL metadata only; cold storage tier for >2yr |
| **BFF Horizontal Scaling** | 2 replicas, H2 cache | 5-10 replicas, Redis Cluster (session + rate limit), read replicas | 20+ replicas, multi-region, Istio mTLS, circuit breakers |
| **Keycloak** | Embedded H2 / single node | PostgreSQL, 3-node cluster, Infinispan cache | Multi-datacenter, custom SPI for NIA attribute mapping |
| **Comgate SDK** | Direct to gateway | Direct (client-side) | Direct (client-side); BFF only for webhook verification |
| **Offline Sync** | Simple timestamp-based | Conflict resolution (last-write-wins + user merge UI) | CRDT for form drafts; vector clocks for message read status |
| **Accessibility Testing** | Manual per release | Automated CI (axe-core) + monthly manual audit | Continuous: axe-core PR gate + quarterly certified audit |

---

## Sources

- ISDS WSDL/endpoints: https://mojedatovaschranka.cz/sds/p/download/sds_webove_sluzby.pdf, Provozní řád https://mojedatovaschranka.cz/info/files/2245_Provozni_rad_ISDS_26_06_2026.pdf
- eIdentita/NIA metadata: https://tnia.identitaobcana.cz/fpsts/FederationMetadata/2007-06/FederationMetadata.xml (test), https://nia.identitaobcana.cz/fpsts/FederationMetadata/2007-06/FederationMetadata.xml (prod)
- Keycloak Identity Broker: https://www.keycloak.org/docs/latest/server_admin/#_identity_broker
- Comgate Mobile SDK: https://help.comgate.cz/docs/en/payment-gateway-in-a-mobile-application
- Drift + SQLCipher: https://drift.simonbinder.eu/docs/advanced-features/encryption/
- Spring WS: https://docs.spring.io/spring-ws/reference/
- gov.cz Design System (accessibility patterns): https://designsystem.gov.cz/