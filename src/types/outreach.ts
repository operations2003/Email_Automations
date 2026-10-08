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
    id: 'pain',
    name: 'Screening Bottleneck',
    icon: '⚡',
    tagline: 'Manual resume screening drag',
    pitch: "Recruiters manually screening hundreds of CVs per JD, creating screening bottlenecks and delaying candidate shortlists.",
    isDefault: true
  },
  {
    id: 'time',
    name: 'Time Saving (8-10h/wk)',
    icon: '⏱️',
    tagline: 'Save 8-10h/week per recruiter',
    pitch: "Automate first-level resume matching to save recruiters 8-10 hours weekly and deliver client shortlists in hours instead of days.",
    isDefault: true
  },
  {
    id: 'volume',
    name: 'High-Volume Matching',
    icon: '📈',
    tagline: 'Large batches & pool matching',
    pitch: "Batch screen large CV volumes and auto-rank candidate pools against mandatory job requirements.",
    isDefault: true
  },
  {
    id: 'productivity',
    name: 'Desk Capacity & Speed',
    icon: '🚀',
    tagline: 'Faster shortlists & consistency',
    pitch: "Accelerate recruiter placement velocity and maintain consistent candidate evaluation scores across consultant desks.",
    isDefault: true
  },
  {
    id: 'curiosity',
    name: 'Soft CTA Walkthrough',
    icon: '💬',
    tagline: '90-second live example offer',
    pitch: "Low-friction conversation starter asking if they are open to seeing a 90-second example of automated candidate matching on a live JD.",
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
