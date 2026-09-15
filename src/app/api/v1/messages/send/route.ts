// POST /api/v1/messages/send
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasScope } from '@/lib/rbac';
import { MailService } from '@/services/mail/mail.service';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);

    if (auth.scopes && !hasScope(auth.scopes, 'messages:send')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Missing "messages:send" scope' },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient "to" array is required' },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { success: false, error: 'Email "subject" is required' },
        { status: 400 }
      );
    }

    // Default to first mailbox if mailboxId omitted
    let mailboxId = body.mailboxId;
    if (!mailboxId) {
      const mailboxes = await db.listMailboxes(auth.organizationId);
      mailboxId = mailboxes[0]?.id;
    }

    if (!mailboxId) {
      return NextResponse.json(
        { success: false, error: 'No active mailbox available to dispatch message' },
        { status: 400 }
      );
    }

    const result = await MailService.sendEmail({
      mailboxId,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      bodyText: body.bodyText,
      bodyHtml: body.bodyHtml,
      attachments: body.attachments,
      inReplyToConversationId: body.inReplyToConversationId,
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        status: 'SENT',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
