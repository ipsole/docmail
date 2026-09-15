// Mock Mail Provider for Local Development and Automated Tests
// Adheres strictly to the MailProvider contract

import {
  MailProvider,
  ProviderAccountInfo,
  ProviderMailbox,
  MailboxQuota,
  FolderInfo,
  PaginatedMessages,
  DetailedMessage,
  SendMessagePayload,
  SendResult,
  MessageFlagUpdate,
  SearchCriteria,
  WebhookInfo,
  CreateWebhookPayload,
  WebhookCreatedResult,
  ProviderMessageHeader,
} from './provider.interface';

export class MockMailProvider implements MailProvider {
  readonly providerName = 'mock';

  private mailboxes: ProviderMailbox[] = [
    { resourceId: 'AC_docdril_info', address: 'info@docdril.com' },
    { resourceId: 'AC_docdril_support', address: 'support@docdril.com' },
    { resourceId: 'AC_docdril_sales', address: 'sales@docdril.com' },
  ];

  private folders: Record<string, FolderInfo[]> = {
    AC_docdril_info: [
      { folder: 'INBOX', name: 'Inbox', unread: 2, total: 4 },
      { folder: 'INBOX.Sent', name: 'Sent', unread: 0, total: 3 },
      { folder: 'INBOX.Drafts', name: 'Drafts', unread: 0, total: 1 },
      { folder: 'INBOX.Archive', name: 'Archive', unread: 0, total: 10 },
      { folder: 'INBOX.Trash', name: 'Trash', unread: 0, total: 1 },
      { folder: 'INBOX.Spam', name: 'Spam', unread: 0, total: 0 },
    ],
  };

  private messages: Record<string, DetailedMessage[]> = {
    'AC_docdril_info:INBOX': [
      {
        uid: 101,
        subject: 'Welcome to Docdril Ecosystem - Partnership Inquiries',
        from: { name: 'Acme Health Partners', address: 'partners@acmehealth.com' },
        to: [{ name: 'Docdril Info', address: 'info@docdril.com' }],
        date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        size: 3450,
        flags: [],
        hasAttachments: true,
        messageId: '<msg-101@acmehealth.com>',
        text: 'Hello Docdril Team,\n\nWe are interested in integrating Docdril Clinical Suite with our hospital communication platform. Could we schedule an introductory discovery call this Thursday?\n\nBest regards,\nElena Vance\nVP of Partnerships',
        html: '<p>Hello Docdril Team,</p><p>We are interested in integrating Docdril Clinical Suite with our hospital communication platform. Could we schedule an introductory discovery call this Thursday?</p><p>Best regards,<br><strong>Elena Vance</strong><br>VP of Partnerships</p>',
        attachments: [
          {
            id: 'att_101_1',
            filename: 'Partnership_Overview.pdf',
            contentType: 'application/pdf',
            size: 245000,
          },
        ],
      },
      {
        uid: 102,
        subject: 'Docdril CRM Sync & Patient Notification Feedback',
        from: { name: 'Dr. Marcus Sterling', address: 'marcus@sterlingclinic.org' },
        to: [{ name: 'Docdril Support', address: 'support@docdril.com' }],
        date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        size: 1980,
        flags: ['\\Seen'],
        hasAttachments: false,
        messageId: '<msg-102@sterlingclinic.org>',
        text: 'Hi Docdril Support,\n\nOur clinic staff loved the new instant email response feature. We would also like to ask if automatic tagging based on patient ID can be turned on by default.\n\nThank you,\nDr. Marcus',
        html: '<p>Hi Docdril Support,</p><p>Our clinic staff loved the new instant email response feature. We would also like to ask if automatic tagging based on patient ID can be turned on by default.</p><p>Thank you,<br>Dr. Marcus</p>',
      },
      {
        uid: 103,
        subject: 'Enterprise SLA & Infrastructure Confirmation',
        from: { name: 'DevOps & Security Board', address: 'security@cloudverify.io' },
        to: [{ name: 'Docdril Info', address: 'info@docdril.com' }],
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        size: 5120,
        flags: ['\\Seen', '\\Flagged'],
        hasAttachments: false,
        messageId: '<msg-103@cloudverify.io>',
        text: 'Annual SOC2 and HIPAA communication audit review completed with 100% adherence score. Report is available for download.',
        html: '<p>Annual SOC2 and HIPAA communication audit review completed with <strong>100% adherence score</strong>. Report is available for download.</p>',
      },
    ],
  };

