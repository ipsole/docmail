import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAuthCode, verifyAuthCode, generateAccessToken, verifyAccessToken } from '../src/lib/oauth';
import { authenticateRequest } from '../src/lib/auth';
import { NextRequest } from 'next/server';

test('OAuth 2.0 Flow & Token Verification', async (t) => {
  await t.test('should issue and verify cryptographic authorization codes', () => {
    const code = generateAuthCode({
      clientId: 'chatgpt',
      redirectUri: 'https://chatgpt.com/connector/oauth/uKBDe2LTKzJS',
      state: 'xyz123',
      scope: 'messages:read messages:send',
      createdAt: Math.floor(Date.now() / 1000),
    });

    assert.ok(code.startsWith('doc_code_'));
    const verified = verifyAuthCode(code);
    assert.ok(verified);
    assert.equal(verified?.clientId, 'chatgpt');
    assert.equal(verified?.redirectUri, 'https://chatgpt.com/connector/oauth/uKBDe2LTKzJS');

    // Tampered code should fail
    const tampered = code.slice(0, -4) + 'abcd';
    assert.equal(verifyAuthCode(tampered), null);
  });

  await t.test('should issue and verify OAuth access tokens', () => {
    const token = generateAccessToken('chatgpt', 'messages:read messages:send contacts:read');
    assert.ok(token.startsWith('dd_oauth_'));

    const verified = verifyAccessToken(token);
    assert.ok(verified);
    assert.equal(verified?.clientId, 'chatgpt');
    assert.equal(verified?.scope, 'messages:read messages:send contacts:read');

    // Tampered token should fail
    const tampered = token.slice(0, -4) + 'abcd';
    assert.equal(verifyAccessToken(tampered), null);
  });

  await t.test('should authenticate MCP requests using OAuth Bearer token', async () => {
    const token = generateAccessToken('chatgpt', 'messages:read messages:send');
    const req = new NextRequest('https://docmail.docdril.com/api/v1/mcp', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
    });

    const auth = await authenticateRequest(req);
    assert.equal(auth.type, 'api_key');
    assert.equal(auth.apiKeyName, 'OAuth (chatgpt)');
    assert.ok(auth.scopes?.includes('messages:read'));
  });
});
