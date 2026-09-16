// GET /api/v1/conversations
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasScope } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.scopes && !hasScope(auth.scopes, 'messages:read')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Missing "messages:read" scope' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mailboxIdParam = searchParams.get('mailboxId');
    const folder = searchParams.get('folder') || 'INBOX';
    const starred = searchParams.get('starred');
    const contactId = searchParams.get('contactId');
    const search = searchParams.get('q');
    const tag = searchParams.get('tag');

    const mailboxes = await db.listMailboxes(auth.organizationId);
    const mailboxId = mailboxIdParam || mailboxes[0]?.id;

    if (!mailboxId) {
      return NextResponse.json({ success: true, data: [] });
    }

    let conversations = await db.listConversations({
      mailboxId,
      folder,
      isStarred: starred === 'true' ? true : undefined,
      contactId: contactId || undefined,
      search: search || undefined,
      tag: tag || undefined,
    });

    // Sync latest messages from Hostinger
    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    if (effectiveToken) {
      const mbx = (await db.findMailboxById(mailboxId)) || (await db.findMailboxByProviderId(mailboxId));
      if (mbx?.providerMailboxId) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);
          const cleanFolder = folder.replace(/^INBOX\./, '');
          const hostingerFolder = cleanFolder === 'Spam' ? 'Junk' : cleanFolder;
          const messageList = await provider.listMessages(mbx.providerMailboxId, hostingerFolder, 1, 25);

          for (const msgHeader of messageList.messages) {
            const folderTag = cleanFolder === 'INBOX' ? '' : `_${cleanFolder}`;
            const messageDocdrilId = `msg_${mbx.providerMailboxId}${folderTag}_${msgHeader.uid}`;
            const conversationId = `cnv_${mbx.providerMailboxId}${folderTag}_${msgHeader.uid}`;

            const isSentFolder = cleanFolder.toLowerCase() === 'sent';
            const liveMessage = {
              id: messageDocdrilId,
              conversationId,
              mailboxId: mbx.id,
              providerMessageId: String(msgHeader.uid),
              providerFolder: folder,
              senderEmail: msgHeader.from?.address || 'unknown@sender.com',
              senderName: msgHeader.from?.name || null,
              recipients: msgHeader.to?.map((r) => ({ type: 'to' as const, email: r.address, name: r.name })) || [],
              subject: msgHeader.subject || '(No Subject)',
              snippet: (msgHeader.subject || '').substring(0, 140),
              bodyText: '',
              bodyHtml: '',
              status: isSentFolder ? ('SENT' as const) : ('RECEIVED' as const),
              isRead: msgHeader.flags.includes('\\Seen'),
              isStarred: msgHeader.flags.includes('\\Flagged'),
              hasAttachments: msgHeader.hasAttachments,
              receivedAt: msgHeader.date || new Date().toISOString(),
            };

            const existing = await db.findMessageById(messageDocdrilId);
            if (!existing) {
              await db.createMessage(liveMessage);
            } else {
              // Keep read and starred flags in sync
              await db.updateMessage(messageDocdrilId, {
                isRead: liveMessage.isRead,
                isStarred: liveMessage.isStarred,
                status: liveMessage.status,
              });
            }
          }

          conversations = await db.listConversations({
            mailboxId,
            folder,
            isStarred: starred === 'true' ? true : undefined,
            contactId: contactId || undefined,
            search: search || undefined,
            tag: tag || undefined,
          });
        } catch (syncErr: any) {
          console.warn('[Conversations Sync Error]', syncErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
