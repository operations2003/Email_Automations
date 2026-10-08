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

export async function sendOutreachEmail(
  payload: SendEmailPayload,
  settings: AppSettings
): Promise<SendEmailResult> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const fullBody = payload.signature ? `${payload.body}\n\n${payload.signature}` : payload.body;

  // 1. SMTP Provider (Gmail, Outlook, Amazon SES, Custom SMTP)
  if (settings.provider === 'smtp') {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      throw new Error(
        'SMTP Configuration incomplete. Please configure SMTP Host, Username/Email, and Password/App Password in Settings.'
      );
    }

    const port = Number(settings.smtpPort) || (settings.smtpSecure ? 465 : 587);
    const isSecure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : port === 465;

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port,
      secure: isSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"${settings.senderName || 'Outreach'}" <${settings.smtpUser || settings.senderEmail}>`,
      to: payload.to,
      cc: payload.cc ? payload.cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      subject: payload.subject,
      text: fullBody
    });

    return {
      success: true,
      messageId: info.messageId || messageId,
      deliveredAt: now,
      provider: 'smtp'
    };
  }

  // 2. Resend API Provider
  if (settings.provider === 'resend') {
    if (!settings.resendApiKey) {
      throw new Error('Resend API Key is missing. Please provide your Resend API Key in Settings.');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.resendApiKey}`
      },
      body: JSON.stringify({
        from: `${settings.senderName} <${settings.senderEmail}>`,
        to: [payload.to],
        cc: payload.cc ? payload.cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        subject: payload.subject,
        text: fullBody
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

