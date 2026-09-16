// GET /api/v1/tags & POST /api/v1/tags
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const tags = await db.listTags(auth.organizationId);
    return NextResponse.json({ success: true, data: tags });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateRequest(req);
    const body = await req.json();
    const { conversationId, conversationIds, tag, action } = body;

    const ids: string[] = Array.isArray(conversationIds)
      ? conversationIds.filter(Boolean)
      : conversationId
      ? [conversationId]
      : [];

    if (ids.length === 0 || !tag) {
      return NextResponse.json(
        { success: false, error: 'conversationId (or conversationIds array) and tag are required' },
        { status: 400 }
      );
    }

    if (ids.length > 1) {
      const affected =
        action === 'remove'
          ? await db.batchRemoveTag(ids, tag)
          : await db.batchAddTag(ids, tag);
      return NextResponse.json({
        success: true,
        data: {
          affectedCount: affected.length,
          affectedIds: affected,
          tag,
          action: action === 'remove' ? 'remove' : 'add',
        },
      });
    }

    const singleId = ids[0];
    let updated;
    if (action === 'remove') {
      updated = await db.removeTagFromConversation(singleId, tag);
    } else {
      updated = await db.addTagToConversation(singleId, tag);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
