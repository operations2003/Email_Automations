'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  InboxConversation,
  Department,
  DEPARTMENTS,
  MailboxOverview,
  InboxActivityLog
} from '@/types/inbox';
import { InboxConversationModal } from './InboxConversationModal';
import { InboxTemplatesModal } from './InboxTemplatesModal';
import { SimulateInboundModal } from './SimulateInboundModal';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Play,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  User,
  ArrowUpDown,
  Building,
  Activity,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Inbox,
  Send,
  Zap,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface InboxAutomationViewProps {
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function InboxAutomationView({ onToast }: InboxAutomationViewProps) {
  const { user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxOverview[]>([]);
  const [logs, setLogs] = useState<InboxActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ackFilter, setAckFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'me' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pendingHuman: 0,
    resolved: 0,
    autoAckSent: 0
  });

  // Modals
  const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'logs'>('conversations');

  // Fetch conversations and stats
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== 'all') params.set('department', selectedDept);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (ackFilter !== 'all') params.set('ackStatus', ackFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('sort', sortOrder);

      const res = await fetch(`/api/inbox/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (data.stats) {
          setStats({
            total: data.stats.total || 0,
            unread: data.stats.unread || 0,
            pendingHuman: data.stats.pendingHuman || 0,
            resolved: data.stats.resolved || 0,
            autoAckSent: data.stats.autoAckSent || 0
          });
        }
      }
    } catch {
      onToast('Failed to load inbox conversations', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDept, statusFilter, ackFilter, searchQuery, sortOrder, onToast]);

  // Fetch Mailboxes Overview
  const fetchMailboxes = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/mailboxes');
      const data = await res.json();
      if (data.success) {
        setMailboxes(data.mailboxes);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Activity Logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/logs?limit=40');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchMailboxes();
    fetchLogs();

    // Auto-refresh every 25 seconds
    const interval = setInterval(() => {
      fetchConversations(true);
      fetchMailboxes();
      fetchLogs();
    }, 25000);

    return () => clearInterval(interval);
  }, [fetchConversations, fetchMailboxes, fetchLogs]);

  // Open single conversation detail
  const handleOpenConversation = async (conv: InboxConversation) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
        // mark locally as read
        setConversations(prev =>
          prev.map(c => (c.id === conv.id ? { ...c, isUnread: false } : c))
        );
      } else {
        setSelectedConversation(conv);
      }
    } catch {
      setSelectedConversation(conv);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Inbox Automation &amp; Auto-Acknowledgment
                {stats.unread > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                    {stats.unread} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">
                Multi-mailbox inbound ingestion, department routing, anti-spam filters &amp; automated 1-to-1 reply acknowledgments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => fetchConversations()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-slate-600" />
              <span>Templates</span>
            </button>
          )}

          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Simulate Inbound</span>
          </button>
        </div>
      </div>

      {/* Connected Mailbox Overview Cards (5 Departments) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(DEPARTMENTS) as Department[]).map(deptKey => {
          const info = DEPARTMENTS[deptKey];
          const mailbox = mailboxes.find(m => m.department === deptKey);
          const isSelected = selectedDept === deptKey;

          return (
            <button
              key={deptKey}
              onClick={() => setSelectedDept(isSelected ? 'all' : deptKey)}
              className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-white border-slate-900 ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                  {info.name}
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
              </div>

              <div className="text-xs font-mono text-slate-400 truncate mb-2">
                {info.email}
              </div>

              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <div>
                  <span className="text-lg font-bold text-slate-900">
                    {mailbox ? mailbox.totalConversations : 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Total Threads</span>
                </div>
                {mailbox && mailbox.pendingHumanCount > 0 && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    {mailbox.pendingHumanCount} pending
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-500">Total Inquiries</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-l border-slate-200/80">
          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold text-amber-800">{stats.pendingHuman}</div>
            <div className="text-[11px] text-slate-500">Pending Team Response</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-l border-slate-200/80">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold text-emerald-800">{stats.autoAckSent}</div>
            <div className="text-[11px] text-slate-500">Auto-Ack Dispatched</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 border-l border-slate-200/80">
          <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">{stats.resolved}</div>
            <div className="text-[11px] text-slate-500">Resolved Threads</div>
          </div>
        </div>
      </div>

      {/* Main Tabs (Conversations vs Activity Logs) */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'conversations'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Incoming Conversations
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {conversations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Audit Activity Logs
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'conversations' ? (
        <>
          {/* Controls Bar: Search, Department Pills, Status Dropdowns */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject, sender name, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Departments</option>
                <option value="operations">Operations</option>
                <option value="careers">Careers</option>
                <option value="hr">Human Resources</option>
                <option value="recruitment">Recruitment</option>
                <option value="support">Support</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending_human">Pending Team Action</option>
                <option value="waiting_on_customer">Waiting on Sender</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam / Bot</option>
              </select>

              {/* Auto-Ack Filter */}
              <select
                value={ackFilter}
                onChange={e => setAckFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Ack Statuses</option>
                <option value="sent">Auto-Ack Sent</option>
                <option value="skipped">Auto-Ack Skipped</option>
                <option value="pending">Auto-Ack Pending</option>
                <option value="failed">Auto-Ack Failed</option>
              </select>

              {/* Assignee Filter */}
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value as any)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Assignees</option>
                <option value="me">Assigned to Me ({user?.name || 'My Queue'})</option>
                <option value="unassigned">Unassigned</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                title={`Sorted by ${sortOrder}`}
              >
                <ArrowUpDown className="h-3 w-3 text-slate-500" />
                <span className="capitalize">{sortOrder}</span>
              </button>
            </div>
          </div>

          {/* Conversations Table List */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                <p className="text-xs">Loading incoming conversations...</p>
              </div>
            ) : conversations.filter(c => {
                if (assigneeFilter === 'me') {
                  return c.assignedTo === user?.name || c.assignedTo === user?.email;
                }
                if (assigneeFilter === 'unassigned') {
                  return !c.assignedTo;
                }
                return true;
              }).length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-700">No conversations found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing your filters or click <strong>Simulate Inbound</strong> to test an incoming email!
                </p>
                <button
                  onClick={() => setIsSimulateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Simulate First Inbound Email
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations
                  .filter(c => {
                    if (assigneeFilter === 'me') {
                      return c.assignedTo === user?.name || c.assignedTo === user?.email;
                    }
                    if (assigneeFilter === 'unassigned') {
                      return !c.assignedTo;
                    }
                    return true;
                  })
                  .map(conv => {
                    const deptInfo = DEPARTMENTS[conv.department] || DEPARTMENTS.operations;
                    return (
                      <div
                      key={conv.id}
                      onClick={() => handleOpenConversation(conv)}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        conv.isUnread ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Left: Indicator, Ticket, Department, Sender, Subject */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Unread dot */}
                        <div className="pt-1.5">
                          {conv.isUnread ? (
                            <span className="block h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                          ) : (
                            <span className="block h-2 w-2 rounded-full bg-transparent" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                              {conv.ticketNumber}
                            </span>

                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${deptInfo.badgeClass}`}>
                              {deptInfo.name}
                            </span>

                            <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                              {conv.sender.name || conv.sender.email}
                            </span>

                            {conv.sender.company && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                • {conv.sender.company}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {conv.subject}
                          </div>

                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {conv.lastMessageSnippet}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Timestamps */}
                      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                        {/* Auto-Ack Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            conv.acknowledgmentStatus === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : conv.acknowledgmentStatus === 'skipped'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : conv.acknowledgmentStatus === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {conv.acknowledgmentStatus === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                          {conv.acknowledgmentStatus === 'skipped' && <ShieldAlert className="h-3 w-3" />}
                          {conv.acknowledgmentStatus === 'failed' && <AlertCircle className="h-3 w-3" />}
                          Ack: {conv.acknowledgmentStatus}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            conv.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : conv.status === 'pending_human'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : conv.status === 'waiting_on_customer'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {conv.status === 'pending_human'
                            ? 'Needs Action'
                            : conv.status === 'waiting_on_customer'
                            ? 'Waiting'
                            : conv.status === 'resolved'
                            ? 'Resolved'
                            : 'Spam'}
                        </span>

                        {/* Message Count */}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {conv.messageCount} msg{conv.messageCount === 1 ? '' : 's'}
                        </span>

                        {/* Timestamp */}
                        <span className="text-[11px] text-slate-400 min-w-[70px] text-right">
                          {new Date(conv.lastMessageTimestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>

                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Audit Activity Logs Tab */
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-600" />
              Inbound &amp; Auto-Acknowledgment Event Audit Trail
            </span>
            <button
              onClick={fetchLogs}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Logs
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit logs captured yet. Incoming email events will stream here in real time.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {logs.map(log => {
                const deptInfo = DEPARTMENTS[log.department] || DEPARTMENTS.operations;
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {log.ticketNumber && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                            {log.ticketNumber}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${deptInfo.badgeClass}`}>
                          {deptInfo.name}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {log.title}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {log.description}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Conversation Thread Modal */}
      {selectedConversation && (
        <InboxConversationModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onRefresh={() => fetchConversations()}
          onToast={onToast}
          currentUser={user || undefined}
        />
      )}

      {/* Templates Modal */}
      {isTemplatesModalOpen && (
        <InboxTemplatesModal
          onClose={() => setIsTemplatesModalOpen(false)}
          onToast={onToast}
        />
      )}

      {/* Simulator Modal */}
      {isSimulateModalOpen && (
        <SimulateInboundModal
          onClose={() => setIsSimulateModalOpen(false)}
          onSuccess={() => {
            fetchConversations();
            fetchMailboxes();
            fetchLogs();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
