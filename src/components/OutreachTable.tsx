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
  onSend?: (campaign: OutreachCampaign) => void;
  onScheduleFollowUp?: (campaign: OutreachCampaign) => void;
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
  'Follow-Up 1 Sent',
  'Follow-Up 2 Sent',
  'Follow-Up 3 Sent',
  'Replied',
  'Interested',
  'Meeting Scheduled',
  'Not Interested',
  'Closed',
  'Completed - No Response',
  'Bounced'
];

export function OutreachTable({
  campaigns,
  loading,
  onRefresh,
  onGenerate,
  onPreview,
  onSend,
  onScheduleFollowUp,
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

  const getFollowUpStatus = (c: OutreachCampaign) => {
    const isStopped =
      c.replyStatus === 'Replied' ||
      c.replyStatus === 'Bounced' ||
      c.replyStatus === 'Unsubscribed' ||
      c.status === 'Follow-Up Paused' ||
      c.status === 'Closed' ||
      c.status === 'Completed - No Response';

    if (isStopped) return { isPending: false, stage: null, label: '' };

    const now = new Date();
    if (!c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= now) {
      return { isPending: true, stage: 'followup_1' as const, label: 'Follow-Up 1 Pending' };
    }
    if (c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= now) {
      return { isPending: true, stage: 'followup_2' as const, label: 'Follow-Up 2 Pending' };
    }
    if (c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= now) {
      return { isPending: true, stage: 'followup_3' as const, label: 'Follow-Up 3 Pending' };
    }

    return { isPending: false, stage: null, label: '' };
  };

  const pendingFollowUpsCount = campaigns.filter(c => getFollowUpStatus(c).isPending).length;

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
    if (statusFilter === 'followup_pending') {
      return getFollowUpStatus(c).isPending;
    }
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
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Ready to Send':
        return 'bg-slate-100 text-slate-900 border-slate-300 font-semibold';
      case 'Initial Email Sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Follow-Up Scheduled':
      case 'Follow-Up 1 Sent':
      case 'Follow-Up 2 Sent':
      case 'Follow-Up 3 Sent':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Replied':
      case 'Interested':
      case 'Meeting Scheduled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'Follow-Up Paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Bounced':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'Unsubscribed':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'Completed - No Response':
      case 'Closed':
      case 'Not Interested':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getScheduleSummary = (c: OutreachCampaign) => {
    if (c.replyStatus === 'Bounced' || c.status === 'Bounced') {
      return <span className="text-rose-600 text-xs font-medium">Bounced (Suppressed)</span>;
    }
    if (c.replyStatus === 'Unsubscribed' || c.status === 'Unsubscribed') {
      return <span className="text-purple-600 text-xs font-medium">Unsubscribed</span>;
    }
    if (c.replyStatus === 'Replied') {
      return <span className="text-emerald-600 text-xs font-medium">Replied (Sequence closed)</span>;
    }
    if (c.status === 'Follow-Up Paused') {
      return <span className="text-amber-600 text-xs">Paused</span>;
    }
    if (c.status === 'Completed - No Response') {
      return <span className="text-slate-500 text-xs">Completed (No reply)</span>;
    }

    if (!c.initialSentAt) {
      return <span className="text-slate-400 text-xs">Not sent yet</span>;
    }

    if (!c.followUp1SentAt && c.followUp1ScheduledAt) {
      const isDue = new Date(c.followUp1ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-700 font-medium' : 'text-slate-600'}`}>
          {isDue ? 'Follow-up 1 due' : `Follow-up 1 on ${new Date(c.followUp1ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp2SentAt && c.followUp2ScheduledAt) {
      const isDue = new Date(c.followUp2ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-700 font-medium' : 'text-slate-600'}`}>
          {isDue ? 'Follow-up 2 due' : `Follow-up 2 on ${new Date(c.followUp2ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp3SentAt && c.followUp3ScheduledAt) {
      const isDue = new Date(c.followUp3ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-700 font-medium' : 'text-slate-600'}`}>
          {isDue ? 'Follow-up 3 due' : `Follow-up 3 on ${new Date(c.followUp3ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    return <span className="text-slate-500 text-xs">Initial email delivered</span>;
  };

  return (
    <div className="space-y-3">
      {/* Assigned Leads Banner for Atul / Team */}
      {assignedLeadsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {isAtul ? 'Assigned Leads' : 'Team Assignments'}: {assignedLeadsCount} compan{assignedLeadsCount > 1 ? 'ies' : 'y'} assigned by Admin
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review company details and prepare tailored outreach sequences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'assigned_to_atul' ? 'all' : 'assigned_to_atul')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
              statusFilter === 'assigned_to_atul'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{statusFilter === 'assigned_to_atul' ? 'Show All Leads' : `Filter Assigned (${assignedLeadsCount})`}</span>
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, email, contact, or assigned..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingFollowUpsCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'followup_pending' ? 'all' : 'followup_pending')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'followup_pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              }`}
              title="Click to show companies with pending follow-ups"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingFollowUpsCount} Follow-Up{pendingFollowUpsCount > 1 ? 's' : ''} Pending</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All Records ({campaigns.length})</option>
              {pendingFollowUpsCount > 0 && (
                <option value="followup_pending">
                  ⚡ Follow-Up Pending ({pendingFollowUpsCount})
                </option>
              )}
              {assignedLeadsCount > 0 && (
                <option value="assigned_to_atul">
                  Assigned to {isAtul ? 'Me' : 'Atul'} ({assignedLeadsCount})
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
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-slate-800' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="clean-table w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-medium text-[11px] border-b border-slate-200 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-[220px]">Company &amp; Contact</th>
                <th className="py-2.5 px-4 w-[200px]">Email</th>
                <th className="py-2.5 px-4 min-w-[200px]">Service &amp; Context</th>
                <th className="py-2.5 px-4 w-[160px]">Status</th>
                <th className="py-2.5 px-4 w-[170px]">Next Step</th>
                <th className="py-2.5 px-4 min-w-[200px]">Subject</th>
                <th className="py-2.5 px-4 w-[130px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-slate-800" />
                        <span className="text-slate-600">Loading records...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {statusFilter === 'assigned_to_atul'
                            ? 'No leads currently assigned to Atul'
                            : 'No matching records found'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {statusFilter !== 'all'
                            ? 'Try clearing the filter above.'
                            : 'Click "New Outreach" above to add a company.'}
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
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      {/* Company & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{c.companyName}</span>
                          {c.companyWebsite && (
                            <a
                              href={c.companyWebsite.startsWith('http') ? c.companyWebsite : `https://${c.companyWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {c.assignedTo && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {c.assignedTo}
                            </span>
                          )}
                        </div>
                        {c.recipientName && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {c.recipientName}
                          </span>
                        )}
                        {c.notes && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 italic line-clamp-1" title={c.notes}>
                            Note: {c.notes}
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-mono text-slate-700 text-xs">{c.email}</span>
                          <button
                            type="button"
                            onClick={e => copyToClipboard(c.email, c.id, e)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
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
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            CC: {c.ccEmails}
                          </span>
                        )}
                      </td>

                      {/* Topic & Context */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {c.mailTopic && (
                            <span className="inline-flex items-center w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                              {c.mailTopic}
                            </span>
                          )}
                          <span className="text-slate-600 line-clamp-1 text-xs" title={c.reason}>
                            {c.reason}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        {getFollowUpStatus(c).isPending ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs w-fit">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Follow-Up Pending
                            </span>
                            <select
                              value={c.status}
                              onChange={e => onStatusChange(c.id, e.target.value as OutreachStatus)}
                              className="rounded px-1.5 py-0.5 text-[10px] border border-slate-200 text-slate-600 bg-white cursor-pointer"
                            >
                              {ALL_STATUSES.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <select
                            value={c.status}
                            onChange={e => onStatusChange(c.id, e.target.value as OutreachStatus)}
                            className={`rounded-md px-2 py-1 text-[11px] border font-medium bg-white focus:outline-none cursor-pointer ${getStatusBadge(
                              c.status
                            )}`}
                          >
                            {ALL_STATUSES.map(st => (
                              <option key={st} value={st} className="bg-white text-slate-900">
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Next Step */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          {getScheduleSummary(c)}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4">
                        {c.initialSubject ? (
                          <span className="text-slate-800 font-medium line-clamp-1" title={c.initialSubject}>
                            {c.initialSubject}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Draft pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Actions */}
                          {getFollowUpStatus(c).isPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                const fu = getFollowUpStatus(c);
                                if (fu.stage) onPreview(c, fu.stage);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                              title="Follow-up is pending! Click to send follow-up"
                            >
                              <Send className="h-3 w-3" />
                              Send Follow-Up
                            </button>
                          ) : !c.initialEmailBody ? (
                            <button
                              type="button"
                              onClick={() => onGenerate(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                              title="Write draft email"
                            >
                              <PenTool className="h-3 w-3" />
                              Draft
                            </button>
                          ) : !c.initialSentAt && onScheduleFollowUp ? (
                            <button
                              type="button"
                              onClick={() => onScheduleFollowUp(c)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Put in Follow-ups queue"
                            >
                              <Clock className="h-3 w-3" />
                              Follow-Up
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
                                {onScheduleFollowUp && c.status !== 'Completed - No Response' && c.replyStatus !== 'Replied' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        onScheduleFollowUp(c);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                                    >
                                      <Clock className="h-3 w-3" />
                                      Put in Follow-Ups
                                    </button>
                                  )}
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
