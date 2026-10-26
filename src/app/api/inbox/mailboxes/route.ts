import { NextRequest, NextResponse } from 'next/server';
import { getMailboxOverviews, updateMailboxSetting } from '@/lib/inbox-db';
import { Department } from '@/types/inbox';

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { department, ...updates } = body;

    if (!department) {
      return NextResponse.json({ success: false, error: 'Department is required' }, { status: 400 });
    }

    const updated = await updateMailboxSetting(department as Department, updates);
    return NextResponse.json({
      success: true,
      mailbox: updated
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/inbox/mailboxes:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { department, action } = body;

    if (!department) {
      return NextResponse.json({ success: false, error: 'Department is required' }, { status: 400 });
    }

    let statusUpdate: 'connected' | 'disconnected' | 'syncing' = 'connected';
    if (action === 'disconnect') {
      statusUpdate = 'disconnected';
    } else if (action === 'reconnect') {
      statusUpdate = 'connected';
    }

    const updated = await updateMailboxSetting(department as Department, {
      status: statusUpdate,
      lastSyncedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      mailbox: updated
    });
  } catch (err: any) {
    console.error('Error in POST /api/inbox/mailboxes:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
