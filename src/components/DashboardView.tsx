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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="h-4 w-4 animate-spin text-slate-600 mr-2" />
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Pipeline Metrics &amp; Volume</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational snapshot of sent outreach, active sequences, replies, and scheduled touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-slate-700' : ''}`} />
          </button>
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email</span>
          </button>
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Total Accounts</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.totalCompanies}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.activeSequences} active sequences</p>
          </div>
        </div>

        {/* Emails Sent */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Total Sent</span>
            <Send className="h-4 w-4 text-slate-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.totalEmailsSent}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.initialSent} initial · {s.followUpsSent} follow-ups</p>
          </div>
        </div>

        {/* Replies */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Total Responses</span>
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">{s.replies}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.responseRate}% response rate</p>
          </div>
        </div>

        {/* Follow-Ups Due */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-600">Follow-ups Due</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-700 tracking-tight">{s.followUpsDueToday}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for dispatch</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Pipeline Stage Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-center">
            <span className="text-xs text-slate-500 block font-medium">Draft</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              {s.pipelineBreakdown.draft}
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-center">
            <span className="text-xs text-slate-500 block font-medium">Initial Sent</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              {s.pipelineBreakdown.initialSent}
            </span>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 text-center">
            <span className="text-xs text-blue-800 block font-semibold">In Follow-ups</span>
            <span className="text-lg font-bold text-blue-900 mt-1 block">
              {s.pipelineBreakdown.followUp1 + s.pipelineBreakdown.followUp2}
            </span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
            <span className="text-xs text-emerald-800 block font-semibold">Replied</span>
            <span className="text-lg font-bold text-emerald-900 mt-1 block">
              {s.pipelineBreakdown.replied}
            </span>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-center">
            <span className="text-xs text-amber-800 block font-semibold">Paused</span>
            <span className="text-lg font-bold text-amber-900 mt-1 block">
              {s.pipelineBreakdown.paused}
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-center">
            <span className="text-xs text-slate-500 block font-medium">Completed</span>
            <span className="text-lg font-bold text-slate-600 mt-1 block">
              {s.pipelineBreakdown.completed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
