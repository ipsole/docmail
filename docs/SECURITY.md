# Security & RBAC Specifications

Docdril Communication enforces strict enterprise security protocols across credentials, network transit, API authorization, and auditability.

---

## 1. Provider Credential Security

- Hostinger API tokens (`HOSTINGER_MAIL_API_TOKEN`) and database stored provider tokens are encrypted at rest using **AES-256-GCM** with unique initialization vectors (`IV`) and authentication tags (`Tag`).
- Secrets are NEVER sent to the client browser, never rendered in React components, and never stored in `localStorage`.
- All outbound requests to Hostinger occur exclusively from backend route handlers.

---

## 2. API Key Security & Hashing

- Service credentials (`dd_live_...`) are hashed using **SHA-256** prior to database storage.
- The raw key is displayed to administrators **only once** upon generation.
- Keys can be instantly revoked from `/admin` &rarr; **Service API Keys**.

---

## 3. Role-Based Access Control (RBAC)

| Role | Mailbox Read | Mailbox Manage | Message Read | Message Send | Contact Write | Admin / Keys |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Member** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Viewer** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Audit Logging

Every critical administrative and message action is recorded in the `audit_logs` table:
- `user.login`
- `mailbox.connected`
- `api_key.created`
- `message.sent`
- `webhook.received`

Each audit entry records timestamp, user/service ID, entity type, IP address, and payload metadata.
