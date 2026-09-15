// POST /api/v1/webhooks/hostinger
// Inbound Webhook Receiver from Hostinger Mail API
import { NextRequest, NextResponse } from 'next/server';
import { HostingerWebhookIngestService } from '@/services/webhooks/hostinger-ingest.service';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const payload = await req.json();

    const result = await HostingerWebhookIngestService.processWebhook(authHeader, payload);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Hostinger Webhook Error]', err.message);
    const status = err.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
