import fs from 'fs/promises';
import path from 'path';
import { getDb } from './mongodb';
import {
  Department,
  DEPARTMENTS,
  InboxConversation,
  InboxMessage,
  AcknowledgmentTemplate,
  MailboxOverview,
  InboxActivityLog
} from '@/types/inbox';

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (process.platform === 'linux' && process.cwd().startsWith('/var/task'))
);

const DATA_DIR = isServerless ? path.join('/tmp', 'tasknera_data') : path.join(process.cwd(), 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'inbox_conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'inbox_messages.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'inbox_templates.json');
const LOGS_FILE = path.join(DATA_DIR, 'inbox_logs.json');

// Default Acknowledgment Templates for all 5 departments
export const DEFAULT_TEMPLATES: Record<Department, AcknowledgmentTemplate> = {
  operations: {
    id: 'tpl_operations',
    department: 'operations',
    name: 'Operations Inquiries',
    fromName: 'TaskNera Operations',
    fromEmail: 'operations@tasknera.com',
    subjectTemplate: 'Re: {subject} [Ref: #{ticketNumber}]',
    bodyTemplate: `Dear {senderName},

Thank you for contacting TaskNera Operations.

We have received your communication regarding "{subject}" and registered it under Reference #{ticketNumber}. Our team is reviewing the operational requirements and will respond within 24 business hours.

If you have additional context or reference material, simply reply directly to this email to preserve your case thread.

Best regards,
TaskNera Operations Team
TaskNera Solutions | https://tasknera.com
operations@tasknera.com`,
    isActive: true,
    estimatedTurnaroundHours: 24,
    updatedAt: new Date().toISOString()
  },
  careers: {
    id: 'tpl_careers',
    department: 'careers',
    name: 'Careers & Opportunities',
    fromName: 'TaskNera Talent Acquisition',
    fromEmail: 'careers@tasknera.com',
    subjectTemplate: 'Re: {subject} — Application Received [Ref: #{ticketNumber}]',
    bodyTemplate: `Dear {senderName},

Thank you for your interest in joining TaskNera Solutions!

We have safely received your application/inquiry under Reference #{ticketNumber}. Our Talent Acquisition team reviews submissions on a rolling basis. If your background aligns with our open positions, a recruiter will reach out directly to schedule an introductory conversation.

We appreciate your time and enthusiasm for TaskNera.

Warm regards,
TaskNera Talent Acquisition Team
careers@tasknera.com`,
    isActive: true,
    estimatedTurnaroundHours: 48,
    updatedAt: new Date().toISOString()
  },
  hr: {
    id: 'tpl_hr',
    department: 'hr',
    name: 'Human Resources & People Ops',
    fromName: 'TaskNera HR & People Ops',
    fromEmail: 'hr@tasknera.com',
    subjectTemplate: 'Re: {subject} [HR Ref: #{ticketNumber}]',
    bodyTemplate: `Hello {senderName},

Thank you for reaching out to TaskNera People & Human Resources.

This automated confirmation verifies that your inquiry has been received (Reference #{ticketNumber}). Your request has been routed to our People Operations team and will be handled with appropriate confidentiality and care.

We strive to review and reply to all correspondence within 1 business day.

Sincerely,
Human Resources Department
TaskNera Solutions | hr@tasknera.com`,
    isActive: true,
    estimatedTurnaroundHours: 24,
    updatedAt: new Date().toISOString()
  },
  recruitment: {
    id: 'tpl_recruitment',
    department: 'recruitment',
    name: 'Recruitment & Staffing Partnerships',
    fromName: 'TaskNera Recruitment',
    fromEmail: 'recruitment@tasknera.com',
    subjectTemplate: 'Re: {subject} — Recruitment Inquiry [Ref: #{ticketNumber}]',
    bodyTemplate: `Hello {senderName},

Thank you for reaching out to the TaskNera Recruitment & Sourcing Team.

We have received your inquiry regarding talent acquisition and staffing collaboration (Reference #{ticketNumber}). Our recruitment team is reviewing your profile/requirements and will connect with you promptly.

Best regards,
TaskNera Recruitment Team
recruitment@tasknera.com`,
    isActive: true,
    estimatedTurnaroundHours: 24,
    updatedAt: new Date().toISOString()
  },
  support: {
    id: 'tpl_support',
    department: 'support',
    name: 'Customer Support & Help Desk',
    fromName: 'TaskNera Customer Support',
    fromEmail: 'support@tasknera.com',
    subjectTemplate: 'Re: {subject} [Support Ticket #{ticketNumber}]',
    bodyTemplate: `Hi {senderName},

Thank you for reaching out to TaskNera Support.

We have generated Ticket #{ticketNumber} for your request: "{subject}". Our technical and customer support specialists are investigating the details and will provide a status update shortly.

Our standard resolution target is within 4 business hours. You can reply directly to this email to add screenshots, error codes, or additional details.

Kind regards,
TaskNera Support Desk
support@tasknera.com`,
    isActive: true,
    estimatedTurnaroundHours: 4,
    updatedAt: new Date().toISOString()
  }
};

