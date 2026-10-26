import nodemailer from 'nodemailer';
import { getSettings } from './settings';
import { findCampaignByEmail, saveCampaign, addHistoryEvent } from './db';
import { isSuppressed } from './suppression';
import {
  Department,
  DEPARTMENTS,
  InboxConversation,
  InboxMessage,
  InboundEmailPayload,
  AcknowledgmentTemplate
} from '@/types/inbox';
import {
  saveConversation,
  saveMessage,
  findConversationByThread,
  getConversationById,
  hasMessageBeenProcessed,
  getNextTicketNumber,
  getInboxTemplateByDepartment,
  addInboxLog,
  normalizeSubject,
  extractTicketFromSubject
} from './inbox-db';

/**
 * Detects if an incoming email is automated, a bounce, a mailer-daemon, or spam.
 */
export function analyzeEmailForSpamOrAutomation(payload: InboundEmailPayload): {
  isSpamOrAutomated: boolean;
  reason?: string;
} {
  const from = (payload.from || '').toLowerCase().trim();
  const subject = (payload.subject || '').toLowerCase().trim();
  const headers = payload.headers || {};

  // 1. Common automated/bot sender prefixes
  const automatedPrefixes = [
    'no-reply@',
    'noreply@',
    'mailer-daemon@',
    'postmaster@',
    'bounce@',
    'bounces@',
    'notification@',
    'notifications@',
    'donotreply@',
    'auto-confirm@',
    'system@',
    'alert@',
    'alerts@',
    'daemon@'
  ];

  for (const prefix of automatedPrefixes) {
    if (from.includes(prefix)) {
      return {
        isSpamOrAutomated: true,
        reason: `Automated mailbox detected (${prefix.replace('@', '')})`
      };
    }
  }

  // 2. Standard email headers indicating automated/bulk mail
  const autoSubmitted = (headers['auto-submitted'] || headers['Auto-Submitted'] || '').toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') {
    return {
      isSpamOrAutomated: true,
      reason: `Auto-Submitted header: ${autoSubmitted}`
    };
  }

  const precedence = (headers['precedence'] || headers['Precedence'] || '').toLowerCase();
  if (['bulk', 'junk', 'auto_reply', 'list'].includes(precedence)) {
    return {
      isSpamOrAutomated: true,
      reason: `Precedence header indicates automated/bulk: ${precedence}`
    };
  }

  const xAutoReply = (headers['x-autoreply'] || headers['X-Autoreply'] || headers['x-autorespond'] || '').toLowerCase();
  if (xAutoReply === 'yes' || xAutoReply === 'true') {
    return {
      isSpamOrAutomated: true,
      reason: 'X-Autoreply header present'
    };
  }

  // 3. Subject-based automated replies and bounces
  const automatedSubjectPatterns = [
    /^out of office/i,
    /^automatic reply/i,
    /^auto:/i,
    /^autoreply/i,
    /^undelivered mail/i,
    /^delivery status notification/i,
    /^mail delivery failed/i,
    /^returned mail/i,
    /^failure notice/i
  ];

  for (const pattern of automatedSubjectPatterns) {
    if (pattern.test(subject)) {
      return {
        isSpamOrAutomated: true,
        reason: `Automated bounce or out-of-office subject: "${payload.subject}"`
      };
    }
  }

  return { isSpamOrAutomated: false };
}

/**
 * Detects which department should handle the incoming message based on recipient mailbox or keywords.
 */
