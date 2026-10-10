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
  Sparkles,
  Bell
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'outreach' | 'companies' | 'dashboard' | 'followups' | 'settings';
  setActiveTab: (tab: 'outreach' | 'companies' | 'dashboard' | 'followups' | 'settings') => void;
  onOpenNewModal: () => void;
  onRunScheduler: () => void;
  isSchedulerRunning: boolean;
  dueTodayCount: number;
  onOpenNotifications: () => void;
  notificationCount?: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  onRunScheduler,
  isSchedulerRunning,
  dueTodayCount,
  onOpenNotifications,
  notificationCount = 0
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs tracking-wider shadow-xs">
              TN
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-slate-900 tracking-tight leading-none">TaskNera</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-normal mt-0.5">Outreach &amp; Pipeline</span>
            </div>
          </div>

          {/* Navigation Tabs - Standard segmented control */}
          <nav className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'outreach'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              All Emails
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'companies'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Follow-ups
              {dueTodayCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 text-[10px] font-semibold">
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
          {/* Notifications Quick Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-xs"
            title="Employee Follow-up Notifications"
          >
            <Bell className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Notifications</span>
            {notificationCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Outreach</span>
          </button>

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              {isAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-slate-700" />
              )}
              <span className="max-w-[110px] truncate font-medium">
                {user?.name || (isAdmin ? 'Sheetal Bedi' : 'Employee')}
              </span>
              <span
                className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                  isAdmin ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 text-xs space-y-2.5">
                  <div className="border-b border-slate-100 pb-2">
                    <p className="font-semibold text-slate-900">{user?.name || (isAdmin ? 'Sheetal Bedi' : 'Team Member')}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isAdmin ? 'Administrator' : 'Team Member'}
                      </span>
                    </div>
                  </div>

                  {/* Fast Demo Role Switching */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                      Role Switch (Testing)
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('employee');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                          <span>Switch to Member (Atul)</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await switchRoleDemo('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                          <span>Switch to Admin (Sheetal)</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1.5">
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer font-medium"
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
