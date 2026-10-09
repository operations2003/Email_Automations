import { AppSettings } from '../types/outreach.js';
import { Resend } from 'resend';

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

export function formatProfessionalEmailHtml(
  body: string,
  signature?: string
): string {
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

export async function sendOutreachEmail(
  payload: SendEmailPayload,
  settings: AppSettings
): Promise<SendEmailResult> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const fullBody = payload.signature ? `${payload.body}\n\n${payload.signature}` : payload.body;
  const htmlBody = formatProfessionalEmailHtml(payload.body, payload.signature);

  const isResend =
    settings.provider === 'resend' ||
    Boolean(process.env.RESEND_API_KEY && settings.provider !== 'smtp' && settings.provider !== 'simulated');

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

  return {
    success: true,
    messageId,
    deliveredAt: now,
    provider: 'simulated_sandbox'
  };
}
