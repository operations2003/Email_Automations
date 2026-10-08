'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Send,
  Clock,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Play
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
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
        Loading Dashboard Metrics...
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-violet-950/30 p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Outreach & Follow-Up Performance
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Live Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Autonomous multi-stage follow-ups scheduled at 2-day intervals. All sequences automatically stop when an inbound reply is detected.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onRunScheduler}
            disabled={isSchedulerRunning}
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            Execute Due Follow-Ups ({s.followUpsDueToday})
          </button>
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            + Add Company
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 22 requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Companies */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Companies</span>
            <Building2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{s.totalCompanies}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Total targets</p>
          </div>
        </div>

        {/* Emails Sent */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Emails Sent</span>
            <Send className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{s.totalEmailsSent}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.initialSent} initial pitches</p>
          </div>
        </div>

        {/* Follow-Ups Due Today */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Due Today</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-300">{s.followUpsDueToday}</span>
            <p className="text-[10px] text-amber-200/70 mt-0.5">Ready to dispatch</p>
          </div>
        </div>

        {/* Follow-Ups Sent */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Follow-Ups</span>
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{s.followUpsSent}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Automated stages</p>
          </div>
        </div>

        {/* Replies */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Replies</span>
            <MessageSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-300">{s.replies}</span>
            <p className="text-[10px] text-emerald-300/70 mt-0.5">{s.responseRate}% response rate</p>
          </div>
        </div>

        {/* Interested */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Interested</span>
            <ThumbsUp className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-teal-300">{s.interested}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Positive leads</p>
          </div>
        </div>

        {/* Meetings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Meetings</span>
            <CalendarCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-cyan-300">{s.meetings}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Demos & calls</p>
          </div>
        </div>

        {/* Completed Campaigns */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-200">{s.completedCampaigns}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Full cycle closed</p>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Funnel & Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Outreach Pipeline Funnel</span>
            <span className="text-xs text-slate-400 font-normal">Active Stages</span>
          </h3>

          <div className="space-y-4">
            {/* Stage: Draft */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Draft / Ready to Send</span>
                <span className="text-slate-200 font-semibold">{s.pipelineBreakdown.draft}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-500 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.draft / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Stage: Initial Email Sent */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-indigo-400">Initial Email Sent (Day 0)</span>
                <span className="text-slate-200 font-semibold">{s.pipelineBreakdown.initialSent}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.initialSent / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Stage: Follow-Up 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-400">Follow-Up 1 Sent (Day 2)</span>
                <span className="text-slate-200 font-semibold">{s.pipelineBreakdown.followUp1}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.followUp1 / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Stage: Follow-Up 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-fuchsia-400">Follow-Up 2 Sent (Day 4)</span>
                <span className="text-slate-200 font-semibold">{s.pipelineBreakdown.followUp2}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-fuchsia-500 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.followUp2 / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Stage: Replied / Paused */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold">Replies Received (Sequence Stopped)</span>
                <span className="text-emerald-300 font-bold">{s.pipelineBreakdown.replied}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.replied / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Stage: Completed */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Completed (No response after Follow-Up 3)</span>
                <span className="text-slate-400 font-semibold">{s.pipelineBreakdown.completed}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-700 transition-all duration-500"
                  style={{
                    width: `${s.totalCompanies ? (s.pipelineBreakdown.completed / s.totalCompanies) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI & Automation Architecture Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              Automation Engine Rules
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                <span>
                  <strong>Strict Non-Repetition:</strong> AI dynamically rotates subjects, hooks, value angles, and CTAs for every recipient.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5"></span>
                <span>
                  <strong>Immediate Reply Stop:</strong> Any reply immediately halts all upcoming follow-ups and switches status to Replied/Paused.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5"></span>
                <span>
                  <strong>Fixed Timeline:</strong> Day 0 (Initial) → Day 2 (Follow-Up 1) → Day 4 (Follow-Up 2) → Day 6 (Follow-Up 3).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5"></span>
                <span>
                  <strong>Spam Protection:</strong> Zero spam clichés, zero fake urgency, strictly human-sounding and business appropriate.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
              <span>Overall Reply Rate</span>
              <span className="text-emerald-400 font-bold">{s.responseRate}%</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Calculated across {s.initialSent} active outreach campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
