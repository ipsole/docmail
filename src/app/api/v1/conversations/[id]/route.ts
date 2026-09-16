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
    let conversation = await db.findConversationById(id);

    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    // If conversation not in local container cache, attempt recovery directly from Hostinger
    if (!conversation && effectiveToken) {
      const cleanId = id.replace(/^(cnv_|msg_)/, '');
      const parts = cleanId.split('_');
      let mbxResource = parts[0] || '1699703';
      let folderName = 'INBOX';
      let uid = parts[1];
      if (parts.length >= 3) {
        folderName = parts[1];
        uid = parts[2];
      }

      const mbx =
        (await db.findMailboxByProviderId(mbxResource)) ||
        (await db.findMailboxById(mbxResource)) ||
        (await db.listMailboxes('org_docdril_primary'))[0];

      if (mbx && uid) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);
          const cleanFolder = folderName.replace(/^INBOX\./, '');
          const hostingerFolder = cleanFolder === 'Spam' ? 'Junk' : cleanFolder;
          const detail = await provider.getMessage(mbx.providerMailboxId, hostingerFolder, uid);
          if (detail) {
            const folderTag = cleanFolder === 'INBOX' ? '' : `_${cleanFolder}`;
            const messageDocdrilId = `msg_${mbx.providerMailboxId}${folderTag}_${uid}`;
            const liveMessage = {
              id: messageDocdrilId,
              conversationId: id,
              mailboxId: mbx.id,
              providerMessageId: String(uid),
              providerFolder: folderName,
              senderEmail: detail.from?.address || 'unknown@sender.com',
              senderName: detail.from?.name || null,
              recipients: detail.to?.map((r) => ({ type: 'to' as const, email: r.address, name: r.name })) || [],
              subject: detail.subject || '(No Subject)',
              snippet: (detail.text || detail.html || detail.subject || '').replace(/<[^>]*>?/gm, '').substring(0, 140),
              bodyText: detail.text || '',
              bodyHtml: detail.html || (detail.text ? `<p>${detail.text.replace(/\n/g, '<br/>')}</p>` : ''),
              status: 'RECEIVED' as const,
              isRead: true,
              isStarred: false,
              hasAttachments: (detail.attachments?.length || 0) > 0,
              attachments: detail.attachments?.map((a: any) => ({
                id: a.id,
                filename: a.filename,
                contentType: a.contentType,
                sizeBytes: a.sizeBytes || a.size || 0,
              })),
              receivedAt: detail.date || new Date().toISOString(),
            };
            await db.createMessage(liveMessage);
            conversation = await db.findConversationById(id);
          }
        } catch (recoverErr: any) {
          console.warn('[Conversation On-The-Fly Recovery Error]', recoverErr.message);
        }
      }
    }

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: `Conversation ${id} not found` },
        { status: 404 }
      );
    }

    // Lazy load message bodies from Hostinger if needed
    if (effectiveToken && conversation.messages) {
      const mbx = await db.findMailboxById(conversation.mailboxId);
      if (mbx?.providerMailboxId) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);

          for (const msg of conversation.messages) {
            if ((!msg.bodyHtml || msg.bodyHtml === '<p></p>') && msg.providerMessageId) {
              try {
                const cleanMsgFolder = (msg.providerFolder || 'INBOX').replace(/^INBOX\./, '');
                const hostingerFolder = cleanMsgFolder === 'Spam' ? 'Junk' : cleanMsgFolder;
                const detail = await provider.getMessage(
                  mbx.providerMailboxId,
                  hostingerFolder,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const cnv = await db.findConversationById(id);
    if (!cnv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const mbx = (await db.findMailboxById(cnv.mailboxId)) || (await db.findMailboxByProviderId(cnv.mailboxId));
    const msgs = await db.listMessagesByConversation(id);

    // 1. Local DB Operation
    if (permanent) {
      await db.deleteConversationsPermanently([id], cnv.mailboxId);
    } else {
      await db.moveConversationsToTrash([id], cnv.mailboxId);
    }

    // 2. Synchronize with Hostinger Provider
    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    if (effectiveToken && mbx?.providerMailboxId && msgs.length > 0) {
      try {
        const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
        const provider = new HostingerMailProvider(effectiveToken);

        const getHostingerFolder = (folderName?: string): string => {
          const clean = (folderName || 'INBOX').replace(/^INBOX\./, '').trim();
          if (!clean || clean.toLowerCase() === 'inbox') return 'INBOX';
          if (clean.toLowerCase() === 'sent') return 'Sent';
          if (clean.toLowerCase() === 'drafts') return 'Drafts';
          if (clean.toLowerCase() === 'trash') return 'Trash';
          if (clean.toLowerCase() === 'junk' || clean.toLowerCase() === 'spam') return 'Junk';
          return clean;
        };

        const syncPromises = msgs
          .filter((m): m is typeof m & { providerMessageId: string } => Boolean(m.providerMessageId))
          .map(async (m) => {
            const hostingerFolder = getHostingerFolder(m.providerFolder);
            if (permanent) {
              // Delete from original folder AND from Trash in case it was already in Trash
              await provider.deleteMessage(mbx.providerMailboxId, hostingerFolder, m.providerMessageId).catch(() => {});
              if (hostingerFolder !== 'Trash') {
                await provider.deleteMessage(mbx.providerMailboxId, 'Trash', m.providerMessageId).catch(() => {});
              }
            } else {
              return provider.moveMessage(mbx.providerMailboxId, hostingerFolder, m.providerMessageId, 'Trash');
            }
          });
        await Promise.allSettled(syncPromises);
      } catch (remoteErr: any) {
        console.warn('[DELETE Hostinger Sync Warning]', remoteErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id, status: permanent ? 'DELETED_PERMANENTLY' : 'TRASHED' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    const { id } = await params;
    const body = await req.json();

    const cnv = await db.findConversationById(id);
    if (!cnv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const mbx = (await db.findMailboxById(cnv.mailboxId)) || (await db.findMailboxByProviderId(cnv.mailboxId));
    const msgs = await db.listMessagesByConversation(id);

    if (body.isTrash === false || body.restore === true) {
      await db.restoreConversationsFromTrash([id], cnv.mailboxId);

      const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
      const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;
      if (effectiveToken && mbx?.providerMailboxId && msgs.length > 0) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);
          const syncPromises = msgs
            .filter((m): m is typeof m & { providerMessageId: string } => Boolean(m.providerMessageId))
            .map(async (m) => {
              const destFolder = m.status === 'SENT' ? 'Sent' : 'INBOX';
              return provider.moveMessage(mbx.providerMailboxId, 'Trash', m.providerMessageId, destFolder);
            });
          await Promise.allSettled(syncPromises);
        } catch (remoteErr: any) {
          console.warn('[Restore Hostinger Sync Warning]', remoteErr.message);
        }
      }
    } else if (body.isTrash === true) {
      await db.moveConversationsToTrash([id], cnv.mailboxId);

      const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
      const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;
      if (effectiveToken && mbx?.providerMailboxId && msgs.length > 0) {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);
          const syncPromises = msgs
            .filter((m): m is typeof m & { providerMessageId: string } => Boolean(m.providerMessageId))
            .map(async (m) => {
              const clean = (m.providerFolder || 'INBOX').replace(/^INBOX\./, '').trim();
              const srcFolder = clean.toLowerCase() === 'sent' ? 'Sent' : 'INBOX';
              return provider.moveMessage(mbx.providerMailboxId, srcFolder, m.providerMessageId, 'Trash');
            });
          await Promise.allSettled(syncPromises);
        } catch (remoteErr: any) {
          console.warn('[Trash Hostinger Sync Warning]', remoteErr.message);
        }
      }
    } else if (body.addTag) {
      await db.addTagToConversation(id, body.addTag);
    } else if (body.removeTag) {
      await db.removeTagFromConversation(id, body.removeTag);
    } else {
      await db.updateConversation(id, body);
    }

    const updated = await db.findConversationById(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

