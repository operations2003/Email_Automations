import { NextRequest, NextResponse } from 'next/server';
import { findCampaignByEmail, saveCampaign, addHistoryEvent } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    // Support common webhook payloads (Resend, Sendgrid, Mandrill, Generic)
    const senderEmail =
      payload.from ||
      payload.sender ||
      payload.data?.from ||
      payload.envelope?.from ||
      payload.email;

    const subject = payload.subject || payload.data?.subject || 'Re: Outreach';
    const text = payload.text || payload.body || payload.data?.text || 'Inbound reply received';

    if (!senderEmail) {
      return NextResponse.json({ success: false, error: 'No sender email found in payload' }, { status: 400 });
    }

    // Extract raw email if format is "Name <email@domain.com>"
    const emailMatch = senderEmail.match(/<([^>]+)>/) || [null, senderEmail];
    const cleanEmail = (emailMatch[1] || senderEmail).trim().toLowerCase();

    const campaign = await findCampaignByEmail(cleanEmail);
    if (!campaign) {
      return NextResponse.json({
        success: true,
        message: `Webhook received, but sender ${cleanEmail} is not in outreach list.`
      });
    }

    const now = new Date().toISOString();
    campaign.replyStatus = 'Replied';
    campaign.status = 'Follow-Up Paused';
    campaign.lastActivity = `Inbound webhook: Reply received from ${cleanEmail}`;
    campaign.lastActivityTimestamp = now;
    campaign.updatedAt = now;

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'reply_received',
      title: 'Inbound Reply Detected via Webhook',
      description: `Subject: "${subject}". Follow-ups automatically halted.`,
      subject,
      body: typeof text === 'string' ? text.substring(0, 300) : '',
      timestamp: now
    });

    return NextResponse.json({
      success: true,
      matched: true,
      company: campaign.companyName,
      message: 'Campaign updated: Replied and follow-ups paused'
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
