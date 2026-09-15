// GET /api/v1/mailboxes
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    let mailboxes = await db.listMailboxes(auth.organizationId);

    // Auto-discover mailboxes if db is empty and token is in env
    if (mailboxes.length === 0 && process.env.HOSTINGER_MAIL_API_TOKEN) {
      try {
        const { HostingerMailProvider } = await import('@/services/mail/hostinger.provider');
        const provider = new HostingerMailProvider(process.env.HOSTINGER_MAIL_API_TOKEN);
        const account = await provider.getAccount();
        if (account.mailboxes && account.mailboxes.length > 0) {
          for (const mbx of account.mailboxes) {
            let quotaBytes = 5368709120;
            let usedBytes = 0;
            try {
              const quota = await provider.getMailboxQuota(mbx.resourceId);
              quotaBytes = quota.totalLimit || quotaBytes;
              usedBytes = quota.totalUsage || usedBytes;
            } catch {}

            const record = {
              id: `mbx_${mbx.resourceId}`,
              organizationId: auth.organizationId,
              providerAccountId: account.orderResourceId,
              provider: 'hostinger' as const,
              providerMailboxId: mbx.resourceId,
              emailAddress: mbx.address,
              displayName: mbx.address.split('@')[0],
              status: 'ACTIVE' as const,
              quotaBytes,
              usedBytes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await db.addMailbox(record);
          }
          mailboxes = await db.listMailboxes(auth.organizationId);
        }
      } catch (e: any) {
        console.warn('[Mailboxes GET] Auto-discovery failed:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: mailboxes.map((m) => ({
        id: m.id,
        emailAddress: m.emailAddress,
        displayName: m.displayName,
        status: m.status,
        quotaBytes: m.quotaBytes,
        usedBytes: m.usedBytes,
        provider: m.provider,
        createdAt: m.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
}
