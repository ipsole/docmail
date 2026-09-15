# Docdril Communication Platform

> Production-grade, multi-tenant business communication infrastructure layer built for the Docdril ecosystem, powered by the **Hostinger Mail API**.

---

## 🌟 Overview

Docdril Communication is a first-party communication platform and API gateway. It provides a modern business email interface while using **Hostinger Email** as the underlying authoritative email infrastructure.

Crucially, **Docdril abstracts Hostinger completely**:
- The web frontend communicates exclusively with the Docdril REST API (`/api/v1/...`).
- Connected Docdril applications (Docdril CRM, Docdril Support, Docdril AI, Docdril Main App) interact via scoped API keys and outbound webhooks without knowing Hostinger credentials, endpoints, or IMAP/SMTP protocols.
- Should the underlying infrastructure provider change in the future, the provider abstraction allows swapping without touching frontend or ecosystem apps.

---

## 🏛️ Ecosystem Architecture

```
                   DOCDRIL ECOSYSTEM

       ┌───────────────────────────────────┐
       │                                   │
       │  Docdril Main App                 │
       │  Docdril CRM                      │
       │  Docdril Support                  │
       │  Docdril AI                       │
       │  Future Docdril Apps              │
       │                                   │
       └───────────────┬───────────────────┘
                       │
                 API / Webhooks (Scoped Keys & HMAC)
                       │
              ┌────────▼────────┐
              │                 │
              │ Docdril         │
              │ Communication   │
              │ Platform        │
              │                 │
              └────────┬────────┘
                       │
                MailProvider Interface
                       │
              ┌────────▼────────┐
              │                 │
              │ Hostinger       │
              │ Mail Provider   │
              │                 │
              └────────┬────────┘
                       │
                HTTPS / Bearer Auth
                       │
              ┌────────▼────────┐
              │ Hostinger Mail  │
              │ Infrastructure  │
              └─────────────────┘
```

---

## 🚀 Key Features

1. **Premium 3-Pane Webmail Interface**:
   - Folders: Inbox, Sent, Drafts, Starred, Archive, Trash, Spam.
   - Real-time live updating via Server-Sent Events (SSE).
   - Threaded conversation viewer with avatars, timestamps, and message history.
2. **Professional Composer**:
   - Multi-recipient chips (`To`, `Cc`, `Bcc`).
   - Dynamic templates (`{{first_name}}`, `{{company}}`, `{{sender_name}}`).
   - Corporate and personal signatures.
   - Attachment support.
3. **Docdril AI Assistant**:
   - Thread summarization & action item extraction.
   - Sentiment & priority analyzer (`high`, `medium`, `low`).
   - Context-aware smart reply drafting (Professional, Concise, Empathetic).
4. **Centralized Contacts & CRM Linkage**:
   - Automatic contact discovery on incoming/outgoing emails.
   - Conversation-to-contact association for seamless CRM synchronization.
5. **REST API v1 (`/api/v1`)**:
   - Versioned, authenticated API with granular permission scopes (`messages:read`, `messages:send`, `contacts:read`, etc.).
   - Service account generation for ecosystem apps.
6. **Robust Webhook Pipeline**:
   - Inbound webhook receiver for Hostinger (`POST /api/v1/webhooks/hostinger`) with Bearer token authentication and strict idempotency deduplication.
   - Outbound webhook dispatcher with HMAC SHA-256 signatures (`X-Docdril-Signature`).
7. **Admin Portal (`/admin`)**:
   - Live Hostinger connection & quota health diagnostics.
   - Mailbox discovery and mapping.
   - API key management and revocation.
   - Full system audit logs.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js 18+ (Tested on Node.js 22)
- npm 9+
- PostgreSQL (or use the built-in development fallback)

### 2. Installation
```bash
# Clone repository
cd docemail

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 3. Running Locally
```bash
# Run Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Webmail interface, or [http://localhost:3000/admin](http://localhost:3000/admin) to view the Admin portal.

### 4. Running Tests
```bash
npm test
```

---

## 📚 Complete Documentation Suite

- [Architecture & Design Guide](docs/ARCHITECTURE.md)
- [REST API v1 Reference](docs/API.md)
- [Hostinger Mail Integration Guide](docs/HOSTINGER_INTEGRATION.md)
- [Webhook Ingestion & Dispatch Guide](docs/WEBHOOKS.md)
- [Security & RBAC Specifications](docs/SECURITY.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
