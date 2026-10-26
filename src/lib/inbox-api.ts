import {
  Department,
  InboxConversation,
  InboxMessage,
  AcknowledgmentTemplate,
  MailboxOverview,
  InboxActivityLog,
  ConversationStatus,
  InboundEmailPayload
} from '@/types/inbox';

export interface InboxStats {
  total: number;
  unread: number;
  pendingHuman: number;
  responded: number;
  resolved: number;
  autoAckSent: number;
  failedAck: number;
  byDepartment?: Record<Department, number>;
}

export interface FetchConversationsParams {
  department?: string;
  status?: string;
  ackStatus?: string;
  search?: string;
  sort?: 'newest' | 'oldest';
  dateRange?: string; // 'all' | 'today' | '7d' | '30d'
  assignedTo?: string;
}

export class InboxApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'InboxApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      throw new InboxApiError(data.error || `HTTP error ${res.status}`, res.status);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof InboxApiError) throw err;
    throw new InboxApiError(err.message || 'Network request failed');
  }
}

// ----------------- MAILBOXES -----------------

export async function fetchMailboxes(): Promise<MailboxOverview[]> {
  const data = await request<{ success: boolean; mailboxes: MailboxOverview[] }>('/api/inbox/mailboxes');
  return data.mailboxes || [];
}

export async function updateMailbox(
  department: Department,
  updates: Partial<MailboxOverview>
): Promise<MailboxOverview> {
  const data = await request<{ success: boolean; mailbox: MailboxOverview }>('/api/inbox/mailboxes', {
    method: 'PATCH',
    body: JSON.stringify({ department, ...updates })
  });
  return data.mailbox;
}

export async function toggleMailboxConnection(
  department: Department,
  action: 'connect' | 'disconnect' | 'reconnect'
): Promise<MailboxOverview> {
  const data = await request<{ success: boolean; mailbox: MailboxOverview }>('/api/inbox/mailboxes', {
    method: 'POST',
    body: JSON.stringify({ department, action })
  });
  return data.mailbox;
}

// ----------------- CONVERSATIONS -----------------

export async function fetchConversations(params?: FetchConversationsParams): Promise<{
  conversations: InboxConversation[];
  stats: InboxStats;
  count: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.department && params.department !== 'all') searchParams.set('department', params.department);
  if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params?.ackStatus && params.ackStatus !== 'all') searchParams.set('ackStatus', params.ackStatus);
  if (params?.search?.trim()) searchParams.set('search', params.search.trim());
  if (params?.sort) searchParams.set('sort', params.sort);
  if (params?.dateRange && params.dateRange !== 'all') searchParams.set('dateRange', params.dateRange);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const data = await request<{
    success: boolean;
    conversations: InboxConversation[];
    stats: InboxStats;
    count: number;
  }>(`/api/inbox/conversations${query}`);

  return {
    conversations: data.conversations || [],
    stats: data.stats || {
      total: 0,
      unread: 0,
      pendingHuman: 0,
      responded: 0,
      resolved: 0,
      autoAckSent: 0,
      failedAck: 0,
      byDepartment: { operations: 0, careers: 0, hr: 0, recruitment: 0, support: 0 }
    },
    count: data.count || 0
  };
}

export async function fetchConversation(id: string): Promise<InboxConversation> {
  const data = await request<{ success: boolean; conversation: InboxConversation }>(
    `/api/inbox/conversations/${id}`
  );
  return data.conversation;
}

export async function updateConversationStatus(
  id: string,
  status: ConversationStatus
): Promise<InboxConversation> {
  const data = await request<{ success: boolean; conversation: InboxConversation }>(
    `/api/inbox/conversations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }
  );
  return data.conversation;
}

export async function assignConversation(
  id: string,
  assignedTo: string | null
): Promise<InboxConversation> {
  const data = await request<{ success: boolean; conversation: InboxConversation }>(
    `/api/inbox/conversations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo })
    }
  );
  return data.conversation;
}

export async function reassignDepartment(
  id: string,
  department: Department
): Promise<InboxConversation> {
  const data = await request<{ success: boolean; conversation: InboxConversation }>(
    `/api/inbox/conversations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ department })
    }
  );
  return data.conversation;
}

export async function markConversationRead(
  id: string,
  isUnread: boolean
): Promise<InboxConversation> {
  const data = await request<{ success: boolean; conversation: InboxConversation }>(
    `/api/inbox/conversations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isUnread })
    }
  );
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/inbox/conversations/${id}`, {
    method: 'DELETE'
  });
}

// ----------------- HUMAN REPLIES & MANUAL ACTIONS -----------------

export async function sendManualReply(
  id: string,
  replyText: string,
  userName: string,
  userEmail: string
): Promise<InboxMessage> {
  const data = await request<{ success: boolean; message: InboxMessage }>(
    `/api/inbox/conversations/${id}/reply`,
    {
      method: 'POST',
      body: JSON.stringify({ replyText, userName, userEmail })
    }
  );
  return data.message;
}

export async function retryAcknowledgment(id: string): Promise<{ success: boolean; messageId?: string }> {
  return await request<{ success: boolean; messageId?: string }>(
    `/api/inbox/conversations/${id}/acknowledge`,
    { method: 'POST' }
  );
}

// ----------------- TEMPLATES -----------------

export async function fetchTemplates(): Promise<AcknowledgmentTemplate[]> {
  const data = await request<{ success: boolean; templates: AcknowledgmentTemplate[] }>(
    '/api/inbox/templates'
  );
  return data.templates || [];
}

export async function saveTemplate(template: Partial<AcknowledgmentTemplate>): Promise<AcknowledgmentTemplate> {
  const data = await request<{ success: boolean; template: AcknowledgmentTemplate }>(
    '/api/inbox/templates',
    {
      method: 'POST',
      body: JSON.stringify(template)
    }
  );
  return data.template;
}

// ----------------- LOGS & SIMULATOR -----------------

export async function fetchInboxLogs(limit = 50): Promise<InboxActivityLog[]> {
  const data = await request<{ success: boolean; logs: InboxActivityLog[] }>(
    `/api/inbox/logs?limit=${limit}`
  );
  return data.logs || [];
}

export async function simulateInboundEmail(payload: InboundEmailPayload | { presetId: string }): Promise<any> {
  const data = await request<{ success: boolean; simulationResult: any }>('/api/inbox/simulate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.simulationResult;
}
