# Architecture & System Design

## 1. Architectural Philosophy: The Control Layer

Docdril Communication adopts a **Control Layer Pattern** over external mail infrastructure. 

```
┌───────────────────────────────────────────────────────────┐
│                      Docdril Web App                      │
└─────────────────────────────┬─────────────────────────────┘
                              │
                    Docdril REST API v1
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                 Docdril Business Services                 │
│   (MailService, ContactService, EventBus, AI Assistant)   │
└─────────────────────────────┬─────────────────────────────┘
                              │
                 interface MailProvider
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                  HostingerMailProvider                    │
│        (Official Hostinger REST API OpenAPI 3.0)          │
└─────────────────────────────┬─────────────────────────────┘
                              │
                      HTTPS / Bearer Auth
                              │
┌─────────────────────────────▼─────────────────────────────┐
│              Hostinger Mail Infrastructure                │
└───────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Zero Provider Leakage**: The frontend never communicates with `api.mail.hostinger.com`. Hostinger resource IDs (`AC...`, `OR...`) are translated to Docdril UUIDs internally.
2. **Provider Abstraction**: All communication operations (`sendMessage`, `getMessage`, `searchMessages`, `listFolders`, `createWebhook`) are governed by the `MailProvider` interface.
3. **Event-Driven Decoupling**: Rather than having the email handler directly call CRM or AI services, incoming emails emit internal events on `DocdrilEventBus`. External apps subscribe via outbound webhooks.
4. **Authoritative Provider**: Hostinger maintains authoritative mailbox storage, quotas, and SMTP transport. Docdril maintains normalized queryable metadata, relationships, contacts, and audit logs.

---

## 2. Directory Structure & Boundaries

```
src/
├── app/                  # Next.js App Router (UI & REST API v1)
│   ├── (dashboard)/      # Webmail, Contacts, Templates, Admin
│   └── api/v1/           # REST API v1 endpoints
├── components/           # React UI components (3-pane webmail, composer, AI panel)
├── lib/                  # Auth, RBAC, DB client, Crypto utilities
├── services/             # Modular monolith services:
│   ├── mail/             # MailProvider, HostingerMailProvider, MailService
│   ├── events/           # EventBus and typed events
│   ├── webhooks/         # Hostinger ingest & outbound dispatcher
│   ├── contacts/         # Centralized contacts & CRM linking
│   └── ai/               # AI summarizer & drafting assistant
└── types/                # TypeScript domain models
```

---

## 3. Real-Time Pipeline

```
Hostinger Inbound Mail
         │
         ▼
POST /api/v1/webhooks/hostinger
         │
  [Bearer Token Auth]
         │
  [Idempotency Check]
         │
  [Normalize Payload]
         │
  [Save to Docdril DB]
         │
         ▼
  Docdril EventBus.emit('message.received')
    ├──> Broadcast via Server-Sent Events (SSE) -> Browser UI updates instantly
    ├──> Outbound Webhook Dispatcher -> HMAC signed POST to Docdril CRM / Support
    └──> Audit Logger -> Persist event in audit_logs
```
