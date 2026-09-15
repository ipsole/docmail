# Database Schema & Entity Design

Docdril Communication uses **PostgreSQL** configured via **Prisma ORM** (`prisma/schema.prisma`).

---

## 1. Core Entities

1. **Multi-Tenancy & Access**:
   - `organizations`: Organization tenant root.
   - `users`: User profiles.
   - `roles` & `permissions`: Granular RBAC definitions.
   - `user_roles`: User-to-role associations.
   - `mailbox_access`: Mailbox permission grants for specific users.

2. **Mailbox & Provider**:
   - `provider_accounts`: Encrypted credentials reference, provider name (`hostinger`), status.
   - `mailboxes`: Internal Docdril mailbox ID, `provider_mailbox_id` (Hostinger resourceId), email address, quotas.
   - `aliases`: Alternative email routing entries.
   - `forwarders`: Email redirection rules.
   - `autoreplies`: Vacation and automatic responders.

3. **Email Models**:
   - `conversations`: Thread groupings, subjects, unread counters, contact linkage.
   - `messages`: Normalized message headers, RFC822 message-IDs, body text/HTML, folder paths.
   - `recipients`: `to`, `cc`, and `bcc` associations.
   - `attachments`: File metadata, content types, storage keys.
   - `drafts`: Autosaved composed messages.

4. **Business & Ecosystem**:
   - `contacts`: Centralized contact directory for CRM linkage.
   - `templates`: Dynamic reusable email templates.
   - `signatures`: Mailbox and user HTML signatures.
   - `api_keys`: Hashed service tokens with granular scopes.
   - `webhook_subscriptions`: External Docdril applications subscribing to events.
   - `events`: Internal event log stream.
   - `audit_logs`: Immutable audit trails.

---

## 2. Migrations & Commands

```bash
# Push schema changes to PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate
```
