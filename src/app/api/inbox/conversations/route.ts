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

    const dateRange = searchParams.get('dateRange');

    const all = await readConversations();

    // Calculate overall stats before filtering
    const stats = {
      total: all.length,
      unread: all.filter(c => c.isUnread).length,
      pendingHuman: all.filter(c => c.status === 'pending_human' || c.status === 'awaiting_team_response').length,
      responded: all.filter(c => c.status === 'responded' || c.lastMessageDirection === 'outbound_human' || c.status === 'waiting_on_customer').length,
      resolved: all.filter(c => c.status === 'resolved').length,
      autoAckSent: all.filter(c => c.acknowledgmentStatus === 'sent').length,
      failedAck: all.filter(c => c.acknowledgmentStatus === 'failed').length,
      byDepartment: {
        operations: all.filter(c => c.department === 'operations').length,
        careers: all.filter(c => c.department === 'careers').length,
        hr: all.filter(c => c.department === 'hr').length,
        recruitment: all.filter(c => c.department === 'recruitment').length,
        support: all.filter(c => c.department === 'support').length
      }
    };

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let filtered = all.filter(c => {
      if (department && department !== 'all' && c.department !== department) {
        return false;
      }
      if (status && status !== 'all') {
        if (status === 'awaiting_team_response' || status === 'pending_human') {
          if (c.status !== 'pending_human' && c.status !== 'awaiting_team_response') return false;
        } else if (status === 'responded') {
          if (c.status !== 'responded' && c.lastMessageDirection !== 'outbound_human' && c.status !== 'waiting_on_customer') return false;
        } else if (c.status !== status) {
          return false;
        }
      }
      if (ackStatus && ackStatus !== 'all' && c.acknowledgmentStatus !== ackStatus) {
        return false;
      }
      if (dateRange && dateRange !== 'all') {
        const itemTime = new Date(c.lastMessageTimestamp).getTime();
        if (dateRange === 'today' && now - itemTime > oneDayMs) return false;
        if (dateRange === '7d' && now - itemTime > 7 * oneDayMs) return false;
        if (dateRange === '30d' && now - itemTime > 30 * oneDayMs) return false;
      }
      if (search) {
        const matchSubj = c.subject.toLowerCase().includes(search);
        const matchTicket = c.ticketNumber.toLowerCase().includes(search);
        const matchSenderEmail = c.sender.email.toLowerCase().includes(search);
        const matchSenderName = (c.sender.name || '').toLowerCase().includes(search);
        const matchCompany = (c.sender.company || '').toLowerCase().includes(search);
        const matchSnippet = (c.lastMessageSnippet || '').toLowerCase().includes(search);
        if (!matchSubj && !matchTicket && !matchSenderEmail && !matchSenderName && !matchCompany && !matchSnippet) {
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
