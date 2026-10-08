'use client';

import React, { useState } from 'react';
import { OutreachCampaign } from '@/types/outreach';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  RefreshCw,
  FastForward,
  Building2,
  Calendar
} from 'lucide-react';

interface FollowUpsViewProps {
  campaigns: OutreachCampaign[];
  onPreview: (campaign: OutreachCampaign, stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3') => void;
  onSendFollowUp: (campaign: OutreachCampaign, stage: 'followup_1' | 'followup_2' | 'followup_3') => void;
  onFastForward: (campaign: OutreachCampaign) => void;
  onRunScheduler: () => void;
  isSchedulerRunning: boolean;
}

export function FollowUpsView({
  campaigns,
  onPreview,
  onSendFollowUp,
  onFastForward,
  onRunScheduler,
  isSchedulerRunning
}: FollowUpsViewProps) {
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming' | 'sent'>('all');
  const now = new Date();

  // Extract all follow-up tasks across campaigns
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
  }> = [];

  for (const c of campaigns) {
    if (!c.initialSentAt) continue; // Initial email must be sent first

    const isStopped =
      c.replyStatus === 'Replied' ||
      c.status === 'Follow-Up Paused' ||
      c.status === 'Closed' ||
      c.status === 'Completed - No Response';

    // Follow-up 1
    const fu1Due = Boolean(c.followUp1ScheduledAt && !c.followUp1SentAt && new Date(c.followUp1ScheduledAt) <= now && !isStopped);
    const fu1Sent = Boolean(c.followUp1SentAt);
    followUpTasks.push({
      campaign: c,
      stage: 'followup_1',
      stageName: 'Follow-Up 1',
      dayOffset: 2,
      subject: c.followUp1Subject,
      body: c.followUp1Body,
      scheduledAt: c.followUp1ScheduledAt || null,
      sentAt: c.followUp1SentAt || null,
      isDue: fu1Due,
      isSent: fu1Sent,
      isPending: !fu1Sent && !fu1Due,
      isPaused: isStopped && !fu1Sent
    });

    // Follow-up 2
    if (c.followUp1SentAt || c.followUp2ScheduledAt) {
      const fu2Due = Boolean(c.followUp2ScheduledAt && !c.followUp2SentAt && new Date(c.followUp2ScheduledAt) <= now && !isStopped);
      const fu2Sent = Boolean(c.followUp2SentAt);
      followUpTasks.push({
        campaign: c,
        stage: 'followup_2',
        stageName: 'Follow-Up 2',
        dayOffset: 4,
        subject: c.followUp2Subject,
        body: c.followUp2Body,
        scheduledAt: c.followUp2ScheduledAt || null,
        sentAt: c.followUp2SentAt || null,
        isDue: fu2Due,
        isSent: fu2Sent,
        isPending: !fu2Sent && !fu2Due,
        isPaused: isStopped && !fu2Sent
      });
    }

    // Follow-up 3
    if (c.followUp2SentAt || c.followUp3ScheduledAt) {
      const fu3Due = Boolean(c.followUp3ScheduledAt && !c.followUp3SentAt && new Date(c.followUp3ScheduledAt) <= now && !isStopped);
      const fu3Sent = Boolean(c.followUp3SentAt);
      followUpTasks.push({
        campaign: c,
        stage: 'followup_3',
        stageName: 'Follow-Up 3',
        dayOffset: 6,
        subject: c.followUp3Subject,
        body: c.followUp3Body,
        scheduledAt: c.followUp3ScheduledAt || null,
        sentAt: c.followUp3SentAt || null,
        isDue: fu3Due,
        isSent: fu3Sent,
        isPending: !fu3Sent && !fu3Due,
        isPaused: isStopped && !fu3Sent
      });
    }
  }

  const filteredTasks = followUpTasks.filter(t => {
    if (filter === 'due') return t.isDue;
    if (filter === 'upcoming') return t.isPending && !t.isPaused;
    if (filter === 'sent') return t.isSent;
    return true;
  });

  const dueCount = followUpTasks.filter(t => t.isDue).length;

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Follow-Ups ({followUpTasks.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'due'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            Due Now ({dueCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Upcoming Scheduled
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'sent'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Sent
          </button>
        </div>

        <button
          onClick={onRunScheduler}
          disabled={isSchedulerRunning || dueCount === 0}
          className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          {isSchedulerRunning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-slate-950" />
          )}
          Send All Due Follow-Ups ({dueCount})
        </button>
      </div>

      {/* Follow-up Queue Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500 text-sm">
            No follow-up items found for this filter.
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <div
              key={`${t.campaign.id}-${t.stage}-${idx}`}
              className={`rounded-xl border p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                t.isDue
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : t.isSent
                  ? 'border-slate-800 bg-slate-900/40'
                  : t.isPaused
                  ? 'border-slate-800/80 bg-slate-950/40 opacity-60'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                      t.stage === 'followup_1'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : t.stage === 'followup_2'
                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                        : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                    }`}
                  >
                    {t.stageName} (Day {t.dayOffset})
                  </span>

                  <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {t.campaign.companyName}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">({t.campaign.email})</span>

                  {t.isDue && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                      ⚡ DUE FOR DISPATCH
                    </span>
                  )}
                  {t.isSent && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                      ✓ Sent on {new Date(t.sentAt!).toLocaleDateString()}
                    </span>
                  )}
                  {t.isPaused && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      Sequence Paused / Replied
                    </span>
                  )}
                </div>

                {/* Subject and preview */}
                <p className="text-xs font-semibold text-indigo-300">
                  {t.subject || <span className="text-slate-500 italic">Subject will be auto-generated</span>}
                </p>
                <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                  {t.body || `Follow-up ${t.stageName} scheduled for 2-day delivery.`}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>
                    Initial Sent: {t.campaign.initialSentAt ? new Date(t.campaign.initialSentAt).toLocaleDateString() : '—'}
                  </span>
                  <span>
                    Scheduled: {t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onPreview(t.campaign, t.stage)}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>

                {!t.isSent && !t.isPaused && (
                  <button
                    onClick={() => onSendFollowUp(t.campaign, t.stage)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Now
                  </button>
                )}

                {/* Fast forward time */}
                {!t.isSent && !t.isDue && !t.isPaused && (
                  <button
                    onClick={() => onFastForward(t.campaign)}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-colors"
                    title="Simulate +2 days to make this follow-up due right now"
                  >
                    <FastForward className="h-3.5 w-3.5" />
                    Advance +2d
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
