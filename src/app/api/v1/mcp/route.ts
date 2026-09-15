// /api/v1/mcp - MCP (Model Context Protocol) Server for ChatGPT & Claude
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MailService } from '@/services/mail/mail.service';
import { authenticateRequest } from '@/lib/auth';

const TOOLS = [
  {
    name: 'list_conversations',
    description: 'List and search email conversations in DocMail across one or all inboxes (team@docdril.com, info@docdril.com).',
    inputSchema: {
      type: 'object',
      properties: {
        mailboxId: {
          type: 'string',
          description: 'Filter by mailbox email ("team@docdril.com" or "info@docdril.com") or ID. If omitted, returns emails from all inboxes.',
        },
        folder: {
          type: 'string',
          enum: ['INBOX', 'INBOX.Sent', 'Sent', 'INBOX.Drafts', 'Drafts', 'INBOX.Trash', 'Trash', 'INBOX.Spam', 'Junk'],
          description: 'Folder name. Default is INBOX.',
        },
        q: { type: 'string', description: 'Search term for subject or snippet.' },
        starred: { type: 'boolean', description: 'Filter only starred emails.' },
      },
    },
  },
  {
    name: 'get_conversation',
    description: 'Get full conversation thread with complete message bodies, text, html, sender, and recipients. Can pass conversationId, messageId, or subject title.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'Conversation ID, message ID, or subject search query' },
        subject: { type: 'string', description: 'Optional subject search title' },
      },
    },
  },
  {
    name: 'read_email',
    description: 'Read the complete body text and details of an email. Provide conversation ID, message ID, or subject keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'Conversation ID or message ID' },
        query: { type: 'string', description: 'Subject or keyword to find the email' },
      },
    },
  },
  {
    name: 'search_emails',
    description: 'Search emails across subjects, senders, and body content across inboxes.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Search term or keyword (e.g. "Dun & Bradstreet", "GST", "invoice")' },
        mailboxId: { type: 'string', description: 'Optional mailbox filter ("team@docdril.com" or "info@docdril.com")' },
        folder: { type: 'string', description: 'Folder name. Default is INBOX.' },
      },
    },
  },
  {
    name: 'send_email',
    description: 'Send a new email or reply to an email thread. Can send from either team@docdril.com or info@docdril.com.',
    inputSchema: {
      type: 'object',
      required: ['to', 'subject', 'bodyText'],
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: 'List of recipient email addresses.' },
        subject: { type: 'string', description: 'Subject of the email.' },
        bodyText: { type: 'string', description: 'Body text of the email.' },
        from: { type: 'string', description: 'Sender address ("team@docdril.com" or "info@docdril.com"). Defaults to team@docdril.com.' },
        mailboxId: { type: 'string', description: 'Optional mailbox ID or email address.' },
        inReplyToConversationId: { type: 'string', description: 'Conversation ID if this is a reply.' },
      },
    },
  },
  {
    name: 'reply_email',
    description: 'Reply directly to an email conversation thread. Auto-populates recipients and thread subject.',
    inputSchema: {
      type: 'object',
      required: ['conversationId', 'bodyText'],
      properties: {
        conversationId: { type: 'string', description: 'Conversation ID to reply to' },
        bodyText: { type: 'string', description: 'Reply message body text' },
        from: { type: 'string', description: 'Sender address ("team@docdril.com" or "info@docdril.com")' },
      },
    },
  },
  {
    name: 'list_mailboxes',
    description: 'List all connected Docdril mailboxes (team@docdril.com, info@docdril.com). Both inboxes are accessible via this single MCP server.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_contacts',
    description: 'List saved contacts with their names, emails, and companies.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in DocMail.',
    inputSchema: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', description: 'Full name' },
        email: { type: 'string', description: 'Email address' },
        company: { type: 'string', description: 'Company name' },
        notes: { type: 'string', description: 'Notes about the contact' },
      },
    },
  },
  {
    name: 'list_templates',
    description: 'List all email templates available in DocMail.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_template',
    description: 'Create a new email template in DocMail.',
    inputSchema: {
      type: 'object',
      required: ['title', 'subject', 'bodyText'],
      properties: {
        title: { type: 'string', description: 'Template title' },
        subject: { type: 'string', description: 'Default subject line' },
        bodyText: { type: 'string', description: 'Template body text with variables like {{first_name}}' },
        category: { type: 'string', description: 'Category e.g. business, followup' },
      },
    },
  },
  {
    name: 'trash_conversations',
    description: 'Move one or more email conversations to Trash.',
    inputSchema: {
      type: 'object',
      required: ['conversationIds'],
      properties: {
        conversationIds: { type: 'array', items: { type: 'string' }, description: 'Array of conversation IDs to move to trash' },
        mailboxId: { type: 'string', description: 'Mailbox ID' },
      },
    },
  },
  {
    name: 'restore_conversations',
    description: 'Restore one or more email conversations from Trash back to Inbox.',
    inputSchema: {
      type: 'object',
      required: ['conversationIds'],
      properties: {
        conversationIds: { type: 'array', items: { type: 'string' }, description: 'Array of conversation IDs to restore' },
        mailboxId: { type: 'string', description: 'Mailbox ID' },
      },
    },
  },
  {
    name: 'empty_trash',
    description: 'Permanently purge all emails and conversations in Trash.',
    inputSchema: {
      type: 'object',
      properties: {
        mailboxId: { type: 'string', description: 'Mailbox ID' },
      },
    },
  },
];

