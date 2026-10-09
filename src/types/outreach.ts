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
  mailTopic?: string;
  reason: string;
  recipientName?: string;
  companyWebsite?: string;
  notes?: string;
  assignedTo?: string; // e.g. 'Atul' or 'atul@tasknera.com'
  assignedBy?: string; // e.g. 'Sheetal Bedi (Admin)'

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
    id: 'vcs',
    name: 'Virtual Customer Support (VCS)',
    icon: '🎧',
    tagline: 'Dedicated, human-led multi-channel support',
    pitch: "TaskNera provides dedicated, human-led customer support across voice, live chat, email, WhatsApp, and social media. Our support teams help businesses manage customer enquiries, resolve issues, handle follow-ups, and maintain service quality through structured workflows, quality monitoring, and SLA-aligned delivery.",
    isDefault: true
  },
  {
    id: 'recruitment',
    name: 'Recruitment & Talent Acquisition',
    icon: '🎯',
    tagline: 'End-to-end recruitment across IT, non-IT & executive roles',
    pitch: "TaskNera supports end-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to shortlisting and interview coordination, we help businesses build relevant talent pipelines and streamline recruitment operations.",
    isDefault: true
  },
  {
    id: 'software',
    name: 'HR Technology & Digital Solutions',
    icon: '💻',
    tagline: 'Recruitment intelligence, HRMS platforms & workflow automation',
    pitch: "TaskNera combines recruitment intelligence and HR technology to help businesses streamline hiring, employee management, and business relationship workflows. With HireIQ ATS and HRMS already in place, TaskNera delivers technology-enabled solutions including recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, analytics, and workflow automation, alongside an in-house CRM designed to connect client relationships, recruitment pipelines, and workforce operations through an integrated digital ecosystem.",
    isDefault: true
  },
  {
    id: 'hireiq',
    name: 'HireIQ — ATS & Recruitment Intelligence',
    icon: '🧠',
    tagline: 'AI JD analysis, resume scoring & CRM integration',
    pitch: "HireIQ by TaskNera is an AI-powered recruitment intelligence platform that supports job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, ranking, and structured candidate evaluation. The planned CRM integration extends these capabilities by connecting client accounts, hiring requirements, communication history, follow-ups, and business opportunities with recruitment activities, providing end-to-end visibility from client acquisition and job requirements through candidate selection and placement.",
    isDefault: true
  },
  {
    id: 'hrms_crm',
    name: 'HRMS & Employee Lifecycle Management',
    icon: '🏢',
    tagline: 'Centralized employee records & CRM integration',
    pitch: "TaskNera's HRMS supports essential employee lifecycle and workforce management activities, including employee records, onboarding and offboarding, attendance, leave management, payroll workflows, performance, and training. The planned CRM integration connects customer accounts, business opportunities, and service requirements with relevant workforce operations, helping organizations improve coordination between customer-facing teams and internal people-management processes to create a connected, visible, and efficient business operations ecosystem.",
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
  emailSignature: `Best regards,\nSwati Verma\nTaskNera Solutions\nhttps://tasknera.com | swati@tasknera.com`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: 'simulated',
  openAiApiKey: '',
  services: DEFAULT_SERVICES
};

export const MAIL_TOPICS = [
  'Virtual Customer Support (VCS)',
  'Recruitment & Talent Acquisition',
  'HR Technology & Digital Solutions',
  'HireIQ — ATS & Recruitment Intelligence',
  'HRMS & Employee Lifecycle Management',
  // Backward compatibility aliases
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
