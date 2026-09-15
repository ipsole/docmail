// Hostinger Mail API Provider Implementation
// Directly conforms to the official Hostinger Mail API (OpenAPI 3.0 v1.1.0)
// Base URL: https://api.mail.hostinger.com

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

import { HOSTINGER_CONFIG } from '@/config/hostinger.config';

export class HostingerMailProvider implements MailProvider {
  readonly providerName = 'hostinger';
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token?: string, baseUrl?: string) {
    this.token = token !== undefined ? token : (process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken);
    this.baseUrl = (baseUrl || process.env.HOSTINGER_API_BASE_URL || HOSTINGER_CONFIG.baseUrl).replace(/\/$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('Hostinger API token is not configured (HOSTINGER_MAIL_API_TOKEN missing).');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorCode = data?.code || `HTTP_${response.status}`;
      const errorMessage = data?.error || response.statusText || 'Hostinger API error';
      throw new Error(`[Hostinger API ${errorCode}] ${errorMessage}`);
    }

    return data;
  }

  // 1. Identity & Discovery
  async getAccount(): Promise<ProviderAccountInfo> {
    const res = await this.request<{ data: { orderResourceId: string; mailboxes: ProviderMailbox[] } }>('/api/v1/me');
    return {
      orderResourceId: res.data.orderResourceId,
      mailboxes: res.data.mailboxes,
    };
  }

  async listMailboxes(): Promise<ProviderMailbox[]> {
    const account = await this.getAccount();
    return account.mailboxes || [];
  }

  async getMailboxQuota(mailboxResourceId: string): Promise<MailboxQuota> {
    const res = await this.request<{
      data: {
        totalUsage: number;
        totalLimit: number;
        totalPercentage: number;
        supported: boolean;
      };
    }>(`/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/quota`);

    return res.data;
  }

  // 2. Folders
  async listFolders(mailboxResourceId: string): Promise<FolderInfo[]> {
    const res = await this.request<{ data: FolderInfo[] }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders`
    );
    return res.data || [];
  }

  async createFolder(mailboxResourceId: string, name: string): Promise<FolderInfo> {
    const res = await this.request<{ data: FolderInfo }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    );
    return res.data;
  }

  async renameFolder(mailboxResourceId: string, folder: string, newName: string): Promise<FolderInfo> {
    const res = await this.request<{ data: FolderInfo }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      }
    );
    return res.data;
  }

  async deleteFolder(mailboxResourceId: string, folder: string): Promise<void> {
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}`,
      {
        method: 'DELETE',
      }
    );
  }

  // 3. Messages
  async listMessages(
    mailboxResourceId: string,
    folder: string,
    page = 1,
    perPage = 25,
    sort = '-uid'
  ): Promise<PaginatedMessages> {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      sort,
    });

    const res = await this.request<{
      data: any[];
      pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
      };
    }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages?${query}`
    );

    const messages: ProviderMessageHeader[] = (res.data || []).map((m) => ({
      uid: m.uid,
      subject: m.subject || '(No Subject)',
      from: m.from || { address: 'unknown@docdril.com' },
      to: m.to || [],
      cc: m.cc || [],
      date: m.date || new Date().toISOString(),
      size: m.size || 0,
      flags: m.flags || [],
      hasAttachments: !!m.hasAttachments,
      messageId: m.messageId,
    }));

    return {
      messages,
      pagination: res.pagination,
    };
  }

  async getMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number
  ): Promise<DetailedMessage> {
    const res = await this.request<{ data: any }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/${uid}`
    );
    const m = res.data;

    let textContent = '';
    let htmlContent = '';
    try {
      const textRes = await this.request<{ data: { text?: string; html?: string } }>(
        `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/${uid}/text`
      );
      if (textRes?.data) {
        textContent = textRes.data.text || '';
        htmlContent = textRes.data.html || '';
      }
    } catch (textErr: any) {
      console.warn(`[Hostinger API] Could not fetch text body for message ${uid}:`, textErr.message);
    }

    const attachments = (m.attachments || []).map((att: any) => ({
      id: att.id,
      filename: att.filename || 'attachment',
      contentType: att.contentType || 'application/octet-stream',
      size: att.sizeBytes || att.size || 0,
      sizeBytes: att.sizeBytes || att.size || 0,
      inline: !!att.inline,
      contentId: att.contentId,
    }));

    return {
      uid: m.uid,
      subject: m.subject || '(No Subject)',
      from: m.from || { address: 'unknown@docdril.com' },
      to: m.to || [],
      cc: m.cc || [],
      date: m.date || new Date().toISOString(),
      size: m.size || 0,
      flags: m.flags || [],
      hasAttachments: attachments.length > 0 || !!m.hasAttachments,
      messageId: m.messageId,
      text: textContent,
      html: htmlContent,
      attachments,
      inReplyTo: m.inReplyTo,
      references: m.references,
      rawHeaders: m.headers || {},
    };
  }

  async searchMessages(
    mailboxResourceId: string,
    folder: string,
    criteria: SearchCriteria
  ): Promise<ProviderMessageHeader[]> {
    const res = await this.request<{ data: any[] }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/search`,
      {
        method: 'POST',
        body: JSON.stringify(criteria),
      }
    );

    return (res.data || []).map((m) => ({
      uid: m.uid,
      subject: m.subject || '',
      from: m.from || { address: '' },
      to: m.to || [],
      cc: m.cc || [],
      date: m.date || new Date().toISOString(),
      size: m.size || 0,
      flags: m.flags || [],
      hasAttachments: !!m.hasAttachments,
      messageId: m.messageId,
    }));
  }

  async sendMessage(
    mailboxResourceId: string,
    payload: SendMessagePayload
  ): Promise<SendResult> {
    try {
      await this.request<void>(
        `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/send`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to send message via Hostinger Mail API',
      };
    }
  }

  async moveMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number,
    targetFolder: string
  ): Promise<void> {
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/${uid}/move`,
      {
        method: 'POST',
        body: JSON.stringify({ folder: targetFolder }),
      }
    );
  }

  async deleteMessage(
    mailboxResourceId: string,
    folder: string,
    uid: string | number
  ): Promise<void> {
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/delete`,
      {
        method: 'POST',
        body: JSON.stringify({ uids: [uid] }),
      }
    );
  }

  async deleteMessages(
    mailboxResourceId: string,
    folder: string,
    uids: (string | number)[]
  ): Promise<void> {
    if (!uids.length) return;
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/delete`,
      {
        method: 'POST',
        body: JSON.stringify({ uids }),
      }
    );
  }

  async setMessageFlags(
    mailboxResourceId: string,
    folder: string,
    uids: (string | number)[],
    update: MessageFlagUpdate
  ): Promise<void> {
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/flags`,
      {
        method: 'POST',
        body: JSON.stringify({
          uids,
          add: update.add,
          remove: update.remove,
        }),
      }
    );
  }

  // 4. Webhooks
  async listWebhooks(mailboxResourceId: string): Promise<WebhookInfo[]> {
    const res = await this.request<{ data: WebhookInfo[] }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/webhooks`
    );
    return res.data || [];
  }

  async createWebhook(
    mailboxResourceId: string,
    payload: CreateWebhookPayload
  ): Promise<WebhookCreatedResult> {
    const res = await this.request<{ data: WebhookCreatedResult }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/webhooks`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  }

  async deleteWebhook(mailboxResourceId: string, webhookId: string): Promise<void> {
    await this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/webhooks/${encodeURIComponent(webhookId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async testWebhook(
    mailboxResourceId: string,
    webhookId: string
  ): Promise<{ success: boolean; httpStatus: number; error?: string | null }> {
    const res = await this.request<{
      data: { success: boolean; httpStatus: number; error?: string | null };
    }>(
      `/api/v1/mailboxes/${encodeURIComponent(mailboxResourceId)}/webhooks/${encodeURIComponent(webhookId)}/test`,
      {
        method: 'POST',
      }
    );
    return res.data;
  }
}