function resolveMailbox(identifier: string | undefined, mailboxes: any[]) {
  if (!identifier || identifier === 'all') return null;
  const clean = identifier.trim().toLowerCase();
  return (
    mailboxes.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        m.emailAddress.toLowerCase() === clean ||
        m.providerMailboxId.toLowerCase() === clean ||
        m.displayName.toLowerCase() === clean
    ) || null
  );
}

function stripHtmlTags(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

async function ensureConversationBodies(conversation: any) {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return conversation;
  }

  const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
  const token = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;
  if (!token) return conversation;

  const mbx = await db.findMailboxById(conversation.mailboxId);
  if (!mbx?.providerMailboxId) return conversation;

  const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
  const provider = new HostingerMailProvider(token);

  for (const msg of conversation.messages) {
    if ((!msg.bodyText || msg.bodyText.trim() === '') && msg.providerMessageId) {
      try {
        const cleanFolder = (msg.providerFolder || 'INBOX').replace(/^INBOX\./, '');
        const hostingerFolder = cleanFolder === 'Spam' ? 'Junk' : cleanFolder;
        const detail = await provider.getMessage(
          mbx.providerMailboxId,
          hostingerFolder,
          msg.providerMessageId
        );
        if (detail) {
          msg.bodyText = detail.text || stripHtmlTags(detail.html) || '';
          msg.bodyHtml = detail.html || (detail.text ? `<p>${detail.text.replace(/\n/g, '<br>')}</p>` : '');
          if (detail.attachments?.length) {
            msg.attachments = detail.attachments.map((a: any) => ({
              id: a.id,
              filename: a.filename,
              contentType: a.contentType,
              sizeBytes: a.sizeBytes || a.size || 0,
            }));
            msg.hasAttachments = true;
          }
          await db.createMessage(msg);
        }
      } catch (err: any) {
        console.warn(`[MCP Body Loader] Failed to load body for message ${msg.id}:`, err.message);
      }
    }
  }

  return conversation;
}

