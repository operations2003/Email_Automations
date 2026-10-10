import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, addHistoryEvent } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { generateOutreachEmail } from '@/lib/ai-engine';

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
    const settings = await getSettings();
    const intervalDays = body.intervalDays || settings.followUpIntervalDays || 2;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const now = new Date();
    const nowIso = now.toISOString();

    const scheduledDate = new Date(now.getTime() + intervalMs).toISOString();

    // Determine target follow-up stage
    let targetStage: 'followup_1' | 'followup_2' | 'followup_3' = 'followup_1';
    let targetNumber: 1 | 2 | 3 = 1;

    if (!campaign.followUp1SentAt) {
      targetStage = 'followup_1';
      targetNumber = 1;
      campaign.followUp1ScheduledAt = scheduledDate;
    } else if (!campaign.followUp2SentAt) {
      targetStage = 'followup_2';
      targetNumber = 2;
      campaign.followUp2ScheduledAt = scheduledDate;
    } else if (!campaign.followUp3SentAt) {
      targetStage = 'followup_3';
      targetNumber = 3;
      campaign.followUp3ScheduledAt = scheduledDate;
    }

    // Pre-generate follow-up draft copy if empty
    const existingBody =
      targetStage === 'followup_1'
        ? campaign.followUp1Body
        : targetStage === 'followup_2'
        ? campaign.followUp2Body
        : campaign.followUp3Body;

    if (!existingBody || existingBody.trim().length === 0) {
      try {
        const previousSubject = campaign.initialSubject;
        const previousEmails = [campaign.initialEmailBody].filter(Boolean);
        if (targetNumber >= 2 && campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
        if (targetNumber >= 3 && campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);

        const gen = await generateOutreachEmail({
          companyName: campaign.companyName,
          recipientEmail: campaign.email,
          ccEmails: campaign.ccEmails,
          mailTopic: campaign.mailTopic,
          reason: campaign.reason,
          recipientName: campaign.recipientName,
          companyWebsite: campaign.companyWebsite,
          previousSubject,
          previousEmails,
          followUpNumber: targetNumber,
          tone: settings.aiTone
        });

        if (targetStage === 'followup_1') {
          campaign.followUp1Subject = gen.subject;
          campaign.followUp1Body = gen.body;
        } else if (targetStage === 'followup_2') {
          campaign.followUp2Subject = gen.subject;
          campaign.followUp2Body = gen.body;
        } else if (targetStage === 'followup_3') {
          campaign.followUp3Subject = gen.subject;
          campaign.followUp3Body = gen.body;
        }
      } catch (err) {
        console.warn('Failed to pre-generate follow-up copy:', err);
      }
    }

    campaign.status = 'Follow-Up Scheduled';
    campaign.lastActivity = `Placed in follow-up pipeline. Follow-Up ${targetNumber} scheduled for ${new Date(scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`;
    campaign.lastActivityTimestamp = nowIso;
    campaign.updatedAt = nowIso;

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: targetStage === 'followup_1' ? 'followup_1_scheduled' : targetStage === 'followup_2' ? 'followup_2_scheduled' : 'followup_3_scheduled',
      title: `Placed in Follow-Ups (Follow-Up ${targetNumber})`,
      description: `Scheduled for delivery on ${new Date(scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} (${intervalDays} days cadence).`,
      timestamp: nowIso
    });

    return NextResponse.json({
      success: true,
      message: `Enrolled in follow-up pipeline. Follow-Up ${targetNumber} scheduled for ${new Date(scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}.`,
      campaign
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
