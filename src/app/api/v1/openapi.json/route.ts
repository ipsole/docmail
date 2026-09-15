// GET /api/v1/openapi.json
// Official OpenAPI 3.1.0 Specification for ChatGPT Custom GPT Actions & AI Agents
import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'DocMail by Docdril Communication API',
      description:
        'Secure email, contact, and template communication API for docdril.com. Enables ChatGPT and autonomous agents to read, search, draft, reply to emails, manage contacts, and apply business templates.',
      version: '1.0.0',
      contact: {
        name: 'Docdril Support',
        url: 'https://docdril.com',
        email: 'team@docdril.com',
      },
    },
    servers: [
      {
        url: 'https://docmail.docdril.com',
        description: 'Production DocMail Gateway',
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      '/api/v1/conversations': {
        get: {
          operationId: 'getConversations',
          summary: 'List and search email conversations',
          description:
            'Retrieves email threads for a mailbox. Supports filtering by folder (INBOX, INBOX.Sent, INBOX.Drafts, INBOX.Trash, INBOX.Spam), search query, or starred status.',
          parameters: [
            {
              name: 'mailboxId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Optional mailbox ID (e.g. mbx_ACed584379339f00d742210b2639ac). Defaults to active mailbox.',
            },
            {
              name: 'folder',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['INBOX', 'INBOX.Sent', 'INBOX.Drafts', 'INBOX.Trash', 'INBOX.Spam'],
                default: 'INBOX',
              },
              description: 'Folder name to list conversations from.',
            },
            {
              name: 'q',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Search keyword to filter email subjects or snippets.',
            },
            {
              name: 'starred',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['true', 'false'] },
              description: 'Filter for starred / flagged emails.',
            },
          ],
          responses: {
            '200': {
              description: 'A list of conversation threads',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            mailboxId: { type: 'string' },
                            subject: { type: 'string' },
                            snippet: { type: 'string' },
                            unreadCount: { type: 'number' },
                            messageCount: { type: 'number' },
                            isStarred: { type: 'boolean' },
                            lastMessageAt: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/conversations/{id}': {
        get: {
          operationId: 'getConversation',
          summary: 'Get conversation thread details and full message content',
          description:
            'Retrieves complete thread details including all messages, HTML/text bodies, headers, and attachments.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'The conversation ID (e.g. cnv_ACed584379339f00d742210b2639ac_Sent_2).',
            },
          ],
          responses: {
            '200': {
              description: 'Detailed conversation thread with message list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          subject: { type: 'string' },
                          messages: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                senderEmail: { type: 'string' },
                                senderName: { type: 'string' },
                                recipients: { type: 'array' },
                                subject: { type: 'string' },
                                bodyText: { type: 'string' },
                                bodyHtml: { type: 'string' },
                                receivedAt: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/messages/send': {
        post: {
          operationId: 'sendEmail',
          summary: 'Send an email or reply to a thread',
          description:
            'Dispatches an outgoing email via team@docdril.com or info@docdril.com. Can reply directly to an existing conversation by supplying inReplyToConversationId.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['to', 'subject', 'bodyText'],
                  properties: {
                    mailboxId: {
                      type: 'string',
                      description: 'Optional ID of the sender mailbox. Defaults to team@docdril.com.',
                    },
                    to: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'List of recipient email addresses.',
                    },
                    cc: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Optional list of CC email addresses.',
                    },
                    bcc: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Optional list of BCC email addresses.',
                    },
                    subject: {
                      type: 'string',
                      description: 'Email subject line.',
                    },
                    bodyText: {
                      type: 'string',
                      description: 'Plain text email body.',
                    },
                    bodyHtml: {
                      type: 'string',
                      description: 'Optional HTML email body. If omitted, generated automatically from bodyText.',
                    },
                    inReplyToConversationId: {
                      type: 'string',
                      description: 'Optional conversation ID to link this reply to an existing thread.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Email successfully sent',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          messageId: { type: 'string' },
                          status: { type: 'string', example: 'SENT' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/mailboxes': {
        get: {
          operationId: 'getMailboxes',
          summary: 'List connected mailboxes',
          description: 'Returns all available mailboxes (team@docdril.com, info@docdril.com) and storage quota.',
          responses: {
            '200': {
              description: 'List of mailboxes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            emailAddress: { type: 'string' },
                            displayName: { type: 'string' },
                            status: { type: 'string' },
                            quotaBytes: { type: 'number' },
                            usedBytes: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/contacts': {
        get: {
          operationId: 'getContacts',
          summary: 'List saved contacts',
          description: 'Retrieves contacts with names, companies, and emails for easy communication.',
          responses: {
            '200': {
              description: 'List of contacts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            company: { type: 'string' },
                            phone: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'createContact',
          summary: 'Add a new contact',
          description: 'Creates a contact record for future correspondence.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    company: { type: 'string' },
                    phone: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Contact created',
            },
          },
        },
      },
      '/api/v1/templates': {
        get: {
          operationId: 'getTemplates',
          summary: 'List reusable response templates',
          description: 'Fetches predefined templates with dynamic variable placeholders.',
          responses: {
            '200': {
              description: 'List of templates',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            subject: { type: 'string' },
                            bodyText: { type: 'string' },
                            category: { type: 'string' },
                            variables: { type: 'array', items: { type: 'string' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'createTemplate',
          summary: 'Create an email template',
          description: 'Saves a new reusable email template.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'subject', 'bodyText'],
                  properties: {
                    title: { type: 'string' },
                    subject: { type: 'string' },
                    bodyText: { type: 'string' },
                    category: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Template created',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Docdril API Key (e.g. dd_live_...)',
          description: 'Enter your DocMail API key as a Bearer token.',
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
