import { AppSettings } from '@/types/outreach';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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

function generateUnsubscribeLink(settings: any): string {
  return settings.unsubscribeUrl || 'mailto:unsubscribe@tasknera.com';
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
 * Produces clean, spam-filter friendly HTML formatting.
 * Avoids marketing-style HTML that triggers spam filters.
 * Uses minimal, professional styling that renders as personal business correspondence.
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
  </div>
  
  <!-- Deliverability enhancement -->
  <div style="font-size: 1px; color: transparent; line-height: 1px; max-height: 1px; overflow: hidden;">
    TaskNera Professional Business Communication
  </div>
</body>
</html>`;
}

export async function sendOutreachEmail(
  payload: SendEmailPayload,
  settings: AppSettings
): Promise<SendEmailResult> {
  const messageId = generateMessageId();
  const now = new Date().toISOString();
  
  // Enhanced email validation to prevent bounces
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.to)) {
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
  
  const optimizedSignature = payload.signature ? optimizeSignatureForDeliverability(payload.signature) : undefined;
  const optimizedBody = optimizeEmailContentForDeliverability(payload.body);
  const optimizedSubject = optimizeSubjectForDeliverability(payload.subject);
  const fullBody = optimizedSignature ? `${optimizedBody}\n\n${optimizedSignature}` : optimizedBody;
  const htmlBody = formatProfessionalEmailHtml(optimizedBody, optimizedSignature);

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
        // Enhanced headers for better deliverability
        headers: {
          'X-Mailer': 'TaskNera Business Communication',
          'X-Priority': '3', // Normal priority (avoid high priority spam trigger)
          'Importance': 'Normal',
          'X-MSMail-Priority': 'Normal',
          'List-Unsubscribe': '<mailto:unsubscribe@tasknera.com>',
          'Message-ID': `<${messageId}@tasknera.com>`,
          'Reply-To': fromEmail
        },
        messageId: `<${messageId}@tasknera.com>`
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
        subject: optimizedSubject,
        text: fullBody,
        html: htmlBody
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
      throw new Error(e.message || 'Failed to dispatch email via Resend.');
    }
  }

  // 3. Simulated Sandbox Mode (Records delivery in local DB and dashboard without dispatching network emails)
  return {
    success: true,
    messageId,
    deliveredAt: now,
    provider: 'simulated_sandbox'
  };
}
