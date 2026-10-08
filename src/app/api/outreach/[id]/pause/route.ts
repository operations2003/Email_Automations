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

    campaign.status = 'Follow-Up Paused';
    campaign.lastActivity = 'Follow-ups manually paused';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'paused',
      title: 'Follow-Ups Paused',
      description: 'Automated follow-ups temporarily halted by user.',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
