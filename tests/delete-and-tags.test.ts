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

  await t.test('should batch tag and star multiple conversations seamlessly', async () => {
    const testMailboxId = 'mbx_ACed584379339f00d742210b2639ac';
    const cnv1 = `cnv_batch_${Date.now()}_1`;
    const cnv2 = `cnv_batch_${Date.now()}_2`;

    await db.createMessage({
      id: `msg_batch_${Date.now()}_1`,
      conversationId: cnv1,
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'duns@dnb.com',
      recipients: [{ type: 'to', email: 'team@docdril.com' }],
      subject: 'Dun & Bradstreet D-U-N-S Number Application',
      snippet: 'Your D-U-N-S Number Application has been processed',
      bodyText: 'D-U-N-S Number 311682940',
      bodyHtml: '',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    await db.createMessage({
      id: `msg_batch_${Date.now()}_2`,
      conversationId: cnv2,
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'duns@dnb.com',
      recipients: [{ type: 'to', email: 'team@docdril.com' }],
      subject: 'Confirmation of your D-U-N-S Number request',
      snippet: 'Tracking number assigned',
      bodyText: 'Details inside',
      bodyHtml: '',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    // 1. Batch tag both with "duns" and "important"
    const tagged = await db.batchAddTag([cnv1, cnv2], 'important');
    assert.equal(tagged.length, 2);

    const checkCnv1 = await db.findConversationById(cnv1);
    const checkCnv2 = await db.findConversationById(cnv2);
    assert.ok(checkCnv1?.tags?.includes('important'));
    assert.ok(checkCnv2?.tags?.includes('important'));
    assert.equal(checkCnv1?.isStarred, true, 'Tagging important should automatically set isStarred');
    assert.equal(checkCnv2?.isStarred, true, 'Tagging important should automatically set isStarred');

    // 2. Batch set starred to false
    await db.batchSetStarred([cnv1, cnv2], false);
    const unstarredCnv1 = await db.findConversationById(cnv1);
    assert.equal(unstarredCnv1?.isStarred, false);
    assert.equal(unstarredCnv1?.tags?.includes('important'), false, 'Unstarring should remove important tag');

    // Clean up
    await db.deleteConversationsPermanently([cnv1, cnv2], testMailboxId);
  });
});

