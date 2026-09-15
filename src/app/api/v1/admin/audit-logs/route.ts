// GET /api/v1/admin/audit-logs
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.role && !hasPermission(auth.role, PERMISSIONS.AUDIT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const logs = await db.listAuditLogs(auth.organizationId);
    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
