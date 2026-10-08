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
  timestamp: string; // ISO date string
}

export interface OutreachCampaign {
  id: string;
  companyName: string;
  email: string;
  ccEmails: string;
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

export interface OutreachService {
  id: string;
  name: string;
  icon?: string;
  tagline?: string;
  pitch: string;
  isDefault?: boolean;
}

export const DEFAULT_SERVICES: OutreachService[] = [
  {
    id: 'hireiq',
    name: 'HireIQ (AI Screening)',
    icon: '🎯',
    tagline: 'JD matching & resume scoring',
    pitch: "Introduce HireIQ, TaskNera's AI platform for instant JD-to-candidate matching and automated resume screening.",
    isDefault: true
  },
  {
    id: 'staffing',
    name: 'Tech Staffing',
    icon: '💻',
    tagline: 'Senior devs in 48-72 hours',
    pitch: "Offer TaskNera's on-demand tech staffing—providing pre-vetted senior developers and engineering pods within 48 to 72 hours.",
    isDefault: true
  },
  {
    id: 'software',
    name: 'Custom Software & AI',
    icon: '🤖',
    tagline: 'Full-cycle product builds',
    pitch: "Introduce TaskNera's custom software and AI development services for building scalable web, mobile, and cloud solutions.",
    isDefault: true
  },
  {
    id: 'ats',
    name: 'Recruiting Automation',
    icon: '📋',
    tagline: 'ATS & pipeline workflows',
    pitch: "Share TaskNera's recruitment automation and ATS workflow solutions to speed up candidate pipelines.",
    isDefault: true
  }
];

export interface AppSettings {
  senderName: string;
  senderEmail: string;
  defaultCc: string;
  companyName: string;
  emailSignature: string;
  aiTone: 'Professional' | 'Consultative' | 'Direct' | 'Friendly' | 'Persuasive';
  followUpIntervalDays: number; // default 2
  maxFollowUps: number; // default 3
  openAiApiKey?: string;
  provider: 'simulated' | 'smtp' | 'resend';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  resendApiKey?: string;
  services?: OutreachService[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'Swati Verma',
  senderEmail: 'swati@tasknera.com',
  defaultCc: 'team@tasknera.com',
  companyName: 'TaskNera Solutions',
  emailSignature: `Best regards,\nSwati Verma\nTaskNera Solutions\nhttps://tasknera.io | swati@tasknera.com`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: 'simulated',
  openAiApiKey: '',
  services: DEFAULT_SERVICES
};

export interface EmailGenerationPayload {
  companyName: string;
  recipientEmail: string;
  ccEmails?: string;
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
}
