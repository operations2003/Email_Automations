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

function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}



function optimizeSubjectForDeliverability(subject: string): string {
  return subject
    // Remove excessive exclamation marks
    .replace(/!+/g, '')
    // Avoid ALL CAPS
    .replace(/^[A-Z\s]+$/, (match) =>
      match.charAt(0) + match.slice(1).toLowerCase()
    )
    // Remove common spam words
    .replace(/\b(FREE|URGENT|LIMITED|GUARANTEE|WINNER)\b/gi, '')
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim();
}

function optimizeEmailContentForDeliverability(content: string): string {
  return content
    // Remove excessive exclamation marks
    .replace(/!{2,}/g, '!')
    // Reduce ALL CAPS sections
    .replace(/\b[A-Z]{4,}\b/g, (match) =>
      match.charAt(0) + match.slice(1).toLowerCase()
    )
    // Remove common spam phrases
    .replace(/\b(URGENT|IMMEDIATE|LIMITED TIME|ACT NOW|CLICK HERE)\b/gi, '')
    // Clean up excessive punctuation
    .replace(/[.]{3,}/g, '...')
    .replace(/[?]{2,}/g, '?')
    // Normalize spacing
    .replace(/\s+/g, ' ')
    .trim();
}

function optimizeSignatureForDeliverability(signature: string): string {
  if (!signature || !signature.trim()) return '';

  return signature
    .trim()
    // Remove multiple URLs (spam trigger)
    .replace(/(https?:\/\/[^\s]+).*\|(.*)/g, '$1') // Remove "url | email" format
    // Simplify multiple contact methods
    .replace(/\|/g, '\n') // Replace | with newlines
    // Remove excessive contact info
    .split('\n')
    .slice(0, 4) // Keep max 4 lines
    .filter(line => line.trim())
    .join('\n');
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
 * Avoids aggressive newsletter styling, marketing banners, and heavy buttons.
 * Renders as a crisp, professional correspondence.
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
      const formatted = escapeHtml(p).replace(/\n/g, '<br>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.5; font-size: 14px; color: #333333; font-family: Arial, sans-serif;">${formatted}</p>`;
    })
    .join('\n');

  // Improved signature formatting - less spam-triggering
  let signatureHtml = '';
  if (signature && signature.trim()) {
    const formattedSig = escapeHtml(signature.trim()).replace(/\n/g, '<br>');
    signatureHtml = `
      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #cccccc; font-size: 12px; line-height: 1.4; color: #666666; font-family: Arial, sans-serif;">
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

  // Minimal HTML structure to avoid spam filters
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Communication</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${paragraphsHtml}
    ${signatureHtml}
    ${optOutHtml}
  </div>
  
  <!-- Deliverability enhancement -->
  <div style="font-size: 1px; color: transparent; line-height: 1px; max-height: 1px; overflow: hidden;">
    TaskNera Professional Business Communication
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

  // Enhanced email validation to prevent bounces
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanRecipient)) {
    throw new Error('Invalid recipient email address format');
  }

  // Validate and clean CC emails
  let cleanCcEmails: string[] = [];
  if (payload.cc) {
    cleanCcEmails = payload.cc
      .split(',')
      .map(email => email.trim())
      .filter(email => email && emailRegex.test(email));
  }

  const messageId = generateMessageId();
  const now = new Date().toISOString();

  // Generate RFC 8058 unsubscribe token & headers
  const unsubToken = generateUnsubscribeToken(cleanRecipient, payload.campaignId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://tasknera.com');
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  const unsubHeaders = settings.enableUnsubscribeHeader !== false ? getUnsubscribeHeaders(cleanRecipient, payload.campaignId, baseUrl) : {};

  const optimizedSignature = payload.signature ? optimizeSignatureForDeliverability(payload.signature) : undefined;
  const optimizedBody = optimizeEmailContentForDeliverability(payload.body);
  const optimizedSubject = optimizeSubjectForDeliverability(payload.subject);

  // Attach clean opt-out text to plain-text body as well
  let fullBody = optimizedSignature ? `${optimizedBody}\n\n${optimizedSignature}` : optimizedBody;
  if (settings.enableUnsubscribeFooter !== false) {
    fullBody += `\n\n---\nOpt out of future communications: ${unsubscribeUrl}`;
  }

  const htmlBody = formatProfessionalEmailHtml(
    optimizedBody,
    optimizedSignature,
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
      },
      // Enhanced configuration for better deliverability
      pool: true,
      maxConnections: 1,
      rateDelta: 30000, // 30 second delay between emails
      rateLimit: 2 // max 2 emails per 30 seconds
    });

    try {
      const fromEmail = smtpUser || settings.senderEmail || 'operations@tasknera.com';
      const fromName = settings.senderName || process.env.EMAIL_SENDER_NAME || 'TaskNera Operations';

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.to,
        cc: cleanCcEmails.length > 0 ? cleanCcEmails : undefined,
        subject: optimizedSubject,
        text: fullBody,
        html: htmlBody,
        headers: {
          ...unsubHeaders,
          'X-Mailer': 'TaskNera Business Communication',
          'X-Priority': '3',
          'Importance': 'Normal',
          'X-Entity-Ref-ID': payload.campaignId || messageId,
          'Feedback-ID': `outreach:${payload.stage}:tasknera`,
          'Reply-To': fromEmail
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
        cc: cleanCcEmails.length > 0 ? cleanCcEmails : undefined,
        subject: optimizedSubject,
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
