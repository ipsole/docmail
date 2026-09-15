// Database Access Layer for DocMail
// Maintains normalized storage and real-time state for connected user mailboxes.

import {
  DocdrilMailbox,
  DocdrilConversation,
  DocdrilMessage,
  DocdrilContact,
  DocdrilTemplate,
  DocdrilSignature,
  DocdrilApiKey,
  DocdrilWebhookSubscription,
  DocdrilAuditLog,
} from '../types';

import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = process.env.VERCEL
  ? path.resolve('/tmp', 'docmail_db.json')
  : path.resolve(process.cwd(), 'data', 'docmail_db.json');

class DocMailDatabase {
  mailboxes: DocdrilMailbox[] = [];
  conversations: DocdrilConversation[] = [];
  messages: DocdrilMessage[] = [];
  contacts: DocdrilContact[] = [];

  templates: DocdrilTemplate[] = [
    {
      id: 'tpl_general_intro',
      organizationId: 'org_docdril_primary',
      title: 'Introduction & Proposal',
      subject: 'Connecting with Docdril: {{company}} Discussion',
      bodyHtml: '<p>Hi {{first_name}},</p><p>Thank you for connecting. I am reaching out regarding our discussion.</p><p>Best regards,<br>{{sender_name}}</p>',
      bodyText: 'Hi {{first_name}},\n\nThank you for connecting. I am reaching out regarding our discussion.\n\nBest regards,\n{{sender_name}}',
      category: 'business',
      variables: ['first_name', 'company', 'sender_name'],
    },
  ];

  signatures: DocdrilSignature[] = [
    {
      id: 'sig_default',
      organizationId: 'org_docdril_primary',
      userId: null,
      mailboxId: null,
      name: 'Professional Default',
      contentHtml: '<p style="font-family: sans-serif; font-size: 13px; color: #475569;"><strong>DocMail</strong> | Docdril Communication Platform<br><span style="color: #f59e0b;">www.docdril.com</span></p>',
      isDefault: true,
    },
  ];

  apiKeys: DocdrilApiKey[] = [
    {
      id: 'key_primary',
      organizationId: 'org_docdril_primary',
      name: 'Docdril CRM Service Credential',
      prefix: 'dd_live',
      scopes: ['messages:read', 'messages:send', 'contacts:read', 'contacts:write'],
      lastUsedAt: new Date().toISOString(),
      isRevoked: false,
      createdAt: new Date().toISOString(),
    },
  ];