export function detectDepartment(payload: InboundEmailPayload): {
  department: Department;
  mailbox: string;
} {
  const recipients: string[] = [];

  if (Array.isArray(payload.to)) {
    recipients.push(...payload.to);
  } else if (payload.to) {
    recipients.push(...payload.to.split(',').map(s => s.trim()));
  }

  if (Array.isArray(payload.cc)) {
    recipients.push(...payload.cc);
  } else if (payload.cc) {
    recipients.push(...payload.cc.split(',').map(s => s.trim()));
  }

  const combinedRecipients = recipients.join(' ').toLowerCase();

  // 1. Direct Mailbox match
  if (combinedRecipients.includes('careers@')) {
    return { department: 'careers', mailbox: DEPARTMENTS.careers.email };
  }
  if (combinedRecipients.includes('hr@') || combinedRecipients.includes('humanresources@')) {
    return { department: 'hr', mailbox: DEPARTMENTS.hr.email };
  }
  if (combinedRecipients.includes('recruitment@') || combinedRecipients.includes('jobs@') || combinedRecipients.includes('talent@')) {
    return { department: 'recruitment', mailbox: DEPARTMENTS.recruitment.email };
  }
  if (combinedRecipients.includes('support@') || combinedRecipients.includes('help@') || combinedRecipients.includes('helpdesk@')) {
    return { department: 'support', mailbox: DEPARTMENTS.support.email };
  }
  if (combinedRecipients.includes('operations@') || combinedRecipients.includes('ops@')) {
    return { department: 'operations', mailbox: DEPARTMENTS.operations.email };
  }

  // 2. Content / Subject keyword classification fallback
  const content = `${payload.subject || ''} ${payload.text || payload.body || ''}`.toLowerCase();

  if (/\b(resume|cv|job application|hiring process|open position|apply for role)\b/i.test(content)) {
    return { department: 'careers', mailbox: DEPARTMENTS.careers.email };
  }
  if (/\b(payroll|pto|vacation|leave request|employee handbook|hr policy|internal complaint)\b/i.test(content)) {
    return { department: 'hr', mailbox: DEPARTMENTS.hr.email };
  }
  if (/\b(headhunter|staffing agency|candidate pipeline|sourcing agreement|recruiter)\b/i.test(content)) {
    return { department: 'recruitment', mailbox: DEPARTMENTS.recruitment.email };
  }
  if (/\b(bug|error|broken|outage|help desk|ticket|issue|troubleshoot|cannot login)\b/i.test(content)) {
    return { department: 'support', mailbox: DEPARTMENTS.support.email };
  }

  // Default to operations
  return { department: 'operations', mailbox: DEPARTMENTS.operations.email };
}

/**
 * Extracts a sender display name if missing from header.
 */
