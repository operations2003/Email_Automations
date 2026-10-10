'use client';

import React, { useState } from 'react';
import { OutreachCampaign, OutreachStatus, ReplyStatus } from '@/types/outreach';
import {
  Sparkles,
  Send,
  Eye,
  RefreshCw,
  MessageSquare,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Pause,
  Play,
  FastForward,
  ChevronDown,
  Filter,
  Search,
  ExternalLink
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
  'Follow-Up 1 Sent',
  'Follow-Up 2 Sent',
  'Follow-Up 3 Sent',
  'Replied',
  'Interested',
  'Meeting Scheduled',
  'Not Interested',
  'Closed',
  'Completed - No Response'
];

export function OutreachTable({
  campaigns,
  loading,
  onRefresh,
  onGenerate,
  onPreview,
  onRegenerate,
  onSend,
  onViewHistory,
  onStatusChange,
  onReplyStatusChange,
  onSimulateReply,
  onFastForward,
  onDelete,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  replyFilter,
  setReplyFilter
}: OutreachTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status: OutreachStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Ready to Send':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Initial Email Sent':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Follow-Up Scheduled':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Follow-Up 1 Sent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Follow-Up 2 Sent':
        return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30';
      case 'Follow-Up 3 Sent':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'Replied':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold';
      case 'Interested':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-bold';
      case 'Meeting Scheduled':
        return 'bg-teal-500/20 text-teal-300 border-teal-400/40 font-bold';
      case 'Completed - No Response':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
      case 'Follow-Up Paused':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Closed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getReplyStatusBadge = (replyStatus: ReplyStatus) => {
    switch (replyStatus) {
      case 'Replied':
      case 'Interested':
      case 'Meeting Requested':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold';
      case 'Bounced':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700/60';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by company, email, subject, or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 py-1.5 px-2.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses ({campaigns.length})</option>
              {ALL_STATUSES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Reply Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Reply:</span>
            <select
              value={replyFilter}
              onChange={e => setReplyFilter(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-800 py-1.5 px-2.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Reply States</option>
              <option value="Not Replied">Not Replied</option>
              <option value="Replied">Replied</option>
              <option value="Interested">Interested</option>
              <option value="Meeting Requested">Meeting Requested</option>
              <option value="Bounced">Bounced</option>
            </select>
          </div>
        </div>

        {/* Counter and Refresh */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{campaigns.length}</strong> records
          </span>
          <button
            onClick={onRefresh}
            title="Refresh Table"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="relative rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-xl overflow-x-auto max-w-full">
        <table className="sheet-table w-full text-left text-xs border-collapse whitespace-nowrap min-w-[2100px]">
          {/* Header Row */}
          <thead>
            <tr className="bg-slate-900/90 text-slate-300 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800 sticky top-0 z-20 backdrop-blur-sm">
              <th className="py-3 px-3 w-12 text-center text-slate-500">#</th>
              <th className="py-3 px-3 min-w-[100px]">1. Date</th>
              <th className="py-3 px-4 min-w-[190px]">2. Company Name</th>
              <th className="py-3 px-4 min-w-[180px]">3. Email Address</th>
              <th className="py-3 px-3 min-w-[140px]">4. Keep in CC</th>
              <th className="py-3 px-4 min-w-[240px]">5. Reason for Email</th>
              <th className="py-3 px-4 min-w-[230px]">6. Subject</th>
              <th className="py-3 px-4 min-w-[210px]">7. Email Template</th>
              <th className="py-3 px-3 min-w-[160px]">8. Status</th>
              <th className="py-3 px-3 min-w-[130px]">9. Initial Sent At</th>
              <th className="py-3 px-3 min-w-[160px]">10. Follow-Up 1</th>
              <th className="py-3 px-3 min-w-[120px]">11. FU 1 Date</th>
              <th className="py-3 px-3 min-w-[160px]">12. Follow-Up 2</th>
              <th className="py-3 px-3 min-w-[120px]">13. FU 2 Date</th>
              <th className="py-3 px-3 min-w-[160px]">14. Follow-Up 3</th>
              <th className="py-3 px-3 min-w-[120px]">15. FU 3 Date</th>
              <th className="py-3 px-3 min-w-[130px]">16. Reply Status</th>
              <th className="py-3 px-4 min-w-[190px]">17. Last Activity</th>
              <th className="py-3 px-4 min-w-[260px] sticky right-0 bg-slate-900/95 z-30 shadow-[-8px_0_12px_rgba(0,0,0,0.3)]">
                18. Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={19} className="py-12 text-center text-slate-500 font-sans">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                      Loading outreach records...
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-400">No campaigns match your filters</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try resetting filters or click "+ Add Company" to start outreach.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              campaigns.map((c, index) => {
                const isDueToday =
                  (!c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= new Date()) ||
                  (c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= new Date()) ||
                  (c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= new Date());

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors font-sans ${
                      isDueToday ? 'bg-amber-950/10 hover:bg-amber-900/20' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-slate-500 text-xs font-mono">{index + 1}</td>

                    {/* 1. Date */}
                    <td className="py-2.5 px-3 text-slate-400 text-xs font-mono">{formatDate(c.createdAt)}</td>

                    {/* 2. Company Name */}
                    <td className="py-2.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[170px]" title={c.companyName}>
                          {c.companyName}
                        </span>
                        {c.companyWebsite && (
                          <a
                            href={c.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-indigo-400"
                            title="Visit website"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {c.recipientName && (
                        <span className="text-[11px] font-normal text-slate-400 block truncate">
                          {c.recipientName}
                        </span>
                      )}
                    </td>

                    {/* 3. Email Address */}
                    <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-1.5 group">
                        <span className="truncate max-w-[150px]" title={c.email}>
                          {c.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.email, `email_${c.id}`)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="Copy email"
                        >
                          {copiedId === `email_${c.id}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 4. Keep in CC */}
                    <td className="py-2.5 px-3 text-slate-400 text-xs font-mono truncate max-w-[140px]" title={c.ccEmails || 'None'}>
                      {c.ccEmails || <span className="text-slate-600">—</span>}
                    </td>

                    {/* 5. Reason for Email */}
                    <td className="py-2.5 px-4 text-slate-300 text-xs">
                      <div
                        className="truncate max-w-[230px] cursor-pointer hover:text-indigo-300 transition-colors"
                        title={c.reason}
                        onClick={() => onPreview(c)}
                      >
                        {c.reason}
                      </div>
                    </td>

                    {/* 6. Subject */}
                    <td className="py-2.5 px-4 text-xs">
                      {c.initialSubject ? (
                        <div
                          className="truncate max-w-[220px] font-medium text-indigo-300 cursor-pointer hover:underline"
                          title={c.initialSubject}
                          onClick={() => onPreview(c)}
                        >
                          {c.initialSubject}
                        </div>
                      ) : (
                        <button
                          onClick={() => onGenerate(c)}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate Subject
                        </button>
                      )}
                    </td>

                    {/* 7. Email Template */}
                    <td className="py-2.5 px-4 text-xs">
                      {c.initialEmailBody ? (
                        <div
                          className="truncate max-w-[200px] text-slate-400 cursor-pointer hover:text-slate-200"
                          title={c.initialEmailBody}
                          onClick={() => onPreview(c)}
                        >
                          {c.initialEmailBody.replace(/\n/g, ' ')}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Not generated yet</span>
                      )}
                    </td>

                    {/* 8. Status */}
                    <td className="py-2.5 px-3">
                      <div className="relative group">
                        <select
                          value={c.status}
                          onChange={e => onStatusChange(c.id, e.target.value as OutreachStatus)}
                          className={`appearance-none cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium border focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-5 ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {ALL_STATUSES.map(st => (
                            <option key={st} value={st} className="bg-slate-900 text-slate-200">
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3 w-3 text-slate-400" />
                      </div>
                    </td>

                    {/* 9. Initial Email Sent At */}
                    <td className="py-2.5 px-3 text-xs font-mono text-slate-400">
                      {c.initialSentAt ? formatDateTime(c.initialSentAt) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* 10. Follow-Up 1 */}
                    <td className="py-2.5 px-3 text-xs">
                      {c.followUp1Subject ? (
                        <span
                          className="truncate max-w-[150px] block cursor-pointer hover:text-indigo-300"
                          title={c.followUp1Subject}
                          onClick={() => onPreview(c, 'followup_1')}
                        >
                          {c.followUp1Subject}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 11. Follow-Up 1 Date */}
                    <td className="py-2.5 px-3 text-xs font-mono">
                      {c.followUp1SentAt ? (
                        <span className="text-emerald-400" title={`Sent: ${formatDateTime(c.followUp1SentAt)}`}>
                          ✓ {formatDate(c.followUp1SentAt)}
                        </span>
                      ) : c.followUp1ScheduledAt ? (
                        <span className="text-cyan-400" title={`Scheduled: ${formatDateTime(c.followUp1ScheduledAt)}`}>
                          📅 {formatDate(c.followUp1ScheduledAt)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 12. Follow-Up 2 */}
                    <td className="py-2.5 px-3 text-xs">
                      {c.followUp2Subject ? (
                        <span
                          className="truncate max-w-[150px] block cursor-pointer hover:text-indigo-300"
                          title={c.followUp2Subject}
                          onClick={() => onPreview(c, 'followup_2')}
                        >
                          {c.followUp2Subject}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 13. Follow-Up 2 Date */}
                    <td className="py-2.5 px-3 text-xs font-mono">
                      {c.followUp2SentAt ? (
                        <span className="text-emerald-400" title={`Sent: ${formatDateTime(c.followUp2SentAt)}`}>
                          ✓ {formatDate(c.followUp2SentAt)}
                        </span>
                      ) : c.followUp2ScheduledAt ? (
                        <span className="text-cyan-400" title={`Scheduled: ${formatDateTime(c.followUp2ScheduledAt)}`}>
                          📅 {formatDate(c.followUp2ScheduledAt)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 14. Follow-Up 3 */}
                    <td className="py-2.5 px-3 text-xs">
                      {c.followUp3Subject ? (
                        <span
                          className="truncate max-w-[150px] block cursor-pointer hover:text-indigo-300"
                          title={c.followUp3Subject}
                          onClick={() => onPreview(c, 'followup_3')}
                        >
                          {c.followUp3Subject}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 15. Follow-Up 3 Date */}
                    <td className="py-2.5 px-3 text-xs font-mono">
                      {c.followUp3SentAt ? (
                        <span className="text-emerald-400" title={`Sent: ${formatDateTime(c.followUp3SentAt)}`}>
                          ✓ {formatDate(c.followUp3SentAt)}
                        </span>
                      ) : c.followUp3ScheduledAt ? (
                        <span className="text-cyan-400" title={`Scheduled: ${formatDateTime(c.followUp3ScheduledAt)}`}>
                          📅 {formatDate(c.followUp3ScheduledAt)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 16. Reply Status */}
                    <td className="py-2.5 px-3">
                      <select
                        value={c.replyStatus}
                        onChange={e => onReplyStatusChange(c.id, e.target.value as ReplyStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] border focus:outline-none ${getReplyStatusBadge(
                          c.replyStatus
                        )}`}
                      >
                        <option value="Not Replied" className="bg-slate-900 text-slate-300">
                          Not Replied
                        </option>
                        <option value="Replied" className="bg-slate-900 text-emerald-300 font-bold">
                          Replied
                        </option>
                        <option value="Interested" className="bg-slate-900 text-emerald-300 font-bold">
                          Interested
                        </option>
                        <option value="Meeting Requested" className="bg-slate-900 text-teal-300">
                          Meeting Requested
                        </option>
                        <option value="Bounced" className="bg-slate-900 text-rose-300">
                          Bounced
                        </option>
                      </select>
                    </td>

                    {/* 17. Last Activity */}
                    <td className="py-2.5 px-4 text-xs text-slate-300">
                      <div className="truncate max-w-[180px]" title={c.lastActivity}>
                        {c.lastActivity}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {formatDateTime(c.lastActivityTimestamp || c.updatedAt)}
                      </span>
                    </td>

                    {/* 18. Actions (Sticky column on right) */}
                    <td className="py-2.5 px-4 sticky right-0 bg-slate-950/95 z-30 shadow-[-8px_0_12px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center gap-1.5">
                        {/* Generate if no initial email */}
                        {!c.initialEmailBody ? (
                          <button
                            onClick={() => onGenerate(c)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors"
                            title="Generate AI email and subject"
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate
                          </button>
                        ) : !c.initialSentAt ? (
                          /* Send Initial */
                          <button
                            onClick={() => onSend(c)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors"
                            title="Send Initial Email and Schedule 3 Follow-Ups"
                          >
                            <Send className="h-3 w-3" />
                            Send
                          </button>
                        ) : null}

                        {/* Preview */}
                        <button
                          onClick={() => onPreview(c)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Preview Email"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Regenerate Fresh Variation */}
                        <button
                          onClick={() => onRegenerate(c)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Regenerate with fresh AI variation"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>

                        {/* View History */}
                        <button
                          onClick={() => onViewHistory(c)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                          title="View Conversation & History"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>

                        {/* Fast Forward +2 Days (Simulation tool) */}
                        {c.initialSentAt && c.status !== 'Completed - No Response' && c.replyStatus !== 'Replied' && (
                          <button
                            onClick={() => onFastForward(c)}
                            className="p-1 rounded hover:bg-slate-800 text-amber-400/80 hover:text-amber-300 transition-colors"
                            title="Fast Forward Schedule +2 Days (Simulate time)"
                          >
                            <FastForward className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Simulate Reply (Verifies stop logic) */}
                        {c.replyStatus !== 'Replied' && c.initialSentAt && (
                          <button
                            onClick={() => onSimulateReply(c)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium transition-colors"
                            title="Simulate Inbound Reply (Immediately stops follow-ups)"
                          >
                            Sim Reply
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(c.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
  );
}
