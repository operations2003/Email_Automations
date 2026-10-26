'use client';

import React, { useState, useMemo } from 'react';
import {
  InboxConversation,
  Department,
  DEPARTMENTS,
  ConversationStatus,
  AcknowledgmentStatus
} from '@/types/inbox';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  User,
  Building,
  RotateCcw,
  Send,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Inbox as InboxIcon,
  Eye,
  CornerDownRight,
  Tag,
  ArrowUpDown
} from 'lucide-react';

interface EmailConversationsTabProps {
  conversations: InboxConversation[];
  loading: boolean;
  selectedDept: string;
  onSelectDept: (dept: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenConversation: (conv: InboxConversation) => void;
  onStatusChange: (convId: string, status: ConversationStatus) => void;
  onAssigneeChange?: (convId: string, assignee: string) => void;
  onRefresh: () => void;
}

export function EmailConversationsTab({
  conversations,
  loading,
  selectedDept,
  onSelectDept,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  onOpenConversation,
  onStatusChange,
  onRefresh
}: EmailConversationsTabProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Additional quick filters
  const [ackFilter, setAckFilter] = useState<'all' | 'sent' | 'pending' | 'failed'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Department filter
      if (selectedDept !== 'all' && conv.department !== selectedDept) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const ack = conv.acknowledgmentStatus || conv.ackStatus;
        if (statusFilter === 'unread') {
          if (!conv.isUnread) return false;
        } else if (statusFilter === 'acknowledged') {
          if (ack !== 'sent') return false;
        } else if (statusFilter === 'awaiting_team_response' || statusFilter === 'pending_human') {
          if (conv.status !== 'pending_human' && conv.status !== 'awaiting_team_response') return false;
        } else if (statusFilter === 'responded') {
          if (conv.status !== 'responded' && conv.status !== 'waiting_on_customer') return false;
        } else if (statusFilter === 'resolved') {
          if (conv.status !== 'resolved') return false;
        } else if (conv.status !== statusFilter) {
          return false;
        }
      }

      // Ack status filter
      if (ackFilter !== 'all') {
        const ack = conv.acknowledgmentStatus || conv.ackStatus;
        if (ack !== ackFilter) return false;
      }

      // Search query (sender name, email, company, subject)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const sName = (conv.sender?.name || conv.senderName || '').toLowerCase();
        const sEmail = (conv.sender?.email || conv.senderEmail || '').toLowerCase();
        const sCompany = (conv.sender?.company || conv.companyName || '').toLowerCase();
        const matchesSender = sName.includes(query);
        const matchesEmail = sEmail.includes(query);
        const matchesCompany = sCompany.includes(query);
        const matchesSubject = conv.subject.toLowerCase().includes(query);
        const preview = (conv.lastMessageSnippet || conv.previewText || '').toLowerCase();
        const matchesPreview = preview.includes(query);
        const matchesTicket = (conv.ticketNumber || '').toLowerCase().includes(query);

