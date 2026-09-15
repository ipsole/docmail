import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mailboxId = searchParams.get('mailboxId');
    const folder = searchParams.get('folder') || 'INBOX';
    const uid = searchParams.get('uid');
    const attachmentId = searchParams.get('attachmentId');
    const filename = searchParams.get('filename') || 'attachment';

    if (!mailboxId || !uid || !attachmentId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const { HOSTINGER_CONFIG } = await import('@/config/hostinger.config');
    const effectiveToken = process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;

    const mbx = await db.findMailboxById(mailboxId);
    if (!mbx?.providerMailboxId || !effectiveToken) {
      return NextResponse.json({ success: false, error: 'Mailbox or token not configured' }, { status: 404 });
    }

    const hostingerUrl = `https://api.mail.hostinger.com/api/v1/mailboxes/${encodeURIComponent(mbx.providerMailboxId)}/folders/${encodeURIComponent(folder)}/messages/${encodeURIComponent(uid)}/attachments/${encodeURIComponent(attachmentId)}`;

    const upstream = await fetch(hostingerUrl, {
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ success: false, error: 'Upstream attachment download failed' }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
