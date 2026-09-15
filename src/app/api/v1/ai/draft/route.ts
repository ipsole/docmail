// POST /api/v1/ai/draft
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { AiCommunicationService } from '@/services/ai/ai-communication.service';

export async function POST(req: NextRequest) {
  try {
    await authenticateRequest(req);
    const body = await req.json();

    if (!body.messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
    }

    const message = await db.findMessageById(body.messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    const draft = await AiCommunicationService.suggestReply(message, body.tone || 'professional');
    return NextResponse.json({ success: true, data: draft });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