function extractSenderName(email: string, explicitName?: string): string {
  if (explicitName && explicitName.trim()) return explicitName.trim();
  const prefix = email.split('@')[0] || 'Valued Contact';
  // Transform "john.doe" -> "John Doe"
  return prefix
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Replaces template variables with dynamic values.
 */
export function formatTemplateText(
  templateStr: string,
  variables: {
    senderName: string;
    senderEmail: string;
    department: string;
    subject: string;
    ticketNumber: string;
    companyName: string;
    receivedAt: string;
  }
): string {
  return templateStr
    .replace(/\{senderName\}/g, variables.senderName)
    .replace(/\{senderEmail\}/g, variables.senderEmail)
    .replace(/\{department\}/g, variables.department)
    .replace(/\{subject\}/g, variables.subject)
    .replace(/\{ticketNumber\}/g, variables.ticketNumber)
    .replace(/\{companyName\}/g, variables.companyName)
    .replace(/\{receivedAt\}/g, variables.receivedAt);
}

/**
 * Dispatches an automated acknowledgment email using the configured email provider.
 */
export async function sendAcknowledgmentEmail(
  template: AcknowledgmentTemplate,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  ticketNumber: string,
  originalMessageId?: string
): Promise<{ success: boolean; messageId: string; error?: string }> {
  const settings = await getSettings();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const deptInfo = DEPARTMENTS[template.department];
  const vars = {
    senderName: recipientName,
    senderEmail: recipientEmail,
    department: deptInfo.name,
    subject: subject,
    ticketNumber: ticketNumber,
    companyName: settings.companyName || 'TaskNera Solutions',
    receivedAt: formattedDate
  };

  const ackSubject = formatTemplateText(template.subjectTemplate, vars);
  const ackBody = formatTemplateText(template.bodyTemplate, vars);

  // If running in simulated mode, test environment, or missing SMTP, simulate clean delivery
  if (
    settings.provider === 'simulated' ||
    process.env.NODE_ENV === 'test' ||
    process.env.SIMULATE_EMAIL === 'true' ||
    !settings.smtpUser
  ) {
    const simulatedMsgId = `ack_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@tasknera.com`;
    return {
      success: true,
      messageId: simulatedMsgId
    };
  }

  // Real SMTP delivery
  try {
    const smtpHost = settings.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = settings.smtpUser || process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = settings.smtpPass || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
    const port = Number(settings.smtpPort) || Number(process.env.SMTP_PORT) || 587;
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

    const fromAddress = `"${template.fromName}" <${template.fromEmail}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: ackSubject,
      text: ackBody,
      replyTo: template.fromEmail,
      headers: {
        'Auto-Submitted': 'auto-replied',
        'X-Auto-Response-Suppress': 'All',
        'Precedence': 'bulk',
        ...(originalMessageId ? {
          'In-Reply-To': originalMessageId,
          'References': originalMessageId
        } : {})
      }
    });

    return {
      success: true,
      messageId: info.messageId || `ack_${Date.now()}@tasknera.com`
    };
  } catch (err: any) {
    console.error('[InboxEngine] Failed to send acknowledgment email via SMTP:', err);
    return {
      success: false,
      messageId: '',
      error: err.message || 'SMTP delivery failure'
    };
  }
}

/**
 * Main Inbound Email Processing Pipeline.
 * 1. Deduplicates by Message-ID.
 * 2. Checks for spam / automated messages.
 * 3. Classifies target department.
 * 4. Finds existing thread or creates new conversation.
 * 5. Cross-links with Outreach campaigns if applicant/recipient exists.
 * 6. Dispatches auto-acknowledgment if eligible (STRICTLY ONE per conversation).
 * 7. Logs all actions.
 */
export async function processIncomingEmail(payload: InboundEmailPayload): Promise<{
  success: boolean;
  conversation: InboxConversation;
  message: InboxMessage;
  acknowledgmentSent: boolean;
  duplicate?: boolean;
  reason?: string;
}> {
  const cleanSenderEmail = (payload.from || '').trim().toLowerCase();
  if (!cleanSenderEmail || !cleanSenderEmail.includes('@')) {
    throw new Error('Invalid sender email address in incoming email payload');
  }

  const messageId = (
    payload.messageId ||
    `in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@mail.tasknera.com`
  ).trim();

  // 1. DEDUPLICATION CHECK
  const isDuplicate = await hasMessageBeenProcessed(messageId);
  if (isDuplicate) {
    const existingConv = await findConversationByThread(
      payload.inReplyTo,
      Array.isArray(payload.references) ? payload.references : [payload.references || ''],
      normalizeSubject(payload.subject || ''),
      cleanSenderEmail
    );

    await addInboxLog({
      department: existingConv?.department || 'operations',
      ticketNumber: existingConv?.ticketNumber,
      conversationId: existingConv?.id,
      action: 'ack_skipped',
      title: 'Duplicate Email Ignored',
      description: `Message ID ${messageId} was already processed. Skipped to prevent duplicate conversation/acknowledgment.`
    });

    return {
      success: true,
      conversation: existingConv!,
      message: null as any,
      acknowledgmentSent: false,
      duplicate: true,
      reason: 'Message-ID already processed'
    };
  }

  // 2. ANALYZE SPAM & AUTOMATED SENDER
  const spamCheck = analyzeEmailForSpamOrAutomation(payload);
  const { department, mailbox } = detectDepartment(payload);
  const senderName = extractSenderName(cleanSenderEmail, payload.fromName);
  const rawSubject = (payload.subject || 'Inquiry regarding TaskNera').trim();
  const normSubject = normalizeSubject(rawSubject);
  const ticketFromSubj = extractTicketFromSubject(rawSubject);
  const bodyText = payload.text || payload.body || (payload.html ? payload.html.replace(/<[^>]*>?/gm, ' ') : '');
  const now = new Date().toISOString();

  // 3. THREAD / CONVERSATION MATCHING
  let conversation = await findConversationByThread(
    payload.inReplyTo,
    Array.isArray(payload.references) ? payload.references : [payload.references || ''],
    normSubject,
    cleanSenderEmail,
    ticketFromSubj || undefined
  );

  let isNewConversation = false;

  if (!conversation) {
    isNewConversation = true;
    const ticketNumber = await getNextTicketNumber();
    const convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    conversation = {
      id: convId,
      ticketNumber,
      subject: rawSubject,
      normalizedSubject: normSubject,
      department,
      mailbox,
      sender: {
        name: senderName,
        email: cleanSenderEmail
      },
      status: spamCheck.isSpamOrAutomated ? 'spam' : 'pending_human',
      acknowledgmentStatus: spamCheck.isSpamOrAutomated ? 'skipped' : 'pending',
      acknowledgmentSkipReason: spamCheck.isSpamOrAutomated ? spamCheck.reason : null,
      lastMessageSnippet: bodyText.slice(0, 140) || 'New message received',
      lastMessageTimestamp: now,
      lastMessageDirection: 'inbound',
      messageCount: 0,
      isUnread: true,
      createdAt: now,
      updatedAt: now
    };
  } else {
    // Existing conversation
    conversation.lastMessageSnippet = bodyText.slice(0, 140) || 'New reply received';
    conversation.lastMessageTimestamp = now;
    conversation.lastMessageDirection = 'inbound';
    conversation.isUnread = true;
    if (conversation.status === 'resolved' || conversation.status === 'waiting_on_customer') {
      conversation.status = 'pending_human';
    }
  }

  // 4. CROSS-LINK WITH COLD OUTREACH CAMPAIGNS (if matching sender email)
  try {
    const campaign = await findCampaignByEmail(cleanSenderEmail);
    if (campaign) {
      conversation.matchedCampaignId = campaign.id;
      if (!conversation.sender.company && campaign.companyName) {
        conversation.sender.company = campaign.companyName;
      }

      // If outreach sequence is active, mark replied and pause follow-ups automatically
      if (campaign.replyStatus !== 'Replied') {
        campaign.replyStatus = 'Replied';
        campaign.status = 'Follow-Up Paused';
        campaign.lastActivity = `Inbound response received in ${DEPARTMENTS[department].name} inbox (Ticket #${conversation.ticketNumber})`;
        campaign.lastActivityTimestamp = now;
        await saveCampaign(campaign);

        await addHistoryEvent(campaign.id, {
          type: 'reply_received',
          title: `Inbound Email Routed to ${DEPARTMENTS[department].name}`,
          description: `Prospect responded: "${rawSubject}". Synced to Inbox as Ticket #${conversation.ticketNumber}. Drip sequence paused.`,
          timestamp: now
        });
      }
    }
  } catch (err) {
    console.warn('[InboxEngine] Outreach cross-link check non-fatal error:', err);
  }

  // 5. SAVE INCOMING MESSAGE
  const incomingMessage: InboxMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    conversationId: conversation.id,
    direction: 'inbound',
    from: {
      name: senderName,
      email: cleanSenderEmail
    },
    to: Array.isArray(payload.to) ? payload.to : [payload.to || mailbox],
    cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : undefined,
    subject: rawSubject,
    bodyText,
    bodyHtml: payload.html,
    messageId,
    inReplyTo: payload.inReplyTo,
    references: Array.isArray(payload.references) ? payload.references : (payload.references ? [payload.references] : []),
    department,
    mailbox,
    timestamp: now,
    isSpamOrAutomated: spamCheck.isSpamOrAutomated,
    spamReason: spamCheck.reason,
    headers: payload.headers
  };

  await saveMessage(incomingMessage);
  conversation.messageCount = (conversation.messageCount || 0) + 1;

  await addInboxLog({
    department,
    ticketNumber: conversation.ticketNumber,
    conversationId: conversation.id,
    action: 'email_received',
    title: `Inbound Email Received: ${conversation.ticketNumber}`,
    description: `From "${senderName}" <${cleanSenderEmail}>: "${rawSubject}"`,
    metadata: { isSpam: spamCheck.isSpamOrAutomated, reason: spamCheck.reason }
  });

  // 6. AUTOMATIC ACKNOWLEDGMENT ENGINE
  let ackSent = false;

  // RULE CHECK:
  // - Must not already have sent an acknowledgment in this conversation!
  // - Must not be spam or automated
  // - Sender must not be suppressed
  // - Sender must not be from our own internal domain
  const isInternal = cleanSenderEmail.endsWith('@tasknera.com');
  const suppressed = await isSuppressed(cleanSenderEmail);

  if (conversation.acknowledgmentStatus === 'sent') {
    // Acknowledgment already sent for this conversation thread!
    conversation.acknowledgmentSkipReason = 'Acknowledgment already sent previously for this conversation';
    await saveConversation(conversation);
    return {
      success: true,
      conversation,
      message: incomingMessage,
      acknowledgmentSent: false,
      reason: 'Acknowledgment already sent for this conversation'
    };
  }

  if (spamCheck.isSpamOrAutomated) {
    conversation.acknowledgmentStatus = 'skipped';
    conversation.acknowledgmentSkipReason = spamCheck.reason;
    await saveConversation(conversation);

    await addInboxLog({
      department,
      ticketNumber: conversation.ticketNumber,
      conversationId: conversation.id,
      action: 'ack_skipped',
      title: 'Auto-Acknowledgment Skipped (Spam/Automated)',
      description: `Excluded from acknowledgment: ${spamCheck.reason}`
    });

    return {
      success: true,
      conversation,
      message: incomingMessage,
      acknowledgmentSent: false,
      reason: spamCheck.reason
    };
  }

  if (isInternal || suppressed) {
    const reason = isInternal ? 'Internal domain address' : 'Address on suppression list';
    conversation.acknowledgmentStatus = 'skipped';
    conversation.acknowledgmentSkipReason = reason;
    await saveConversation(conversation);

    await addInboxLog({
      department,
      ticketNumber: conversation.ticketNumber,
      conversationId: conversation.id,
      action: 'ack_skipped',
      title: 'Auto-Acknowledgment Skipped',
      description: `Excluded from acknowledgment: ${reason}`
    });

    return {
      success: true,
      conversation,
      message: incomingMessage,
      acknowledgmentSent: false,
      reason
    };
  }

  // Eligible for auto-acknowledgment!
  const template = await getInboxTemplateByDepartment(conversation.department);

  if (template.isActive) {
    const sendResult = await sendAcknowledgmentEmail(
      template,
      cleanSenderEmail,
      senderName,
      rawSubject,
      conversation.ticketNumber,
      messageId
    );

    if (sendResult.success) {
      ackSent = true;
      conversation.acknowledgmentStatus = 'sent';
      conversation.acknowledgmentSentAt = new Date().toISOString();
      conversation.acknowledgmentMessageId = sendResult.messageId;
      conversation.acknowledgmentError = null;

      // Save outgoing auto-ack message record in conversation
      const ackMsg: InboxMessage = {
        id: `msg_ack_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        conversationId: conversation.id,
        direction: 'outbound_ack',
        from: {
          name: template.fromName,
          email: template.fromEmail
        },
        to: [cleanSenderEmail],
        subject: formatTemplateText(template.subjectTemplate, {
          senderName,
          senderEmail: cleanSenderEmail,
          department: DEPARTMENTS[department].name,
          subject: rawSubject,
          ticketNumber: conversation.ticketNumber,
          companyName: 'TaskNera Solutions',
          receivedAt: new Date().toISOString()
        }),
        bodyText: formatTemplateText(template.bodyTemplate, {
          senderName,
          senderEmail: cleanSenderEmail,
          department: DEPARTMENTS[department].name,
          subject: rawSubject,
          ticketNumber: conversation.ticketNumber,
          companyName: 'TaskNera Solutions',
          receivedAt: new Date().toISOString()
        }),
        messageId: sendResult.messageId,
        inReplyTo: messageId,
        references: [messageId],
        department: conversation.department,
        mailbox: template.fromEmail,
        timestamp: new Date().toISOString()
      };

      await saveMessage(ackMsg);
      conversation.messageCount = (conversation.messageCount || 0) + 1;

      await addInboxLog({
        department,
        ticketNumber: conversation.ticketNumber,
        conversationId: conversation.id,
        action: 'ack_sent',
        title: `Auto-Acknowledgment Dispatched (${DEPARTMENTS[department].name})`,
        description: `Sent to ${cleanSenderEmail} referencing Ticket #${conversation.ticketNumber}`
      });
    } else {
      conversation.acknowledgmentStatus = 'failed';
      conversation.acknowledgmentError = sendResult.error || 'SMTP delivery error';

      await addInboxLog({
        department,
        ticketNumber: conversation.ticketNumber,
        conversationId: conversation.id,
        action: 'ack_failed',
        title: 'Auto-Acknowledgment Delivery Failed',
        description: `Error sending to ${cleanSenderEmail}: ${sendResult.error}`
      });
    }
  }

  await saveConversation(conversation);

  return {
    success: true,
    conversation,
    message: incomingMessage,
    acknowledgmentSent: ackSent
  };
}

