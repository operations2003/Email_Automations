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
    name: 'VCS',
    icon: '👥',
    tagline: 'Flexible workforce & staffing support',
    pitch: "TaskNera HR Solutions provides flexible workforce and staffing support to help businesses meet their talent requirements efficiently. We aim to simplify workforce planning, support hiring needs, and help organizations find suitable talent while reducing the time and effort involved in managing staffing requirements. Our services can be tailored to your organization's needs and growth plans.",
    isDefault: true
  },
  {
    id: 'recruitment',
    name: 'Recruitment Services',
    icon: '🎯',
    tagline: 'Streamlined candidate sourcing & shortlisting',
    pitch: "TaskNera HR Solutions helps businesses streamline their recruitment process, from identifying potential candidates to screening and shortlisting suitable talent. Our goal is to help organizations reduce hiring effort, improve recruitment efficiency, and connect with candidates who match their job requirements. We support businesses in building stronger teams through a more organized and effective hiring process.",
    isDefault: true
  },
  {
    id: 'software',
    name: 'Software Solutions',
    icon: '💻',
    tagline: 'Digital tools for HR, CRM & recruitment intelligence',
    pitch: "TaskNera HR Solutions delivers technology-driven software solutions that help businesses simplify workflows, reduce manual tasks, and improve operational efficiency. Our solutions focus on recruitment intelligence, human resource management, and customer relationship management, enabling organizations to manage essential business activities more effectively through digital tools tailored to their operational needs.",
    isDefault: true
  },
  {
    id: 'hireiq',
    name: 'ATS + CRM Application — HireIQ by TaskNera',
    icon: '🧠',
    tagline: 'AI-powered recruitment intelligence & CRM',
    pitch: "HireIQ by TaskNera is an AI-powered recruitment intelligence solution designed to make hiring smarter and more efficient. It helps recruitment teams analyze job descriptions, evaluate resumes against defined criteria, identify suitable candidates, and organize recruitment activities. Combined with CRM capabilities, it helps teams manage candidate information and recruitment interactions in a more structured workflow, reducing repetitive work and supporting informed hiring decisions.",
    isDefault: true
  },
  {
    id: 'hrms_crm',
    name: 'HRMS + CRM Application',
    icon: '🏢',
    tagline: 'Integrated employee management & CRM workflows',
    pitch: "TaskNera HR Solutions offers an integrated HRMS and CRM solution designed to simplify employee management and customer relationship workflows. The HRMS supports essential HR activities such as attendance, leave management, employee records, and payroll workflows, while CRM capabilities help businesses manage leads, customer information, and interactions. Together, these solutions aim to improve coordination, reduce administrative workload, and provide businesses with better visibility into their day-to-day operations.",
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

export const MAIL_TOPICS = [
  'VCS',
  'Recruitment Services',
  'Software Solutions',
  'ATS + CRM Application — HireIQ by TaskNera',
  'HRMS + CRM Application',
  // Backward compatibility aliases
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
