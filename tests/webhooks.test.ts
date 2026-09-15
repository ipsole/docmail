// Test Suite: Inbound & Outbound Webhook Verification & Idempotency
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { HostingerWebhookIngestService } from '../src/services/webhooks/hostinger-ingest.service';
import { signWebhookPayload, verifyHmacSignature } from '../src/lib/crypto';
import { db } from '../src/lib/db';

describe('Webhook Engine & Security', () => {
  before(async () => {
    // Register test mailbox for webhook delivery
    await db.addMailbox({
      id: 'mbx_webhook_test',
      organizationId: 'org_docdril_primary',
      providerAccountId: 'pacc_test',
      provider: 'mock',
      providerMailboxId: 'AC_webhook_test',
      emailAddress: 'info@docdril.com',
      displayName: 'Docdril Info',
      status: 'ACTIVE',
      quotaBytes: 5368709120,
      usedBytes: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('should process a valid Hostinger message.received webhook', async () => {
    const testEventId = `evt_test_${Date.now()}`;
    const payload = {
      event: 'message.received',
      eventId: testEventId,
      accountResourceId: 'AC_webhook_test',
      mailbox: 'info@docdril.com',
      data: {
        uid: 9991,
        folder: 'INBOX',
        subject: 'Realtime Webhook Test Message',
        from: { address: 'external@partner.org', name: 'External Partner' },
        to: [{ address: 'info@docdril.com', name: 'Docdril Info' }],
        text: 'This is a test webhook delivered by Hostinger infrastructure.',
        date: new Date().toISOString(),
      },
    };

    const result = await HostingerWebhookIngestService.processWebhook(null, payload);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.eventId, testEventId);

    // Verify message was normalized and saved to Docdril database
    const conversations = await db.listConversations({ mailboxId: 'mbx_webhook_test' });
    const match = conversations.find((c) => c.subject === 'Realtime Webhook Test Message');
    assert.ok(match, 'Conversation should exist in Docdril DB after webhook ingestion');
  });

  it('should guarantee idempotency when duplicate webhook is delivered', async () => {
    const fixedEventId = 'evt_duplicate_idempotency_check';
    const payload = {
      event: 'message.received',
      eventId: fixedEventId,
      mailbox: 'info@docdril.com',
      data: {
        uid: 9992,
        subject: 'Idempotency Test Email',
      },
    };

    // First delivery
    const firstResult = await HostingerWebhookIngestService.processWebhook(null, payload);
    assert.strictEqual(firstResult.success, true);

    // Second delivery (replay)
    const secondResult = await HostingerWebhookIngestService.processWebhook(null, payload);
    assert.strictEqual(secondResult.success, true);
    assert.ok(secondResult.message.includes('already processed'));
  });

  it('should correctly generate and verify HMAC SHA-256 signatures for outbound webhooks', () => {
    const secret = 'whsec_my_super_secret_crm_key';
    const body = JSON.stringify({
      type: 'message.received',
      organizationId: 'org_docdril_primary',
      timestamp: new Date().toISOString(),
    });

    const signature = signWebhookPayload(body, secret);
    assert.ok(signature);

    const isValid = verifyHmacSignature(body, signature, secret);
    assert.strictEqual(isValid, true);

    const isInvalid = verifyHmacSignature(body, signature, 'wrong_secret');
    assert.strictEqual(isInvalid, false);
  });
});
