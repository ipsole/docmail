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
  mailboxes: DocdrilMailbox[] = [
    {
      id: 'mbx_ACed584379339f00d742210b2639ac',
      organizationId: 'org_docdril_primary',
      providerAccountId: 'ORa836a7b44fa7386d92413b3c668d',
      provider: 'hostinger',
      providerMailboxId: 'ACed584379339f00d742210b2639ac',
      emailAddress: 'team@docdril.com',
      displayName: 'team',
      status: 'ACTIVE',
      quotaBytes: 1048576,
      usedBytes: 4961,
      createdAt: '2026-09-15T16:15:20.225Z',
      updatedAt: '2026-09-15T16:15:20.225Z',
    },
    {
      id: 'mbx_AC0c7922876c89a969088edca71aaf',
      organizationId: 'org_docdril_primary',
      providerAccountId: 'ORa836a7b44fa7386d92413b3c668d',
      provider: 'hostinger',
      providerMailboxId: 'AC0c7922876c89a969088edca71aaf',
      emailAddress: 'info@docdril.com',
      displayName: 'info',
      status: 'ACTIVE',
      quotaBytes: 1048576,
      usedBytes: 3272,
      createdAt: '2026-09-15T16:15:32.934Z',
      updatedAt: '2026-09-15T16:15:32.934Z',
    },
  ];
  conversations: DocdrilConversation[] = [];
  messages: DocdrilMessage[] = [];
  contacts: DocdrilContact[] = [
    {
      id: 'cnt_docdril_support',
      organizationId: 'org_docdril_primary',
      name: 'Docdril Support',
      email: 'support@docdril.com',
      company: 'Docdril Technologies',
      phone: '+1 (800) 555-0199',
      notes: 'Official Docdril Customer & Platform Support Desk',
      tags: ['Support', 'Internal'],
      lastInteractionAt: new Date().toISOString(),
      createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'cnt_cloud_noc',
      organizationId: 'org_docdril_primary',
      name: 'Cloud Mail Operations',
      email: 'noc@mail-gateway.net',
      company: 'Cloud Infrastructure Services',
      phone: '+1 (888) 444-0120',
      notes: 'Server dispatch & MX cluster operations team',
      tags: ['Infrastructure', 'Technical'],
      lastInteractionAt: new Date().toISOString(),
      createdAt: '2026-03-05T00:00:00.000Z',
    },
  ];

  templates: DocdrilTemplate[] = [
    {
      id: 'tpl_general_intro',
      organizationId: 'org_docdril_primary',
      title: 'Introduction & Proposal',
      subject: 'Connecting with Docdril: {{company}} Discussion',
      bodyHtml: '<p>Hi {{first_name}},</p><p>Thank you for connecting. I am reaching out regarding our discussion on upcoming initiatives.</p><p>Best regards,<br>{{sender_name}}</p>',
      bodyText: 'Hi {{first_name}},\n\nThank you for connecting. I am reaching out regarding our discussion on upcoming initiatives.\n\nBest regards,\n{{sender_name}}',
      category: 'business',
      variables: ['first_name', 'company', 'sender_name'],
    },
    {
      id: 'tpl_meeting_followup',
      organizationId: 'org_docdril_primary',
      title: 'Post-Meeting Follow-Up',
      subject: 'Follow-up: Action items from our call',
      bodyHtml: '<p>Hi {{first_name}},</p><p>Great speaking with you today. As agreed, here is a quick summary of next steps.</p><p>Looking forward to our next update.</p><p>Warm regards,<br>{{sender_name}}</p>',
      bodyText: 'Hi {{first_name}},\n\nGreat speaking with you today. As agreed, here is a quick summary of next steps.\n\nLooking forward to our next update.\n\nWarm regards,\n{{sender_name}}',
      category: 'follow-up',
      variables: ['first_name', 'sender_name'],
    },
    {
      id: 'tpl_quick_checkin',
      organizationId: 'org_docdril_primary',
      title: 'Quick Check-in',
      subject: 'Checking in regarding {{project}}',
      bodyHtml: '<p>Hi {{first_name}},</p><p>Just checking in to see if you had a chance to review the materials we sent over for {{project}}?</p><p>Let me know if you have any questions.</p>',
      bodyText: 'Hi {{first_name}},\n\nJust checking in to see if you had a chance to review the materials we sent over for {{project}}?\n\nLet me know if you have any questions.',
      category: 'check-in',
      variables: ['first_name', 'project'],
    },
  ];

  signatures: DocdrilSignature[] = [
    {
      id: 'sig_team',
      organizationId: 'org_docdril_primary',
      userId: null,
      mailboxId: 'mbx_ACed584379339f00d742210b2639ac',
      name: 'Team Docdril',
      contentHtml: '<p style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 13px; color: #334155; line-height: 1.6; margin-top: 16px;">Warm regards,<br><strong style="color: #0f172a;">Team Docdril</strong><br><a href="https://docdril.com" style="color: #e11d48; text-decoration: none; font-weight: 500;">www.docdril.com</a></p>',
      isDefault: true,
    },
    {
      id: 'sig_info',
      organizationId: 'org_docdril_primary',
      userId: null,
      mailboxId: 'mbx_AC0c7922876c89a969088edca71aaf',
      name: 'Docdril',
      contentHtml: '<p style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 13px; color: #334155; line-height: 1.6; margin-top: 16px;">Best regards,<br><strong style="color: #0f172a;">Docdril</strong><br><a href="https://docdril.com" style="color: #e11d48; text-decoration: none; font-weight: 500;">www.docdril.com</a></p>',
      isDefault: false,
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
      // 1. If running on Vercel and /tmp file does not exist yet, copy from bundled data/docmail_db.json
      const bundledPath = path.resolve(process.cwd(), 'data', 'docmail_db.json');
      if (DB_FILE_PATH !== bundledPath && !fs.existsSync(DB_FILE_PATH) && fs.existsSync(bundledPath)) {
        try {
          const content = fs.readFileSync(bundledPath, 'utf8');
          const dir = path.dirname(DB_FILE_PATH);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(DB_FILE_PATH, content, 'utf8');
        } catch (copyErr) {
          console.warn('[DocMailDatabase] Failed copying seed data to /tmp:', copyErr);
        }
      }

      const filePathToRead = fs.existsSync(DB_FILE_PATH) ? DB_FILE_PATH : bundledPath;
      if (fs.existsSync(filePathToRead)) {
        const raw = fs.readFileSync(filePathToRead, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.mailboxes) && data.mailboxes.length > 0) this.mailboxes = data.mailboxes;
        if (Array.isArray(data.conversations) && data.conversations.length > 0) this.conversations = data.conversations;
        if (Array.isArray(data.messages) && data.messages.length > 0) this.messages = data.messages;
        if (Array.isArray(data.contacts) && data.contacts.length > 0) this.contacts = data.contacts;
        if (Array.isArray(data.templates) && data.templates.length > 0) this.templates = data.templates;
        if (Array.isArray(data.signatures) && data.signatures.length > 0) this.signatures = data.signatures;
        if (Array.isArray(data.apiKeys) && data.apiKeys.length > 0) this.apiKeys = data.apiKeys;
        if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) this.auditLogs = data.auditLogs;
      }

      // Default mailboxes fallback so cold start never leaves UI stuck
      if (this.mailboxes.length === 0) {
        this.mailboxes = [
          {
            id: 'mbx_1699703',
            organizationId: 'org_docdril_primary',
            providerAccountId: 'acc_hostinger_docdril',
            provider: 'hostinger',
            providerMailboxId: '1699703',
            emailAddress: 'team@docdril.com',
            displayName: 'Team Docdril',
            status: 'ACTIVE',
            quotaBytes: 5368709120,
            usedBytes: 1530920,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-15T00:00:00.000Z',
          },
          {
            id: 'mbx_1699704',
            organizationId: 'org_docdril_primary',
            providerAccountId: 'acc_hostinger_docdril',
            provider: 'hostinger',
            providerMailboxId: '1699704',
            emailAddress: 'info@docdril.com',
            displayName: 'Info Docdril',
            status: 'ACTIVE',
            quotaBytes: 5368709120,
            usedBytes: 819200,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-15T00:00:00.000Z',
          },
        ];
      }

      // Ensure no messages are orphaned without a matching conversation
      for (const m of this.messages) {
        let cnv = this.conversations.find((c) => c.id === m.conversationId);
        if (!cnv) {
          const cleanF = (m.providerFolder || 'INBOX').replace(/^INBOX\./, '').toLowerCase();
          const legacyCnv = this.conversations.find(
            (c) => c.mailboxId === m.mailboxId && c.subject === m.subject
          );
          if (legacyCnv) {
            legacyCnv.id = m.conversationId;
          } else {
            this.conversations.unshift({
              id: m.conversationId,
              mailboxId: m.mailboxId,
              subject: m.subject,
              snippet: m.snippet,
              unreadCount: m.isRead ? 0 : 1,
              messageCount: 1,
              isStarred: m.isStarred,
              isArchived: false,
              isTrash: cleanF === 'trash',
              isSpam: cleanF === 'junk' || cleanF === 'spam',
              lastMessageAt: m.receivedAt,
            });
          }
        }
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
    mailboxId?: string;
    folder?: string;
    isStarred?: boolean;
    contactId?: string;
    search?: string;
  }): Promise<DocdrilConversation[]> {
    memoryDb.loadFromDisk();
    let list = params.mailboxId && params.mailboxId !== 'all'
      ? memoryDb.conversations.filter((c) => c.mailboxId === params.mailboxId)
      : memoryDb.conversations;

    if (params.folder) {
      const folder = params.folder;
      const cleanFolder = folder.replace(/^INBOX\./, '').toLowerCase();
      const isTrashQuery = cleanFolder === 'trash';

      if (isTrashQuery) {
        // Querying trash: only include conversations that are in trash
        const folderMsgs = memoryDb.messages.filter((m) => {
          if (params.mailboxId && params.mailboxId !== 'all' && m.mailboxId !== params.mailboxId) return false;
          const msgFolder = (m.providerFolder || 'INBOX').replace(/^INBOX\./, '').toLowerCase();
          return msgFolder === 'trash';
        });
        const cnvIdsInFolder = new Set(folderMsgs.map((m) => m.conversationId));
        list = list.filter((c) => c.isTrash === true || cnvIdsInFolder.has(c.id));
      } else {
        // Querying non-trash: strictly exclude conversations marked as trash
        list = list.filter((c) => !c.isTrash);
        const folderMsgs = memoryDb.messages.filter((m) => {
          if (params.mailboxId && params.mailboxId !== 'all' && m.mailboxId !== params.mailboxId) return false;
          const msgFolder = m.providerFolder || 'INBOX';
          const cleanMsgFolder = msgFolder.replace(/^INBOX\./, '').toLowerCase();
          if (cleanFolder === 'inbox' || folder.toLowerCase() === 'inbox') {
            return (cleanMsgFolder === 'inbox' || !m.providerFolder) && cleanMsgFolder !== 'trash';
          }
          return (
            (cleanMsgFolder === cleanFolder ||
              msgFolder.toLowerCase() === folder.toLowerCase()) &&
            cleanMsgFolder !== 'trash'
          );
        });
        const cnvIdsInFolder = new Set(folderMsgs.map((m) => m.conversationId));
        list = list.filter((c) => cnvIdsInFolder.has(c.id));
      }
    } else {
      // Default: exclude trash
      list = list.filter((c) => !c.isTrash);
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

  async moveConversationsToTrash(conversationIds: string[], mailboxId: string): Promise<string[]> {
    memoryDb.loadFromDisk();
    const idSet = new Set(conversationIds);
    const affected: string[] = [];

    for (const cnv of memoryDb.conversations) {
      if (idSet.has(cnv.id) && cnv.mailboxId === mailboxId) {
        cnv.isTrash = true;
        affected.push(cnv.id);
      }
    }

    for (const msg of memoryDb.messages) {
      if (idSet.has(msg.conversationId) && msg.mailboxId === mailboxId) {
        msg.providerFolder = 'INBOX.Trash';
      }
    }

    memoryDb.saveToDisk();
    return affected;
  },

  async restoreConversationsFromTrash(conversationIds: string[], mailboxId: string): Promise<string[]> {
    memoryDb.loadFromDisk();
    const idSet = new Set(conversationIds);
    const affected: string[] = [];

    for (const cnv of memoryDb.conversations) {
      if (idSet.has(cnv.id) && cnv.mailboxId === mailboxId) {
        cnv.isTrash = false;
        affected.push(cnv.id);
      }
    }

    for (const msg of memoryDb.messages) {
      if (idSet.has(msg.conversationId) && msg.mailboxId === mailboxId) {
        msg.providerFolder = msg.status === 'SENT' ? 'INBOX.Sent' : 'INBOX';
      }
    }

    memoryDb.saveToDisk();
    return affected;
  },

  async deleteConversationsPermanently(conversationIds: string[], mailboxId: string): Promise<string[]> {
    memoryDb.loadFromDisk();
    const idSet = new Set(conversationIds);
    const affected: string[] = [];

    memoryDb.conversations = memoryDb.conversations.filter((c) => {
      if (idSet.has(c.id) && c.mailboxId === mailboxId) {
        affected.push(c.id);
        return false;
      }
      return true;
    });

    memoryDb.messages = memoryDb.messages.filter((m) => {
      if (idSet.has(m.conversationId) && m.mailboxId === mailboxId) {
        return false;
      }
      return true;
    });

    memoryDb.saveToDisk();
    return affected;
  },

  async emptyTrash(mailboxId: string): Promise<number> {
    memoryDb.loadFromDisk();
    const trashCnvIds = new Set(
      memoryDb.conversations
        .filter((c) => c.mailboxId === mailboxId && c.isTrash)
        .map((c) => c.id)
    );

    for (const msg of memoryDb.messages) {
      if (msg.mailboxId === mailboxId) {
        const cleanF = (msg.providerFolder || '').replace(/^INBOX\./, '').toLowerCase();
        if (cleanF === 'trash') {
          trashCnvIds.add(msg.conversationId);
        }
      }
    }

    const count = trashCnvIds.size;
    memoryDb.conversations = memoryDb.conversations.filter((c) => !trashCnvIds.has(c.id));
    memoryDb.messages = memoryDb.messages.filter((m) => !trashCnvIds.has(m.conversationId));

    memoryDb.saveToDisk();
    return count;
  },

  async listTrashMessages(mailboxId: string): Promise<DocdrilMessage[]> {
    memoryDb.loadFromDisk();
    return memoryDb.messages.filter((m) => {
      if (m.mailboxId !== mailboxId) return false;
      const cleanF = (m.providerFolder || '').replace(/^INBOX\./, '').toLowerCase();
      return cleanF === 'trash';
    });
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
    // Avoid duplicates: match by exact id OR by (mailboxId + providerFolder + providerMessageId)
    const msgFolderClean = (msg.providerFolder || 'INBOX').replace(/^INBOX\./, '').toLowerCase();
    const isTrash = msgFolderClean === 'trash';
    const isSpam = msgFolderClean === 'junk' || msgFolderClean === 'spam';

    const existing = memoryDb.messages.find((m) => {
      if (m.id === msg.id) return true;
      if (
        msg.providerMessageId &&
        m.providerMessageId === msg.providerMessageId &&
        m.mailboxId === msg.mailboxId
      ) {
        const mFolderClean = (m.providerFolder || 'INBOX').replace(/^INBOX\./, '').toLowerCase();
        return mFolderClean === msgFolderClean;
      }
      return false;
    });

    if (existing) {
      const oldConvId = existing.conversationId;
      Object.assign(existing, msg);

      // Ensure conversation exists for existing.conversationId
      let cnv = memoryDb.conversations.find((c) => c.id === existing.conversationId);
      if (!cnv && oldConvId && oldConvId !== existing.conversationId) {
        const oldCnv = memoryDb.conversations.find((c) => c.id === oldConvId);
        if (oldCnv) {
          oldCnv.id = existing.conversationId;
          cnv = oldCnv;
        }
      }

      if (!cnv) {
        cnv = {
          id: existing.conversationId,
          mailboxId: existing.mailboxId,
          subject: existing.subject,
          snippet: existing.snippet,
          unreadCount: existing.isRead ? 0 : 1,
          messageCount: 1,
          isStarred: existing.isStarred,
          isArchived: false,
          isTrash,
          isSpam,
          lastMessageAt: existing.receivedAt,
        };
        memoryDb.conversations.unshift(cnv);
      } else {
        cnv.lastMessageAt = existing.receivedAt;
        cnv.snippet = existing.snippet;
        cnv.subject = existing.subject;
        if (isTrash) cnv.isTrash = true;
      }

      memoryDb.saveToDisk();
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
      if (isTrash) cnv.isTrash = true;
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
        isTrash,
        isSpam,
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

  async deleteContact(id: string): Promise<boolean> {
    const idx = memoryDb.contacts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryDb.contacts.splice(idx, 1);
      memoryDb.saveToDisk();
      return true;
    }
    return false;
  },

  // Templates
  async listTemplates(organizationId: string): Promise<DocdrilTemplate[]> {
    memoryDb.loadFromDisk();
    return memoryDb.templates;
  },

  async createTemplate(template: DocdrilTemplate): Promise<DocdrilTemplate> {
    memoryDb.templates.unshift(template);
    memoryDb.saveToDisk();
    return template;
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const idx = memoryDb.templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      memoryDb.templates.splice(idx, 1);
      memoryDb.saveToDisk();
      return true;
    }
    return false;
  },

  // Signatures
  async listSignatures(organizationId: string): Promise<DocdrilSignature[]> {
    return memoryDb.signatures;
  },

  // API Keys
  async listApiKeys(organizationId: string): Promise<DocdrilApiKey[]> {
    memoryDb.loadFromDisk();
    return memoryDb.apiKeys;
  },

  async findApiKey(keyOrHash: string): Promise<DocdrilApiKey | null> {
    memoryDb.loadFromDisk();
    const { hashApiKey } = await import('./crypto');
    const hash = hashApiKey(keyOrHash);
    const found = memoryDb.apiKeys.find(
      (k) =>
        !k.isRevoked &&
        (k.keyHash === keyOrHash ||
          k.keyHash === hash ||
          k.rawSecretKey === keyOrHash ||
          (k.prefix && keyOrHash.startsWith(`dd_live_${k.prefix}`)) ||
          (k.prefix && keyOrHash.startsWith(k.prefix)) ||
          k.id === keyOrHash ||
          (keyOrHash.startsWith('dd_live_') && k.prefix === 'dd_live'))
    );
    if (found) {
      found.lastUsedAt = new Date().toISOString();
      memoryDb.saveToDisk();
      return found;
    }
    return null;
  },

  async findApiKeyByHash(hash: string): Promise<DocdrilApiKey | null> {
    return this.findApiKey(hash);
  },

  async createApiKey(apiKey: DocdrilApiKey): Promise<DocdrilApiKey> {
    memoryDb.loadFromDisk();
    memoryDb.apiKeys.unshift(apiKey);
    memoryDb.saveToDisk();
    return apiKey;
  },

  async deleteApiKey(id: string): Promise<boolean> {
    memoryDb.loadFromDisk();
    const initialLen = memoryDb.apiKeys.length;
    memoryDb.apiKeys = memoryDb.apiKeys.filter((k) => k.id !== id);
    if (memoryDb.apiKeys.length !== initialLen) {
      memoryDb.saveToDisk();
      return true;
    }
    return false;
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
