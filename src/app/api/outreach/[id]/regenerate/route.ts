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
    const stage = body.stage || 'initial';
    const settings = await getSettings();

    let followUpNumber: 0 | 1 | 2 | 3 = 0;
    const previousEmails: string[] = [];
    let previousSubject = '';

    if (stage === 'followup_1') {
      followUpNumber = 1;
      previousSubject = campaign.followUp1Subject || campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
    } else if (stage === 'followup_2') {
      followUpNumber = 2;
      previousSubject = campaign.followUp2Subject || campaign.followUp1Subject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
      if (campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);
    } else if (stage === 'followup_3') {
      followUpNumber = 3;
      previousSubject = campaign.followUp3Subject || campaign.followUp2Subject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
      if (campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);
      if (campaign.followUp3Body) previousEmails.push(campaign.followUp3Body);
    } else {
      followUpNumber = 0;
      previousSubject = campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
    }

    const generated = await generateOutreachEmail(
      {
        companyName: campaign.companyName,
        recipientEmail: campaign.email,
        ccEmails: campaign.ccEmails,
        mailTopic: body.mailTopic || campaign.mailTopic,
        reason: campaign.reason,
        recipientName: campaign.recipientName,
        companyWebsite: campaign.companyWebsite,
        previousSubject,
        previousEmails,
        followUpNumber,
        tone: body.tone || settings.aiTone
      },
      settings.openAiApiKey
    );

    if (followUpNumber === 0) {
      campaign.initialSubject = generated.subject;
      campaign.initialEmailBody = generated.body;
      if (campaign.status === 'Draft') campaign.status = 'Ready to Send';
    } else if (followUpNumber === 1) {
      campaign.followUp1Subject = generated.subject;
      campaign.followUp1Body = generated.body;
    } else if (followUpNumber === 2) {
      campaign.followUp2Subject = generated.subject;
      campaign.followUp2Body = generated.body;
    } else if (followUpNumber === 3) {
      campaign.followUp3Subject = generated.subject;
      campaign.followUp3Body = generated.body;
    }

    campaign.lastActivity = `AI Regenerated variation for ${stage}`;
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'regenerated',
      title: `Regenerated fresh variation for ${stage}`,
      description: `New subject: "${generated.subject}" with distinct hook and body.`,
      subject: generated.subject,
      body: generated.body,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      campaign,
      generated
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
