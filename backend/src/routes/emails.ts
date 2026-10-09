import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { getSettings } from '../services/settings.js';
import { findCampaignById, saveCampaign, addHistoryEvent } from '../services/db.js';
import { formatProfessionalEmailHtml } from '../services/email-service.js';

const router = Router();

// POST /api/emails/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, body, campaignId, stage } = req.body || {};
    const emailBody = body || text;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required and must be valid.'
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and email body are required.'
      });
    }

    if (!html && !emailBody) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and email body are required.'
      });
    }

    const settings = await getSettings();
    const apiKey = (process.env.RESEND_API_KEY || settings.resendApiKey || '').trim();

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Resend API key is missing. Please configure RESEND_API_KEY.'
      });
    }

    const resend = new Resend(apiKey);

    let fromAddress = (process.env.EMAIL_FROM || '').trim();
    if (!fromAddress) {
      fromAddress = settings.senderEmail || 'operations@tasknera.com';
    }
    if (!fromAddress.includes('<') && !fromAddress.includes('>')) {
      const name = settings.senderName || 'TaskNera Operations';
      fromAddress = `"${name}" <${fromAddress}>`;
    }

    const plainText = emailBody || '';
    const formattedHtml = html || formatProfessionalEmailHtml(plainText, settings.emailSignature);

    const result = await resend.emails.send({
      from: fromAddress,
      to: [to.trim()],
      subject: subject.trim(),
      html: formattedHtml,
      text: plainText
    });

    if (result.error) {
      let message = result.error.message || 'The email provider could not accept the email.';
      if (
        message.toLowerCase().includes('domain is not verified') ||
        result.error.name === 'validation_error'
      ) {
        message = `Resend Domain Error: The domain in sender address '${fromAddress}' is not verified. Please add and verify DNS records (DKIM/SPF) for your domain at https://resend.com/domains, or update EMAIL_FROM.`;
      }
      return res.status(502).json({ success: false, message });
    }

    if (campaignId) {
      try {
        const campaign = await findCampaignById(campaignId);
        if (campaign) {
          const nowIso = new Date().toISOString();
          const targetStage = stage || 'initial';
          if (targetStage === 'initial') {
            campaign.initialSentAt = nowIso;
            campaign.status = 'Initial Email Sent';
          }
          campaign.lastActivity = `Email sent via Resend (ID: ${result.data?.id})`;
          campaign.lastActivityTimestamp = nowIso;
          campaign.updatedAt = nowIso;
          await saveCampaign(campaign);

          await addHistoryEvent(campaignId, {
            type: targetStage === 'initial' ? 'initial_sent' : 'followup_1_sent',
            title: `Sent via Resend API`,
            description: `Delivered to ${to}. Resend Message ID: ${result.data?.id}`,
            subject: subject.trim(),
            body: plainText,
            timestamp: nowIso
          });
        }
      } catch (histErr) {
        console.warn('[Backend Emails API] Non-fatal history update warning:', histErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Email accepted for processing.',
      id: result.data?.id,
      provider: 'resend'
    });
  } catch (error: any) {
    console.error('Email sending failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to send the email. Please try again.'
    });
  }
});

export default router;
