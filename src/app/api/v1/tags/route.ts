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
    const { conversationId, tag, action } = body;

    if (!conversationId || !tag) {
      return NextResponse.json(
        { success: false, error: 'conversationId and tag are required' },
        { status: 400 }
      );
    }

    let updated;
    if (action === 'remove') {
      updated = await db.removeTagFromConversation(conversationId, tag);
    } else {
      updated = await db.addTagToConversation(conversationId, tag);
    }

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
