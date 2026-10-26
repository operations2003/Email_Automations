import { NextRequest, NextResponse } from 'next/server';
import {
  getConversationById,
  saveConversation,
  readConversations,
  writeConversations,
  readMessages,
  addInboxLog
} from '@/lib/inbox-db';
import { DEPARTMENTS } from '@/types/inbox';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getConversationById(id);

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Auto mark as read when opened
    if (conversation.isUnread) {
      conversation.isUnread = false;
      await saveConversation(conversation);
    }

    return NextResponse.json({
      success: true,
      conversation
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/conversations/[id]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const conversation = await getConversationById(id);

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Status change
    if (body.status && body.status !== conversation.status) {
      const oldStatus = conversation.status;
      conversation.status = body.status;
      await addInboxLog({
        department: conversation.department,
        ticketNumber: conversation.ticketNumber,
        conversationId: conversation.id,
        action: 'status_changed',
        title: `Status Updated to "${body.status}"`,
        description: `Conversation status shifted from ${oldStatus} to ${body.status}`
      });
    }

    // Department re-assignment
    if (body.department && body.department !== conversation.department && DEPARTMENTS[body.department as keyof typeof DEPARTMENTS]) {
      const oldDept = conversation.department;
      conversation.department = body.department;
      conversation.mailbox = DEPARTMENTS[body.department as keyof typeof DEPARTMENTS].email;
      await addInboxLog({
        department: conversation.department,
        ticketNumber: conversation.ticketNumber,
        conversationId: conversation.id,
        action: 'department_changed',
        title: `Reassigned to ${DEPARTMENTS[body.department as keyof typeof DEPARTMENTS].name}`,
        description: `Department changed from ${DEPARTMENTS[oldDept].name} to ${DEPARTMENTS[body.department as keyof typeof DEPARTMENTS].name}`
      });
    }

    if (body.isUnread !== undefined) {
      conversation.isUnread = Boolean(body.isUnread);
    }

    if (body.assignedTo !== undefined) {
      conversation.assignedTo = body.assignedTo;
    }

    const updated = await saveConversation(conversation);

    return NextResponse.json({
      success: true,
      conversation: updated
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/inbox/conversations/[id]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const all = await readConversations();
    const filtered = all.filter(c => c.id !== id);
    await writeConversations(filtered);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/inbox/conversations/[id]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
