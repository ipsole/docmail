// /api/v1/webhooks/subscriptions - Manage Outbound Webhook Subscriptions for Docdril Apps
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasScope } from '@/lib/rbac';
import { db } from '@/lib/db';
import { DocdrilWebhookSubscription } from '@/types';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.scopes && !hasScope(auth.scopes, 'webhooks:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const subscriptions = await db.listWebhookSubscriptions(auth.organizationId);
    return NextResponse.json({
      success: true,
      data: subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        targetUrl: s.targetUrl,
        events: s.events,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.scopes && !hasScope(auth.scopes, 'webhooks:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !body.targetUrl || !Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Name, targetUrl, and events array are required' },
        { status: 400 }
      );
    }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const newSubscription: DocdrilWebhookSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: auth.organizationId,
      name: body.name,
      targetUrl: body.targetUrl,
      secret,
      events: body.events,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.createWebhookSubscription(newSubscription);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...saved,
          secret, // Return secret once upon creation for HMAC verification
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
