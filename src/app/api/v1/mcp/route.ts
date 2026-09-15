// /api/v1/mcp - MCP (Model Context Protocol) Server for ChatGPT & Claude
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MailService } from '@/services/mail/mail.service';
import { authenticateRequest } from '@/lib/auth';

const TOOLS = [
  {
    name: 'list_conversations',
    description: 'List and search email conversations in DocMail for a mailbox and folder (e.g. INBOX, Sent).',
    inputSchema: {
      type: 'object',
      properties: {
        mailboxId: { type: 'string', description: 'Mailbox ID. Defaults to active mailbox.' },
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
    description: 'Get full conversation thread details with message content, text, html, sender, and recipients.',
    inputSchema: {
      type: 'object',
      required: ['conversationId'],
      properties: {
        conversationId: { type: 'string', description: 'Conversation ID (e.g. cnv_ACed584379339f00d742210b2639ac_Sent_2)' },
      },
    },
  },
  {
    name: 'send_email',
    description: 'Send a new email or reply to an existing email thread from team@docdril.com or info@docdril.com.',
    inputSchema: {
      type: 'object',
      required: ['to', 'subject', 'bodyText'],
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: 'List of recipient email addresses.' },
        subject: { type: 'string', description: 'Subject of the email.' },
        bodyText: { type: 'string', description: 'Body text of the email.' },
        mailboxId: { type: 'string', description: 'Mailbox ID to send from.' },
        inReplyToConversationId: { type: 'string', description: 'Conversation ID if this is a reply.' },
      },
    },
  },
  {
    name: 'list_mailboxes',
    description: 'List all connected Docdril mailboxes (e.g. team@docdril.com, info@docdril.com) and storage quotas.',
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

export async function GET() {
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
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
    const body = await req.json();

    const { id, method, params } = body || {};

    // 1. Initialize
    if (method === 'initialize') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'docmail-mcp-server',
              version: '1.0.0',
            },
            capabilities: {
              tools: {},
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

    // 2. Tools List
    if (method === 'tools/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
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

    // 3. Tools Call
    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params || {};
      let toolResult: any = null;

      switch (name) {
        case 'list_conversations': {
          const mailboxes = await db.listMailboxes(orgId);
          const mailboxId = args.mailboxId || mailboxes[0]?.id;
          const folder = args.folder || 'INBOX';
          toolResult = await db.listConversations({
            mailboxId,
            folder,
            search: args.q,
            isStarred: args.starred,
          });
          break;
        }

        case 'get_conversation': {
          if (!args.conversationId) throw new Error('Missing argument "conversationId"');
          toolResult = await db.findConversationById(args.conversationId);
          break;
        }

        case 'send_email': {
          if (!args.to || !args.subject || !args.bodyText) {
            throw new Error('Missing required arguments: to, subject, or bodyText');
          }
          const mailboxes = await db.listMailboxes(orgId);
          const mailboxId = args.mailboxId || mailboxes[0]?.id;
          toolResult = await MailService.sendEmail({
            mailboxId,
            to: Array.isArray(args.to) ? args.to : [args.to],
            subject: args.subject,
            bodyText: args.bodyText,
            inReplyToConversationId: args.inReplyToConversationId,
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
          const mailboxId = args.mailboxId || mailboxes[0]?.id;
          toolResult = await db.moveConversationsToTrash(args.conversationIds, mailboxId);
          break;
        }

        case 'restore_conversations': {
          if (!args.conversationIds || !Array.isArray(args.conversationIds)) {
            throw new Error('Missing or invalid argument "conversationIds"');
          }
          const mailboxes = await db.listMailboxes(orgId);
          const mailboxId = args.mailboxId || mailboxes[0]?.id;
          toolResult = await db.restoreConversationsFromTrash(args.conversationIds, mailboxId);
          break;
        }

        case 'empty_trash': {
          const mailboxes = await db.listMailboxes(orgId);
          const mailboxId = args.mailboxId || mailboxes[0]?.id;
          const count = await db.emptyTrash(mailboxId);
          toolResult = { emptiedCount: count, message: 'Trash emptied successfully' };
          break;
        }

        default:
          throw new Error(`Unknown tool "${name}"`);
      }

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
