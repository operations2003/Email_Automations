'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Send,
  Clock,
  MessageSquare,
  RefreshCw,
  Play,
  Plus
} from 'lucide-react';

interface DashboardStats {
  totalCompanies: number;
  totalEmailsSent: number;
  initialSent: number;
  followUpsDueToday: number;
  followUpsSent: number;
  replies: number;
  interested: number;
  meetings: number;
  completedCampaigns: number;
  activeSequences: number;
  responseRate: number;
  pipelineBreakdown: {
    draft: number;
    initialSent: number;
    followUp1: number;
    followUp2: number;
    replied: number;
    completed: number;
    paused: number;
  };
}

interface DashboardViewProps {
  onRunScheduler: () => void;
  isSchedulerRunning: boolean;
  onOpenNewModal: () => void;
}

export function DashboardView({
  onRunScheduler,
  isSchedulerRunning,
  onOpenNewModal
}: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-500 mr-2" />
        <span>Loading stats...</span>
      </div>
    );
  }

  const s = stats || {
    totalCompanies: 0,
    totalEmailsSent: 0,
    initialSent: 0,
    followUpsDueToday: 0,
    followUpsSent: 0,
    replies: 0,
    interested: 0,
    meetings: 0,
    completedCampaigns: 0,
    activeSequences: 0,
    responseRate: 0,
    pipelineBreakdown: {
      draft: 0,
      initialSent: 0,
      followUp1: 0,
      followUp2: 0,
      replied: 0,
      completed: 0,
      paused: 0
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#23272f]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Stats Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            A quick look at your sent emails, replies, and follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-1.5 rounded-lg border border-[#23272f] hover:bg-[#1f242d] text-gray-400 hover:text-gray-200 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {s.followUpsDueToday > 0 && (
            <button
              onClick={onRunScheduler}
              disabled={isSchedulerRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Play className="h-3 w-3 fill-amber-300" />
              <span>Send Due Follow-ups ({s.followUpsDueToday})</span>
            </button>
          )}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email</span>
          </button>
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Total Contacts</span>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-white tracking-tight">{s.totalCompanies}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.activeSequences} active now</p>
          </div>
        </div>

        {/* Emails Sent */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Emails Sent</span>
            <Send className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-white tracking-tight">{s.totalEmailsSent}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.initialSent} first emails · {s.followUpsSent} follow-ups</p>
          </div>
        </div>

        {/* Replies */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Replies</span>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-emerald-400 tracking-tight">{s.replies}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.responseRate}% reply rate</p>
          </div>
        </div>

        {/* Follow-Ups Due */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Follow-ups Due Today</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold text-amber-300 tracking-tight">{s.followUpsDueToday}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">Ready to send</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-5">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Status Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">Draft</span>
            <span className="text-lg font-semibold text-gray-200 mt-1 block">
              {s.pipelineBreakdown.draft}
            </span>
          </div>

          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">First Email Sent</span>
            <span className="text-lg font-semibold text-gray-200 mt-1 block">
              {s.pipelineBreakdown.initialSent}
            </span>
          </div>

          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">In Follow-ups</span>
            <span className="text-lg font-semibold text-purple-400 mt-1 block">
              {s.pipelineBreakdown.followUp1 + s.pipelineBreakdown.followUp2}
            </span>
          </div>

          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">Got Reply</span>
            <span className="text-lg font-semibold text-emerald-400 mt-1 block">
              {s.pipelineBreakdown.replied}
            </span>
          </div>

          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">Paused</span>
            <span className="text-lg font-semibold text-amber-400 mt-1 block">
              {s.pipelineBreakdown.paused}
            </span>
          </div>

          <div className="rounded-md border border-[#23272f] bg-[#0d0f12] p-3 text-center">
            <span className="text-xs text-gray-400 block">Finished</span>
            <span className="text-lg font-semibold text-gray-400 mt-1 block">
              {s.pipelineBreakdown.completed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