  private webhooks: WebhookInfo[] = [
    {
      id: 'mock_wh_1',
      accountResourceId: 'AC_docdril_info',
      mailbox: 'info@docdril.com',
      name: 'Docdril Inbound Webhook Dispatcher',
      description: 'Dispatches real-time message events to Docdril core',
      events: ['message.received'],
      status: 'active',
      url: 'http://localhost:3000/api/v1/webhooks/hostinger',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async getAccount(): Promise<ProviderAccountInfo> {
    return {
      orderResourceId: 'OR_DOCDRIL_MOCK_ORDER',
      mailboxes: this.mailboxes,
    };
  }

  async listMailboxes(): Promise<ProviderMailbox[]> {
    return this.mailboxes;
  }

  async getMailboxQuota(mailboxResourceId: string): Promise<MailboxQuota> {
    return {
      totalUsage: 254800000,
      totalLimit: 5368709120, // 5GB
      totalPercentage: 4.75,
      supported: true,
    };
  }

  async listFolders(mailboxResourceId: string): Promise<FolderInfo[]> {
    return (
      this.folders[mailboxResourceId] || [
        { folder: 'INBOX', name: 'Inbox', unread: 0, total: 0 },
        { folder: 'INBOX.Sent', name: 'Sent', unread: 0, total: 0 },
        { folder: 'INBOX.Drafts', name: 'Drafts', unread: 0, total: 0 },
      ]
    );
  }

  async createFolder(mailboxResourceId: string, name: string): Promise<FolderInfo> {
    const folderKey = `INBOX.${name}`;
    const newFolder: FolderInfo = { folder: folderKey, name, unread: 0, total: 0 };
    if (!this.folders[mailboxResourceId]) this.folders[mailboxResourceId] = [];
    this.folders[mailboxResourceId].push(newFolder);
    return newFolder;
  }

  async renameFolder(mailboxResourceId: string, folder: string, newName: string): Promise<FolderInfo> {
    const list = this.folders[mailboxResourceId] || [];
    const item = list.find((f) => f.folder === folder);
    if (item) {
      item.name = newName;
      return item;
    }
    return { folder, name: newName };
  }

  async deleteFolder(mailboxResourceId: string, folder: string): Promise<void> {
    if (this.folders[mailboxResourceId]) {
      this.folders[mailboxResourceId] = this.folders[mailboxResourceId].filter((f) => f.folder !== folder);
    }
  }

  async listMessages(
    mailboxResourceId: string,
    folder: string,
    page = 1,
    perPage = 25
  ): Promise<PaginatedMessages> {
    const key = `${mailboxResourceId}:${folder}`;
    const all = this.messages[key] || [];
    const start = (page - 1) * perPage;
    const paginated = all.slice(start, start + perPage);

    return {
      messages: paginated,
      pagination: {
        page,
        perPage,
        total: all.length,
        totalPages: Math.ceil(all.length / perPage) || 1,
      },
    };
  }

  async getMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number
  ): Promise<DetailedMessage> {
    const key = `${mailboxResourceId}:${folder}`;
    const msg = (this.messages[key] || []).find((m) => String(m.uid) === String(uid));
    if (!msg) {
      throw new Error(`Message UID ${uid} not found in folder ${folder}`);
    }
    return msg;
  }

  async searchMessages(
    mailboxResourceId: string,
    folder: string,
    criteria: SearchCriteria
  ): Promise<ProviderMessageHeader[]> {
    const key = `${mailboxResourceId}:${folder}`;
    const all = this.messages[key] || [];
    return all.filter((m) => {
      if (criteria.subject && !m.subject.toLowerCase().includes(criteria.subject.toLowerCase())) return false;
      if (criteria.from && !m.from.address.toLowerCase().includes(criteria.from.toLowerCase())) return false;
      if (criteria.text && !m.text?.toLowerCase().includes(criteria.text.toLowerCase())) return false;
      return true;
    });
  }

  async sendMessage(
    mailboxResourceId: string,
    payload: SendMessagePayload
  ): Promise<SendResult> {
    const sentKey = `${mailboxResourceId}:INBOX.Sent`;
    if (!this.messages[sentKey]) {
      this.messages[sentKey] = [];
    }

    const newUid = Date.now();
    const newMsg: DetailedMessage = {
      uid: newUid,
      subject: payload.subject,
      from: { address: 'info@docdril.com', name: payload.displayName || 'Docdril' },
      to: payload.to.map((addr) => ({ address: addr })),
      cc: payload.cc?.map((addr) => ({ address: addr })),
      date: new Date().toISOString(),
      size: (payload.text?.length || 0) + (payload.html?.length || 0) + 1024,
      flags: ['\\Seen'],
      hasAttachments: (payload.attachments?.length || 0) > 0,
      messageId: `<msg-${newUid}@docdril.com>`,
      text: payload.text,
      html: payload.html,
      attachments: payload.attachments?.map((a, i) => ({
        id: `att_${newUid}_${i}`,
        filename: a.filename,
        contentType: a.contentType,
        size: Math.round(a.content.length * 0.75),
      })),
    };

    this.messages[sentKey].unshift(newMsg);
    return { success: true, messageId: newMsg.messageId };
  }

  async moveMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number,
    targetFolder: string
  ): Promise<void> {
    const srcKey = `${mailboxResourceId}:${folder}`;
    const destKey = `${mailboxResourceId}:${targetFolder}`;
    const srcList = this.messages[srcKey] || [];
    const idx = srcList.findIndex((m) => String(m.uid) === String(uid));
    if (idx !== -1) {
      const [item] = srcList.splice(idx, 1);
      if (!this.messages[destKey]) this.messages[destKey] = [];
      this.messages[destKey].unshift(item);
    }
  }

