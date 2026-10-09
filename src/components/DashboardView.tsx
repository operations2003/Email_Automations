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
        <RefreshCw className="h-4 w-4 animate-spin text-[#7c3aed] mr-2" />
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Stats Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            A quick look at your sent emails, replies, and follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#7c3aed]' : ''}`} />
          </button>
          {s.followUpsDueToday > 0 && (
            <button
              onClick={onRunScheduler}
              disabled={isSchedulerRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-amber-700" />
              <span>Send Due Follow-ups ({s.followUpsDueToday})</span>
            </button>
          )}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email</span>
          </button>
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold text-gray-600">Total Contacts</span>
            <Building2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{s.totalCompanies}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.activeSequences} active now</p>
          </div>
        </div>

        {/* Emails Sent */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold text-gray-600">Emails Sent</span>
            <Send className="h-4 w-4 text-[#7c3aed]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{s.totalEmailsSent}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.initialSent} first emails · {s.followUpsSent} follow-ups</p>
          </div>
        </div>

        {/* Replies */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold text-gray-600">Replies</span>
            <MessageSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">{s.replies}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.responseRate}% reply rate</p>
          </div>
        </div>

        {/* Follow-Ups Due */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold text-gray-600">Follow-ups Due Today</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-600 tracking-tight">{s.followUpsDueToday}</span>
            <p className="text-[11px] text-gray-400 mt-0.5">Ready to send</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          Status Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-center">
            <span className="text-xs text-gray-500 block font-medium">Draft</span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {s.pipelineBreakdown.draft}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-center">
            <span className="text-xs text-gray-500 block font-medium">First Email Sent</span>
            <span className="text-lg font-bold text-gray-900 mt-1 block">
              {s.pipelineBreakdown.initialSent}
            </span>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 text-center">
            <span className="text-xs text-[#7c3aed] block font-semibold">In Follow-ups</span>
            <span className="text-lg font-bold text-[#7c3aed] mt-1 block">
              {s.pipelineBreakdown.followUp1 + s.pipelineBreakdown.followUp2}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
            <span className="text-xs text-emerald-700 block font-semibold">Got Reply</span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              {s.pipelineBreakdown.replied}
            </span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-center">
            <span className="text-xs text-amber-700 block font-semibold">Paused</span>
            <span className="text-lg font-bold text-amber-700 mt-1 block">
              {s.pipelineBreakdown.paused}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-center">
            <span className="text-xs text-gray-500 block font-medium">Finished</span>
            <span className="text-lg font-bold text-gray-500 mt-1 block">
              {s.pipelineBreakdown.completed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
