import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getUserFromRequest } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { addHistoryEvent, findCampaignById, saveCampaign } from '@/lib/db';
import { formatProfessionalEmailHtml } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user if auth header/cookie is present
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin' && user.role !== 'employee') {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to send emails.' },
        { status: 403 }
      );
    }

    // 2. Validate request body
    const body = await req.json().catch(() => ({}));
    const { to, subject, html, text, campaignId, stage } = body;
    const emailBody = body.body || text;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Recipient email address is required and must be valid.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { success: false, message: 'Recipient, subject, and email body are required.' },
        { status: 400 }
      );
    }

    if (!html && !emailBody) {
      return NextResponse.json(
        { success: false, message: 'Recipient, subject, and email body are required.' },
        { status: 400 }
      );
    }

    // 3. Resolve configuration
    const settings = await getSettings();
    const apiKey = (process.env.RESEND_API_KEY || settings.resendApiKey || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Resend API key is missing. Please configure RESEND_API_KEY.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // Format sender address
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

    // 4. Send email through Resend SDK
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
      } else if (result.error.name === 'restricted_api_key' || (result.error as any).statusCode === 401) {
        message = `Resend Authorization Error: ${result.error.message || 'Restricted or invalid API key'}.`;
      }
      return NextResponse.json(
        { success: false, message },
        { status: 502 }
      );
    }

    // 5. Record send attempt in history if campaignId is present
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
        console.warn('[Emails API] Non-fatal history update warning:', histErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email accepted for processing.',
      id: result.data?.id,
      provider: 'resend'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Email sending failed:', err.message);
    return NextResponse.json(
      { success: false, message: 'Unable to send the email. Please try again.' },
      { status: 500 }
    );
  }
}
