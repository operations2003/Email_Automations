import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, addHistoryEvent } from '@/lib/db';
import { ReplyStatus } from '@/types/outreach';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await findCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const replyType: ReplyStatus = body.replyType || 'Replied'; // 'Replied' | 'Interested' | 'Meeting Requested'
    const replySnippet = body.snippet || 'Thanks for reaching out! Let us schedule some time to connect next week.';

    const now = new Date().toISOString();

    campaign.replyStatus = replyType;
    campaign.status = replyType === 'Interested' ? 'Interested' : replyType === 'Meeting Requested' ? 'Meeting Scheduled' : 'Follow-Up Paused';
    campaign.lastActivity = `Inbound response: "${replySnippet.substring(0, 50)}..."`;
    campaign.lastActivityTimestamp = now;
    campaign.updatedAt = now;

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'reply_received',
      title: `Inbound Reply Received (${replyType})`,
      description: `Recipient responded: "${replySnippet}". All pending follow-ups immediately stopped.`,
      timestamp: now
    });

    return NextResponse.json({
      success: true,
      message: 'Inbound reply registered. Pending follow-ups automatically paused.',
      campaign
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
