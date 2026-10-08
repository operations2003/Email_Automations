'use client';

import React from 'react';
import {
  Table2,
  BarChart3,
  Clock,
  Settings,
  Plus,
  Play,
  Sparkles,
  RefreshCw,
  MailCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'outreach' | 'dashboard' | 'followups' | 'settings';
  setActiveTab: (tab: 'outreach' | 'dashboard' | 'followups' | 'settings') => void;
  onOpenNewModal: () => void;
  onRunScheduler: () => void;
  isSchedulerRunning: boolean;
  dueTodayCount: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  onRunScheduler,
  isSchedulerRunning,
  dueTodayCount
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">AutoReach AI</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
                Smart Sheet
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Email Outreach & 3-Stage Follow-Up Manager</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('outreach')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'outreach'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Table2 className="h-4 w-4" />
            Outreach Sheet
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'followups'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="h-4 w-4" />
            Follow-Up Queue
            {dueTodayCount > 0 && (
              <span className="rounded-full bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-bold">
                {dueTodayCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Scheduler status badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Scheduler Active (2-Day Cycles)
          </div>

          {/* Run Due Follow-Ups Button */}
          <button
            onClick={onRunScheduler}
            disabled={isSchedulerRunning}
            title="Execute any follow-up emails currently due"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSchedulerRunning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            ) : (
              <Play className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            )}
            Run Due Follow-Ups
            {dueTodayCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-400/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold border border-amber-400/30">
                {dueTodayCount} due
              </span>
            )}
          </button>

          {/* Add New Company Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800 bg-slate-900/90 py-1.5">
        <button
          onClick={() => setActiveTab('outreach')}
          className={`flex flex-col items-center text-[10px] ${activeTab === 'outreach' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Table2 className="h-4 w-4" />
          Sheet
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center text-[10px] ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <BarChart3 className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`flex flex-col items-center text-[10px] ${activeTab === 'followups' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Clock className="h-4 w-4" />
          Follow-Ups
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center text-[10px] ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </header>
  );
}
