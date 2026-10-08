import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, addHistoryEvent } from '@/lib/db';
import { getSettings } from '@/lib/settings';

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

    const settings = await getSettings();
    const intervalDays = settings.followUpIntervalDays || 2;
    const nextScheduled = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

    // Determine state
    if (!campaign.followUp1SentAt) {
      campaign.followUp1ScheduledAt = nextScheduled;
      campaign.status = 'Initial Email Sent';
    } else if (!campaign.followUp2SentAt) {
      campaign.followUp2ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 1 Sent';
    } else if (!campaign.followUp3SentAt) {
      campaign.followUp3ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 2 Sent';
    }

    // Reset reply status if resuming
    if (campaign.replyStatus === 'Replied') {
      campaign.replyStatus = 'Not Replied';
    }

    campaign.lastActivity = 'Follow-ups resumed by user';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'resumed',
      title: 'Follow-Ups Resumed',
      description: `Sequence reactivated. Next follow-up scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
