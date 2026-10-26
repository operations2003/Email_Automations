import { NextRequest, NextResponse } from 'next/server';
import { getInboxTemplates, saveInboxTemplate, DEFAULT_TEMPLATES } from '@/lib/inbox-db';
import { Department } from '@/types/inbox';

export async function GET() {
  try {
    const templates = await getInboxTemplates();
    return NextResponse.json({
      success: true,
      templates
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/templates:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.department || !DEFAULT_TEMPLATES[body.department as Department]) {
      return NextResponse.json({ success: false, error: 'Invalid department specified' }, { status: 400 });
    }

    if (!body.subjectTemplate || !body.bodyTemplate) {
      return NextResponse.json({ success: false, error: 'Subject and body templates are required' }, { status: 400 });
    }

    const updated = await saveInboxTemplate(body);

    return NextResponse.json({
      success: true,
      template: updated
    });
  } catch (err: any) {
    console.error('Error in POST /api/inbox/templates:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
