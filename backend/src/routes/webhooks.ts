import { Router, Request, Response } from 'express';
import { findCampaignByEmail, saveCampaign, addHistoryEvent } from '../services/db.js';

const router = Router();

router.post('/email', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const senderEmail =
      payload.from ||
      payload.sender ||
      payload.data?.from ||
      payload.envelope?.from ||
      payload.email;

    const subject = payload.subject || payload.data?.subject || 'Re: Outreach';
    const text = payload.text || payload.body || payload.data?.text || 'Inbound reply received';

    if (!senderEmail) {
      return res.status(400).json({ success: false, error: 'No sender email found in payload' });
    }

    const emailMatch = senderEmail.match(/<([^>]+)>/) || [null, senderEmail];
    const cleanEmail = (emailMatch[1] || senderEmail).trim().toLowerCase();

    const campaign = await findCampaignByEmail(cleanEmail);
    if (!campaign) {
      return res.json({
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

    res.json({
      success: true,
      matched: true,
      company: campaign.companyName,
      message: 'Campaign updated: Replied and follow-ups paused'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
