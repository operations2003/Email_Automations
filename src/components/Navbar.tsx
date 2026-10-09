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
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Building2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'outreach' | 'companies' | 'dashboard' | 'followups' | 'settings';
  setActiveTab: (tab: 'outreach' | 'companies' | 'dashboard' | 'followups' | 'settings') => void;
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

  // Ensure employee cannot remain on settings tab if active
  useEffect(() => {
    if (!isAdmin && activeTab === 'settings') {
      setActiveTab('outreach');
    }
  }, [isAdmin, activeTab, setActiveTab]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-15 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7c3aed] text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 tracking-tight">AutoReach AI</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'outreach'
                  ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              All Emails
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Follow-ups
              {dueTodayCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold">
                  {dueTodayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Stats
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            )}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {dueTodayCount > 0 && (
            <button
              onClick={onRunScheduler}
              disabled={isSchedulerRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {isSchedulerRunning ? (
                <RefreshCw className="h-3 w-3 animate-spin text-amber-700" />
              ) : (
                <Play className="h-3 w-3 fill-amber-700 text-amber-700" />
              )}
              <span>Send Due ({dueTodayCount})</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Email</span>
          </button>

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70'
                  : 'bg-purple-50 border-purple-200 text-[#7c3aed] hover:bg-purple-100/70'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-[#7c3aed]" />
              )}
              <span className="max-w-[110px] truncate font-semibold">
                {user?.name || (isAdmin ? 'Sheetal Bedi' : 'Employee')}
              </span>
              <span
                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                  isAdmin ? 'bg-amber-200/70 text-amber-800' : 'bg-purple-200/70 text-[#7c3aed]'
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
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xl z-50 text-xs space-y-3">
                  <div className="border-b border-gray-100 pb-2.5">
                    <p className="font-semibold text-gray-900">{user?.name || (isAdmin ? 'Sheetal Bedi' : 'Team Member')}</p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-[#7c3aed] border border-purple-200'
                        }`}
                      >
                        {isAdmin ? '👑 Administrator' : '👤 Employee Member'}
                      </span>
                    </div>
                  </div>

                  {/* Fast Demo Role Switching */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                      Quick Switch (Testing)
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('employee');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-[#7c3aed]" />
                          <span>Switch to Atul (Employee)</span>
                        </div>
                        <span className="text-[9px] text-gray-400">Employee</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 text-gray-700 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                          <span>Switch to Sheetal Bedi</span>
                        </div>
                        <span className="text-[9px] text-amber-600">Admin</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer"
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
