'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Table2,
  BarChart3,
  Clock,
  Settings,
  Plus,
  Play,
  RefreshCw,
  Database
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
  const [dbState, setDbState] = useState<{
    connected: boolean;
    latencyMs?: number | null;
    databaseName?: string;
    loading: boolean;
  }>({ connected: false, loading: true });

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setDbState({
              connected: Boolean(data?.database?.connected),
              latencyMs: data?.database?.latencyMs,
              databaseName: data?.database?.databaseName || 'tasknera',
              loading: false
            });
          }
        }
      } catch {
        if (mounted) {
          setDbState(prev => ({ ...prev, connected: false, loading: false }));
        }
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-[#23272f] bg-[#0d0f12]/95 backdrop-blur-xs">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-white">Email Outreach</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 bg-[#14171c] p-1 rounded-lg border border-[#23272f]">
            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'outreach'
                  ? 'bg-[#23272f] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              All Emails
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'followups'
                  ? 'bg-[#23272f] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Follow-ups
              {dueTodayCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-semibold">
                  {dueTodayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#23272f] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Stats
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#23272f] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {dueTodayCount > 0 && (
            <button
              onClick={onRunScheduler}
              disabled={isSchedulerRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSchedulerRunning ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 fill-amber-300" />
              )}
              <span>Send Due ({dueTodayCount})</span>
            </button>
          )}

          {/* Database Connectivity Badge */}
          <div
            title={
              dbState.loading
                ? 'Connecting to Database...'
                : dbState.connected
                ? `Connected to MongoDB Atlas (${dbState.databaseName || 'tasknera'}${dbState.latencyMs !== undefined && dbState.latencyMs !== null ? ` • ${dbState.latencyMs}ms` : ''})`
                : 'MongoDB offline — Local filesystem cache active'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              dbState.loading
                ? 'bg-[#14171c] border-[#23272f] text-gray-400'
                : dbState.connected
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            }`}
          >
            <Database className="h-3 w-3" />
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                dbState.loading
                  ? 'bg-gray-400 animate-pulse'
                  : dbState.connected
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {dbState.loading
                ? 'DB Connecting...'
                : dbState.connected
                ? 'Database Connected'
                : 'Local Sync'}
            </span>
          </div>
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email</span>
          </button>
        </div>
      </div>
    </header>
  );
}
