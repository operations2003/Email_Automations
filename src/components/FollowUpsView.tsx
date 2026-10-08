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
    if (!c.initialSentAt) continue;

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14171c] p-2.5 rounded-lg border border-[#23272f]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#23272f] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({followUpTasks.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === 'due'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Due Today ({dueCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-[#23272f] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === 'sent'
                ? 'bg-[#23272f] text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sent
          </button>
        </div>

        {dueCount > 0 && (
          <button
            onClick={onRunScheduler}
            disabled={isSchedulerRunning}
            className="flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSchedulerRunning ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-gray-950" />
            )}
            <span>Send Due Follow-ups ({dueCount})</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-12 text-center text-gray-400 text-xs">
            No follow-ups found here.
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <div
              key={`${t.campaign.id}-${t.stage}-${idx}`}
              className={`rounded-lg border p-3.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                t.isDue
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : t.isSent
                  ? 'border-[#23272f] bg-[#14171c]/70'
                  : 'border-[#23272f] bg-[#14171c]'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-300">
                    {t.stageName} (Day {t.dayOffset})
                  </span>

                  <span className="text-gray-400">·</span>

                  <span className="font-medium text-xs text-white">
                    {t.campaign.companyName}
                  </span>

                  <span className="text-xs text-gray-400 font-mono">
                    ({t.campaign.email})
                  </span>

                  {t.isDue && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                      Due today
                    </span>
                  )}
                  {t.isSent && (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      Sent {new Date(t.sentAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {t.isPaused && (
                    <span className="rounded bg-gray-800 px-1.5 py-0.2 text-[10px] font-medium text-gray-400">
                      Stopped (Got reply or paused)
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-200 font-medium">
                  {t.subject || 'Subject will be written when due'}
                </p>
                <p className="text-xs text-gray-400 line-clamp-1 max-w-2xl">
                  {t.body || 'Email will be drafted automatically.'}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                  <span>
                    First email: {t.campaign.initialSentAt ? new Date(t.campaign.initialSentAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
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
                  className="flex items-center gap-1 rounded-md border border-[#23272f] hover:bg-[#23272f] px-2.5 py-1 text-xs text-gray-300 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>

                {!t.isSent && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onSendFollowUp(t.campaign, t.stage)}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Now</span>
                  </button>
                )}

                {!t.isSent && !t.isDue && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onFastForward(t.campaign)}
                    className="flex items-center gap-1 rounded-md border border-[#23272f] hover:bg-[#23272f] px-2 py-1 text-xs text-amber-400 transition-colors"
                    title="Skip 2 days ahead for testing"
                  >
                    <FastForward className="h-3 w-3" />
                    <span>Skip 2d</span>
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
