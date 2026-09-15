# Webhooks Architecture & Verification

Docdril Communication utilizes a **two-way webhook architecture**:
1. **Inbound Webhooks** (Hostinger &rarr; Docdril): Notifies Docdril of incoming emails without IMAP polling.
2. **Outbound Webhooks** (Docdril &rarr; Ecosystem Apps): Broadcasts normalized communication events to Docdril CRM, Docdril Support, and Docdril AI.

---

## 1. Inbound Webhooks (From Hostinger)

### Endpoint
```
POST /api/v1/webhooks/hostinger
```

### Authentication
Hostinger sends an HTTP header:
```
Authorization: Bearer <HOSTINGER_WEBHOOK_SECRET>
```

### Idempotency & De-duplication
Docdril generates an idempotency key from `eventId` and `data.messageId`. Re-delivered events are acknowledged with `HTTP 200` without triggering duplicate side-effects.

---

## 2. Outbound Webhooks (To Docdril Ecosystem)

### Supported Outbound Events
- `message.received`: A new email has landed in an organization mailbox.
- `message.sent`: An email has been dispatched via the platform.
- `conversation.updated`: A conversation thread changed status, unread count, or tags.
- `contact.updated`: A contact interaction was recorded.

### Webhook Headers Delivered to Docdril Apps
```http
POST https://crm.docdril.com/api/v1/webhooks/communication
Content-Type: application/json
X-Docdril-Event: message.received
X-Docdril-Delivery-Id: del_1710001234
X-Docdril-Signature: a1b2c3d4e5f6... (HMAC SHA-256 hex)
```

### How Connected Apps Verify the Signature (Node.js Example)

```javascript
import crypto from 'crypto';

function verifyDocdrilWebhook(rawBody, signatureHeader, webhookSecret) {
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected)
  );
}
```
