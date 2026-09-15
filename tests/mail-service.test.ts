// Test Suite: Docdril Mail Service & Threading
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { MailService } from '../src/services/mail/mail.service';
import { db } from '../src/lib/db';

describe('MailService & Threading Logic', () => {
  before(async () => {
    // Register a test mailbox
    await db.addMailbox({
      id: 'mbx_test_mailbox',
      organizationId: 'org_docdril_primary',
      providerAccountId: 'pacc_test',
      provider: 'mock',
      providerMailboxId: 'AC_test_mailbox',
      emailAddress: 'test@docdril.com',
      displayName: 'Test Mailbox',
      status: 'ACTIVE',
      quotaBytes: 5368709120,
      usedBytes: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should successfully send an email and record it in database and sent folder', async () => {
    const sendResult = await MailService.sendEmail({
      mailboxId: 'mbx_test_mailbox',
      to: ['client@healthcarepartners.com'],
      subject: 'Docdril Clinical Suite Demo Confirmation',
      bodyText: 'Looking forward to our demo session on Friday at 2pm.',
    });

    assert.strictEqual(sendResult.success, true);
    assert.ok(sendResult.messageId);

    // Verify stored in DB
    const saved = await db.findMessageById(sendResult.messageId);
    assert.ok(saved);
    assert.strictEqual(saved.subject, 'Docdril Clinical Suite Demo Confirmation');
    assert.strictEqual(saved.status, 'SENT');
    assert.strictEqual(saved.providerFolder, 'INBOX.Sent');
  });

  it('should toggle read and starred flags on messages', async () => {
    // Create a message to toggle
    const testMsg = await db.createMessage({
      id: 'msg_test_flag_toggle',
      conversationId: 'cnv_test_flag_toggle',
      mailboxId: 'mbx_test_mailbox',
      providerFolder: 'INBOX',
      senderEmail: 'sender@example.com',
      recipients: [{ type: 'to', email: 'test@docdril.com' }],
      subject: 'Flag Toggle Test',
      snippet: 'Testing flags',
      status: 'RECEIVED',
      isRead: false,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    assert.ok(testMsg);

    // Mark read
    const readMsg = await MailService.setReadStatus(testMsg.id, true);
    assert.strictEqual(readMsg.isRead, true);

    // Toggle star
    const starredMsg = await MailService.setStarredStatus(testMsg.id, true);
    assert.strictEqual(starredMsg.isStarred, true);
  });

  it('should list conversations filtered by mailbox', async () => {
    const list = await db.listConversations({
      mailboxId: 'mbx_test_mailbox',
    });

    assert.ok(list.length >= 1);
    assert.ok(list[0].id);
    assert.ok(list[0].subject);
  });
});
