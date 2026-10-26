import { NextRequest, NextResponse } from 'next/server';
import { retryAcknowledgment } from '@/lib/inbox-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await retryAcknowledgment(id);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in POST /api/inbox/conversations/[id]/acknowledge:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
