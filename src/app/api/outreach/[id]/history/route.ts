import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById } from '@/lib/db';

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

    return NextResponse.json({
      success: true,
      companyName: campaign.companyName,
      email: campaign.email,
      status: campaign.status,
      replyStatus: campaign.replyStatus,
      history: campaign.history || [],
      emails: {
        initial: {
          sentAt: campaign.initialSentAt,
          subject: campaign.initialSubject,
          body: campaign.initialEmailBody
        },
        followUp1: {
          scheduledAt: campaign.followUp1ScheduledAt,
          sentAt: campaign.followUp1SentAt,
          subject: campaign.followUp1Subject,
          body: campaign.followUp1Body
        },
        followUp2: {
          scheduledAt: campaign.followUp2ScheduledAt,
          sentAt: campaign.followUp2SentAt,
          subject: campaign.followUp2Subject,
          body: campaign.followUp2Body
        },
        followUp3: {
          scheduledAt: campaign.followUp3ScheduledAt,
          sentAt: campaign.followUp3SentAt,
          subject: campaign.followUp3Subject,
          body: campaign.followUp3Body
        }
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
