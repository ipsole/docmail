// MailProvider Abstraction Interface
// All mail provider implementations (Hostinger, Mock, future providers) must adhere to this contract.

export interface ProviderAccountInfo {
  orderResourceId: string;
  mailboxes: ProviderMailbox[];
}

export interface ProviderMailbox {
  resourceId: string;
  address: string;
}

export interface MailboxQuota {
  totalUsage: number;
  totalLimit: number;
  totalPercentage: number;
  supported: boolean;
}

export interface FolderInfo {
  folder: string;
  name: string;
  delimiter?: string;
  attributes?: string[];
  unread?: number;
  total?: number;
}

export interface ProviderMessageHeader {
  uid: string | number;
  subject: string;
  from: { name?: string; address: string };
  to: { name?: string; address: string }[];
  cc?: { name?: string; address: string }[];
  date: string;
  size: number;
  flags: string[];
  hasAttachments: boolean;
  messageId?: string;
}

export interface PaginatedMessages {
  messages: ProviderMessageHeader[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ProviderAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  contentBase64?: string;
}

export interface DetailedMessage extends ProviderMessageHeader {
  text?: string;
  html?: string;
  attachments?: ProviderAttachment[];
  inReplyTo?: string;
  references?: string;
  rawHeaders?: Record<string, string>;
}

export interface SendMessagePayload {
  to: string[];
  displayName?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    contentType: string;
    content: string; // Base64 encoded
  }[];
  inReplyTo?: {
    folder: string;
    uid: string | number;
  };
  forwardOf?: {
    folder: string;
    uid: string | number;
  };
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MessageFlagUpdate {
  add?: string[];    // e.g. ["\\Seen", "\\Flagged"]
  remove?: string[]; // e.g. ["\\Seen"]
}

export interface SearchCriteria {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  since?: string;
  before?: string;
  flags?: string[];
}

export interface WebhookInfo {
  id: string;
  accountResourceId: string;
  mailbox: string;
  name: string;
  description?: string | null;
  events: string[];
  status: 'active' | 'paused' | 'disabled';
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookPayload {
  name: string;
  description?: string;
  events: string[];
  status?: 'active' | 'paused' | 'disabled';
  url: string;
}

export interface WebhookCreatedResult extends WebhookInfo {
  secret: string; // One-time delivered bearer secret
}

export interface MailProvider {
  readonly providerName: string;

  // Identity & Discovery
  getAccount(): Promise<ProviderAccountInfo>;
  listMailboxes(): Promise<ProviderMailbox[]>;
  getMailboxQuota(mailboxResourceId: string): Promise<MailboxQuota>;

  // Folders
  listFolders(mailboxResourceId: string): Promise<FolderInfo[]>;
  createFolder(mailboxResourceId: string, name: string): Promise<FolderInfo>;
  renameFolder(mailboxResourceId: string, folder: string, newName: string): Promise<FolderInfo>;
  deleteFolder(mailboxResourceId: string, folder: string): Promise<void>;

  // Messages
  listMessages(mailboxResourceId: string, folder: string, page?: number, perPage?: number, sort?: string): Promise<PaginatedMessages>;
  getMessage(mailboxResourceId: string, folder: string, uid: string | number): Promise<DetailedMessage>;
  searchMessages(mailboxResourceId: string, folder: string, criteria: SearchCriteria): Promise<ProviderMessageHeader[]>;
  sendMessage(mailboxResourceId: string, payload: SendMessagePayload): Promise<SendResult>;
  moveMessage(mailboxResourceId: string, folder: string, uid: string | number, targetFolder: string): Promise<void>;
  deleteMessage(mailboxResourceId: string, folder: string, uid: string | number): Promise<void>;
  setMessageFlags(mailboxResourceId: string, folder: string, uids: (string | number)[], update: MessageFlagUpdate): Promise<void>;

  // Webhooks
  listWebhooks(mailboxResourceId: string): Promise<WebhookInfo[]>;
  createWebhook(mailboxResourceId: string, payload: CreateWebhookPayload): Promise<WebhookCreatedResult>;
  deleteWebhook(mailboxResourceId: string, webhookId: string): Promise<void>;
  testWebhook(mailboxResourceId: string, webhookId: string): Promise<{ success: boolean; httpStatus: number; error?: string | null }>;
}
