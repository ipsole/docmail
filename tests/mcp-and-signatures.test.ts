// Test Suite: ChatGPT OpenAPI, MCP Server, Signatures & Sent Folder
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/lib/db';
import { GET as getOpenApi } from '../src/app/api/v1/openapi.json/route';
import { GET as getMcp, POST as postMcp } from '../src/app/api/v1/mcp/route';
import { NextRequest } from 'next/server';

describe('ChatGPT OpenAPI & MCP Server Integration', () => {
  it('should return valid OpenAPI 3.1.0 specification with all core mail endpoints', async () => {
    const res = await getOpenApi();
    assert.strictEqual(res.status, 200);
    const spec = await res.json();

    assert.strictEqual(spec.openapi, '3.1.0');
    assert.ok(spec.paths['/api/v1/conversations']);
    assert.ok(spec.paths['/api/v1/conversations/{id}']);
    assert.ok(spec.paths['/api/v1/messages/send']);
    assert.ok(spec.paths['/api/v1/mailboxes']);
    assert.ok(spec.paths['/api/v1/contacts']);
    assert.ok(spec.paths['/api/v1/templates']);
  });

  it('should support MCP initialize and tools/list', async () => {
    // 1. Initialize
    const initReq = new NextRequest('http://localhost:3000/api/v1/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
      }),
    });
    const initRes = await postMcp(initReq);
    const initData = await initRes.json();
    assert.strictEqual(initData.result.serverInfo.name, 'docmail-mcp-server');

    // 2. Tools List
    const toolsReq = new NextRequest('http://localhost:3000/api/v1/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      }),
    });
    const toolsRes = await postMcp(toolsReq);
    const toolsData = await toolsRes.json();
    assert.ok(Array.isArray(toolsData.result.tools));
    const toolNames = toolsData.result.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('list_conversations'));
    assert.ok(toolNames.includes('get_conversation'));
    assert.ok(toolNames.includes('send_email'));
    assert.ok(toolNames.includes('list_mailboxes'));
    assert.ok(toolNames.includes('list_contacts'));
    assert.ok(toolNames.includes('list_templates'));
  });

  it('should support MCP tools/call for list_mailboxes', async () => {
    const callReq = new NextRequest('http://localhost:3000/api/v1/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'list_mailboxes',
          arguments: {},
        },
      }),
    });
    const callRes = await postMcp(callReq);
    const callData = await callRes.json();
    assert.ok(callData.result.content);
    assert.strictEqual(callData.result.content[0].type, 'text');
  });

  it('should verify Team Docdril and Docdril signatures exist with no DocMail branding', async () => {
    const signatures = await db.listSignatures('org_docdril_primary');
    assert.ok(signatures.length >= 2);

    const teamSig = signatures.find((s) => s.name === 'Team Docdril');
    const infoSig = signatures.find((s) => s.name === 'Docdril');

    assert.ok(teamSig, 'Team Docdril signature should exist');
    assert.ok(infoSig, 'Docdril signature should exist');

    assert.ok(teamSig.contentHtml.includes('Team Docdril'));
    assert.ok(infoSig.contentHtml.includes('Docdril'));

    for (const sig of signatures) {
      assert.strictEqual(
        sig.contentHtml.includes('DocMail'),
        false,
        'Signature content must not include "DocMail" text'
      );
    }
  });

  it('should correctly list Sent folder conversations with both Sent and INBOX.Sent queries', async () => {
    // Add two distinct messages in Sent folder
    await db.createMessage({
      id: 'msg_test_sent_1',
      conversationId: 'cnv_test_sent_1',
      mailboxId: 'mbx_test_mailbox',
      providerFolder: 'INBOX.Sent',
      senderEmail: 'team@docdril.com',
      recipients: [{ type: 'to', email: 'recipient1@example.com' }],
      subject: 'Sent Message 1',
      snippet: 'Sent Message 1',
      status: 'SENT',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    await db.createMessage({
      id: 'msg_test_sent_2',
      conversationId: 'cnv_test_sent_2',
      mailboxId: 'mbx_test_mailbox',
      providerFolder: 'Sent',
      senderEmail: 'team@docdril.com',
      recipients: [{ type: 'to', email: 'recipient2@example.com' }],
      subject: 'Sent Message 2',
      snippet: 'Sent Message 2',
      status: 'SENT',
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date().toISOString(),
    });

    const listWithInboxSent = await db.listConversations({
      mailboxId: 'mbx_test_mailbox',
      folder: 'INBOX.Sent',
    });
    const listWithSent = await db.listConversations({
      mailboxId: 'mbx_test_mailbox',
      folder: 'Sent',
    });

    assert.ok(listWithInboxSent.some((c) => c.id === 'cnv_test_sent_1'));
    assert.ok(listWithInboxSent.some((c) => c.id === 'cnv_test_sent_2'));
    assert.ok(listWithSent.some((c) => c.id === 'cnv_test_sent_1'));
    assert.ok(listWithSent.some((c) => c.id === 'cnv_test_sent_2'));
  });

  it('should support openapi.json POST fallback for MCP tools/list', async () => {
    const { POST: postOpenApi } = await import('../src/app/api/v1/openapi.json/route');
    const req = new NextRequest('http://localhost:3000/api/v1/openapi.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'tools/list',
      }),
    });
    const res = await postOpenApi(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.jsonrpc, '2.0');
    assert.ok(Array.isArray(data.result.tools));
  });

  it('should create, list with masked keys, and delete API keys permanently', async () => {
    const { GET: getKeys, POST: postKey, DELETE: deleteKey } = await import('../src/app/api/v1/admin/api-keys/route');

    // 1. Create a key
    const createReq = new NextRequest('http://localhost:3000/api/v1/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Deletable Key',
        scopes: ['messages:read'],
      }),
    });
    const createRes = await postKey(createReq);
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.ok(createData.data.id);
    assert.ok(createData.data.rawSecretKey);
    const newKeyId = createData.data.id;

    // 2. List keys - verify masked key is returned, NOT full secret
    const listReq = new NextRequest('http://localhost:3000/api/v1/admin/api-keys');
    const listRes = await getKeys(listReq);
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData.data));
    const createdKeyInList = listData.data.find((k: any) => k.id === newKeyId);
    assert.ok(createdKeyInList);
    assert.ok(createdKeyInList.maskedKey.includes('••••••••'));
    assert.strictEqual(createdKeyInList.rawSecretKey, undefined);

    // 3. Delete key
    const delReq = new NextRequest(`http://localhost:3000/api/v1/admin/api-keys?id=${newKeyId}`, {
      method: 'DELETE',
    });
    const delRes = await deleteKey(delReq);
    const delData = await delRes.json();
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delData.success, true);

    // 4. Verify key is completely removed
    const listAfterReq = new NextRequest('http://localhost:3000/api/v1/admin/api-keys');
    const listAfterRes = await getKeys(listAfterReq);
    const listAfterData = await listAfterRes.json();
    assert.strictEqual(listAfterData.data.some((k: any) => k.id === newKeyId), false);
  });
});

