'use client';

import React, { useState } from 'react';
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
  PenTool
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (status: OutreachStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-800 text-gray-300 border-gray-700';
      case 'Ready to Send':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Initial Email Sent':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Follow-Up Scheduled':
      case 'Follow-Up 1 Sent':
      case 'Follow-Up 2 Sent':
      case 'Follow-Up 3 Sent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Replied':
      case 'Interested':
      case 'Meeting Scheduled':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium';
      case 'Follow-Up Paused':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Completed - No Response':
      case 'Closed':
      case 'Not Interested':
        return 'bg-gray-800/80 text-gray-400 border-gray-700/60';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getScheduleSummary = (c: OutreachCampaign) => {
    if (c.replyStatus === 'Replied') {
      return <span className="text-emerald-400 text-xs">Got reply (Stopped)</span>;
    }
    if (c.status === 'Follow-Up Paused') {
      return <span className="text-amber-400 text-xs">Paused</span>;
    }
    if (c.status === 'Completed - No Response') {
      return <span className="text-gray-400 text-xs">Finished (No reply)</span>;
    }

    if (!c.initialSentAt) {
      return <span className="text-gray-400 text-xs">Not sent yet</span>;
    }

    if (!c.followUp1SentAt && c.followUp1ScheduledAt) {
      const isDue = new Date(c.followUp1ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-400 font-medium' : 'text-gray-300'}`}>
          {isDue ? 'Follow-up 1 due today' : `Follow-up 1 on ${new Date(c.followUp1ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp2SentAt && c.followUp2ScheduledAt) {
      const isDue = new Date(c.followUp2ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-400 font-medium' : 'text-gray-300'}`}>
          {isDue ? 'Follow-up 2 due today' : `Follow-up 2 on ${new Date(c.followUp2ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    if (!c.followUp3SentAt && c.followUp3ScheduledAt) {
      const isDue = new Date(c.followUp3ScheduledAt) <= new Date();
      return (
        <span className={`text-xs ${isDue ? 'text-amber-400 font-medium' : 'text-gray-300'}`}>
          {isDue ? 'Final follow-up due today' : `Final follow-up on ${new Date(c.followUp3ScheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
        </span>
      );
    }

    return <span className="text-gray-400 text-xs">First email sent</span>;
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14171c] p-2.5 rounded-lg border border-[#23272f]">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-md bg-[#0d0f12] border border-[#23272f] py-1 px-2 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All ({campaigns.length})</option>
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
            className="p-1.5 rounded-md hover:bg-[#23272f] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border border-[#23272f] bg-[#14171c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="clean-table w-full text-left text-xs">
            <thead>
              <tr className="bg-[#101318] text-gray-400 font-medium text-[11px] border-b border-[#23272f]">
                <th className="py-2.5 px-4 w-[220px]">Company & Contact</th>
                <th className="py-2.5 px-4 w-[220px]">Email</th>
                <th className="py-2.5 px-4 min-w-[200px]">Why emailing</th>
                <th className="py-2.5 px-4 w-[160px]">Status</th>
                <th className="py-2.5 px-4 w-[180px]">Next Step</th>
                <th className="py-2.5 px-4 min-w-[220px]">Subject</th>
                <th className="py-2.5 px-4 w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f242d]">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-300">No emails yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Click &quot;New Email&quot; above to start.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                campaigns.map(c => {
                  const isMenuOpen = openMenuId === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onPreview(c)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Company & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-200">{c.companyName}</span>
                          {c.companyWebsite && (
                            <a
                              href={c.companyWebsite.startsWith('http') ? c.companyWebsite : `https://${c.companyWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-gray-400 hover:text-blue-400"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {c.recipientName && (
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {c.recipientName}
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-mono text-gray-300 text-xs">{c.email}</span>
                          <button
                            type="button"
                            onClick={e => copyToClipboard(c.email, c.id, e)}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                            title="Copy email"
                          >
                            {copiedId === c.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
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

                      {/* Why emailing */}
                      <td className="py-3 px-4">
                        <span className="text-gray-300 line-clamp-1 text-xs" title={c.reason}>
                          {c.reason}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={e => onStatusChange(c.id, e.target.value as OutreachStatus)}
                          className={`rounded-md px-2 py-1 text-[11px] border font-medium bg-transparent focus:outline-none cursor-pointer ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {ALL_STATUSES.map(st => (
                            <option key={st} value={st} className="bg-[#14171c] text-gray-200">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Next Step */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                          {getScheduleSummary(c)}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4">
                        {c.initialSubject ? (
                          <span className="text-gray-300 font-medium line-clamp-1" title={c.initialSubject}>
                            {c.initialSubject}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Not written yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Write or Send */}
                          {!c.initialEmailBody ? (
                            <button
                              type="button"
                              onClick={() => onGenerate(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
                              title="Write draft email"
                            >
                              <PenTool className="h-3 w-3" />
                              Write
                            </button>
                          ) : !c.initialSentAt ? (
                            <button
                              type="button"
                              onClick={() => onSend(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors"
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
                            className="p-1 rounded-md hover:bg-[#23272f] text-gray-400 hover:text-gray-200 transition-colors"
                            title="View email"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* History */}
                          <button
                            type="button"
                            onClick={() => onViewHistory(c)}
                            className="p-1 rounded-md hover:bg-[#23272f] text-gray-400 hover:text-gray-200 transition-colors"
                            title="History"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>

                          {/* More */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : c.id)}
                              className="p-1 rounded-md hover:bg-[#23272f] text-gray-400 hover:text-gray-200 transition-colors"
                              title="More"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#181c22] border border-[#2b303b] shadow-lg py-1 z-50 text-left">
                                {c.initialSentAt && c.status !== 'Completed - No Response' && c.replyStatus !== 'Replied' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onFastForward(c);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-300 hover:bg-[#23272f] transition-colors"
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
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300 hover:bg-[#23272f] transition-colors"
                                  >
                                    <Check className="h-3 w-3" />
                                    Mark as replied
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onDelete(c.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-[#23272f] transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
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