  webhookSubscriptions: DocdrilWebhookSubscription[] = [];
  auditLogs: DocdrilAuditLog[] = [];
  aliases: any[] = [];
  forwarders: any[] = [];
  autoreplies: any[] = [];
  processedWebhookEvents = new Set<string>();

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.loadFromDisk();
    }
  }

  loadFromDisk() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.mailboxes)) this.mailboxes = data.mailboxes;
        if (Array.isArray(data.conversations)) this.conversations = data.conversations;
        if (Array.isArray(data.messages)) this.messages = data.messages;
        if (Array.isArray(data.contacts)) this.contacts = data.contacts;
        if (Array.isArray(data.templates) && data.templates.length > 0) this.templates = data.templates;
        if (Array.isArray(data.signatures) && data.signatures.length > 0) this.signatures = data.signatures;
        if (Array.isArray(data.apiKeys) && data.apiKeys.length > 0) this.apiKeys = data.apiKeys;
        if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      }
    } catch (e) {
      console.warn('[DocMailDatabase] Error loading db from disk:', e);
    }
  }

  saveToDisk() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        mailboxes: this.mailboxes,
        conversations: this.conversations,
        messages: this.messages,
        contacts: this.contacts,
        templates: this.templates,
        signatures: this.signatures,
        apiKeys: this.apiKeys,
        auditLogs: this.auditLogs,
      };
      const tmpFile = `${DB_FILE_PATH}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE_PATH);
    } catch (e) {
      console.warn('[DocMailDatabase] Error saving db to disk:', e);
    }
  }
}

const memoryDb = new DocMailDatabase();

export const db = {
  // Mailboxes
  async listMailboxes(organizationId: string): Promise<DocdrilMailbox[]> {
    memoryDb.loadFromDisk();
    return memoryDb.mailboxes;
  },

  async addMailbox(mailbox: DocdrilMailbox): Promise<DocdrilMailbox> {
    const existingIdx = memoryDb.mailboxes.findIndex(
      (m) => m.emailAddress.toLowerCase() === mailbox.emailAddress.toLowerCase()
    );
    if (existingIdx !== -1) {
      memoryDb.mailboxes[existingIdx] = mailbox;
    } else {
      memoryDb.mailboxes.push(mailbox);
    }
    memoryDb.saveToDisk();
    return mailbox;
  },

  async findMailboxById(id: string): Promise<DocdrilMailbox | null> {
    memoryDb.loadFromDisk();
    return memoryDb.mailboxes.find((m) => m.id === id) || null;
  },

  async findMailboxByEmail(email: string): Promise<DocdrilMailbox | null> {
    memoryDb.loadFromDisk();
    return memoryDb.mailboxes.find((m) => m.emailAddress.toLowerCase() === email.toLowerCase()) || null;
  },

  async findMailboxByProviderId(providerMailboxId: string): Promise<DocdrilMailbox | null> {
    memoryDb.loadFromDisk();
    return memoryDb.mailboxes.find((m) => m.providerMailboxId === providerMailboxId) || null;
  },

  // Conversations
  async listConversations(params: {
    mailboxId: string;
    folder?: string;
    isStarred?: boolean;
    contactId?: string;
    search?: string;
  }): Promise<DocdrilConversation[]> {
    memoryDb.loadFromDisk();
    let list = memoryDb.conversations.filter((c) => c.mailboxId === params.mailboxId);

    if (params.folder) {
      const folder = params.folder;
      const folderMsgs = memoryDb.messages.filter(
        (m) => m.mailboxId === params.mailboxId && (m.providerFolder === folder || (!m.providerFolder && folder === 'INBOX'))
      );
      const cnvIdsInFolder = new Set(folderMsgs.map((m) => m.conversationId));
      list = list.filter((c) => cnvIdsInFolder.has(c.id));
    }

    if (params.isStarred !== undefined) {
      list = list.filter((c) => c.isStarred === params.isStarred);
    }
    if (params.contactId) {
      list = list.filter((c) => c.contactId === params.contactId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.subject.toLowerCase().includes(q) || c.snippet.toLowerCase().includes(q));
    }

    return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },

  async findConversationById(id: string): Promise<DocdrilConversation | null> {
    memoryDb.loadFromDisk();
    const cnv = memoryDb.conversations.find((c) => c.id === id);
    if (!cnv) return null;

    const messages = memoryDb.messages.filter((m) => m.conversationId === id);
    return {
      ...cnv,
      messages: messages.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()),
    };
  },

  async updateConversation(
    id: string,
    updates: Partial<DocdrilConversation>
  ): Promise<DocdrilConversation> {
    const cnv = memoryDb.conversations.find((c) => c.id === id);
    if (!cnv) throw new Error(`Conversation ${id} not found`);
    Object.assign(cnv, updates);
    memoryDb.saveToDisk();
    return cnv;
  },

  // Messages
  async listMessagesByConversation(conversationId: string): Promise<DocdrilMessage[]> {
    return memoryDb.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
  },

  async findMessageById(id: string): Promise<DocdrilMessage | null> {
    return memoryDb.messages.find((m) => m.id === id) || null;
  },

  async createMessage(msg: DocdrilMessage): Promise<DocdrilMessage> {
    // Avoid duplicates by providerMessageId or id
    const existing = memoryDb.messages.find(
      (m) => (m.providerMessageId && m.providerMessageId === msg.providerMessageId) || m.id === msg.id
    );
    if (existing) {
      Object.assign(existing, msg);
      return existing;
    }

    memoryDb.messages.push(msg);

    // Update or create conversation
    let cnv = memoryDb.conversations.find((c) => c.id === msg.conversationId);
    if (cnv) {
      cnv.lastMessageAt = msg.receivedAt;
      cnv.snippet = msg.snippet;
      cnv.messageCount += 1;
      if (!msg.isRead) cnv.unreadCount += 1;
    } else {
      cnv = {
        id: msg.conversationId,
        mailboxId: msg.mailboxId,
        subject: msg.subject,
        snippet: msg.snippet,
        unreadCount: msg.isRead ? 0 : 1,
        messageCount: 1,
        isStarred: msg.isStarred,
        isArchived: false,
        isTrash: false,
        isSpam: false,
        lastMessageAt: msg.receivedAt,
      };
      memoryDb.conversations.unshift(cnv);
    }

    memoryDb.saveToDisk();
    return msg;
  },

  async updateMessage(id: string, updates: Partial<DocdrilMessage>): Promise<DocdrilMessage> {
    const msg = memoryDb.messages.find((m) => m.id === id);
    if (!msg) throw new Error(`Message ${id} not found`);
    Object.assign(msg, updates);
    memoryDb.saveToDisk();
    return msg;
  },

  // Contacts
  async listContacts(organizationId: string): Promise<DocdrilContact[]> {
    memoryDb.loadFromDisk();
    return memoryDb.contacts;
  },

  async findContactById(id: string): Promise<DocdrilContact | null> {
    memoryDb.loadFromDisk();
    return memoryDb.contacts.find((c) => c.id === id) || null;
  },

  async findContactByEmail(organizationId: string, email: string): Promise<DocdrilContact | null> {
    memoryDb.loadFromDisk();
    return (
      memoryDb.contacts.find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  },

  async createContact(contact: DocdrilContact): Promise<DocdrilContact> {
    memoryDb.contacts.unshift(contact);
    memoryDb.saveToDisk();
    return contact;
  },

  // Templates
  async listTemplates(organizationId: string): Promise<DocdrilTemplate[]> {
    return memoryDb.templates;
  },

  // Signatures
  async listSignatures(organizationId: string): Promise<DocdrilSignature[]> {
    return memoryDb.signatures;
  },

  // API Keys
  async listApiKeys(organizationId: string): Promise<DocdrilApiKey[]> {
    return memoryDb.apiKeys;
  },

  async findApiKeyByHash(hash: string): Promise<DocdrilApiKey | null> {
    return memoryDb.apiKeys.find((k) => !k.isRevoked) || null;
  },

  async createApiKey(apiKey: DocdrilApiKey): Promise<DocdrilApiKey> {
    memoryDb.apiKeys.unshift(apiKey);
    return apiKey;
  },

  // Webhook Subscriptions (Outbound)
  async listWebhookSubscriptions(organizationId: string): Promise<DocdrilWebhookSubscription[]> {
    return memoryDb.webhookSubscriptions;
  },

  async createWebhookSubscription(sub: DocdrilWebhookSubscription): Promise<DocdrilWebhookSubscription> {
    memoryDb.webhookSubscriptions.push(sub);
    return sub;
  },

  // Audit Logs
  async logAudit(log: DocdrilAuditLog): Promise<void> {
    memoryDb.auditLogs.unshift(log);
  },

  async listAuditLogs(organizationId: string): Promise<DocdrilAuditLog[]> {
    return memoryDb.auditLogs;
  },

  async listAliases(mailboxId: string) {
    return memoryDb.aliases.filter((a) => a.mailboxId === mailboxId);
  },

  async listForwarders(mailboxId: string) {
    return memoryDb.forwarders.filter((f) => f.mailboxId === mailboxId);
  },

  async listAutoreplies(mailboxId: string) {
    return memoryDb.autoreplies.filter((a) => a.mailboxId === mailboxId);
  },

  isWebhookEventProcessed(eventId: string): boolean {
    return memoryDb.processedWebhookEvents.has(eventId);
  },

  markWebhookEventProcessed(eventId: string): void {
    memoryDb.processedWebhookEvents.add(eventId);
  },
};
