'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OutreachCampaign, OutreachStatus, ReplyStatus } from '@/types/outreach';
import {
  Send,
  Eye,
  RefreshCw,
  Clock,
  Trash2,
  Copy,
  Check,
  FastForward,
  Search,
  ExternalLink,
  MoreVertical,
  MessageSquare,
  PenTool,
  Users,
  UserCheck
} from 'lucide-react';

interface OutreachTableProps {
  campaigns: OutreachCampaign[];
  loading: boolean;
  onRefresh: () => void;
  onGenerate: (campaign: OutreachCampaign) => void;
  onPreview: (campaign: OutreachCampaign, stage?: 'initial' | 'followup_1' | 'followup_2' | 'followup_3') => void;
  onRegenerate: (campaign: OutreachCampaign) => void;
  onSend: (campaign: OutreachCampaign) => void;
  onViewHistory: (campaign: OutreachCampaign) => void;
  onStatusChange: (campaignId: string, newStatus: OutreachStatus) => void;
  onReplyStatusChange: (campaignId: string, newReplyStatus: ReplyStatus) => void;
  onSimulateReply: (campaign: OutreachCampaign) => void;
  onFastForward: (campaign: OutreachCampaign) => void;
  onDelete: (campaignId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  replyFilter: string;
  setReplyFilter: (status: string) => void;
}

export const ALL_STATUSES: OutreachStatus[] = [
  'Draft',
  'Ready to Send',
  'Initial Email Sent',
  'Follow-Up Scheduled',
  'Follow-Up 1 Sent',
  'Follow-Up 2 Sent',
  'Follow-Up 3 Sent',
  'Replied',
  'Interested',
  'Meeting Scheduled',
  'Not Interested',
  'Closed',
  'Completed - No Response',
  'Follow-Up Paused'
];

export function OutreachTable({
  campaigns,
  loading,
  onRefresh,
  onGenerate,
  onPreview,
  onSend,
  onViewHistory,
  onStatusChange,
  onSimulateReply,
  onFastForward,
  onDelete,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter
}: OutreachTableProps) {
  const { user, isAdmin } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isAtul = Boolean(
    user?.email?.toLowerCase().includes('atul') ||
    user?.name?.toLowerCase().includes('atul')
  );

  const assignedLeadsCount = campaigns.filter(
    c => (c.assignedTo && c.assignedTo.toLowerCase().includes('atul')) || (c.assignedTo && c.assignedTo.trim().length > 0)
  ).length;

  const filteredCampaigns = campaigns.filter(c => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCompany = c.companyName.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchContact = c.recipientName?.toLowerCase().includes(q);
      const matchReason = c.reason?.toLowerCase().includes(q);
      const matchAssigned = c.assignedTo?.toLowerCase().includes(q);
      if (!matchCompany && !matchEmail && !matchContact && !matchReason && !matchAssigned) {
        return false;
      }
    }

    // Status / Assignment filter
    if (statusFilter === 'assigned_to_atul' || statusFilter === 'assigned_to_me') {
      return (c.assignedTo && c.assignedTo.toLowerCase().includes('atul')) || (c.assignedTo && c.assignedTo.trim().length > 0);
    }
    if (statusFilter && statusFilter !== 'all') {
      return c.status === statusFilter;
    }

    return true;
  });

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (status: OutreachStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Ready to Send':
        return 'bg-purple-50 text-[#7c3aed] border-purple-200 font-semibold';
      case 'Initial Email Sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Follow-Up Scheduled':
      case 'Follow-Up 1 Sent':
      case 'Follow-Up 2 Sent':
      case 'Follow-Up 3 Sent':
        return 'bg-purple-50 text-[#7c3aed] border-purple-200';
      case 'Replied':
      case 'Interested':
      case 'Meeting Scheduled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'Follow-Up Paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed - No Response':
      case 'Closed':
      case 'Not Interested':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScheduleSummary = (c: OutreachCampaign) => {
    if (c.replyStatus === 'Replied') {
      return <span className="text-emerald-600 text-xs font-medium">Got reply (Stopped)</span>;
    }
    if (c.status === 'Follow-Up Paused') {
      return <span className="text-amber-600 text-xs">Paused</span>;
    }
    if (c.status === 'Completed - No Response') {
      return <span className="text-gray-500 text-xs">Finished (No reply)</span>;
    }

    if (!c.initialSentAt) {
      return <span className="text-gray-400 text-xs">Not sent yet</span>;
    }

    if (!c.followUp1SentAt && c.followUp1ScheduledAt) {
      const isDue = new Date(c.followUp1ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
          {isDue ? 'Follow-up 1 due today' : `Follow-up 1 on ${new Date(c.followUp1ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp2SentAt && c.followUp2ScheduledAt) {
      const isDue = new Date(c.followUp2ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
          {isDue ? 'Follow-up 2 due today' : `Follow-up 2 on ${new Date(c.followUp2ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp3SentAt && c.followUp3ScheduledAt) {
      const isDue = new Date(c.followUp3ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
          {isDue ? 'Final follow-up due today' : `Final follow-up on ${new Date(c.followUp3ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    return <span className="text-gray-500 text-xs">First email sent</span>;
  };

  return (
    <div className="space-y-3">
      {/* Assigned Leads Banner for Atul / Team */}
      {assignedLeadsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {isAtul ? 'Welcome Atul!' : 'Team Queue:'} You have {assignedLeadsCount} company lead{assignedLeadsCount > 1 ? 's' : ''} assigned by Admin
              </p>
              <p className="text-[11px] text-indigo-300/80 mt-0.5">
                Ready for you to generate draft emails and reach out.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'assigned_to_atul' ? 'all' : 'assigned_to_atul')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'assigned_to_atul'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 border border-indigo-500/30'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{statusFilter === 'assigned_to_atul' ? 'Show All Leads' : `View Assigned Leads (${assignedLeadsCount})`}</span>
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, email, contact, or assigned..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl bg-gray-50 border border-gray-200 py-1.5 px-3 text-xs text-gray-800 focus:bg-white focus:border-[#7c3aed] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All ({campaigns.length})</option>
              {assignedLeadsCount > 0 && (
                <option value="assigned_to_atul" className="text-indigo-400 font-semibold bg-[#14171c]">
                  👤 Assigned to {isAtul ? 'Me' : 'Atul'} ({assignedLeadsCount})
                </option>
              )}
              {ALL_STATUSES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#7c3aed]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="clean-table w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold text-[11px] border-b border-gray-200 uppercase tracking-wider">
                <th className="py-3 px-4 w-[220px]">Company & Contact</th>
                <th className="py-3 px-4 w-[220px]">Email</th>
                <th className="py-3 px-4 min-w-[220px]">Topic & Context</th>
                <th className="py-3 px-4 w-[160px]">Status</th>
                <th className="py-3 px-4 w-[180px]">Next Step</th>
                <th className="py-3 px-4 min-w-[220px]">Subject</th>
                <th className="py-3 px-4 w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#7c3aed]" />
                        <span className="text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {statusFilter === 'assigned_to_atul'
                            ? 'No leads currently assigned to Atul'
                            : 'No matching emails found'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {statusFilter !== 'all'
                            ? 'Try clearing the filter above.'
                            : 'Click "New Email" above to start.'}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const isMenuOpen = openMenuId === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onPreview(c)}
                      className="cursor-pointer transition-colors hover:bg-purple-50/30"
                    >
                      {/* Company & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900">{c.companyName}</span>
                          {c.companyWebsite && (
                            <a
                              href={c.companyWebsite.startsWith('http') ? c.companyWebsite : `https://${c.companyWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-gray-400 hover:text-[#7c3aed] transition-colors"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {c.assignedTo && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              👤 {c.assignedTo}
                            </span>
                          )}
                        </div>
                        {c.recipientName && (
                          <span className="text-[11px] text-gray-500 block mt-0.5">
                            {c.recipientName}
                          </span>
                        )}
                        {c.notes && (
                          <span className="text-[10px] text-indigo-300/80 block mt-0.5 italic line-clamp-1" title={c.notes}>
                            Note: {c.notes}
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-mono text-gray-700 text-xs">{c.email}</span>
                          <button
                            type="button"
                            onClick={e => copyToClipboard(c.email, c.id, e)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                            title="Copy email"
                          >
                            {copiedId === c.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                        {c.ccEmails && (
                          <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                            CC: {c.ccEmails}
                          </span>
                        )}
                      </td>

                      {/* Topic & Context */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {c.mailTopic && (
                            <span className="inline-flex items-center w-fit rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-[#7c3aed] border border-purple-200">
                              {c.mailTopic}
                            </span>
                          )}
                          <span className="text-gray-700 line-clamp-1 text-xs" title={c.reason}>
                            {c.reason}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={e => onStatusChange(c.id, e.target.value as OutreachStatus)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] border font-semibold bg-white focus:outline-none cursor-pointer ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {ALL_STATUSES.map(st => (
                            <option key={st} value={st} className="bg-white text-gray-900">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Next Step */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                          {getScheduleSummary(c)}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        {c.initialSubject ? (
                          <span className="text-gray-800 font-medium line-clamp-1" title={c.initialSubject}>
                            {c.initialSubject}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Not written yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Write or Send */}
                          {!c.initialEmailBody ? (
                            <button
                              type="button"
                              onClick={() => onGenerate(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Write draft email"
                            >
                              <PenTool className="h-3 w-3" />
                              Write
                            </button>
                          ) : !c.initialSentAt ? (
                            <button
                              type="button"
                              onClick={() => onSend(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Send email now"
                            >
                              <Send className="h-3 w-3" />
                              Send
                            </button>
                          ) : null}

                          {/* View */}
                          <button
                            type="button"
                            onClick={() => onPreview(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                            title="View email"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* History */}
                          <button
                            type="button"
                            onClick={() => onViewHistory(c)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                            title="History"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>

                          {/* More */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : c.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                              title="More"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-gray-200 shadow-xl py-1 z-50 text-left">
                                {c.initialSentAt && c.status !== 'Completed - No Response' && c.replyStatus !== 'Replied' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onFastForward(c);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                  >
                                    <FastForward className="h-3 w-3" />
                                    Skip 2 days ahead
                                  </button>
                                )}

                                {c.replyStatus !== 'Replied' && c.initialSentAt && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onSimulateReply(c);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                    Mark as replied
                                  </button>
                                )}

                                {c.initialEmailBody && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      setOpenMenuId(null);
                                      const text = c.initialSubject
                                        ? `Subject: ${c.initialSubject}\n\n${c.initialEmailBody}`
                                        : c.initialEmailBody;
                                      copyToClipboard(text, `mail_${c.id}`, e);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3 w-3" />
                                    Copy Mail
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDelete(c.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
