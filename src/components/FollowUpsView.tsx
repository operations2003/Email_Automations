'use client';

import React, { useState } from 'react';
import { OutreachCampaign } from '@/types/outreach';
import {
  Send,
  Eye,
  RefreshCw,
  FastForward,
  Play,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  Sparkles,
  Loader2
} from 'lucide-react';

interface FollowUpsViewProps {
  campaigns: OutreachCampaign[];
  onPreview: (campaign: OutreachCampaign, stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3') => void;
  onSendFollowUp: (campaign: OutreachCampaign, stage: 'followup_1' | 'followup_2' | 'followup_3') => void;
  onFastForward: (campaign: OutreachCampaign) => void;
  onRunScheduler: () => void;
  isSchedulerRunning: boolean;
  onRefresh?: () => void;
  activeFilter?: 'all' | 'due' | 'upcoming' | 'sent';
  onFilterChange?: (filter: 'all' | 'due' | 'upcoming' | 'sent') => void;
}

export function FollowUpsView({
  campaigns,
  onPreview,
  onSendFollowUp,
  onFastForward,
  onRunScheduler,
  isSchedulerRunning,
  onRefresh,
  activeFilter,
  onFilterChange
}: FollowUpsViewProps) {
  const [internalFilter, setInternalFilter] = useState<'all' | 'due' | 'upcoming' | 'sent'>('all');
  const filter = activeFilter !== undefined ? activeFilter : internalFilter;
  const setFilter = (f: 'all' | 'due' | 'upcoming' | 'sent') => {
    setInternalFilter(f);
    if (onFilterChange) onFilterChange(f);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'followup_1' | 'followup_2' | 'followup_3'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingTaskId, setSendingTaskId] = useState<string | null>(null);

  const handleSend = async (campaign: OutreachCampaign, stage: 'followup_1' | 'followup_2' | 'followup_3', taskKey: string) => {
    setSendingTaskId(taskKey);
    try {
      await onSendFollowUp(campaign, stage);
    } finally {
      setSendingTaskId(null);
    }
  };

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  // Extract follow-up tasks
  const followUpTasks: Array<{
    campaign: OutreachCampaign;
    stage: 'followup_1' | 'followup_2' | 'followup_3';
    stageName: string;
    dayOffset: number;
    subject: string;
    body: string;
    scheduledAt: string | null;
    sentAt: string | null;
    isDue: boolean;
    isSent: boolean;
    isPending: boolean;
    isPaused: boolean;
    isOverdue: boolean;
  }> = [];

  for (const c of campaigns) {
    // Exclude Blocked, Not Interested, Bounced, and Unsubscribed campaigns from follow-ups
    if (
      c.status === 'Blocked' ||
      c.status === 'Not Interested' ||
      c.status === 'Bounced' ||
      c.status === 'Unsubscribed' ||
      c.replyStatus === 'Bounced' ||
      c.replyStatus === 'Unsubscribed'
    ) {
      continue;
    }

    const initialSent = c.initialSentAt || (c.status === 'Initial Email Sent' || c.status === 'Follow-Up 1 Sent' || c.status === 'Follow-Up 2 Sent' ? (c.lastActivityTimestamp || c.createdAt) : null);
    if (!initialSent && !c.followUp1ScheduledAt) continue;

    const isStopped =
      c.replyStatus === 'Replied' ||
      c.status === 'Follow-Up Paused' ||
      c.status === 'Closed' ||
      c.status === 'Completed - No Response';

    const sentTime = new Date(initialSent || c.createdAt).getTime();
    const fu1Scheduled = c.followUp1ScheduledAt || new Date(sentTime + twoDays).toISOString();
    const fu2Scheduled = c.followUp2ScheduledAt || new Date(sentTime + twoDays * 2).toISOString();
    const fu3Scheduled = c.followUp3ScheduledAt || new Date(sentTime + twoDays * 3).toISOString();

    // Helper to evaluate if scheduled date is due on or before today
    const isDueOnOrBeforeToday = (scheduledDateStr: string | null) => {
      if (!scheduledDateStr) return false;
      const schDate = new Date(scheduledDateStr);
      return schDate <= todayEnd;
    };

    // Helper to check if strictly overdue (scheduled before right now)
    const isStrictlyOverdue = (scheduledDateStr: string | null) => {
      if (!scheduledDateStr) return false;
      return new Date(scheduledDateStr) <= now;
    };

    // Follow-up 1
    const fu1Sent = Boolean(c.followUp1SentAt);
    const fu1Due = !fu1Sent && !isStopped && isDueOnOrBeforeToday(fu1Scheduled);
    const fu1Pending = !fu1Sent && !fu1Due && !isStopped;

    followUpTasks.push({
      campaign: c,
      stage: 'followup_1',
      stageName: 'Follow-up 1',
      dayOffset: 2,
      subject: c.followUp1Subject,
      body: c.followUp1Body,
      scheduledAt: fu1Scheduled,
      sentAt: c.followUp1SentAt || null,
      isDue: fu1Due,
      isSent: fu1Sent,
      isPending: fu1Pending,
      isPaused: isStopped && !fu1Sent,
      isOverdue: !fu1Sent && !isStopped && isStrictlyOverdue(fu1Scheduled)
    });

    // Follow-up 2 (scheduled for Day 4)
    const fu2Sent = Boolean(c.followUp2SentAt);
    const fu2Due = !fu2Sent && !isStopped && Boolean(c.followUp1SentAt) && isDueOnOrBeforeToday(fu2Scheduled);
    const fu2Pending = !fu2Sent && !fu2Due && !isStopped;

    followUpTasks.push({
      campaign: c,
      stage: 'followup_2',
      stageName: 'Follow-up 2',
      dayOffset: 4,
      subject: c.followUp2Subject,
      body: c.followUp2Body,
      scheduledAt: fu2Scheduled,
      sentAt: c.followUp2SentAt || null,
      isDue: fu2Due,
      isSent: fu2Sent,
      isPending: fu2Pending,
      isPaused: isStopped && !fu2Sent,
      isOverdue: !fu2Sent && !isStopped && Boolean(c.followUp1SentAt) && isStrictlyOverdue(fu2Scheduled)
    });

    // Follow-up 3 (scheduled for Day 6)
    const fu3Sent = Boolean(c.followUp3SentAt);
    const fu3Due = !fu3Sent && !isStopped && Boolean(c.followUp2SentAt) && isDueOnOrBeforeToday(fu3Scheduled);
    const fu3Pending = !fu3Sent && !fu3Due && !isStopped;

    followUpTasks.push({
      campaign: c,
      stage: 'followup_3',
      stageName: 'Follow-up 3',
      dayOffset: 6,
      subject: c.followUp3Subject,
      body: c.followUp3Body,
      scheduledAt: fu3Scheduled,
      sentAt: c.followUp3SentAt || null,
      isDue: fu3Due,
      isSent: fu3Sent,
      isPending: fu3Pending,
      isPaused: isStopped && !fu3Sent,
      isOverdue: !fu3Sent && !isStopped && Boolean(c.followUp2SentAt) && isStrictlyOverdue(fu3Scheduled)
    });
  }

  // Filter tasks
  const filteredTasks = followUpTasks.filter(t => {
    // Tab filter
    if (filter === 'due' && !t.isDue) return false;
    if (filter === 'upcoming' && (!t.isPending || t.isPaused)) return false;
    if (filter === 'sent' && !t.isSent) return false;

    // Stage filter
    if (stageFilter !== 'all' && t.stage !== stageFilter) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = t.campaign.companyName.toLowerCase().includes(q);
      const matchEmail = t.campaign.email.toLowerCase().includes(q);
      const matchSubject = t.subject ? t.subject.toLowerCase().includes(q) : false;
      if (!matchCompany && !matchEmail && !matchSubject) return false;
    }

    return true;
  });

