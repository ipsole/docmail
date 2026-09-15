// /api/v1/contacts - GET, POST
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { hasScope } from '@/lib/rbac';
import { db } from '@/lib/db';
import { DocdrilContact } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.scopes && !hasScope(auth.scopes, 'contacts:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const contacts = await db.listContacts(auth.organizationId);
    return NextResponse.json({ success: true, data: contacts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.scopes && !hasScope(auth.scopes, 'contacts:write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.email || !body.name) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    const newContact: DocdrilContact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: auth.organizationId,
      name: body.name,
      email: body.email,
      company: body.company || null,
      phone: body.phone || null,
      notes: body.notes || null,
      tags: Array.isArray(body.tags) ? body.tags : ['API-Created'],
      lastInteractionAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const saved = await db.createContact(newContact);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
