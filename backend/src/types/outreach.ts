export type OutreachStatus =
  | 'Draft'
  | 'Ready to Send'
  | 'Initial Email Sent'
  | 'Follow-Up Scheduled'
  | 'Follow-Up 1 Sent'
  | 'Follow-Up 2 Sent'
  | 'Follow-Up 3 Sent'
  | 'Replied'
  | 'Interested'
  | 'Meeting Scheduled'
  | 'Not Interested'
  | 'Closed'
  | 'Completed - No Response'
  | 'Follow-Up Paused';

export type ReplyStatus =
  | 'Not Replied'
  | 'Replied'
  | 'Interested'
  | 'Meeting Requested'
  | 'Bounced';

export interface EmailHistoryEvent {
  id: string;
  type:
    | 'initial_generated'
    | 'initial_sent'
    | 'followup_1_scheduled'
    | 'followup_1_sent'
    | 'followup_2_scheduled'
    | 'followup_2_sent'
    | 'followup_3_scheduled'
    | 'followup_3_sent'
    | 'reply_received'
    | 'status_changed'
    | 'paused'
    | 'resumed'
    | 'edited'
    | 'regenerated';
  title: string;
  description: string;
  subject?: string;
  body?: string;
  timestamp: string;
}

export interface OutreachCampaign {
  id: string;
  companyName: string;
  email: string;
  ccEmails: string;
  mailTopic?: string;
  reason: string;
  recipientName?: string;
  companyWebsite?: string;
  notes?: string;

  // Initial Email
  initialSubject: string;
  initialEmailBody: string;
  initialSentAt?: string | null;

  // Follow-Up 1
  followUp1Subject: string;
  followUp1Body: string;
  followUp1ScheduledAt?: string | null;
  followUp1SentAt?: string | null;

  // Follow-Up 2
  followUp2Subject: string;
  followUp2Body: string;
  followUp2ScheduledAt?: string | null;
  followUp2SentAt?: string | null;

  // Follow-Up 3
  followUp3Subject: string;
  followUp3Body: string;
  followUp3ScheduledAt?: string | null;
  followUp3SentAt?: string | null;

  status: OutreachStatus;
  replyStatus: ReplyStatus;

  lastActivity: string;
  lastActivityTimestamp: string;
  createdAt: string;
  updatedAt: string;

  history: EmailHistoryEvent[];
}

export interface AppSettings {
  senderName: string;
  senderEmail: string;
  defaultCc: string;
  companyName: string;
  emailSignature: string;
  aiTone: 'Professional' | 'Consultative' | 'Direct' | 'Friendly' | 'Persuasive';
  followUpIntervalDays: number;
  maxFollowUps: number;
  openAiApiKey?: string;
  provider: 'simulated' | 'smtp' | 'resend';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  resendApiKey?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'TaskNera Operations',
  senderEmail: process.env.EMAIL_FROM || 'operations@tasknera.com',
  defaultCc: 'operations@tasknera.com',
  companyName: 'TaskNera Solutions',
  emailSignature: `Best regards,\nOperations Team\nTaskNera Solutions\nhttps://tasknera.io | operations@tasknera.com`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: (process.env.RESEND_API_KEY ? 'resend' : 'smtp') as AppSettings['provider'],
  resendApiKey: process.env.RESEND_API_KEY || '',
  openAiApiKey: '',
};

export const MAIL_TOPICS = [
  'Virtual Customer Support (VCS)',
  'Recruitment & Talent Acquisition',
  'HR Technology & Digital Solutions',
  'HireIQ — ATS & Recruitment Intelligence',
  'HRMS & Employee Lifecycle Management',
  'VCS',
  'Recruitment Services',
  'Software Solutions',
  'ATS + CRM Application — HireIQ by TaskNera',
  'HRMS + CRM Application',
  'recruitment services',
  'software solutions',
  'ATS + CRM app',
  'HRMS + CRm'
] as const;

export type MailTopic = (typeof MAIL_TOPICS)[number];

export interface EmailGenerationPayload {
  companyName: string;
  recipientEmail: string;
  ccEmails?: string;
  mailTopic?: string;
  reason: string;
  recipientName?: string;
  companyWebsite?: string;
  previousSubject?: string;
  previousEmails?: string[];
  followUpNumber?: 0 | 1 | 2 | 3;
  previousResponseStatus?: string;
  tone?: string;
  signature?: string;
}

export interface GeneratedEmailResult {
  subject: string;
  body: string;
  emailType: string;
  tone: string;
  wordCount: number;
  qualityPassed: boolean;
  qualityNotes: string[];
  alternativeSubjects?: string[];
}
