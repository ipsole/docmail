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
    });

    // Auto-sync from Hostinger if no conversations cached for this mailbox & folder
    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    if (conversations.length === 0 && effectiveToken) {
      const mbx = await db.findMailboxById(mailboxId);
      if (mbx?.providerMailboxId) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);
          const messageList = await provider.listMessages(mbx.providerMailboxId, folder, 1, 30);

          for (const msgHeader of messageList.messages) {
            const messageDocdrilId = `msg_${mbx.providerMailboxId}_${msgHeader.uid}`;
            const conversationId = `cnv_${mbx.providerMailboxId}_${msgHeader.uid}`;

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
              status: 'RECEIVED' as const,
              isRead: msgHeader.flags.includes('\\Seen'),
              isStarred: msgHeader.flags.includes('\\Flagged'),
              hasAttachments: msgHeader.hasAttachments,
              receivedAt: msgHeader.date || new Date().toISOString(),
            };
            await db.createMessage(liveMessage);
          }

          conversations = await db.listConversations({
            mailboxId,
            folder,
            isStarred: starred === 'true' ? true : undefined,
            contactId: contactId || undefined,
            search: search || undefined,
          });
        } catch (syncErr: any) {
          console.warn('[Conversations AutoSync Error]', syncErr.message);
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
