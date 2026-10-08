'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Table2,
  BarChart3,
  Clock,
  Settings,
  Plus,
  Play,
  RefreshCw,
  Database,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown
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
  const { user, isAdmin, logout, switchRoleDemo } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  // Ensure employee cannot remain on settings tab if active
  useEffect(() => {
    if (!isAdmin && activeTab === 'settings') {
      setActiveTab('outreach');
    }
  }, [isAdmin, activeTab, setActiveTab]);
  return (
    <header className="sticky top-0 z-40 border-b border-[#23272f] bg-[#0d0f12]/95 backdrop-blur-xs">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20">
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
            {isAdmin && (
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
            )}
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

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                isAdmin
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/15'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              )}
              <span className="max-w-[110px] truncate font-semibold">
                {user?.name || (isAdmin ? 'Sheetal Bedi' : 'Employee')}
              </span>
              <span
                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {isAdmin ? 'ADMIN' : 'EMP'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#23272f] bg-[#14171c] p-3 shadow-2xl z-50 text-xs space-y-3">
                  <div className="border-b border-[#23272f] pb-2.5">
                    <p className="font-semibold text-white">{user?.name || (isAdmin ? 'Sheetal Bedi' : 'Team Member')}</p>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isAdmin ? '👑 Administrator' : '👤 Employee Member'}
                      </span>
                    </div>
                  </div>

                  {/* Fast Demo Role Switching */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                      Quick Switch (Testing)
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('employee');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#23272f] text-gray-300 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                          <span>Switch to Atul (Employee)</span>
                        </div>
                        <span className="text-[9px] text-gray-500">Employee</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#23272f] text-gray-300 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                          <span>Switch to Sheetal Bedi</span>
                        </div>
                        <span className="text-[9px] text-amber-400">Admin</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-[#23272f] pt-2">
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 text-left transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
