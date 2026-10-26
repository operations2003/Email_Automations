import { NextRequest, NextResponse } from 'next/server';
import { sendHumanReply } from '@/lib/inbox-engine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { replyText, userName, userEmail } = body;
    if (!replyText || !replyText.trim()) {
      return NextResponse.json({ success: false, error: 'Reply text cannot be empty' }, { status: 400 });
    }

    const message = await sendHumanReply(id, replyText.trim(), {
      name: userName || 'Team Member',
      email: userEmail || 'operations@tasknera.com'
    });

    return NextResponse.json({
      success: true,
      message
    });
  } catch (err: any) {
    console.error('Error in POST /api/inbox/conversations/[id]/reply:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