/**
 * Manually dispatches or retries an auto-acknowledgment for a conversation.
 */
export async function retryAcknowledgment(conversationId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const conv = await getConversationById(conversationId);
  if (!conv) {
    throw new Error('Conversation not found');
  }

  const template = await getInboxTemplateByDepartment(conv.department);
  const result = await sendAcknowledgmentEmail(
    template,
    conv.sender.email,
    conv.sender.name || 'Valued Contact',
    conv.subject,
    conv.ticketNumber
  );

  if (result.success) {
    conv.acknowledgmentStatus = 'sent';
    conv.acknowledgmentSentAt = new Date().toISOString();
    conv.acknowledgmentMessageId = result.messageId;
    conv.acknowledgmentError = null;

    const ackMsg: InboxMessage = {
      id: `msg_ack_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      conversationId: conv.id,
      direction: 'outbound_ack',
      from: {
        name: template.fromName,
        email: template.fromEmail
      },
      to: [conv.sender.email],
      subject: formatTemplateText(template.subjectTemplate, {
        senderName: conv.sender.name || 'Valued Contact',
        senderEmail: conv.sender.email,
        department: DEPARTMENTS[conv.department].name,
        subject: conv.subject,
        ticketNumber: conv.ticketNumber,
        companyName: 'TaskNera Solutions',
        receivedAt: new Date().toISOString()
      }),
      bodyText: formatTemplateText(template.bodyTemplate, {
        senderName: conv.sender.name || 'Valued Contact',
        senderEmail: conv.sender.email,
        department: DEPARTMENTS[conv.department].name,
        subject: conv.subject,
        ticketNumber: conv.ticketNumber,
        companyName: 'TaskNera Solutions',
        receivedAt: new Date().toISOString()
      }),
      messageId: result.messageId,
      department: conv.department,
      mailbox: template.fromEmail,
      timestamp: new Date().toISOString()
    };

    await saveMessage(ackMsg);
    conv.messageCount = (conv.messageCount || 0) + 1;
    await saveConversation(conv);

    await addInboxLog({
      department: conv.department,
      ticketNumber: conv.ticketNumber,
      conversationId: conv.id,
      action: 'ack_sent',
      title: 'Manual Acknowledgment Triggered',
      description: `Manual auto-ack dispatched to ${conv.sender.email}`
    });

    return { success: true, messageId: result.messageId };
  } else {
    conv.acknowledgmentStatus = 'failed';
    conv.acknowledgmentError = result.error;
    await saveConversation(conv);
    return { success: false, error: result.error };
  }
}

/**
 * Sends a human response from a team member directly to the conversation recipient.
 */
export async function sendHumanReply(
  conversationId: string,
  replyBody: string,
  user: { name: string; email: string }
): Promise<InboxMessage> {
  const conv = await getConversationById(conversationId);
  if (!conv) {
    throw new Error('Conversation not found');
  }

  const deptInfo = DEPARTMENTS[conv.department];
  const settings = await getSettings();
  const now = new Date().toISOString();
  const replySubject = conv.subject.toLowerCase().startsWith('re:') ? conv.subject : `Re: ${conv.subject}`;

  let sentMessageId = `human_${Date.now()}_${Math.random().toString(36).substr(2, 6)}@tasknera.com`;

  // Send real email if SMTP configured
  if (settings.provider === 'smtp' && settings.smtpUser) {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost || 'smtp.gmail.com',
        port: Number(settings.smtpPort) || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass
        },
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: `"${user.name} (${deptInfo.name})" <${deptInfo.email}>`,
        to: conv.sender.email,
        subject: replySubject,
        text: replyBody,
        replyTo: deptInfo.email,
        headers: {
          'In-Reply-To': conv.acknowledgmentMessageId || undefined,
          'References': conv.acknowledgmentMessageId || undefined
        }
      });
      if (info.messageId) sentMessageId = info.messageId;
    } catch (err: any) {
      console.error('[InboxEngine] Failed to dispatch human email via SMTP:', err);
    }
  }

  const humanMsg: InboxMessage = {
    id: `msg_human_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    conversationId: conv.id,
    direction: 'outbound_human',
    from: {
      name: `${user.name} (${deptInfo.name})`,
      email: deptInfo.email
    },
    to: [conv.sender.email],
    subject: replySubject,
    bodyText: replyBody,
    messageId: sentMessageId,
    department: conv.department,
    mailbox: deptInfo.email,
    timestamp: now
  };

  await saveMessage(humanMsg);

  conv.lastMessageSnippet = replyBody.slice(0, 140);
  conv.lastMessageTimestamp = now;
  conv.lastMessageDirection = 'outbound_human';
  conv.status = 'waiting_on_customer';
  conv.assignedTo = user.name;
  conv.messageCount = (conv.messageCount || 0) + 1;
  conv.isUnread = false;
  await saveConversation(conv);

  await addInboxLog({
    department: conv.department,
    ticketNumber: conv.ticketNumber,
    conversationId: conv.id,
    action: 'human_replied',
    title: `Team Response Sent by ${user.name}`,
    description: `Replied to ${conv.sender.email} on Ticket #${conv.ticketNumber}`
  });

  return humanMsg;
}
