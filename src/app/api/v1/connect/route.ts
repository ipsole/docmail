// POST /api/v1/connect
// Authenticates user's live Hostinger Mail API token, auto-discovers mailboxes, and syncs real emails.
import { NextRequest, NextResponse } from 'next/server';
import { HostingerMailProvider } from '@/services/mail/hostinger.provider';
import { db } from '@/lib/db';
import { DocdrilMailbox, DocdrilMessage } from '@/types';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token || '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Hostinger API Bearer token is required.' },
        { status: 400 }
      );
    }

    // 1. Test token with official Hostinger API
    const provider = new HostingerMailProvider(token);
    const accountInfo = await provider.getAccount();

    if (!accountInfo.mailboxes || accountInfo.mailboxes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token verified successfully, but no mailboxes were found under this Hostinger order.',
        },
        { status: 404 }
      );
    }

    // 2. Set token in environment and update .env file for persistence
    process.env.HOSTINGER_MAIL_API_TOKEN = token;
    process.env.MAIL_PROVIDER_DEFAULT = 'hostinger';

    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('HOSTINGER_MAIL_API_TOKEN=')) {
          envContent = envContent.replace(
            /HOSTINGER_MAIL_API_TOKEN=.*(\r?\n|$)/,
            `HOSTINGER_MAIL_API_TOKEN="${token}"$1`
          );
        } else {
          envContent += `\nHOSTINGER_MAIL_API_TOKEN="${token}"\n`;
        }

        if (envContent.includes('MAIL_PROVIDER_DEFAULT=')) {
          envContent = envContent.replace(
            /MAIL_PROVIDER_DEFAULT=.*(\r?\n|$)/,
            `MAIL_PROVIDER_DEFAULT="hostinger"$1`
          );
        }

        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr) {
      console.warn('[Connect] Could not persist token to .env file:', fsErr);
    }

    // 3. Register real mailboxes in database
    const savedMailboxes: DocdrilMailbox[] = [];

    for (const mbx of accountInfo.mailboxes) {
      let quotaBytes = 5368709120;
      let usedBytes = 0;

      try {
        const quota = await provider.getMailboxQuota(mbx.resourceId);
        quotaBytes = quota.totalLimit || quotaBytes;
        usedBytes = quota.totalUsage || usedBytes;
      } catch {}

      const mailboxRecord: DocdrilMailbox = {
        id: `mbx_${mbx.resourceId}`,
        organizationId: 'org_docdril_primary',
        providerAccountId: accountInfo.orderResourceId,
        provider: 'hostinger',
        providerMailboxId: mbx.resourceId,
        emailAddress: mbx.address,
        displayName: mbx.address.split('@')[0],
        status: 'ACTIVE',
        quotaBytes,
        usedBytes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.addMailbox(mailboxRecord);
      savedMailboxes.push(mailboxRecord);

      // 4. Initial live sync of INBOX messages from Hostinger
      try {
        const messageList = await provider.listMessages(mbx.resourceId, 'INBOX', 1, 25);
        for (const msgHeader of messageList.messages) {
          const detail = await provider.getMessage(mbx.resourceId, 'INBOX', msgHeader.uid);
          const messageDocdrilId = `msg_${mbx.resourceId}_${msgHeader.uid}`;
          const conversationId = `cnv_${mbx.resourceId}_${msgHeader.uid}`;

          const liveMessage: DocdrilMessage = {
            id: messageDocdrilId,
            conversationId,
            mailboxId: mailboxRecord.id,
            providerMessageId: String(msgHeader.uid),
            providerFolder: 'INBOX',
            senderEmail: detail.from?.address || 'unknown@sender.com',
            senderName: detail.from?.name || null,
            recipients: detail.to.map((r) => ({ type: 'to', email: r.address, name: r.name })),
            subject: detail.subject || '(No Subject)',
            snippet: (detail.text || detail.html || '').replace(/<[^>]*>?/gm, '').substring(0, 140),
            bodyText: detail.text || '',
            bodyHtml: detail.html || `<p>${detail.text || ''}</p>`,
            status: 'RECEIVED',
            isRead: detail.flags.includes('\\Seen'),
            isStarred: detail.flags.includes('\\Flagged'),
            hasAttachments: detail.hasAttachments,
            attachments: detail.attachments?.map((a) => ({
              id: a.id,
              filename: a.filename,
              contentType: a.contentType,
              sizeBytes: a.size,
            })),
            receivedAt: detail.date || new Date().toISOString(),
          };

          await db.createMessage(liveMessage);
        }
      } catch (syncErr: any) {
        console.warn(`[Connect] Could not sync initial messages for ${mbx.address}:`, syncErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected ${savedMailboxes.length} live Hostinger mailbox(es)!`,
      data: {
        orderResourceId: accountInfo.orderResourceId,
        mailboxes: savedMailboxes,
      },
    });
  } catch (err: any) {
    const errorMsg = err.cause?.message
      ? `${err.message} (${err.cause.message})`
      : (err.message || 'Failed to authenticate with Hostinger');

    console.error('[Connect API Error]', errorMsg, err.cause || '');

    let userFriendlyError = errorMsg;
    if (err.message?.includes('fetch failed') || err.cause?.code === 'ENOTFOUND') {
      userFriendlyError = 'Could not reach Hostinger API (api.mail.hostinger.com). Network connection error.';
    } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
      userFriendlyError = 'Invalid or expired Hostinger Bearer token. Please verify your token in Hostinger hPanel.';
    }

    return NextResponse.json(
      { success: false, error: userFriendlyError, details: errorMsg },
      { status: 400 }
    );
  }
}
