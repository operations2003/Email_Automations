import { NextRequest, NextResponse } from 'next/server';
import { getInboxLogs } from '@/lib/inbox-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const logs = await getInboxLogs(limit);

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/logs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