// Memory fallbacks
let inMemoryConversations: InboxConversation[] = [];
let inMemoryMessages: InboxMessage[] = [];
let inMemoryTemplates: Record<Department, AcknowledgmentTemplate> = { ...DEFAULT_TEMPLATES };
let inMemoryLogs: InboxActivityLog[] = [];
let ticketCounter = 1000;

// Initialize JSON files if missing
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// ----------------- TEMPLATES -----------------

export async function getInboxTemplates(): Promise<AcknowledgmentTemplate[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<AcknowledgmentTemplate>('inbox_templates');
      const docs = await col.find({}).toArray();
      if (docs && docs.length > 0) {
        return docs.map(({ _id, ...rest }: any) => rest as AcknowledgmentTemplate);
      }
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB getInboxTemplates failed, falling back to local file:', err);
  }

  try {
    await ensureDataDir();
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }

  return Object.values(inMemoryTemplates);
}

export async function getInboxTemplateByDepartment(dept: Department): Promise<AcknowledgmentTemplate> {
  const templates = await getInboxTemplates();
  const match = templates.find(t => t.department === dept);
  if (match) return match;
  return DEFAULT_TEMPLATES[dept] || DEFAULT_TEMPLATES.operations;
}

export async function saveInboxTemplate(template: AcknowledgmentTemplate): Promise<AcknowledgmentTemplate> {
  const updated: AcknowledgmentTemplate = {
    ...template,
    updatedAt: new Date().toISOString()
  };

  inMemoryTemplates[template.department] = updated;

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_templates');
      await col.updateOne(
        { department: updated.department },
        { $set: updated },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB saveInboxTemplate failed, saving to file:', err);
  }

  try {
    await ensureDataDir();
    const current = await getInboxTemplates();
    const filtered = current.filter(t => t.department !== updated.department);
    filtered.push(updated);
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[InboxDB] File saveInboxTemplate failed:', err);
  }

  return updated;
}

// ----------------- CONVERSATIONS -----------------

export async function readConversations(): Promise<InboxConversation[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<InboxConversation>('inbox_conversations');
      const docs = await col.find({}).sort({ lastMessageTimestamp: -1 }).toArray();
      const loaded = docs.map(({ _id, ...rest }: any) => rest as InboxConversation);
      inMemoryConversations = loaded;
      return loaded;
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB readConversations failed, using file:', err);
  }

  try {
    await ensureDataDir();
    const data = await fs.readFile(CONVERSATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      inMemoryConversations = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }

  return inMemoryConversations;
}

export async function writeConversations(conversations: InboxConversation[]): Promise<void> {
  inMemoryConversations = [...conversations];

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_conversations');
      await col.deleteMany({});
      if (conversations.length > 0) {
        await col.insertMany(conversations as any);
      }
      return;
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB writeConversations failed, falling back to file:', err);
  }

  try {
    await ensureDataDir();
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[InboxDB] File writeConversations failed:', err);
  }
}

export async function getConversationById(id: string): Promise<InboxConversation | null> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<InboxConversation>('inbox_conversations');
      const doc = await col.findOne({ id } as any);
      if (doc) {
        const { _id, ...rest } = doc as any;
        const conv = rest as InboxConversation;
        conv.messages = await getConversationMessages(id);
        return conv;
      }
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB getConversationById failed:', err);
  }

  const all = await readConversations();
  const match = all.find(c => c.id === id);
  if (!match) return null;
  const messages = await getConversationMessages(id);
  return { ...match, messages };
}

export async function saveConversation(conv: InboxConversation): Promise<InboxConversation> {
  const updated: InboxConversation = {
    ...conv,
    updatedAt: new Date().toISOString()
  };

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_conversations');
      // Strip embedded messages array from conversation doc in MongoDB to keep normalized
      const { messages, ...doc } = updated;
      await col.updateOne({ id: updated.id }, { $set: doc }, { upsert: true });
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB saveConversation failed:', err);
  }

  const all = await readConversations();
  const existingIdx = all.findIndex(c => c.id === updated.id);
  if (existingIdx >= 0) {
    all[existingIdx] = updated;
  } else {
    all.unshift(updated);
  }
  await writeConversations(all);

  return updated;
}

