// Docdril High-Level Mail Service
// Encapsulates business logic, translation between Docdril domain models and MailProvider

import { ProviderFactory } from './provider.factory';
import { db } from '../../lib/db';
import { eventBus } from '../events/event-bus';
import {
  DocdrilMessage,
  DocdrilConversation,
  DocdrilMailbox,
} from '../../types';
import { SendMessagePayload as DomainSendPayload } from './provider.interface';

export interface SendEmailParams {
  mailboxId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: {
    filename: string;
    contentType: string;
    content: string; // base64
  }[];
  inReplyToConversationId?: string;
}

export class MailService {
  /**
   * Send an email via the configured provider for the mailbox.
   */
  static async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId: string }> {
    const mailbox = await db.findMailboxById(params.mailboxId);
    if (!mailbox) {
      throw new Error(`Mailbox not found: ${params.mailboxId}`);
    }

    const provider = ProviderFactory.getProvider(mailbox.provider);

    // 1. Send via MailProvider (Hostinger / Mock)
    const providerResult = await provider.sendMessage(mailbox.providerMailboxId, {
      to: params.to,
      displayName: mailbox.displayName,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      text: params.bodyText,
      html: params.bodyHtml,
      attachments: params.attachments,
    });

    if (!providerResult.success) {
      throw new Error(providerResult.error || 'Provider failed to dispatch email');
    }

    // 2. Determine or create conversation
    let conversationId = params.inReplyToConversationId;
    if (!conversationId) {
      conversationId = `cnv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 3. Persist normalized message in Docdril DB
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMessage: DocdrilMessage = {
      id: messageId,
      conversationId,
      mailboxId: mailbox.id,
      providerMessageId: providerResult.messageId || `msg_p_${Date.now()}`,
      providerFolder: 'INBOX.Sent',
      senderEmail: mailbox.emailAddress,
      senderName: mailbox.displayName,
      recipients: [
        ...params.to.map((email) => ({ type: 'to' as const, email })),
        ...(params.cc || []).map((email) => ({ type: 'cc' as const, email })),
        ...(params.bcc || []).map((email) => ({ type: 'bcc' as const, email })),
      ],
      subject: params.subject,
      snippet: (params.bodyText || params.bodyHtml || '').replace(/<[^>]*>?/gm, '').substring(0, 140),
      bodyText: params.bodyText || '',
      bodyHtml: params.bodyHtml || `<p>${params.bodyText || ''}</p>`,
      status: 'SENT',
      isRead: true,
      isStarred: false,
      hasAttachments: (params.attachments?.length || 0) > 0,
      sentAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    await db.createMessage(newMessage);

    // 4. Emit internal event
    await eventBus.emit({
      id: `evt_send_${Date.now()}`,
      type: 'message.sent',
      organizationId: mailbox.organizationId,
      entityId: newMessage.id,
      entityType: 'message',
      timestamp: new Date().toISOString(),
      payload: {
        message: newMessage,
        conversationId,
      },
    });

    // 5. Log audit trail
    await db.logAudit({
      id: `aud_${Date.now()}`,
      organizationId: mailbox.organizationId,
      action: 'message.sent',
      entityType: 'message',
      entityId: newMessage.id,
      metadata: {
        mailbox: mailbox.emailAddress,
        to: params.to,
        subject: params.subject,
      },
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: newMessage.id,
    };
  }

  /**
   * Mark a message or conversation as read/unread.
   */
  static async setReadStatus(
    messageId: string,
    isRead: boolean
  ): Promise<DocdrilMessage> {
    const msg = await db.findMessageById(messageId);
    if (!msg) throw new Error(`Message not found: ${messageId}`);

    const updated = await db.updateMessage(messageId, { isRead });

    // Sync with provider flags if providerMessageId is present
    const mailbox = await db.findMailboxById(msg.mailboxId);
    if (mailbox && msg.providerMessageId) {
      try {
        const provider = ProviderFactory.getProvider(mailbox.provider);
        await provider.setMessageFlags(
          mailbox.providerMailboxId,
          msg.providerFolder,
          [msg.providerMessageId],
          isRead ? { add: ['\\Seen'] } : { remove: ['\\Seen'] }
        );
      } catch (err) {
        console.warn('[MailService] Failed to sync flags with provider:', err);
      }
    }

    return updated;
  }

  /**
   * Star / unstar a message.
   */
  static async setStarredStatus(
    messageId: string,
    isStarred: boolean
  ): Promise<DocdrilMessage> {
    const msg = await db.findMessageById(messageId);
    if (!msg) throw new Error(`Message not found: ${messageId}`);

    const updated = await db.updateMessage(messageId, { isStarred });

    const mailbox = await db.findMailboxById(msg.mailboxId);
    if (mailbox && msg.providerMessageId) {
      try {
        const provider = ProviderFactory.getProvider(mailbox.provider);
        await provider.setMessageFlags(
          mailbox.providerMailboxId,
          msg.providerFolder,
          [msg.providerMessageId],
          isStarred ? { add: ['\\Flagged'] } : { remove: ['\\Flagged'] }
        );
      } catch (err) {
        console.warn('[MailService] Failed to sync flags with provider:', err);
      }
    }

    return updated;
  }
}
