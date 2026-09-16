// POST /api/v1/conversations/batch
// Batch operations: move to trash, restore, delete forever, empty trash
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const body = await req.json();

    const { action, conversationIds = [], mailboxId: rawMailboxId, tag } = body || {};

    const allowedActions = [
      'trash',
      'restore',
      'delete_forever',
      'empty_trash',
      'add_tag',
      'remove_tag',
      'star',
      'unstar',
      'mark_read',
      'mark_unread',
    ];

    if (!action || !allowedActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Allowed: ${allowedActions.map((a) => `"${a}"`).join(', ')}` },
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

    // Helper to extract clean Hostinger folder name
    const getHostingerFolder = (folderName?: string): string => {
      const clean = (folderName || 'INBOX').replace(/^INBOX\./, '').trim();
      if (!clean || clean.toLowerCase() === 'inbox') return 'INBOX';
      if (clean.toLowerCase() === 'sent') return 'Sent';
      if (clean.toLowerCase() === 'drafts') return 'Drafts';
      if (clean.toLowerCase() === 'trash') return 'Trash';
      if (clean.toLowerCase() === 'junk' || clean.toLowerCase() === 'spam') return 'Junk';
      return clean;
    };

    // 1. Gather all target messages and their source folders BEFORE mutating local DB
    const syncTasks: {
      providerMessageId: string;
      sourceFolder: string;
      status?: string;
    }[] = [];

    if (action === 'empty_trash') {
      const trashMsgs = await db.listTrashMessages(mbx?.id || mailboxId);
      for (const m of trashMsgs) {
        if (m.providerMessageId) {
          syncTasks.push({
            providerMessageId: m.providerMessageId,
            sourceFolder: 'Trash',
            status: m.status,
          });
        }
      }
    } else {
      for (const cnvId of conversationIds) {
        const msgs = await db.listMessagesByConversation(cnvId);
        for (const m of msgs) {
          if (m.providerMessageId) {
            syncTasks.push({
              providerMessageId: m.providerMessageId,
              sourceFolder: getHostingerFolder(m.providerFolder),
              status: m.status,
            });
          }
        }
      }
    }

    // 2. Execute DB Operation
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

      case 'add_tag': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        if (!tag) {
          return NextResponse.json({ success: false, error: 'tag is required for add_tag' }, { status: 400 });
        }
        affectedIds = await db.batchAddTag(conversationIds, tag);
        affectedCount = affectedIds.length;
        break;
      }

      case 'remove_tag': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        if (!tag) {
          return NextResponse.json({ success: false, error: 'tag is required for remove_tag' }, { status: 400 });
        }
        affectedIds = await db.batchRemoveTag(conversationIds, tag);
        affectedCount = affectedIds.length;
        break;
      }

      case 'star': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        affectedIds = await db.batchSetStarred(conversationIds, true);
        affectedCount = affectedIds.length;
        break;
      }

      case 'unstar': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        affectedIds = await db.batchSetStarred(conversationIds, false);
        affectedCount = affectedIds.length;
        break;
      }

      case 'mark_read': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        for (const id of conversationIds) {
          await db.updateConversation(id, { unreadCount: 0 }).catch(() => {});
        }
        affectedIds = conversationIds;
        affectedCount = affectedIds.length;
        break;
      }

      case 'mark_unread': {
        if (!conversationIds.length) {
          return NextResponse.json({ success: false, error: 'conversationIds array is required' }, { status: 400 });
        }
        for (const id of conversationIds) {
          await db.updateConversation(id, { unreadCount: 1 }).catch(() => {});
        }
        affectedIds = conversationIds;
        affectedCount = affectedIds.length;
        break;
      }
    }

    // 3. Synchronize with Hostinger Provider (if configured)
    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    if (effectiveToken && mbx?.providerMailboxId && syncTasks.length > 0) {
      try {
        const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
        const provider = new HostingerMailProvider(effectiveToken);

        if (action === 'trash') {
          // Move from each message's real source folder to Trash
          await Promise.allSettled(
            syncTasks.map((t) =>
              provider.moveMessage(mbx.providerMailboxId, t.sourceFolder, t.providerMessageId, 'Trash')
            )
          );
        } else if (action === 'restore') {
          // Move from Trash back to Inbox or original folder
          await Promise.allSettled(
            syncTasks.map((t) => {
              const destFolder = t.status === 'SENT' ? 'Sent' : 'INBOX';
              return provider.moveMessage(mbx.providerMailboxId, 'Trash', t.providerMessageId, destFolder);
            })
          );
        } else if (action === 'delete_forever' || action === 'empty_trash') {
          // Group by source folder and delete permanently from both source folder AND Trash
          const folderToUids = new Map<string, string[]>();
          const allUids: string[] = [];
          for (const t of syncTasks) {
            const f = t.sourceFolder || 'Trash';
            if (!folderToUids.has(f)) folderToUids.set(f, []);
            folderToUids.get(f)!.push(t.providerMessageId);
            allUids.push(t.providerMessageId);
          }

          const deletePromises: Promise<any>[] = [];
          for (const [folder, uids] of folderToUids.entries()) {
            deletePromises.push(provider.deleteMessages(mbx.providerMailboxId, folder, uids).catch(() => {}));
          }
          // Also explicitly purge all UIDs from Trash on Hostinger
          if (allUids.length > 0) {
            deletePromises.push(provider.deleteMessages(mbx.providerMailboxId, 'Trash', allUids).catch(() => {}));
          }
          await Promise.allSettled(deletePromises);
        }
      } catch (syncErr: any) {
        console.warn('[Batch Hostinger Sync Warning]', syncErr.message);
      }
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
