# Hostinger Mail API Integration Guide

This guide provides step-by-step instructions for integrating Docdril Communication with **Hostinger Email Infrastructure** using the official Hostinger Mail REST API (OpenAPI 3.0 v1.1.0).

---

## 1. Creating Your Hostinger API Token

1. Log into your **Hostinger Account** at [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. Navigate to **Emails** &rarr; Select your Domain &rarr; **API / Developer**.
3. Click **Create API Token**.
4. Configure Token Scopes:
   - Select the Order containing your business email accounts (e.g. `docdril.com`).
   - Grant full mailbox permissions (`Read`, `Send`, `Manage`, `Webhooks`).
   - You can restrict the token to specific mailboxes (`info@docdril.com`, `support@docdril.com`) or permit all mailboxes in the order.
5. Copy the generated Bearer Token.

---

## 2. Configuring Docdril Environment

Set your token in your `.env` file:

```bash
# Hostinger Mail API Bearer Token
HOSTINGER_MAIL_API_TOKEN="your_hostinger_bearer_token_here"

# Base URL (defaults to official API endpoint)
HOSTINGER_API_BASE_URL="https://api.mail.hostinger.com"

# Set default provider mode to live Hostinger
MAIL_PROVIDER_DEFAULT="hostinger"
```

> [!CAUTION]
> Never commit `HOSTINGER_MAIL_API_TOKEN` to Git. Never expose it in client-side code. It must remain exclusively server-side.

---

## 3. How Mailboxes Are Discovered & Mapped

Docdril's `HostingerMailProvider` calls `GET /api/v1/me`:

```json
{
  "data": {
    "orderResourceId": "OR1a2b3c4d5e6f7g",
    "mailboxes": [
      {
        "resourceId": "AC1a2b3c4d5e6f7g",
        "address": "info@docdril.com"
      },
      {
        "resourceId": "AC2h3i4j5k6l7m8n",
        "address": "support@docdril.com"
      }
    ]
  }
}
```

Docdril maps Hostinger's `resourceId` (e.g. `AC1a2b3c4d5e6f7g`) to Docdril's internal UUID `mailbox.provider_mailbox_id`.

---

## 4. Setting Up Hostinger Webhooks

Docdril avoids polling by utilizing Hostinger's Webhook architecture.

### Automatic Setup via API
When configured, Docdril automatically subscribes to Hostinger webhooks by calling:

```http
POST https://api.mail.hostinger.com/api/v1/mailboxes/{mailboxResourceId}/webhooks
Authorization: Bearer <HOSTINGER_TOKEN>
Content-Type: application/json

{
  "name": "Docdril Inbound Webhook",
  "url": "https://mail.docdril.com/api/v1/webhooks/hostinger",
  "events": ["message.received"],
  "status": "active"
}
```

### Webhook Response & One-Time Secret
Hostinger returns a one-time secret:
```json
{
  "data": {
    "id": "019683f8-1234-7abc-8def-0123456789ab",
    "secret": "4a6f8b2d1e9c3f7a0b5d8e2c4f1a7b3d9e6c2f8a1b4d7e0c3f6a9b2d5e8c1f4"
  }
}
```
Store this secret in your environment:
```bash
HOSTINGER_WEBHOOK_SECRET="4a6f8b2d1e9c3f7a0b5d8e2c4f1a7b3d9e6c2f8a1b4d7e0c3f6a9b2d5e8c1f4"
```

---

## 5. Webhook Security & Ingestion

Every webhook delivered by Hostinger contains:
```http
POST /api/v1/webhooks/hostinger
Authorization: Bearer <HOSTINGER_WEBHOOK_SECRET>
```

Docdril validates:
1. **Bearer Token Authentication**: Verifies that the header matches `HOSTINGER_WEBHOOK_SECRET`.
2. **Idempotency Guard**: Extracts `eventId` or message UID to guarantee that re-delivered webhooks are never processed more than once.

---

## 6. Credential Rotation & Troubleshooting

### Token Rotation
1. Generate a new token in Hostinger hPanel.
2. Update `HOSTINGER_MAIL_API_TOKEN` in `.env` (or in `provider_accounts` table).
3. Restart the service or verify in `/admin` &rarr; **Infrastructure Health**.

### Common Troubleshooting
| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `[Hostinger API ERR_UNAUTHORIZED]` | Invalid or expired API token | Regenerate token in hPanel and update `.env`. |
| `[Hostinger API ERR_MAILBOX_NOT_FOUND]` | Token not scoped to mailbox | Re-issue token with scope including target mailbox. |
| Webhooks not arriving | Public URL inaccessible | Verify your endpoint is public (e.g. use ngrok for local testing). |
| `HTTP 401 on Webhook` | Webhook secret mismatch | Verify `HOSTINGER_WEBHOOK_SECRET` matches the secret provided during webhook creation. |
