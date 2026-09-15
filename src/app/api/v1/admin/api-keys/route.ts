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
    const maskedKeys = keys.map((k) => ({
      id: k.id,
      organizationId: k.organizationId,
      name: k.name,
      prefix: k.prefix,
      scopes: k.scopes,
      isRevoked: k.isRevoked,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      maskedKey: `dd_live_${k.prefix ? k.prefix.replace(/^dd_live_/, '') : 'crm'}_••••••••••••••••`,
    }));

    return NextResponse.json({
      success: true,
      data: maskedKeys,
      count: maskedKeys.length,
    });
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Token/Application name is required' },
        { status: 400 }
      );
    }

    const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
      ? body.scopes
      : ['messages:read', 'messages:send', 'contacts:read', 'contacts:write'];

    const { key, hash, prefix } = generateApiKey();

    const newKey: DocdrilApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: auth.organizationId,
      name: body.name.trim(),
      prefix,
      keyHash: hash,
      rawSecretKey: key,
      scopes,
      isRevoked: false,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
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
          id: newKey.id,
          name: newKey.name,
          prefix: newKey.prefix,
          scopes: newKey.scopes,
          createdAt: newKey.createdAt,
          maskedKey: `dd_live_${newKey.prefix}_••••••••••••••••`,
          rawSecretKey: key, // Delivered once upon creation so user can copy it
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.role && !hasPermission(auth.role, PERMISSIONS.INTEGRATION_MANAGE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let keyId = searchParams.get('id');

    if (!keyId) {
      try {
        const body = await req.json();
        keyId = body?.id;
      } catch {
        // No json body
      }
    }

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'API key id is required to delete' },
        { status: 400 }
      );
    }

    const deleted = await db.deleteApiKey(keyId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    await db.logAudit({
      id: `aud_${Date.now()}`,
      organizationId: auth.organizationId,
      action: 'api_key.deleted',
      entityType: 'api_key',
      entityId: keyId,
      metadata: { deletedKeyId: keyId },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: { deletedId: keyId, message: 'API key deleted completely' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
