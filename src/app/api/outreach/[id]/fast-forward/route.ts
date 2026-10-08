import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, addHistoryEvent } from '@/lib/db';

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

    // Fast-forward scheduled dates by 2.5 days backwards so they become immediately due
    const timeShiftMs = 2.5 * 24 * 60 * 60 * 1000;

    if (campaign.followUp1ScheduledAt && !campaign.followUp1SentAt) {
      campaign.followUp1ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    } else if (campaign.followUp2ScheduledAt && !campaign.followUp2SentAt) {
      campaign.followUp2ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    } else if (campaign.followUp3ScheduledAt && !campaign.followUp3SentAt) {
      campaign.followUp3ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    }

    campaign.lastActivity = 'Fast-forwarded schedule +2 days for testing';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'edited',
      title: 'Time Simulation: Advanced +2 Days',
      description: 'Scheduled follow-up moved to due now for instant verification.',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule advanced +2 days. Follow-up is now due for execution.',
      campaign
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
