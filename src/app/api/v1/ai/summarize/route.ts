// POST /api/v1/ai/summarize
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { AiCommunicationService } from '@/services/ai/ai-communication.service';

export async function POST(req: NextRequest) {
  try {
    await authenticateRequest(req);
    const body = await req.json();

    if (!body.conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const conversation = await db.findConversationById(body.conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const result = await AiCommunicationService.summarizeConversation(conversation);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