// ----------------- MESSAGES -----------------

export async function readMessages(): Promise<InboxMessage[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<InboxMessage>('inbox_messages');
      const docs = await col.find({}).sort({ timestamp: 1 }).toArray();
      const loaded = docs.map(({ _id, ...rest }: any) => rest as InboxMessage);
      inMemoryMessages = loaded;
      return loaded;
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB readMessages failed:', err);
  }

  try {
    await ensureDataDir();
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      inMemoryMessages = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }

  return inMemoryMessages;
}

export async function getConversationMessages(conversationId: string): Promise<InboxMessage[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<InboxMessage>('inbox_messages');
      const docs = await col.find({ conversationId } as any).sort({ timestamp: 1 }).toArray();
      if (docs && docs.length > 0) {
        return docs.map(({ _id, ...rest }: any) => rest as InboxMessage);
      }
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB getConversationMessages failed:', err);
  }

  const all = await readMessages();
  return all.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function saveMessage(msg: InboxMessage): Promise<InboxMessage> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_messages');
      await col.insertOne(msg as any);
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB saveMessage failed:', err);
  }

  const all = await readMessages();
  all.push(msg);
  inMemoryMessages = all;

  try {
    await ensureDataDir();
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[InboxDB] File saveMessage failed:', err);
  }

  return msg;
}

export async function hasMessageBeenProcessed(messageId: string): Promise<boolean> {
  if (!messageId || !messageId.trim()) return false;
  const clean = messageId.trim().toLowerCase();

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_messages');
      const count = await col.countDocuments({
        $or: [
          { messageId: clean },
          { id: clean }
        ]
      } as any);
      if (count > 0) return true;
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB hasMessageBeenProcessed failed:', err);
  }

  const all = await readMessages();
  return all.some(m => m.messageId?.toLowerCase() === clean || m.id.toLowerCase() === clean);
}

// ----------------- CONVERSATION MATCHING & THREADING -----------------

