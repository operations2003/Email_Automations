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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All ({followUpTasks.length})
          </button>
          <button
            onClick={() => setFilter('due')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'due'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Due Today ({dueCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'sent'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Sent
          </button>
        </div>

        {dueCount > 0 && (
          <button
            onClick={onRunScheduler}
            disabled={isSchedulerRunning}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSchedulerRunning ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-white" />
            )}
            <span>Send Due Follow-ups ({dueCount})</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 text-xs">
            No follow-ups found here.
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <div
              key={`${t.campaign.id}-${t.stage}-${idx}`}
              className={`rounded-2xl border p-4.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
                t.isDue
                  ? 'border-amber-200 bg-amber-50/50'
                  : t.isSent
                  ? 'border-gray-200 bg-gray-50/60'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Left Details */}
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-700">
                    {t.stageName} (Day {t.dayOffset})
                  </span>

                  <span className="text-gray-300">·</span>

                  <span className="font-bold text-xs text-gray-900">
                    {t.campaign.companyName}
                  </span>

                  <span className="text-xs text-gray-500 font-mono">
                    ({t.campaign.email})
                  </span>

                  {t.isDue && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800 border border-amber-200">
                      Due today
                    </span>
                  )}
                  {t.isSent && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Sent {new Date(t.sentAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {t.isPaused && (
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-medium text-gray-600">
                      Stopped (Got reply or paused)
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-800 font-medium">
                  {t.subject || 'Subject will be written when due'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1 max-w-2xl">
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
                  className="flex items-center gap-1 rounded-xl border border-gray-200 hover:bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>

                {!t.isSent && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onSendFollowUp(t.campaign, t.stage)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Now</span>
                  </button>
                )}

                {!t.isSent && !t.isDue && !t.isPaused && (
                  <button
                    type="button"
                    onClick={() => onFastForward(t.campaign)}
                    className="flex items-center gap-1 rounded-xl border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
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
