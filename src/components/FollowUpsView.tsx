'use client';

import React, { useState } from 'react';
import { OutreachCampaign } from '@/types/outreach';
import {
  Send,
  Eye,
  RefreshCw,
  FastForward,
  Play
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
  }> = [];

  for (const c of campaigns) {
    if (!c.initialSentAt && !c.followUp1ScheduledAt) continue;

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
      stageName: 'Follow-up 1',
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
        stageName: 'Follow-up 2',
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
        stageName: 'Follow-up 3',
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
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({followUpTasks.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'due'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Pending / Due Today ({dueCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'sent'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Sent
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
            No follow-ups found in this view.
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <div
              key={`${t.campaign.id}-${t.stage}-${idx}`}
              className={`rounded-xl border p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                t.isDue
                  ? 'border-amber-200 bg-amber-50/40'
                  : t.isSent
                  ? 'border-slate-200 bg-slate-50/60'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {t.stageName} (Day {t.dayOffset})
                  </span>

                  <span className="text-slate-300">·</span>

                  <span className="font-semibold text-xs text-slate-900">
                    {t.campaign.companyName}
                  </span>

                  <span className="text-xs text-slate-500 font-mono">
                    ({t.campaign.email})
                  </span>

                  {t.isDue && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                      Due today
                    </span>
                  )}
                  {t.isSent && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                      Sent {new Date(t.sentAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {t.isPaused && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                      Stopped (Replied or paused)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-800 font-medium">
                  {t.subject || 'Subject generated upon dispatch'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                  {t.body || 'Draft prepared automatically.'}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  <span>
                    Initial: {t.campaign.initialSentAt ? new Date(t.campaign.initialSentAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  <span>
                    Scheduled: {t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
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
                    onClick={() => onSendFollowUp(t.campaign, t.stage)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Now</span>
                  </button>
                )}

                {!t.isSent && !t.isDue && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onFastForward(t.campaign)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
                    title="Advance schedule 2 days"
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
