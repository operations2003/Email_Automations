export type Department = 'operations' | 'careers' | 'hr' | 'recruitment' | 'support';

export type AcknowledgmentStatus = 'sent' | 'pending' | 'skipped' | 'failed';

export type ConversationStatus = 'pending_human' | 'resolved' | 'waiting_on_customer' | 'spam';

export interface DepartmentInfo {
  id: Department;
  name: string;
  email: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
}

export const DEPARTMENTS: Record<Department, DepartmentInfo> = {
  operations: {
    id: 'operations',
    name: 'Operations',
    email: 'operations@tasknera.com',
    description: 'General business inquiries, operational workflows & corporate communication',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  careers: {
    id: 'careers',
    name: 'Careers',
    email: 'careers@tasknera.com',
    description: 'Candidate applications, job inquiries & talent opportunities',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  hr: {
    id: 'hr',
    name: 'Human Resources',
    email: 'hr@tasknera.com',
    description: 'Employee relations, workplace policies, onboarding & HR inquiries',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment',
    email: 'recruitment@tasknera.com',
    description: 'Executive hiring, candidate sourcing & staffing partner coordination',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  support: {
    id: 'support',
    name: 'Support',
    email: 'support@tasknera.com',
    description: 'Customer help desk, technical troubleshooting & service assistance',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export interface InboxMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound_ack' | 'outbound_human';
  from: {
    name?: string;
    email: string;
  };
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  messageId: string; // RFC Message-ID
  inReplyTo?: string;
  references?: string[];
  department: Department;
  mailbox: string;
  timestamp: string; // ISO string
  isSpamOrAutomated?: boolean;
  spamReason?: string;
  headers?: Record<string, string>;
}

export interface InboxConversation {
  id: string;
  ticketNumber: string; // e.g. "TNK-1001"
  subject: string;
  normalizedSubject: string;
  department: Department;
  mailbox: string;
  sender: {
    name?: string;
    email: string;
    company?: string;
  };
  status: ConversationStatus;
  acknowledgmentStatus: AcknowledgmentStatus;
  acknowledgmentSentAt?: string | null;
  acknowledgmentMessageId?: string | null;
  acknowledgmentError?: string | null;
  acknowledgmentSkipReason?: string | null;
  assignedTo?: string | null;
  lastMessageSnippet: string;
  lastMessageTimestamp: string;
  lastMessageDirection: 'inbound' | 'outbound_ack' | 'outbound_human';
  messageCount: number;
  isUnread: boolean;
  matchedCampaignId?: string | null; // Associated cold outreach campaign if detected
  createdAt: string;
  updatedAt: string;
  messages?: InboxMessage[];
}

export interface AcknowledgmentTemplate {
  id: string;
  department: Department;
  name: string;
  fromName: string;
  fromEmail: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  estimatedTurnaroundHours: number;
  updatedAt: string;
}

export interface MailboxOverview {
  department: Department;
  name: string;
  email: string;
  description: string;
  status: 'connected' | 'idle' | 'syncing';
  totalConversations: number;
  unreadCount: number;
  pendingHumanCount: number;
  autoAckCount: number;
  lastReceivedAt?: string | null;
}

export interface InboxActivityLog {
  id: string;
  conversationId?: string;
  ticketNumber?: string;
  department: Department;
  action:
    | 'email_received'
    | 'ack_sent'
    | 'ack_skipped'
    | 'ack_failed'
    | 'human_replied'
    | 'status_changed'
    | 'department_changed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface InboundEmailPayload {
  from: string;
  fromName?: string;
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  body?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string | string[];
  headers?: Record<string, string>;
  raw?: string;
}
