// /api/v1/templates - GET, POST, DELETE
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { DocdrilTemplate } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const templates = await db.listTemplates(auth.organizationId);
    return NextResponse.json({ success: true, data: templates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const body = await req.json();

    if (!body.title || !body.subject || (!body.bodyHtml && !body.bodyText)) {
      return NextResponse.json(
        { success: false, error: 'Title, subject, and body are required' },
        { status: 400 }
      );
    }

    const template: DocdrilTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId: auth.organizationId,
      title: body.title,
      subject: body.subject,
      bodyHtml: body.bodyHtml || `<p>${body.bodyText}</p>`,
      bodyText: body.bodyText || body.bodyHtml.replace(/<[^>]*>?/gm, ''),
      category: body.category || 'general',
      variables: Array.isArray(body.variables) ? body.variables : [],
    };

    const created = await db.createTemplate(template);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    const deleted = await db.deleteTemplate(id);
    return NextResponse.json({ success: true, data: { deleted } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

