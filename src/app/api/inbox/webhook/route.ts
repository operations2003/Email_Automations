import { NextRequest, NextResponse } from 'next/server';
import { processIncomingEmail } from '@/lib/inbox-engine';
import { InboundEmailPayload } from '@/types/inbox';

export async function POST(req: NextRequest) {
  try {
    // Optional Webhook Secret Verification
    const secret = process.env.INBOX_WEBHOOK_SECRET;
    if (secret) {
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token');
      const authHeader = req.headers.get('authorization') || '';
      const bearerToken = authHeader.replace(/^Bearer\s+/i, '');

      if (queryToken !== secret && bearerToken !== secret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized webhook call: invalid secret token' },
          { status: 401 }
        );
      }
    }

    const contentType = req.headers.get('content-type') || '';
    let payload: InboundEmailPayload;

    // Handle multipart/form-data (used by SendGrid Inbound Parse, Mailgun, etc.)
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const from = (formData.get('from') as string) || (formData.get('sender') as string) || '';
      const to = (formData.get('to') as string) || (formData.get('recipient') as string) || '';
      const cc = (formData.get('cc') as string) || undefined;
      const subject = (formData.get('subject') as string) || 'No Subject';
      const text = (formData.get('text') as string) || (formData.get('body-plain') as string) || '';
      const html = (formData.get('html') as string) || (formData.get('body-html') as string) || undefined;
      const messageId = (formData.get('Message-Id') as string) || (formData.get('message-id') as string) || undefined;
      const inReplyTo = (formData.get('In-Reply-To') as string) || (formData.get('in-reply-to') as string) || undefined;
      const references = (formData.get('References') as string) || (formData.get('references') as string) || undefined;

      // Extract sender name if formatted as "John Doe <john@example.com>"
      let parsedFromName: string | undefined = undefined;
      let parsedFromEmail = from;
      const match = from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
      if (match) {
        parsedFromName = match[1]?.trim();
        parsedFromEmail = match[2]?.trim();
      }

      payload = {
        from: parsedFromEmail,
        fromName: parsedFromName,
        to,
        cc,
        subject,
        text,
        html,
        messageId,
        inReplyTo,
        references
      };
    } else {
      // Standard application/json payload
      const json = await req.json();

      // Normalize common webhook JSON variations
      payload = {
        from: json.from || json.sender || json.data?.from || json.envelope?.from || '',
        fromName: json.fromName || json.senderName || json.data?.fromName,
        to: json.to || json.recipient || json.data?.to || json.envelope?.to || 'operations@tasknera.com',
        cc: json.cc || json.data?.cc,
        subject: json.subject || json.data?.subject || 'Inquiry',
        text: json.text || json.body || json.data?.text || '',
        html: json.html || json.data?.html,
        messageId: json.messageId || json.data?.message_id || json.id,
        inReplyTo: json.inReplyTo || json.data?.in_reply_to,
        references: json.references || json.data?.references,
        headers: json.headers || json.data?.headers
      };
    }

    if (!payload.from) {
      return NextResponse.json(
        { success: false, error: 'Missing required field "from" in incoming payload' },
        { status: 400 }
      );
    }

    const result = await processIncomingEmail(payload);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/inbox/webhook:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
