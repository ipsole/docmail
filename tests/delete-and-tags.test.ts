import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/lib/db';

test('Permanent Deletion & Tags Management', async (t) => {
  await t.test('should permanently delete conversation and record tombstones', async () => {
    // 1. Create a dummy test conversation and message
    const testCnvId = `cnv_test_del_${Date.now()}`;
    const testMsgId = `msg_test_del_${Date.now()}`;
    const testMailboxId = 'mbx_ACed584379339f00d742210b2639ac';

    await db.createMessage({
      id: testMsgId,
      conversationId: testCnvId,
      mailboxId: testMailboxId,
      providerMessageId: '999999',
      providerFolder: 'INBOX',
      senderEmail: 'test@example.com',
      senderName: 'Test',
      recipients: [{ type: 'to', email: 'team@docdril.com' }],
      subject: 'Temporary Message for Permanent Deletion',
      snippet: 'This message will be deleted forever',
      bodyText: 'Delete me forever',
      bodyHtml: '<p>Delete me forever</p>',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    const created = await db.findConversationById(testCnvId);
    assert.ok(created, 'Conversation should be created');

    // 2. Permanently delete
    const affected = await db.deleteConversationsPermanently([testCnvId], testMailboxId);
    assert.ok(affected.includes(testCnvId));

    // 3. Verify it is removed
    const afterDelete = await db.findConversationById(testCnvId);
    assert.equal(afterDelete, null, 'Conversation must be gone from DB');

    // 4. Verify tombstones block recreation
    await db.createMessage({
      id: testMsgId,
      conversationId: testCnvId,
      mailboxId: testMailboxId,
      providerMessageId: '999999',
      providerFolder: 'INBOX',
      senderEmail: 'test@example.com',
      senderName: 'Test',
      recipients: [{ type: 'to', email: 'team@docdril.com' }],
      subject: 'Temporary Message Resurrected',
      snippet: 'Should not exist',
      bodyText: '',
      bodyHtml: '',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    const blockedCnv = await db.findConversationById(testCnvId);
    assert.equal(blockedCnv, null, 'Tombstone must prevent recreation of deleted message/conversation');
  });

  await t.test('should manage tags on conversations seamlessly', async () => {
    const testCnvId = `cnv_test_tag_${Date.now()}`;
    const testMailboxId = 'mbx_ACed584379339f00d742210b2639ac';

    await db.createMessage({
      id: `msg_test_tag_${Date.now()}`,
      conversationId: testCnvId,
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'client@example.com',
      recipients: [{ type: 'to', email: 'team@docdril.com' }],
      subject: 'Invoice & Proposal Discussion',
      snippet: 'Important proposal attached',
      bodyText: 'Hello team',
      bodyHtml: '',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    // Add tags: general, important, custom 'invoice'
    await db.addTagToConversation(testCnvId, 'important');
    await db.addTagToConversation(testCnvId, 'invoice');

    let cnv = await db.findConversationById(testCnvId);
    assert.ok(cnv?.tags?.includes('important'));
    assert.ok(cnv?.tags?.includes('invoice'));

    // Filter by tag
    const invoiceConvs = await db.listConversations({ tag: 'invoice' });
    assert.ok(invoiceConvs.some((c) => c.id === testCnvId));

    // Remove tag
    await db.removeTagFromConversation(testCnvId, 'invoice');
    cnv = await db.findConversationById(testCnvId);
    assert.equal(cnv?.tags?.includes('invoice'), false);

    // Clean up
    await db.deleteConversationsPermanently([testCnvId], testMailboxId);
  });
});
