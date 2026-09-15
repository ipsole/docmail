// Test Suite: Trash, Restore, Batch Operations & Empty Trash Forever
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/lib/db';
import { POST as batchRoute } from '../src/app/api/v1/conversations/batch/route';
import { DELETE as deleteSingleRoute } from '../src/app/api/v1/conversations/[id]/route';
import { NextRequest } from 'next/server';

describe('Trash, Batch Deletion, Restore & Empty Trash Forever', () => {
  const testMailboxId = 'mbx_test_trash_mailbox';

  before(async () => {
    await db.addMailbox({
      id: testMailboxId,
      organizationId: 'org_docdril_primary',
      providerAccountId: 'acc_test',
      provider: 'mock',
      providerMailboxId: 'AC_trash_test',
      emailAddress: 'trash-test@docdril.com',
      displayName: 'Trash Test',
      status: 'ACTIVE',
      quotaBytes: 5368709120,
      usedBytes: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should move single and multiple conversations to trash and isolate them from Inbox', async () => {
    // 1. Create two test conversations
    await db.createMessage({
      id: 'msg_t1',
      conversationId: 'cnv_t1',
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'sender1@example.com',
      recipients: [{ type: 'to', email: 'trash-test@docdril.com' }],
      subject: 'Trash Test Email 1',
      snippet: 'Testing moving to trash 1',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    await db.createMessage({
      id: 'msg_t2',
      conversationId: 'cnv_t2',
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'sender2@example.com',
      recipients: [{ type: 'to', email: 'trash-test@docdril.com' }],
      subject: 'Trash Test Email 2',
      snippet: 'Testing moving to trash 2',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    // Verify both are in INBOX
    let inboxList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX' });
    assert.ok(inboxList.some((c) => c.id === 'cnv_t1'));
    assert.ok(inboxList.some((c) => c.id === 'cnv_t2'));

    // 2. Move cnv_t1 to trash via db.moveConversationsToTrash
    await db.moveConversationsToTrash(['cnv_t1'], testMailboxId);

    // Verify cnv_t1 is gone from INBOX
    inboxList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX' });
    assert.strictEqual(inboxList.some((c) => c.id === 'cnv_t1'), false);
    assert.ok(inboxList.some((c) => c.id === 'cnv_t2'));

    // Verify cnv_t1 appears in Trash
    let trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.ok(trashList.some((c) => c.id === 'cnv_t1'));
    assert.strictEqual(trashList.some((c) => c.id === 'cnv_t2'), false);

    // 3. Move cnv_t2 to trash as well
    await db.moveConversationsToTrash(['cnv_t2'], testMailboxId);
    trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.ok(trashList.some((c) => c.id === 'cnv_t1'));
    assert.ok(trashList.some((c) => c.id === 'cnv_t2'));
  });

  it('should restore conversations from trash back to Inbox', async () => {
    // Restore cnv_t1
    await db.restoreConversationsFromTrash(['cnv_t1'], testMailboxId);

    // Verify cnv_t1 is back in INBOX
    const inboxList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX' });
    assert.ok(inboxList.some((c) => c.id === 'cnv_t1'));

    // Verify cnv_t1 is removed from Trash, but cnv_t2 remains
    const trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.strictEqual(trashList.some((c) => c.id === 'cnv_t1'), false);
    assert.ok(trashList.some((c) => c.id === 'cnv_t2'));
  });

  it('should permanently delete a conversation forever', async () => {
    // Delete cnv_t2 permanently
    await db.deleteConversationsPermanently(['cnv_t2'], testMailboxId);

    // Verify cnv_t2 is gone from DB completely
    const cnv = await db.findConversationById('cnv_t2');
    assert.strictEqual(cnv, null);

    const trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.strictEqual(trashList.some((c) => c.id === 'cnv_t2'), false);
  });

  it('should empty trash completely', async () => {
    // Create another message and trash it
    await db.createMessage({
      id: 'msg_t3',
      conversationId: 'cnv_t3',
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'sender3@example.com',
      recipients: [{ type: 'to', email: 'trash-test@docdril.com' }],
      subject: 'Trash Test Email 3',
      snippet: 'Testing empty trash',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    await db.moveConversationsToTrash(['cnv_t3'], testMailboxId);

    let trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.ok(trashList.length >= 1);

    // Empty trash
    const emptiedCount = await db.emptyTrash(testMailboxId);
    assert.ok(emptiedCount >= 1);

    trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.strictEqual(trashList.length, 0);
  });

  it('should support batch API route for trash, restore, and delete_forever', async () => {
    // Setup message
    await db.createMessage({
      id: 'msg_batch_1',
      conversationId: 'cnv_batch_1',
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'sender_batch@example.com',
      recipients: [{ type: 'to', email: 'trash-test@docdril.com' }],
      subject: 'Batch API Test',
      snippet: 'Batch API Test',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    // 1. Batch Trash
    const trashReq = new NextRequest('http://localhost:3000/api/v1/conversations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trash',
        conversationIds: ['cnv_batch_1'],
        mailboxId: testMailboxId,
      }),
    });
    const trashRes = await batchRoute(trashReq);
    const trashData = await trashRes.json();
    assert.strictEqual(trashData.success, true);
    assert.strictEqual(trashData.data.action, 'trash');

    let trashList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX.Trash' });
    assert.ok(trashList.some((c) => c.id === 'cnv_batch_1'));

    // 2. Batch Restore
    const restoreReq = new NextRequest('http://localhost:3000/api/v1/conversations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore',
        conversationIds: ['cnv_batch_1'],
        mailboxId: testMailboxId,
      }),
    });
    const restoreRes = await batchRoute(restoreReq);
    const restoreData = await restoreRes.json();
    assert.strictEqual(restoreData.success, true);

    let inboxList = await db.listConversations({ mailboxId: testMailboxId, folder: 'INBOX' });
    assert.ok(inboxList.some((c) => c.id === 'cnv_batch_1'));

    // 3. Batch Delete Forever
    const delReq = new NextRequest('http://localhost:3000/api/v1/conversations/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_forever',
        conversationIds: ['cnv_batch_1'],
        mailboxId: testMailboxId,
      }),
    });
    const delRes = await batchRoute(delReq);
    const delData = await delRes.json();
    assert.strictEqual(delData.success, true);

    const checkCnv = await db.findConversationById('cnv_batch_1');
    assert.strictEqual(checkCnv, null);
  });

  it('should support DELETE /api/v1/conversations/[id] for single trash and permanent deletion', async () => {
    // Setup message
    await db.createMessage({
      id: 'msg_single_del',
      conversationId: 'cnv_single_del',
      mailboxId: testMailboxId,
      providerFolder: 'INBOX',
      senderEmail: 'single@example.com',
      recipients: [{ type: 'to', email: 'trash-test@docdril.com' }],
      subject: 'Single Delete Test',
      snippet: 'Single Delete Test',
      status: 'RECEIVED',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    // Move to trash via DELETE
    const reqTrash = new NextRequest('http://localhost:3000/api/v1/conversations/cnv_single_del', {
      method: 'DELETE',
    });
    const resTrash = await deleteSingleRoute(reqTrash, { params: Promise.resolve({ id: 'cnv_single_del' }) });
    const dataTrash = await resTrash.json();
    assert.strictEqual(dataTrash.success, true);
    assert.strictEqual(dataTrash.data.status, 'TRASHED');

    // Delete permanently via DELETE with ?permanent=true
    const reqPerm = new NextRequest('http://localhost:3000/api/v1/conversations/cnv_single_del?permanent=true', {
      method: 'DELETE',
    });
    const resPerm = await deleteSingleRoute(reqPerm, { params: Promise.resolve({ id: 'cnv_single_del' }) });
    const dataPerm = await resPerm.json();
    assert.strictEqual(dataPerm.success, true);
    assert.strictEqual(dataPerm.data.status, 'DELETED_PERMANENTLY');

    const checkCnv = await db.findConversationById('cnv_single_del');
    assert.strictEqual(checkCnv, null);
  });
});
