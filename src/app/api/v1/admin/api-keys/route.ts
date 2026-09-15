// /api/v1/admin/api-keys - Manage Service Account API Keys
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';
import { generateApiKey } from '@/lib/crypto';
import { DocdrilApiKey } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.role && !hasPermission(auth.role, PERMISSIONS.INTEGRATION_MANAGE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const keys = await db.listApiKeys(auth.organizationId);
    return NextResponse.json({ success: true, data: keys });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.role && !hasPermission(auth.role, PERMISSIONS.INTEGRATION_MANAGE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !Array.isArray(body.scopes)) {
      return NextResponse.json(
        { success: false, error: 'Name and scopes array are required' },
        { status: 400 }
      );
    }

    const { key, hash, prefix } = generateApiKey();

    const newKey: DocdrilApiKey = {
      id: `key_${Date.now()}`,
      organizationId: auth.organizationId,
      name: body.name,
      prefix,
      scopes: body.scopes,
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };

    await db.createApiKey(newKey);

    // Log audit trail
    await db.logAudit({
      id: `aud_${Date.now()}`,
      organizationId: auth.organizationId,
      action: 'api_key.created',
      entityType: 'api_key',
      entityId: newKey.id,
      metadata: { name: newKey.name, scopes: newKey.scopes },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newKey,
          rawSecretKey: key, // Delivered once only upon generation
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
