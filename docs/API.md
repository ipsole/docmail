# Docdril Communication REST API v1 Reference

All endpoints are prefixed with `/api/v1`. External services authenticate via API keys:
`Authorization: Bearer dd_live_<prefix>_<token>`

---

## 1. Mailboxes

### `GET /api/v1/mailboxes`
Lists all mailboxes accessible to the authenticated organization.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mbx_docdril_info",
      "emailAddress": "info@docdril.com",
      "displayName": "Docdril Info Desk",
      "status": "ACTIVE",
      "quotaBytes": 5368709120,
      "usedBytes": 254800000,
      "provider": "hostinger"
    }
  ]
}
```

---

## 2. Sending Messages

### `POST /api/v1/messages/send`
Sends an email from a Docdril mailbox through the underlying provider.

**Scope Required**: `messages:send`

**Request Body:**
```json
{
  "mailboxId": "mbx_docdril_info",
  "to": ["client@example.com"],
  "cc": ["team@example.com"],
  "subject": "Proposal Discussion",
  "bodyText": "Hello, attached is our proposal.",
  "bodyHtml": "<p>Hello, attached is our proposal.</p>",
  "inReplyToConversationId": "cnv_welcome_101"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_1710001122_ab12",
    "status": "SENT"
  }
}
```

---

## 3. Conversations

### `GET /api/v1/conversations`
List conversations with optional query filters.

**Parameters**:
- `mailboxId`: (optional) Filter by mailbox ID.
- `folder`: (optional) Filter by folder (e.g. `INBOX`, `INBOX.Sent`, `INBOX.Archive`).
- `starred`: (optional) `true` to filter starred conversations.
- `contactId`: (optional) Filter conversations linked to a specific contact.
- `q`: (optional) Keyword search across subject and snippets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cnv_welcome_101",
      "mailboxId": "mbx_docdril_info",
      "contactId": "cnt_elena_vance",
      "subject": "Partnership Inquiries",
      "snippet": "We are interested in integrating...",
      "unreadCount": 1,
      "messageCount": 2,
      "isStarred": true,
      "lastMessageAt": "2026-09-15T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/conversations/:id`
Retrieves full conversation with complete message thread history.

---

## 4. Contacts

### `GET /api/v1/contacts`
Lists all contacts in the organization.

### `POST /api/v1/contacts`
Creates a new contact from CRM or other applications.

**Request Body:**
```json
{
  "name": "Dr. Sarah Connor",
  "email": "sarah@medgroup.org",
  "company": "MedGroup",
  "phone": "+1 (555) 321-9988"
}
```

---

## 5. Webhooks

### `POST /api/v1/webhooks/subscriptions`
Subscribes an external application (e.g. Docdril CRM) to outbound events.

**Request Body:**
```json
{
  "name": "Docdril CRM Ingest",
  "targetUrl": "https://crm.docdril.com/api/v1/webhooks/communication",
  "events": ["message.received", "message.sent"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sub_17100033",
    "name": "Docdril CRM Ingest",
    "targetUrl": "https://crm.docdril.com/api/v1/webhooks/communication",
    "secret": "whsec_34f8a9...",
    "status": "ACTIVE"
  }
}
```

---

## 6. Real-Time Stream

### `GET /api/v1/events/stream`
Server-Sent Events (SSE) connection that pushes real-time event updates (`message.received`, `message.sent`) to active browser sessions.
