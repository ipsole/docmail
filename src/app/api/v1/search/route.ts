// GET /api/v1/search
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    if (!query) {
      return NextResponse.json({ success: true, data: { conversations: [], contacts: [] } });
    }

    const mailboxes = await db.listMailboxes(auth.organizationId);
    const primaryMailbox = mailboxes[0];

    const conversations = await db.listConversations({
      mailboxId: primaryMailbox?.id || '',
      search: query,
    });

    const contacts = (await db.listContacts(auth.organizationId)).filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.company && c.company.toLowerCase().includes(query))
    );

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        contacts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
