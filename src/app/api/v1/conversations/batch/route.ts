// POST /api/v1/conversations/batch
// Batch operations: move to trash, restore, delete forever, empty trash
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const body = await req.json();

    const { action, conversationIds = [], mailboxId: rawMailboxId } = body || {};

    if (!action || !['trash', 'restore', 'delete_forever', 'empty_trash'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Allowed: "trash", "restore", "delete_forever", "empty_trash"' },
        { status: 400 }
      );
    }

    const mailboxes = await db.listMailboxes(auth.organizationId);
    const mailboxId = rawMailboxId || mailboxes[0]?.id;

    if (!mailboxId) {
      return NextResponse.json({ success: false, error: 'Mailbox not found' }, { status: 400 });
    }

    const mbx = (await db.findMailboxById(mailboxId)) || (await db.findMailboxByProviderId(mailboxId));
    let affectedCount = 0;
    let affectedIds: string[] = [];

    // 1. Execute DB Operation
    switch (action) {
      case 'trash': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        affectedIds = await db.moveConversationsToTrash(conversationIds, mailboxId);
        affectedCount = affectedIds.length;
        break;
      }

      case 'restore': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        affectedIds = await db.restoreConversationsFromTrash(conversationIds, mailboxId);
        affectedCount = affectedIds.length;
        break;
      }

      case 'delete_forever': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        affectedIds = await db.deleteConversationsPermanently(conversationIds, mailboxId);
        affectedCount = affectedIds.length;
        break;
      }

      case 'empty_trash': {
        affectedCount = await db.emptyTrash(mailboxId);
        break;
      }
    }

    // 2. Asynchronous Sync with Hostinger Provider (if configured)
    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    if (effectiveToken && mbx?.providerMailboxId) {
      // Fire-and-forget sync so UI responds instantly
      (async () => {
        try {
          const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
          const provider = new HostingerMailProvider(effectiveToken);

          if (action === 'trash' || action === 'restore') {
            const targetFolder = action === 'trash' ? 'Trash' : 'INBOX';
            const sourceFolder = action === 'trash' ? 'INBOX' : 'Trash';

            for (const cnvId of conversationIds) {
              const msgs = await db.listMessagesByConversation(cnvId);
              for (const m of msgs) {
                if (m.providerMessageId) {
                  try {
                    await provider.moveMessage(mbx.providerMailboxId, sourceFolder, m.providerMessageId, targetFolder);
                  } catch (moveErr: any) {
                    // Ignore if message already moved or not on remote
                  }
                }
              }
            }
          } else if (action === 'delete_forever' || action === 'empty_trash') {
            // For delete forever, delete messages from Trash on remote
            for (const cnvId of conversationIds) {
              const msgs = await db.listMessagesByConversation(cnvId);
              for (const m of msgs) {
                if (m.providerMessageId) {
                  try {
                    await provider.deleteMessage(mbx.providerMailboxId, 'Trash', m.providerMessageId);
                  } catch (delErr: any) {
                    // Ignore if already deleted
                  }
                }
              }
            }
          }
        } catch (syncErr: any) {
          console.warn('[Batch Hostinger Sync Warning]', syncErr.message);
        }
      })().catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount,
        affectedIds,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
