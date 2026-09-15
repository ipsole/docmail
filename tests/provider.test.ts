// Test Suite: Provider Abstraction & Hostinger/Mock Compliance
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MockMailProvider } from '../src/services/mail/mock.provider';
import { HostingerMailProvider } from '../src/services/mail/hostinger.provider';

describe('MailProvider Abstraction & Compliance', () => {
  it('should instantiate MockMailProvider and return mailboxes and quota', async () => {
    const provider = new MockMailProvider();

    assert.strictEqual(provider.providerName, 'mock');

    const account = await provider.getAccount();
    assert.ok(account.orderResourceId);
    assert.ok(Array.isArray(account.mailboxes));
    assert.strictEqual(account.mailboxes.length, 3);
    assert.strictEqual(account.mailboxes[0].address, 'info@docdril.com');

    const quota = await provider.getMailboxQuota(account.mailboxes[0].resourceId);
    assert.strictEqual(quota.supported, true);
    assert.ok(quota.totalLimit > 0);
  });

  it('should list folders and messages properly', async () => {
    const provider = new MockMailProvider();

    const folders = await provider.listFolders('AC_docdril_info');
    assert.ok(folders.length >= 3);
    assert.ok(folders.some((f) => f.folder === 'INBOX'));

    const paginated = await provider.listMessages('AC_docdril_info', 'INBOX');
    assert.ok(paginated.messages.length > 0);
    assert.ok(paginated.pagination.total > 0);

    const firstMsg = paginated.messages[0];
    assert.ok(firstMsg.uid);
    assert.ok(firstMsg.subject);
    assert.ok(firstMsg.from.address);
  });

  it('should send an email without throwing errors', async () => {
    const provider = new MockMailProvider();

    const result = await provider.sendMessage('AC_docdril_info', {
      to: ['test@docdril.com'],
      subject: 'Test Provider Dispatch',
      text: 'Hello from test',
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.messageId);
  });

  it('should verify HostingerMailProvider rejects missing token gracefully', async () => {
    const provider = new HostingerMailProvider('', 'https://api.mail.hostinger.com');

    assert.strictEqual(provider.providerName, 'hostinger');

    await assert.rejects(
      async () => {
        await provider.getAccount();
      },
      {
        message: /Hostinger API token is not configured/,
      }
    );
  });
});
