// GET /api/v1/admin/health
// Checks Hostinger Mail API status, webhook status, token configuration, and system metrics
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { ProviderFactory } from '@/services/mail/provider.factory';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const hasHostingerToken = !!process.env.HOSTINGER_MAIL_API_TOKEN;
    const configuredProvider = process.env.MAIL_PROVIDER_DEFAULT || (hasHostingerToken ? 'hostinger' : 'mock');

    let providerStatus = 'connected';
    let providerError = null;
    let providerAccountInfo = null;

    try {
      const provider = ProviderFactory.getProvider();
      providerAccountInfo = await provider.getAccount();
    } catch (err: any) {
      providerStatus = 'degraded';
      providerError = err.message;
    }

    const mailboxes = await db.listMailboxes(auth.organizationId);
    const auditLogs = await db.listAuditLogs(auth.organizationId);

    return NextResponse.json({
      success: true,
      data: {
        status: providerStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        provider: {
          name: configuredProvider,
          status: providerStatus,
          hasApiToken: hasHostingerToken,
          error: providerError,
          orderResourceId: providerAccountInfo?.orderResourceId || 'N/A',
          connectedMailboxCount: providerAccountInfo?.mailboxes?.length || mailboxes.length,
        },
        webhooks: {
          inboundEndpoint: '/api/v1/webhooks/hostinger',
          isSecretConfigured: !!process.env.HOSTINGER_WEBHOOK_SECRET,
        },
        ecosystem: {
          activeMailboxes: mailboxes.length,
          totalAuditEvents: auditLogs.length,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
