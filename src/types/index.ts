// Domain Types for Docdril Communication Platform

export type RoleType = 'OWNER' | 'ADMINISTRATOR' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export type MailboxStatus = 'ACTIVE' | 'INACTIVE' | 'SYNCING' | 'ERROR';

export type MessageStatus = 'RECEIVED' | 'SENT' | 'DRAFT' | 'QUEUED' | 'FAILED';

export type WebhookStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';

export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface DocdrilUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: RoleType;
  createdAt: string;
}

export interface DocdrilMailbox {
  id: string;
  organizationId: string;
  providerAccountId: string;
  provider: 'hostinger' | 'mock' | string;
  providerMailboxId: string; // Hostinger resource ID e.g. AC...
  emailAddress: string;
  displayName: string;
  status: MailboxStatus;
  quotaBytes: number;
  usedBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocdrilConversation {
  id: string;
  mailboxId: string;
  contactId?: string | null;
  subject: string;
  snippet: string;
  unreadCount: number;
  messageCount: number;
  isStarred: boolean;
  isArchived: boolean;
  isTrash: boolean;
  isSpam: boolean;
  lastMessageAt: string;
  providerThreadId?: string | null;
  messages?: DocdrilMessage[];
}

export interface DocdrilRecipient {
  type: 'to' | 'cc' | 'bcc';
  name?: string | null;
  email: string;
}

export interface DocdrilAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  storageKey?: string;
  contentBase64?: string;
}

export interface DocdrilMessage {
  id: string;
  conversationId: string;
  mailboxId: string;
  providerMessageId?: string | null;
  providerFolder: string;
  senderEmail: string;
  senderName?: string | null;
  recipients: DocdrilRecipient[];
  subject: string;
  snippet: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  status: MessageStatus;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: DocdrilAttachment[];
  headers?: Record<string, string>;
  sentAt?: string | null;
  receivedAt: string;
}

export interface DocdrilDraft {
  id: string;
  mailboxId: string;
  inReplyToMessageId?: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  attachments: DocdrilAttachment[];
  updatedAt: string;
}

export interface DocdrilContact {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  notes?: string | null;
  tags: string[];
  lastInteractionAt?: string | null;
  createdAt: string;
}

export interface DocdrilTemplate {
  id: string;
  organizationId: string;
  title: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  category: string;
  variables: string[];
}

export interface DocdrilSignature {
  id: string;
  organizationId: string;
  userId?: string | null;
  mailboxId?: string | null;
  name: string;
  contentHtml: string;
  isDefault: boolean;
}

export interface DocdrilApiKey {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface DocdrilWebhookSubscription {
  id: string;
  organizationId: string;
  name: string;
  targetUrl: string;
  secret: string;
  events: string[];
  status: WebhookStatus;
  createdAt: string;
}

export interface DocdrilAuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  createdAt: string;
}
