import { NextResponse } from 'next/server';
import { getMailboxOverviews } from '@/lib/inbox-db';

export async function GET() {
  try {
    const mailboxes = await getMailboxOverviews();
    return NextResponse.json({
      success: true,
      mailboxes
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/mailboxes:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
