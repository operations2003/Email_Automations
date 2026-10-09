import { NextRequest, NextResponse } from 'next/server';
import { findCampaignByEmail, saveCampaign, addHistoryEvent } from '@/lib/db';
import { addToSuppression } from '@/lib/suppression';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const eventType = payload.type || payload.event;
    const now = new Date().toISOString();

    // 1. Resend Delivery & Event Webhooks
    if (eventType && typeof eventType === 'string' && eventType.startsWith('email.')) {
      const emailData = payload.data || {};
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to || emailData.recipient || emailData.email];
      const targetEmail = (recipients[0] || '').trim().toLowerCase();

      if (!targetEmail || !targetEmail.includes('@')) {
        return NextResponse.json({ success: true, message: 'Webhook event processed (no recipient email found).' });
      }

      const campaign = await findCampaignByEmail(targetEmail);

      switch (eventType) {
        case 'email.bounced': {
          const bounceReason = emailData.bounce?.message || emailData.message || 'Mailbox unavailable or invalid address';
          await addToSuppression(targetEmail, 'bounced', campaign?.id, bounceReason);

          if (campaign) {
            campaign.status = 'Bounced';
            campaign.replyStatus = 'Bounced';
            campaign.lastActivity = `Delivery bounced: ${bounceReason}`;
            campaign.lastActivityTimestamp = now;
            campaign.updatedAt = now;
            await saveCampaign(campaign);

            await addHistoryEvent(campaign.id, {
              type: 'bounced',
              title: 'Email Hard Bounced',
              description: `Mail server rejected delivery for ${targetEmail}. Address added to suppression list. Reason: ${bounceReason}`,
              timestamp: now
            });
          }
          return NextResponse.json({ success: true, event: 'email.bounced', email: targetEmail, status: 'suppressed' });
        }

        case 'email.complained': {
          await addToSuppression(targetEmail, 'complaint', campaign?.id, 'Recipient marked as spam');

          if (campaign) {
            campaign.status = 'Closed';
            campaign.replyStatus = 'Unsubscribed';
            campaign.lastActivity = 'Spam complaint registered by recipient provider';
            campaign.lastActivityTimestamp = now;
            campaign.updatedAt = now;
            await saveCampaign(campaign);

            await addHistoryEvent(campaign.id, {
              type: 'status_changed',
              title: 'Spam Complaint Received',
              description: `Recipient marked message as spam. Address immediately suppressed and sequence halted.`,
              timestamp: now
            });
          }
          return NextResponse.json({ success: true, event: 'email.complained', email: targetEmail, status: 'suppressed' });
        }

        case 'email.delivered': {
          if (campaign) {
            campaign.lastActivity = `Email delivery confirmed (ID: ${emailData.email_id || emailData.id})`;
            campaign.lastActivityTimestamp = now;
            campaign.updatedAt = now;
            await saveCampaign(campaign);

            await addHistoryEvent(campaign.id, {
              type: 'delivered',
              title: 'Delivery Confirmed by Mail Server',
              description: `Delivered to ${targetEmail} via Resend. Message ID: ${emailData.email_id || emailData.id}`,
              timestamp: now
            });
          }
          return NextResponse.json({ success: true, event: 'email.delivered', email: targetEmail });
        }

        default:
          return NextResponse.json({ success: true, event: eventType, email: targetEmail });
      }
    }

    // 2. Inbound Reply Webhooks (SendGrid, Mandrill, Generic Inbound)
    const senderEmail =
      payload.from ||
      payload.sender ||
      payload.data?.from ||
      payload.envelope?.from ||
      payload.email;

    const subject = payload.subject || payload.data?.subject || 'Re: Outreach';
    const text = payload.text || payload.body || payload.data?.text || 'Inbound reply received';

    if (!senderEmail) {
      return NextResponse.json({ success: false, error: 'No sender or event found in payload' }, { status: 400 });
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
