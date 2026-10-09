import { AppSettings } from '@/types/outreach';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { isSuppressed, addToSuppression, getUnsubscribeHeaders, generateUnsubscribeToken } from './suppression';
import { findCampaignById, saveCampaign, addHistoryEvent } from './db';

function formatFromAddress(senderName?: string, senderEmail?: string): string {
  const envFrom = (process.env.EMAIL_FROM || '').trim();
  if (envFrom) {
    if (envFrom.includes('<') && envFrom.includes('>')) {
      return envFrom;
    }
    const name = senderName || 'TaskNera Operations';
    return `"${name}" <${envFrom}>`;
  }
  const email = (senderEmail || 'operations@tasknera.com').trim();
  const name = (senderName || 'TaskNera Operations').trim();
  return `"${name}" <${email}>`;
}

export interface SendEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  signature?: string;
  campaignId: string;
  stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3';
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  deliveredAt: string;
  provider: string;
  error?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Produces clean, responsive, personal 1:1 business HTML formatting.
 * Includes RFC 8058 and CAN-SPAM compliant opt-out footer.
 */
export function formatProfessionalEmailHtml(
  body: string,
  signature?: string,
  unsubscribeUrl?: string,
  companyName: string = 'TaskNera Solutions'
): string {
  // Split paragraphs by double newlines
  const paragraphs = body
    .trim()
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const paragraphsHtml = paragraphs
    .map(p => {
      const formatted = escapeHtml(p).replace(/\n/g, '<br />');
      return `<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px; color: #1e293b;">${formatted}</p>`;
    })
    .join('\n');

  let signatureHtml = '';
  if (signature && signature.trim()) {
    const formattedSig = escapeHtml(signature.trim()).replace(/\n/g, '<br />');
    signatureHtml = `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; line-height: 1.5; color: #475569;">
        ${formattedSig}
      </div>
    `;
  }

  let optOutHtml = '';
  if (unsubscribeUrl) {
    optOutHtml = `
      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: left;">
        <p style="margin: 0 0 4px 0;">Sent by ${escapeHtml(companyName)} &bull; Business Operations</p>
        <p style="margin: 0;">If you prefer not to receive future emails regarding these services, you can <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    p { margin: 0 0 16px 0; }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; text-align: left;">
    ${paragraphsHtml}
    ${signatureHtml}
    ${optOutHtml}
  </div>
</body>
</html>`;
}

/**
 * Checks whether an error is a hard bounce (invalid address / mailbox not found)
 */
function isHardBounce(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return (
    msg.includes('550') ||
    msg.includes('551') ||
    msg.includes('552') ||
    msg.includes('553') ||
    msg.includes('554') ||
    msg.includes('user not found') ||
    msg.includes('user unknown') ||
    msg.includes('mailbox unavailable') ||
    msg.includes('recipient address rejected') ||
    msg.includes('does not exist') ||
    msg.includes('address rejected')
  );
}

export async function sendOutreachEmail(
  payload: SendEmailPayload,
  settings: AppSettings
): Promise<SendEmailResult> {
  const cleanRecipient = payload.to.trim().toLowerCase();

  // 0. Deliverability Safeguard: Check suppression list
  if (await isSuppressed(cleanRecipient)) {
    throw new Error(
      `Delivery Aborted: Recipient "${cleanRecipient}" is on the suppression list (previously unsubscribed, bounced, or flagged). Email was not sent to protect your domain reputation.`
    );
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // Generate RFC 8058 unsubscribe token & headers
  const unsubToken = generateUnsubscribeToken(cleanRecipient, payload.campaignId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://tasknera.com');
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  const unsubHeaders = settings.enableUnsubscribeHeader !== false ? getUnsubscribeHeaders(cleanRecipient, payload.campaignId, baseUrl) : {};

  // Attach clean opt-out text to plain-text body as well
  let fullBody = payload.signature ? `${payload.body}\n\n${payload.signature}` : payload.body;
  if (settings.enableUnsubscribeFooter !== false) {
    fullBody += `\n\n---\nOpt out of future communications: ${unsubscribeUrl}`;
  }

  const htmlBody = formatProfessionalEmailHtml(
    payload.body,
    payload.signature,
    settings.enableUnsubscribeFooter !== false ? unsubscribeUrl : undefined,
    settings.companyName || 'TaskNera Solutions'
  );

  // 1. SMTP Provider (Gmail, Outlook, Amazon SES, Custom SMTP)
  if (settings.provider === 'smtp') {
    const smtpHost = settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = settings.smtpUser || process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = settings.smtpPass || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      const missing: string[] = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpUser) missing.push('EMAIL_USER / SMTP_USER');
      if (!smtpPass) missing.push('EMAIL_PASSWORD / SMTP_PASS');
      throw new Error(
        `SMTP Configuration incomplete. Missing credentials: [${missing.join(', ')}]. Please configure them securely in your environment variables (.env.local) or Settings.`
      );
    }

    const port = Number(settings.smtpPort) || Number(process.env.SMTP_PORT) || (settings.smtpSecure ? 465 : 587);
    const isSecure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (port === 465);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      const fromEmail = smtpUser || settings.senderEmail || 'operations@tasknera.com';
      const fromName = settings.senderName || process.env.EMAIL_SENDER_NAME || 'TaskNera Operations';

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.to,
        cc: payload.cc ? payload.cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        subject: payload.subject,
        text: fullBody,
        html: htmlBody,
        headers: {
          ...unsubHeaders,
          'X-Entity-Ref-ID': payload.campaignId || messageId,
          'Feedback-ID': `outreach:${payload.stage}:tasknera`
        }
      });

      return {
        success: true,
        messageId: info.messageId || messageId,
        deliveredAt: now,
        provider: 'smtp'
      };
    } catch (err: unknown) {
      const e = err as Error;

      // Handle Hard Bounce
      if (isHardBounce(e.message)) {
        await addToSuppression(cleanRecipient, 'bounced', payload.campaignId, e.message);
        if (payload.campaignId) {
          try {
            const camp = await findCampaignById(payload.campaignId);
            if (camp) {
              camp.status = 'Bounced';
              camp.replyStatus = 'Bounced';
              camp.lastActivity = `Hard bounce detected: ${e.message}`;
              camp.lastActivityTimestamp = now;
              await saveCampaign(camp);
              await addHistoryEvent(payload.campaignId, {
                type: 'bounced',
                title: 'Email Bounced (Hard Bounce)',
                description: `Recipient mail server rejected address: ${e.message}. Address added to suppression list.`,
                timestamp: now
              });
            }
          } catch {
            // ignore non-fatal history update
          }
        }
        throw new Error(`SMTP Delivery Failed (Hard Bounce): ${e.message}. Address automatically suppressed.`);
      }

      if (
        e.message.includes('535') ||
        e.message.includes('BadCredentials') ||
        e.message.includes('Username and Password not accepted')
      ) {
        throw new Error(
          'Email provider rejected SMTP credentials (Authentication failure 535). For Google Workspace / Gmail, please verify you are using a 16-character App Password (configured in .env or Settings), not your standard account password.'
        );
      }
      // Re-throw safe error message without leaking transporter configs
      throw new Error(`SMTP Delivery Failed: ${e.message || 'Unknown network error'}`);
    }
  }

  // 2. Resend API Provider (Official Resend SDK)
  const isResend =
    settings.provider === 'resend' ||
    Boolean(process.env.RESEND_API_KEY && (settings.provider as string) !== 'smtp' && (settings.provider as string) !== 'simulated');

  if (isResend) {
    const apiKey = (process.env.RESEND_API_KEY || settings.resendApiKey || '').trim();
    if (!apiKey) {
      throw new Error(
        'Resend API Key is missing. Please configure RESEND_API_KEY in your environment or add it in Settings.'
      );
    }

    const formattedFrom = formatFromAddress(settings.senderName, settings.senderEmail);

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: formattedFrom,
        to: [payload.to.trim()],
        cc: payload.cc ? payload.cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        subject: payload.subject,
        text: fullBody,
        html: htmlBody,
        headers: unsubHeaders
      });

      if (error) {
        let errorMsg = error.message || 'The email provider could not accept the email.';
        if (
          errorMsg.toLowerCase().includes('domain is not verified') ||
          error.name === 'validation_error'
        ) {
          errorMsg = `Resend Domain Error: The domain in sender address '${formattedFrom}' is not verified. Please add and verify DNS records (DKIM/SPF) for your domain at https://resend.com/domains, or update EMAIL_FROM.`;
        } else if (error.name === 'restricted_api_key' || (error as any).statusCode === 401) {
          errorMsg = `Resend Authorization Error: ${error.message || 'Restricted or invalid API key'}.`;
        }
        throw new Error(errorMsg);
      }

      return {
        success: true,
        messageId: data?.id || messageId,
        deliveredAt: now,
        provider: 'resend'
      };
    } catch (err: unknown) {
      const e = err as Error;
      if (isHardBounce(e.message)) {
        await addToSuppression(cleanRecipient, 'bounced', payload.campaignId, e.message);
      }
      throw new Error(e.message || 'Failed to dispatch email via Resend.');
    }
  }

  // 3. Simulated Sandbox Mode
  return {
    success: true,
    messageId,
    deliveredAt: now,
    provider: 'simulated_sandbox'
  };
}