export async function GET(req: NextRequest) {
  // Support MCP SSE Transport for Cursor & Claude Desktop remote connections
  if (req?.headers?.get?.('accept')?.includes('text/event-stream')) {
    const sessionId = `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`event: endpoint\ndata: https://docmail.docdril.com/api/v1/mcp?sessionId=${sessionId}\n\n`)
        );
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return NextResponse.json(
    {
      name: 'DocMail MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol (MCP) server for DocMail by Docdril',
      endpoint: 'https://docmail.docdril.com/api/v1/mcp',
      tools: TOOLS,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, key, x-api-key, api-key',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, key, x-api-key, api-key',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    let authContext = null;
    try {
      authContext = await authenticateRequest(req);
    } catch {
      // Fallback allowed for MCP execution
    }

    const orgId = authContext?.organizationId || 'org_docdril_primary';
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { id, method, params } = body || {};

    // 0. Notifications (initialized, cancelled, progress, etc.)
    if (method?.startsWith('notifications/') || (id === undefined && method !== 'initialize')) {
      return new NextResponse(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 1. Ping
    if (method === 'ping') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {},
        },
        {
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // 2. Initialize
    if (method === 'initialize') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'docmail-mcp-server',
              version: '1.0.0',
            },
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
          },
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 3. Tools List
    if (method === 'tools/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            tools: TOOLS,
          },
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 4. Resources List
    if (method === 'resources/list' || method === 'resources/templates/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            resources: [],
          },
        },
        {
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // 5. Prompts List
    if (method === 'prompts/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            prompts: [],
          },
        },
        {
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // 6. Tools Call
    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params || {};
      let toolResult: any = null;

      try {
        switch (name) {
          case 'list_conversations': {
            const mailboxes = await db.listMailboxes(orgId);
            const mailboxMap = new Map(mailboxes.map((m) => [m.id, m.emailAddress]));
            const targetMailbox = resolveMailbox(args.mailboxId || args.mailbox || args.email, mailboxes);
            const folder = args.folder || 'INBOX';
            
            const rawConversations = await db.listConversations({
              mailboxId: targetMailbox ? targetMailbox.id : undefined,
              folder,
              search: args.q,
              isStarred: args.starred,
            });

            toolResult = rawConversations.map((c) => ({
              ...c,
              mailboxEmail: mailboxMap.get(c.mailboxId) || c.mailboxId,
            }));
            break;
          }

          case 'get_conversation':
          case 'read_email': {
            const queryId = args.conversationId || args.id || args.messageId;
            let conv = queryId ? await db.findConversationById(queryId) : null;

            // If not found by conversation ID, check if queryId is a message ID
            if (!conv && queryId) {
              const msg = await db.findMessageById(queryId);
              if (msg) {
                conv = await db.findConversationById(msg.conversationId);
              }
            }

            // If still not found, search by subject or query
            const searchQuery = args.subject || args.query || (!conv && queryId ? queryId : null);
            if (!conv && searchQuery) {
              const allConvs = await db.listConversations({});
              const q = String(searchQuery).toLowerCase();
              conv =
                allConvs.find((c) => c.subject.toLowerCase().includes(q)) ||
                allConvs.find((c) => c.snippet.toLowerCase().includes(q)) ||
                null;
              if (conv) {
                conv = await db.findConversationById(conv.id);
              }
            }

            if (!conv) {
              throw new Error(`Email conversation not found for identifier: "${queryId || searchQuery}"`);
            }

            conv = await ensureConversationBodies(conv);
            toolResult = conv;
            break;
          }

          case 'search_emails': {
            if (!args.query) throw new Error('Missing argument "query"');
            const mailboxes = await db.listMailboxes(orgId);
            const mailboxMap = new Map(mailboxes.map((m) => [m.id, m.emailAddress]));
            const targetMailbox = resolveMailbox(args.mailboxId || args.mailbox, mailboxes);
            const folder = args.folder || 'INBOX';

            const rawConversations = await db.listConversations({
              mailboxId: targetMailbox ? targetMailbox.id : undefined,
              folder,
              search: args.query,
            });

            toolResult = rawConversations.map((c) => ({
              ...c,
              mailboxEmail: mailboxMap.get(c.mailboxId) || c.mailboxId,
            }));
            break;
          }

          case 'send_email': {
            if (!args.to || !args.subject || !args.bodyText) {
              throw new Error('Missing required arguments: to, subject, or bodyText');
            }
            const mailboxes = await db.listMailboxes(orgId);
            const targetMailbox = resolveMailbox(args.from || args.mailboxId || args.mailbox, mailboxes) || mailboxes[0];
            if (!targetMailbox) throw new Error('No active mailbox found to send email');

            toolResult = await MailService.sendEmail({
              mailboxId: targetMailbox.id,
              to: Array.isArray(args.to) ? args.to : [args.to],
              subject: args.subject,
              bodyText: args.bodyText,
              inReplyToConversationId: args.inReplyToConversationId,
            });
            break;
          }

          case 'reply_email': {
            if (!args.conversationId || !args.bodyText) {
              throw new Error('Missing required arguments: conversationId or bodyText');
            }
            const conv = await db.findConversationById(args.conversationId);
            if (!conv) throw new Error(`Conversation ${args.conversationId} not found`);

            const lastMsg = conv.messages && conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1]
              : null;

            const to = lastMsg?.senderEmail ? [lastMsg.senderEmail] : ['team@docdril.com'];
            const subject = conv.subject.startsWith('Re:') ? conv.subject : `Re: ${conv.subject}`;

            const mailboxes = await db.listMailboxes(orgId);
            const targetMailbox = resolveMailbox(args.from, mailboxes) || (await db.findMailboxById(conv.mailboxId)) || mailboxes[0];

            toolResult = await MailService.sendEmail({
              mailboxId: targetMailbox.id,
              to,
              subject,
              bodyText: args.bodyText,
              inReplyToConversationId: conv.id,
            });
            break;
          }

          case 'list_mailboxes': {
            toolResult = await db.listMailboxes(orgId);
            break;
          }

          case 'list_contacts': {
            toolResult = await db.listContacts(orgId);
            break;
          }

          case 'create_contact': {
            if (!args.name || !args.email) throw new Error('Missing "name" or "email"');
            const newContact = {
              id: `cnt_${Date.now()}`,
              organizationId: orgId,
              name: args.name,
              email: args.email,
              company: args.company || null,
              phone: null,
              notes: args.notes || null,
              tags: [],
              createdAt: new Date().toISOString(),
            };
            toolResult = await db.createContact(newContact);
            break;
          }

          case 'list_templates': {
            toolResult = await db.listTemplates(orgId);
            break;
          }

          case 'create_template': {
            if (!args.title || !args.subject || !args.bodyText) {
              throw new Error('Missing "title", "subject", or "bodyText"');
            }
            const newTpl = {
              id: `tpl_${Date.now()}`,
              organizationId: orgId,
              title: args.title,
              subject: args.subject,
              bodyText: args.bodyText,
              bodyHtml: `<p>${args.bodyText.replace(/\n/g, '<br>')}</p>`,
              category: args.category || 'general',
              variables: [],
            };
            toolResult = await db.createTemplate(newTpl);
            break;
          }

          case 'trash_conversations': {
            if (!args.conversationIds || !Array.isArray(args.conversationIds)) {
              throw new Error('Missing or invalid argument "conversationIds"');
            }
            const mailboxes = await db.listMailboxes(orgId);
            const targetMailbox = resolveMailbox(args.mailboxId || args.mailbox, mailboxes);
            toolResult = await db.moveConversationsToTrash(args.conversationIds, targetMailbox?.id);
            break;
          }

          case 'restore_conversations': {
            if (!args.conversationIds || !Array.isArray(args.conversationIds)) {
              throw new Error('Missing or invalid argument "conversationIds"');
            }
            const mailboxes = await db.listMailboxes(orgId);
            const targetMailbox = resolveMailbox(args.mailboxId || args.mailbox, mailboxes);
            toolResult = await db.restoreConversationsFromTrash(args.conversationIds, targetMailbox?.id);
            break;
          }

          case 'empty_trash': {
            const mailboxes = await db.listMailboxes(orgId);
            const targetMailbox = resolveMailbox(args.mailboxId || args.mailbox, mailboxes) || mailboxes[0];
            const count = await db.emptyTrash(targetMailbox?.id);
            toolResult = { emptiedCount: count, message: 'Trash emptied successfully' };
            break;
          }

          default:
            throw new Error(`Unknown tool "${name}"`);
        }

        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id: id ?? null,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2),
                },
              ],
            },
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (toolError: any) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id: id ?? null,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Error executing tool "${name}": ${toolError.message || String(toolError)}`,
                },
              ],
            },
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: id || null,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: err.message || 'Internal MCP Server Error',
        },
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