  const dueCount = followUpTasks.filter(t => t.isDue).length;
  const upcomingCount = followUpTasks.filter(t => t.isPending && !t.isPaused).length;
  const sentCount = followUpTasks.filter(t => t.isSent).length;

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Filter and Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Filter Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            All ({followUpTasks.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'due'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                : 'text-amber-800 hover:bg-amber-50'
              }`}
          >
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Pending / Due Today ({dueCount})</span>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'upcoming'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Upcoming ({upcomingCount})</span>
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === 'sent'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Sent ({sentCount})</span>
          </button>
        </div>

        {/* Search, Stage Filter & Actions */}
        <div className="flex items-center gap-2">
          {/* Stage selector */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            className="rounded-lg bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
          >
            <option value="all">All Stages</option>
            <option value="followup_1">Follow-up 1</option>
            <option value="followup_2">Follow-up 2</option>
            <option value="followup_3">Follow-up 3</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg bg-slate-50 border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none w-36 sm:w-44"
            />
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh follow-ups list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No follow-ups found in this view.</p>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto text-[11px]">
              {filter === 'due'
                ? 'No follow-up emails are scheduled for today! Check the "Upcoming" tab to view queued messages.'
                : filter === 'upcoming'
                  ? 'All queued follow-ups have been sent or none are currently scheduled.'
                  : 'Create new campaigns to initiate follow-up sequences.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <div
              key={`${t.campaign.id}-${t.stage}-${idx}`}
              className={`rounded-xl border p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${t.isDue
                  ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/60'
                  : t.isSent
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              {/* Left Details */}
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${t.isSent
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                      : 'text-slate-700 bg-slate-100 border-slate-200'
                    }`}>
                    {t.isSent && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    <span>{t.stageName} (Day {t.dayOffset}){t.isSent ? ' • Done' : ''}</span>
                  </span>

                  <span className="font-semibold text-xs text-slate-900">
                    {t.campaign.companyName}
                  </span>

                  <span className="text-xs text-slate-500 font-mono">
                    ({t.campaign.email})
                  </span>

                  {t.isDue && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{t.isOverdue ? 'Overdue / Due Now' : 'Due Today'}</span>
                    </span>
                  )}
                  {t.isPending && !t.isPaused && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      <span>Upcoming · {t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Pending'}</span>
                    </span>
                  )}
                  {t.isSent && (
                    <span className="rounded-md bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                      <span>{t.stageName} Done</span>
                      <span className="text-emerald-700/60 font-normal">&bull;</span>
                      <span className="font-medium text-emerald-800">
                        Completed {new Date(t.sentAt!).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </span>
                  )}
                  {t.isPaused && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                      Stopped ({t.campaign.replyStatus === 'Replied' ? 'Replied' : t.campaign.status})
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-800 font-medium">
                  {t.subject || 'Subject will be generated upon dispatch'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                  {t.body || 'Draft prepared automatically by AI cadence engine.'}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  <span>
                    Initial Sent: {t.campaign.initialSentAt ? new Date(t.campaign.initialSentAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                  <span>&bull;</span>
                  <span>
                    Scheduled: {t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onPreview(t.campaign, t.stage)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>

                {!t.isSent && !t.isPaused && (
                  <button
                    type="button"
                    disabled={sendingTaskId === `${t.campaign.id}-${t.stage}`}
                    onClick={() => handleSend(t.campaign, t.stage, `${t.campaign.id}-${t.stage}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:opacity-75 px-3.5 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed"
                  >
                    {sendingTaskId === `${t.campaign.id}-${t.stage}` ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>Send Now</span>
                      </>
                    )}
                  </button>
                )}

                {!t.isSent && !t.isDue && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onFastForward(t.campaign)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
                    title="Advance schedule 2 days to test"
                  >
                    <FastForward className="h-3 w-3" />
                    <span>Advance 2d</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
