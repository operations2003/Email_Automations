import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, deleteCampaign, addHistoryEvent } from '@/lib/db';
import { OutreachStatus, ReplyStatus } from '@/types/outreach';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await findCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await findCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const updates = await req.json();
    const oldStatus = campaign.status;
    const oldReplyStatus = campaign.replyStatus;

    // Apply allowed updates
    if (updates.companyName !== undefined) campaign.companyName = updates.companyName;
    if (updates.email !== undefined) campaign.email = updates.email;
    if (updates.ccEmails !== undefined) campaign.ccEmails = updates.ccEmails;
    if (updates.mailTopic !== undefined) campaign.mailTopic = updates.mailTopic;
    if (updates.reason !== undefined) campaign.reason = updates.reason;
    if (updates.recipientName !== undefined) campaign.recipientName = updates.recipientName;
    if (updates.companyWebsite !== undefined) campaign.companyWebsite = updates.companyWebsite;
    if (updates.notes !== undefined) campaign.notes = updates.notes;
    if (updates.assignedTo !== undefined) campaign.assignedTo = updates.assignedTo;
    if (updates.assignedBy !== undefined) campaign.assignedBy = updates.assignedBy;

    // Editable email content
    if (updates.initialSubject !== undefined) campaign.initialSubject = updates.initialSubject;
    if (updates.initialEmailBody !== undefined) campaign.initialEmailBody = updates.initialEmailBody;
    if (updates.followUp1Subject !== undefined) campaign.followUp1Subject = updates.followUp1Subject;
    if (updates.followUp1Body !== undefined) campaign.followUp1Body = updates.followUp1Body;
    if (updates.followUp2Subject !== undefined) campaign.followUp2Subject = updates.followUp2Subject;
    if (updates.followUp2Body !== undefined) campaign.followUp2Body = updates.followUp2Body;
    if (updates.followUp3Subject !== undefined) campaign.followUp3Subject = updates.followUp3Subject;
    if (updates.followUp3Body !== undefined) campaign.followUp3Body = updates.followUp3Body;

    // Status updates
    if (updates.status !== undefined) {
      campaign.status = updates.status as OutreachStatus;

      const now = new Date();
      const nowIso = now.toISOString();
      const intervalMs = 2 * 24 * 60 * 60 * 1000;

      // If status changed to Initial Email Sent, kick off 2-day follow-up cycle
      if (updates.status === 'Initial Email Sent') {
        if (!campaign.initialSentAt) {
          campaign.initialSentAt = nowIso;
        }
        if (!campaign.followUp1ScheduledAt) {
          campaign.followUp1ScheduledAt = new Date(now.getTime() + intervalMs).toISOString();
        }
        if (!campaign.followUp2ScheduledAt) {
          campaign.followUp2ScheduledAt = new Date(now.getTime() + intervalMs * 2).toISOString();
        }
        if (!campaign.followUp3ScheduledAt) {
          campaign.followUp3ScheduledAt = new Date(now.getTime() + intervalMs * 3).toISOString();
        }
        campaign.lastActivity = 'Initial email sent. Follow-up cycle started (Follow-Up 1 in 2 days).';
      } else if (updates.status === 'First Follow-Up Done') {
        if (!campaign.followUp1SentAt) {
          campaign.followUp1SentAt = nowIso;
        }
        if (!campaign.followUp2ScheduledAt) {
          campaign.followUp2ScheduledAt = new Date(now.getTime() + intervalMs).toISOString();
        }
        campaign.lastActivity = 'First follow-up marked done. Follow-Up 2 scheduled.';
      } else if (updates.status === 'Second Follow-Up Done') {
        if (!campaign.followUp2SentAt) {
          campaign.followUp2SentAt = nowIso;
        }
        if (!campaign.followUp3ScheduledAt) {
          campaign.followUp3ScheduledAt = new Date(now.getTime() + intervalMs).toISOString();
        }
        campaign.lastActivity = 'Second follow-up marked done. Follow-Up 3 scheduled.';
      } else if (updates.status === 'Third Follow-Up Done') {
        if (!campaign.followUp3SentAt) {
          campaign.followUp3SentAt = nowIso;
        }
        campaign.lastActivity = 'Third follow-up marked done (Sequence completed).';
      }
    }
    if (updates.replyStatus !== undefined) campaign.replyStatus = updates.replyStatus as ReplyStatus;

    campaign.updatedAt = new Date().toISOString();

    // Log history if status changed
    if (updates.status && updates.status !== oldStatus) {
      await addHistoryEvent(campaign.id, {
        type: 'status_changed',
        title: `Status changed to ${updates.status}`,
        description: `Campaign status changed from "${oldStatus}" to "${updates.status}".`,
        timestamp: new Date().toISOString()
      });
      if (updates.status !== 'Initial Email Sent') {
        campaign.lastActivity = `Status: ${updates.status}`;
      }
    }

    // If reply status changed to Replied, halt follow-ups
    if (updates.replyStatus === 'Replied' && oldReplyStatus !== 'Replied') {
      campaign.status = 'Follow-Up Paused';
      await addHistoryEvent(campaign.id, {
        type: 'reply_received',
        title: 'Reply Received - Follow-Ups Paused',
        description: 'Recipient replied. Automated follow-ups automatically paused.',
        timestamp: new Date().toISOString()
      });
      campaign.lastActivity = 'Replied - Follow-ups paused';
    }

    await saveCampaign(campaign);

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only administrators can delete outreach targets.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const deleted = await deleteCampaign(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
