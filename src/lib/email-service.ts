import { AppSettings } from '@/types/outreach';
import nodemailer from 'nodemailer';

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
 * Avoids aggressive newsletter styling, marketing banners, and heavy buttons.
 * Renders as a crisp, professional correspondence.
 */
export function formatProfessionalEmailHtml(
  body: string,
  signature?: string
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
  </div>
</body>
</html>`;
}

export async function sendOutreachEmail(
  payload: SendEmailPayload,
  settings: AppSettings
): Promise<SendEmailResult> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const fullBody = payload.signature ? `${payload.body}\n\n${payload.signature}` : payload.body;
  const htmlBody = formatProfessionalEmailHtml(payload.body, payload.signature);

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
        html: htmlBody
      });

      return {
        success: true,
        messageId: info.messageId || messageId,
        deliveredAt: now,
        provider: 'smtp'
      };
    } catch (err: unknown) {
      const e = err as Error;
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

  // 2. Resend API Provider
  if (settings.provider === 'resend') {
    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API Key is missing. Please configure RESEND_API_KEY in environment variables or Settings.');
    }

    const fromEmail = settings.senderEmail || process.env.EMAIL_USER || 'operations@tasknera.com';
    const fromName = settings.senderName || process.env.EMAIL_SENDER_NAME || 'TaskNera Operations';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `"${fromName}" <${fromEmail}>`,
        to: [payload.to],
        cc: payload.cc ? payload.cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        subject: payload.subject,
        text: fullBody,
        html: htmlBody
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || `Resend API failed with status ${res.status}`);
    }

    return {
      success: true,
      messageId: data.id || messageId,
      deliveredAt: now,
      provider: 'resend'
    };
  }

  // 3. Simulated Sandbox Mode (Records delivery in local DB and dashboard without dispatching network emails)
  return {
    success: true,
    messageId,
    deliveredAt: now,
    provider: 'simulated_sandbox'
  };
}