  async deleteMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number
  ): Promise<void> {
    const key = `${mailboxResourceId}:${folder}`;
    if (this.messages[key]) {
      this.messages[key] = this.messages[key].filter((m) => String(m.uid) !== String(uid));
    }
  }

  async setMessageFlags(
    mailboxResourceId: string,
    folder: string,
    uids: (string | number)[],
    update: MessageFlagUpdate
  ): Promise<void> {
    const key = `${mailboxResourceId}:${folder}`;
    const list = this.messages[key] || [];
    const uidSet = new Set(uids.map(String));

    for (const msg of list) {
      if (uidSet.has(String(msg.uid))) {
        let flags = new Set(msg.flags);
        if (update.add) {
          update.add.forEach((f) => flags.add(f));
        }
        if (update.remove) {
          update.remove.forEach((f) => flags.delete(f));
        }
        msg.flags = Array.from(flags);
      }
    }
  }

  async listWebhooks(mailboxResourceId: string): Promise<WebhookInfo[]> {
    return this.webhooks;
  }

  async createWebhook(
    mailboxResourceId: string,
    payload: CreateWebhookPayload
  ): Promise<WebhookCreatedResult> {
    const id = `wh_${Date.now()}`;
    const secret = `mock_secret_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const created: WebhookCreatedResult = {
      id,
      accountResourceId: mailboxResourceId,
      mailbox: 'info@docdril.com',
      name: payload.name,
      description: payload.description,
      events: payload.events,
      status: payload.status || 'active',
      url: payload.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      secret,
    };
    this.webhooks.push(created);
    return created;
  }

  async deleteWebhook(mailboxResourceId: string, webhookId: string): Promise<void> {
    this.webhooks = this.webhooks.filter((w) => w.id !== webhookId);
  }

  async testWebhook(
    mailboxResourceId: string,
    webhookId: string
  ): Promise<{ success: boolean; httpStatus: number; error?: string | null }> {
    return { success: true, httpStatus: 200, error: null };
  }
}
