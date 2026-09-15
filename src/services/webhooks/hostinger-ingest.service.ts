// Hostinger Inbound Webhook Ingestion Service
// Authenticates Bearer secret, verifies idempotency, normalizes event, updates state, and fires eventBus.

import { db } from '../../lib/db';
import { eventBus } from '../events/event-bus';
import { DocdrilMessage, DocdrilConversation } from '../../types';

export interface HostingerWebhookPayload {
  event: 'message.received' | string;
  accountResourceId?: string;
  mailbox?: string;
  data?: {
    uid?: number | string;
    folder?: string;
    subject?: string;
    from?: { address: string; name?: string };
    to?: { address: string; name?: string }[];
    date?: string;
    size?: number;
    text?: string;
    html?: string;
    messageId?: string;
    hasAttachments?: boolean;
    attachments?: any[];
  };
  timestamp?: string;
  eventId?: string;
}

export class HostingerWebhookIngestService {
  /**
   * Process and validate an incoming webhook from Hostinger Mail API.
   */
  static async processWebhook(
    authHeader: string | null,
    payload: HostingerWebhookPayload
  ): Promise<{ success: boolean; message: string; eventId?: string }> {
    // 1. Authenticate Bearer secret
    const configuredSecret = process.env.HOSTINGER_WEBHOOK_SECRET;
    if (configuredSecret) {
      const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
      if (!token || token !== configuredSecret) {
        throw new Error('Unauthorized Hostinger webhook: Invalid Bearer token');
      }
    }

    // 2. Idempotency Check
    const eventId = payload.eventId || `evt_wh_${payload.data?.messageId || payload.data?.uid || Date.now()}`;
    if (db.isWebhookEventProcessed(eventId)) {
      return {
        success: true,
        message: 'Event already processed (idempotency key matched)',
        eventId,
      };
    }

    // 3. Resolve target mailbox
    const mailboxEmail = payload.mailbox || payload.data?.to?.[0]?.address || 'info@docdril.com';
    let mailbox = await db.findMailboxByEmail(mailboxEmail);
    if (!mailbox && payload.accountResourceId) {
      mailbox = await db.findMailboxByProviderId(payload.accountResourceId);
    }
    if (!mailbox) {
      // Fallback to primary mailbox
      const all = await db.listMailboxes('org_docdril_primary');
      mailbox = all[0];
    }

    if (!mailbox) {
      throw new Error(`Cannot locate mailbox for incoming address: ${mailboxEmail}`);
    }

    // 4. Normalize message data
    const d = payload.data || {};
    const uid = d.uid || d.messageId || Date.now();
    const messageDocdrilId = `msg_${mailbox.providerMailboxId}_${uid}`;
    const conversationId = `cnv_${mailbox.providerMailboxId}_${uid}`;

    const normalizedMessage: DocdrilMessage = {
      id: messageDocdrilId,
      conversationId,
      mailboxId: mailbox.id,
      providerMessageId: String(uid),
      providerFolder: d.folder || 'INBOX',
      senderEmail: d.from?.address || 'unknown@sender.com',
      senderName: d.from?.name || null,
      recipients: (d.to || [{ address: mailbox.emailAddress }]).map((r) => ({
        type: 'to',
        email: r.address,
        name: r.name || null,
      })),
      subject: d.subject || '(No Subject)',
      snippet: (d.text || d.html || '').replace(/<[^>]*>?/gm, '').substring(0, 140),
      bodyText: d.text || '',
      bodyHtml: d.html || `<p>${d.text || ''}</p>`,
      status: 'RECEIVED',
      isRead: false,
      isStarred: false,
      hasAttachments: !!d.hasAttachments || (d.attachments?.length || 0) > 0,
      receivedAt: d.date || new Date().toISOString(),
    };

    // 5. Store message & update conversation in Docdril DB
    await db.createMessage(normalizedMessage);

    // 6. Mark event as processed (Idempotency)
    db.markWebhookEventProcessed(eventId);

    // 7. Fire internal Docdril event across EventBus
    const conversation = await db.findConversationById(normalizedMessage.conversationId);
    await eventBus.emit({
      id: eventId,
      type: 'message.received',
      organizationId: mailbox.organizationId,
      entityId: normalizedMessage.id,
      entityType: 'message',
      timestamp: new Date().toISOString(),
      payload: {
        message: normalizedMessage,
        conversation,
      },
    });

    // 8. Log audit trail
    await db.logAudit({
      id: `aud_${Date.now()}`,
      organizationId: mailbox.organizationId,
      action: 'webhook.received',
      entityType: 'message',
      entityId: normalizedMessage.id,
      metadata: {
        provider: 'hostinger',
        event: payload.event,
        mailbox: mailbox.emailAddress,
        sender: normalizedMessage.senderEmail,
      },
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Message processed and dispatched successfully',
      eventId,
    };
  }
}