export function normalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(re:\s*|fwd:\s*|fw:\s*|auto:\s*|automatic reply:\s*)+/gi, '')
    .replace(/\[(ref|ticket|support|hr|careers|operations|recruitment)[\s#:]*([a-z0-9-]+)\]/gi, '')
    .trim()
    .toLowerCase();
}

export function extractTicketFromSubject(subject: string): string | null {
  if (!subject) return null;
  const match = subject.match(/(?:ref|ticket|case|inquiry)[\s:#]+(?:#)?(TNK-[0-9]{4,})/i) ||
                subject.match(/#(TNK-[0-9]{4,})/i);
  return match ? match[1].toUpperCase() : null;
}

export async function findConversationByThread(
  inReplyTo?: string,
  references?: string[],
  normalizedSubj?: string,
  senderEmail?: string,
  ticketNumber?: string
): Promise<InboxConversation | null> {
  const conversations = await readConversations();

  // 1. Exact Ticket Number match in subject
  if (ticketNumber) {
    const match = conversations.find(c => c.ticketNumber.toLowerCase() === ticketNumber.toLowerCase());
    if (match) return match;
  }

  // 2. In-Reply-To or References match against previous message IDs
  const allRefs = [
    ...(inReplyTo ? [inReplyTo.trim().toLowerCase()] : []),
    ...(references ? references.map(r => r.trim().toLowerCase()) : [])
  ].filter(Boolean);

  if (allRefs.length > 0) {
    const messages = await readMessages();
    const matchedMessage = messages.find(m =>
      allRefs.includes(m.messageId.toLowerCase()) ||
      (m.id && allRefs.includes(m.id.toLowerCase()))
    );

    if (matchedMessage) {
      const conv = conversations.find(c => c.id === matchedMessage.conversationId);
      if (conv) return conv;
    }
  }

  // 3. Fallback: Normalized subject + same sender email within last 30 days
  if (normalizedSubj && senderEmail) {
    const cleanSender = senderEmail.trim().toLowerCase();
    const cleanSubj = normalizedSubj.trim().toLowerCase();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const match = conversations.find(c => {
      const isSameSender = c.sender.email.trim().toLowerCase() === cleanSender;
      const isSameSubject = c.normalizedSubject.toLowerCase() === cleanSubj;
      const isRecent = new Date(c.lastMessageTimestamp).getTime() >= thirtyDaysAgo;
      return isSameSender && isSameSubject && isRecent;
    });

    if (match) return match;
  }

  return null;
}

// ----------------- TICKET NUMBER COUNTER -----------------

export async function getNextTicketNumber(): Promise<string> {
  const conversations = await readConversations();
  if (conversations.length === 0) {
    return 'TNK-1001';
  }

  let maxNum = 1000;
  for (const c of conversations) {
    const match = c.ticketNumber.match(/TNK-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `TNK-${maxNum + 1}`;
}

// ----------------- ACTIVITY LOGS -----------------

export async function addInboxLog(log: Omit<InboxActivityLog, 'id' | 'timestamp'>): Promise<InboxActivityLog> {
  const fullLog: InboxActivityLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_logs');
      await col.insertOne(fullLog as any);
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB addInboxLog failed:', err);
  }

  inMemoryLogs.unshift(fullLog);
  if (inMemoryLogs.length > 200) {
    inMemoryLogs = inMemoryLogs.slice(0, 200);
  }

  try {
    await ensureDataDir();
    await fs.writeFile(LOGS_FILE, JSON.stringify(inMemoryLogs, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }

  return fullLog;
}

export async function getInboxLogs(limit = 50): Promise<InboxActivityLog[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<InboxActivityLog>('inbox_logs');
      const docs = await col.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
      if (docs && docs.length > 0) {
        return docs.map(({ _id, ...rest }: any) => rest as InboxActivityLog);
      }
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB getInboxLogs failed:', err);
  }

  try {
    await ensureDataDir();
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, limit);
    }
  } catch {
    // ignore
  }

  return inMemoryLogs.slice(0, limit);
}

// ----------------- MAILBOX OVERVIEWS -----------------

const MAILBOXES_FILE = path.join(DATA_DIR, 'inbox_mailboxes.json');
let inMemoryMailboxSettings: Record<string, Partial<MailboxOverview>> = {};

export async function getMailboxOverviews(): Promise<MailboxOverview[]> {
  const conversations = await readConversations();
  const deptList: Department[] = ['operations', 'careers', 'hr', 'recruitment', 'support'];

  // Load custom settings
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_mailboxes');
      const docs = await col.find({}).toArray();
      for (const d of docs) {
        inMemoryMailboxSettings[(d as any).department] = d as any;
      }
    } else {
      const data = await fs.readFile(MAILBOXES_FILE, 'utf-8').catch(() => '');
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object') {
          inMemoryMailboxSettings = parsed;
        }
      }
    }
  } catch {
    // ignore
  }

  return deptList.map(dept => {
    const info = DEPARTMENTS[dept];
    const deptConvs = conversations.filter(c => c.department === dept);
    const unreadCount = deptConvs.filter(c => c.isUnread).length;
    const pendingHumanCount = deptConvs.filter(c => c.status === 'pending_human' || c.status === 'awaiting_team_response').length;
    const autoAckCount = deptConvs.filter(c => c.acknowledgmentStatus === 'sent').length;

    let lastReceivedAt: string | null = null;
    if (deptConvs.length > 0) {
      const sorted = [...deptConvs].sort(
        (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );
      lastReceivedAt = sorted[0].lastMessageTimestamp;
    }

    const custom = inMemoryMailboxSettings[dept] || {};

    return {
      department: dept,
      name: custom.name || info.name,
      email: custom.email || info.email,
      description: custom.description || info.description,
      status: (custom.status as any) || 'connected',
      autoAckEnabled: custom.autoAckEnabled !== false,
      totalConversations: deptConvs.length,
      unreadCount,
      pendingHumanCount,
      autoAckCount,
      lastReceivedAt,
      lastSyncedAt: custom.lastSyncedAt || new Date().toISOString(),
      assignedEmployees: custom.assignedEmployees || []
    };
  });
}

export async function updateMailboxSetting(
  dept: Department,
  updates: Partial<MailboxOverview>
): Promise<MailboxOverview> {
  const current = (await getMailboxOverviews()).find(m => m.department === dept);
  if (!current) {
    throw new Error(`Mailbox for department ${dept} not found`);
  }

  const updated: MailboxOverview = {
    ...current,
    ...updates,
    department: dept
  };

  inMemoryMailboxSettings[dept] = updated;

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('inbox_mailboxes');
      await col.updateOne({ department: dept }, { $set: updated }, { upsert: true });
    }
  } catch (err) {
    console.warn('[InboxDB] MongoDB save mailbox failed:', err);
  }

  try {
    await ensureDataDir();
    await fs.writeFile(MAILBOXES_FILE, JSON.stringify(inMemoryMailboxSettings, null, 2), 'utf-8');
  } catch (err) {
    // ignore
  }

  await addInboxLog({
    department: dept,
    action: 'department_changed',
    title: `Mailbox Settings Updated: ${DEPARTMENTS[dept].name}`,
    description: `Connection status: ${updated.status}, Auto-Ack: ${updated.autoAckEnabled ? 'Enabled' : 'Disabled'}`
  });

  return updated;
}