        if (!matchesSender && !matchesEmail && !matchesCompany && !matchesSubject && !matchesPreview && !matchesTicket) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, selectedDept, statusFilter, ackFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredConversations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedConversations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredConversations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConversations, currentPage, itemsPerPage]);

  // Format date helper
  const formatDateTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoDate;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: ConversationStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            New
          </span>
        );
      case 'pending_human':
      case 'awaiting_team_response':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Awaiting Team
          </span>
        );
      case 'responded':
      case 'waiting_on_customer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Send className="h-3 w-3 text-purple-600" />
            Responded
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'ack_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            Ack Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Ack status badge helper
  const getAckBadge = (ack: AcknowledgmentStatus) => {
    switch (ack) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700" title="Auto-Acknowledgment Sent">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="hidden xl:inline">Ack Sent</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700" title="Acknowledgment Queued / In Progress">
            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="hidden xl:inline">Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700" title="Acknowledgment Delivery Failed">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <span className="hidden xl:inline">Ack Failed</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500" title="Auto-Ack Suppressed (Duplicate / Disabled)">
            <span className="text-[10px]">—</span>
            <span className="hidden xl:inline">Skipped</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by sender, email address, company, or subject..."
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Mailbox:</span>
            <select
              value={selectedDept}
              onChange={e => {
                onSelectDept(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 cursor-pointer shadow-xs"
            >
              <option value="all">All Departments ({conversations.length})</option>
              {(Object.keys(DEPARTMENTS) as Department[]).map(deptKey => (
                <option key={deptKey} value={deptKey}>
                  {DEPARTMENTS[deptKey].name} ({DEPARTMENTS[deptKey].email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium mr-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filter:
          </span>

          {[
            { id: 'all', label: 'All Emails' },
            { id: 'unread', label: 'Unread' },
            { id: 'acknowledged', label: 'Acknowledged' },
            { id: 'awaiting_team_response', label: 'Awaiting Team Response' },
            { id: 'responded', label: 'Responded' },
            { id: 'resolved', label: 'Resolved' }
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onStatusFilterChange(tab.id);
                  setCurrentPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <div className="ml-auto hidden md:flex items-center text-xs text-slate-400 font-medium">
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </div>
        </div>
      </div>

      {/* Email List Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-slate-50/70 rounded-lg">
                <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <InboxIcon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No email conversations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || selectedDept !== 'all'
                ? 'Try adjusting your search query, department selection, or status filters.'
                : 'No incoming departmental emails have arrived yet. Inbound inquiries will appear here automatically.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || selectedDept !== 'all') && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onStatusFilterChange('all');
                  onSelectDept('all');
                  setCurrentPage(1);
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedConversations.map(conv => {
              const deptInfo = DEPARTMENTS[conv.department] || {
                name: conv.department,
                email: `${conv.department}@tasknera.com`,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
              };

              const sName = conv.sender?.name || conv.senderName || 'Inbound Contact';
              const sEmail = conv.sender?.email || conv.senderEmail || '';
              const sCompany = conv.sender?.company || conv.companyName || '';
              const snippet = conv.lastMessageSnippet || conv.previewText || 'No preview text available';
              const sAck = conv.acknowledgmentStatus || conv.ackStatus || 'pending';
              const rDate = conv.createdAt || conv.receivedAt || conv.lastMessageTimestamp || new Date().toISOString();

              return (
                <div
                  key={conv.id}
                  onClick={() => onOpenConversation(conv)}
                  className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/90 transition-colors cursor-pointer ${
                    conv.isUnread ? 'bg-blue-50/20' : 'bg-white'
                  }`}
                >
                  {/* Left Column: Avatar & Sender + Subject Preview */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Unread indicator & Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200">
                        {sName ? sName.charAt(0).toUpperCase() : 'M'}
                      </div>
                      {conv.isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Sender Details & Snippet */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs truncate ${conv.isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                          {sName}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          &lt;{sEmail}&gt;
                        </span>

                        {sCompany && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            <Building className="h-2.5 w-2.5 text-slate-400" />
                            {sCompany}
                          </span>
                        )}

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${deptInfo.badgeClass}`}>
                          {deptInfo.name}
                        </span>

                        {conv.ticketNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{conv.ticketNumber}
                          </span>
                        )}
                      </div>

                      {/* Subject and body snippet */}
                      <div className="flex items-baseline gap-2 text-xs">
                        <span className={`truncate ${conv.isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {conv.subject}
                        </span>
                        <span className="text-slate-400 hidden md:inline shrink-0">—</span>
                        <span className="text-slate-500 truncate hidden md:inline text-[11px]">
                          {snippet}
                        </span>
                      </div>

                      {/* Assigned member info if present */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {conv.assignedTo ? (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <UserCheck className="h-3 w-3 text-slate-400" />
                            Assigned: <span className="font-medium text-slate-700">{conv.assignedTo}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}

                        {conv.messages && conv.messages.length > 1 && (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <CornerDownRight className="h-3 w-3 text-slate-400" />
                            {conv.messages.length} messages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Badges, Ack, and Date */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Ack Status Badge */}
                    <div className="shrink-0">
                      {getAckBadge(sAck)}
                    </div>

                    {/* Conversation Status Badge */}
                    <div className="shrink-0">
                      {getStatusBadge(conv.status)}
                    </div>

                    {/* Received Date/Time */}
                    <div className="text-right shrink-0 min-w-[70px]">
                      <span className={`text-xs block ${conv.isUnread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                        {formatDateTime(rDate)}
                      </span>
                    </div>

                    {/* Quick Action button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenConversation(conv);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View Conversation"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-100 text-xs">
            <div className="text-slate-500">
              Page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-7 w-7 rounded-lg font-semibold transition-colors cursor-pointer ${
                    currentPage === pageNumber
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
