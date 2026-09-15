// Test Suite: Security, Cryptography & RBAC Scopes
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encryptCredential, decryptCredential, hashApiKey, generateApiKey } from '../src/lib/crypto';
import { hasPermission, hasScope, PERMISSIONS } from '../src/lib/rbac';

describe('Security, Encryption & RBAC', () => {
  it('should encrypt and decrypt provider credentials accurately (AES-256-GCM)', () => {
    const rawSecretToken = 'hostinger_live_secret_token_xyz_987654321';
    const encrypted = encryptCredential(rawSecretToken);

    assert.notStrictEqual(encrypted, rawSecretToken);
    assert.ok(encrypted.includes(':'), 'Encrypted string should have iv:tag:ciphertext components');

    const decrypted = decryptCredential(encrypted);
    assert.strictEqual(decrypted, rawSecretToken);
  });

  it('should generate valid Docdril API keys with prefixes and SHA-256 hashes', () => {
    const { key, hash, prefix } = generateApiKey();

    assert.ok(key.startsWith('dd_live_'));
    assert.ok(hash);
    assert.strictEqual(hashApiKey(key), hash);
    assert.strictEqual(prefix.length, 8);
  });

  it('should enforce role-based permissions correctly', () => {
    // OWNER has all permissions
    assert.strictEqual(hasPermission('OWNER', PERMISSIONS.INTEGRATION_MANAGE), true);
    assert.strictEqual(hasPermission('OWNER', PERMISSIONS.MESSAGE_SEND), true);

    // MEMBER cannot manage integrations
    assert.strictEqual(hasPermission('MEMBER', PERMISSIONS.INTEGRATION_MANAGE), false);
    assert.strictEqual(hasPermission('MEMBER', PERMISSIONS.MESSAGE_SEND), true);

    // VIEWER cannot send messages
    assert.strictEqual(hasPermission('VIEWER', PERMISSIONS.MESSAGE_SEND), false);
    assert.strictEqual(hasPermission('VIEWER', PERMISSIONS.MESSAGE_READ), true);
  });

  it('should validate API key scopes with wildcard support', () => {
    const crmScopes = ['messages:read', 'messages:send', 'contacts:read'];

    assert.strictEqual(hasScope(crmScopes, 'messages:read'), true);
    assert.strictEqual(hasScope(crmScopes, 'messages:send'), true);
    assert.strictEqual(hasScope(crmScopes, 'webhooks:manage'), false);

    // Wildcard admin scope
    const adminScopes = ['admin:all'];
    assert.strictEqual(hasScope(adminScopes, 'webhooks:manage'), true);
    assert.strictEqual(hasScope(adminScopes, 'anything:custom'), true);
  });
});
