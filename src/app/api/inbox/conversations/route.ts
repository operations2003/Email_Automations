import { NextRequest, NextResponse } from 'next/server';
import { readConversations } from '@/lib/inbox-db';
import { processIncomingEmail } from '@/lib/inbox-engine';
import { InboxConversation, Department } from '@/types/inbox';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const ackStatus = searchParams.get('ackStatus');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const sort = searchParams.get('sort') || 'newest';

    const all = await readConversations();

    // Calculate overall stats before filtering
    const stats = {
      total: all.length,
      unread: all.filter(c => c.isUnread).length,
      pendingHuman: all.filter(c => c.status === 'pending_human').length,
      resolved: all.filter(c => c.status === 'resolved').length,
      autoAckSent: all.filter(c => c.acknowledgmentStatus === 'sent').length,
      byDepartment: {
        operations: all.filter(c => c.department === 'operations').length,
        careers: all.filter(c => c.department === 'careers').length,
        hr: all.filter(c => c.department === 'hr').length,
        recruitment: all.filter(c => c.department === 'recruitment').length,
        support: all.filter(c => c.department === 'support').length
      }
    };

    let filtered = all.filter(c => {
      if (department && department !== 'all' && c.department !== department) {
        return false;
      }
      if (status && status !== 'all' && c.status !== status) {
        return false;
      }
      if (ackStatus && ackStatus !== 'all' && c.acknowledgmentStatus !== ackStatus) {
        return false;
      }
      if (search) {
        const matchSubj = c.subject.toLowerCase().includes(search);
        const matchTicket = c.ticketNumber.toLowerCase().includes(search);
        const matchSenderEmail = c.sender.email.toLowerCase().includes(search);
        const matchSenderName = (c.sender.name || '').toLowerCase().includes(search);
        const matchSnippet = (c.lastMessageSnippet || '').toLowerCase().includes(search);
        if (!matchSubj && !matchTicket && !matchSenderEmail && !matchSenderName && !matchSnippet) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp).getTime();
      const timeB = new Date(b.lastMessageTimestamp).getTime();
      return sort === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      stats,
      count: filtered.length,
      conversations: filtered
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/conversations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await processIncomingEmail(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in POST /api/inbox/conversations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
