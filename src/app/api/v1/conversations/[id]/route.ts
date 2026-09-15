// GET /api/v1/conversations/[id]
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasScope } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.scopes && !hasScope(auth.scopes, 'messages:read')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Missing "messages:read" scope' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const conversation = await db.findConversationById(id);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: `Conversation ${id} not found` },
        { status: 404 }
      );
    }

    // Lazy load message bodies from Hostinger if needed
    if (process.env.HOSTINGER_MAIL_API_TOKEN && conversation.messages) {
      const mbx = await db.findMailboxById(conversation.mailboxId);
      if (mbx?.providerMailboxId) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(process.env.HOSTINGER_MAIL_API_TOKEN);

          for (const msg of conversation.messages) {
            if ((!msg.bodyHtml || msg.bodyHtml === '<p></p>') && msg.providerMessageId) {
              try {
                const detail = await provider.getMessage(
                  mbx.providerMailboxId,
                  msg.providerFolder || 'INBOX',
                  msg.providerMessageId
                );
                if (detail) {
                  msg.bodyText = detail.text || '';
                  msg.bodyHtml = detail.html || (detail.text ? `<p>${detail.text.replace(/\n/g, '<br/>')}</p>` : '');
                  msg.snippet = (detail.text || detail.html || msg.subject).replace(/<[^>]*>?/gm, '').substring(0, 140);
                  if (detail.attachments && detail.attachments.length > 0) {
                    msg.attachments = detail.attachments.map((a: any) => ({
                      id: a.id,
                      filename: a.filename,
                      contentType: a.contentType,
                      sizeBytes: a.sizeBytes || a.size || 0,
                    }));
                    msg.hasAttachments = true;
                  }
                  await db.updateMessage(msg.id, {
                    bodyText: msg.bodyText,
                    bodyHtml: msg.bodyHtml,
                    snippet: msg.snippet,
                    attachments: msg.attachments,
                    hasAttachments: msg.hasAttachments,
                  });
                }
              } catch (fetchErr: any) {
                console.warn(`[Message Body Fetch] Could not fetch body for ${msg.id}:`, fetchErr.message);
              }
            }
          }
        } catch (e: any) {
          console.warn('[Conversation Detail Provider Error]', e.message);
        }
      }
    }

    const freshConversation = await db.findConversationById(id);

    return NextResponse.json({
      success: true,
      data: freshConversation || conversation,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
