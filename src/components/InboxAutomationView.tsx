'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  InboxConversation,
  Department,
  DEPARTMENTS,
  MailboxOverview,
  InboxSubView,
  ConversationStatus
} from '@/types/inbox';
import { InboxStats } from '@/lib/inbox-api';
import { useAuth } from '@/context/AuthContext';
import { InboxOverviewTab } from './inbox/InboxOverviewTab';
import { DepartmentalInboxesTab } from './inbox/DepartmentalInboxesTab';
import { EmailConversationsTab } from './inbox/EmailConversationsTab';
import { AcknowledgmentTemplatesTab } from './inbox/AcknowledgmentTemplatesTab';
import { MailboxSettingsTab } from './inbox/MailboxSettingsTab';
import { InboxConversationModal } from './InboxConversationModal';
import { SimulateInboundModal } from './SimulateInboundModal';
import {
  Inbox,
  LayoutDashboard,
  Building2,
  Mail,
  Layers,
  Sliders,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface InboxAutomationViewProps {
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function InboxAutomationView({ onToast }: InboxAutomationViewProps) {
  const { user, isAdmin } = useAuth();

  // Active SubView navigation
  const [activeSubView, setActiveSubView] = useState<InboxSubView>('overview');

  // Shared Data
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  // Stats
  const [stats, setStats] = useState<InboxStats>({
    total: 0,
    unread: 0,
    pendingHuman: 0,
    responded: 0,
    resolved: 0,
    autoAckSent: 0,
    failedAck: 0,
    byDepartment: {
      operations: 0,
      careers: 0,
      hr: 0,
      recruitment: 0,
      support: 0
    }
  });

  // Modals
  const [selectedConversation, setSelectedConversation] = useState<InboxConversation | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Fetch Conversations and Stats from API
  const fetchConversationsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== 'all') params.set('department', selectedDept);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateRange !== 'all') params.set('dateRange', dateRange);

      const res = await fetch(`/api/inbox/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            total: data.stats.total || 0,
            unread: data.stats.unread || 0,
            pendingHuman: data.stats.pendingHuman || 0,
            responded: data.stats.responded || 0,
            resolved: data.stats.resolved || 0,
            autoAckSent: data.stats.autoAckSent || 0,
            failedAck: data.stats.failedAck || 0,
            byDepartment: data.stats.byDepartment || prev.byDepartment
          }));
        }
      }
    } catch {
      onToast('Failed to load conversations data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDept, statusFilter, searchQuery, dateRange, onToast]);

  // Fetch Mailboxes from API
  const fetchMailboxesData = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/mailboxes');
      const data = await res.json();
      if (data.success && data.mailboxes) {
        setMailboxes(data.mailboxes);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchConversationsData();
    fetchMailboxesData();

    // Auto-refresh every 25 seconds
    const interval = setInterval(() => {
      fetchConversationsData(true);
      fetchMailboxesData();
    }, 25000);

    return () => clearInterval(interval);
  }, [fetchConversationsData, fetchMailboxesData]);

  // Handle open conversation detail
  const handleOpenConversation = async (conv: InboxConversation) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        setSelectedConversation(data.conversation);
        // mark locally as read
        setConversations(prev =>
          prev.map(c => (c.id === conv.id ? { ...c, isUnread: false } : c))
        );
        // decrement unread count locally
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - (conv.isUnread ? 1 : 0))
        }));
      } else {
        setSelectedConversation(conv);
      }
    } catch {
      setSelectedConversation(conv);
    }
  };

  // Handle status update
  const handleStatusChange = async (convId: string, newStatus: ConversationStatus) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Conversation status updated to ${newStatus.replace('_', ' ')}`, 'success');
        fetchConversationsData(true);
        if (selectedConversation && selectedConversation.id === convId) {
          setSelectedConversation(data.conversation);
        }
      }
    } catch {
      onToast('Failed to update status', 'error');
    }
  };

  // Sub-navigation menu items
  const navItems: {
    id: InboxSubView;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'KPI statistics & recent activity',
      icon: LayoutDashboard
    },
    {
      id: 'departments',
      label: 'Departmental Inboxes',
      description: 'Operations, Careers, HR, Recruitment, Support',
      icon: Building2,
      badge: mailboxes.length || 5
    },
    {
      id: 'conversations',
      label: 'Email Conversations',
      description: 'Inbound emails & reply threads',
      icon: Mail,
      badge: stats.unread > 0 ? `${stats.unread} new` : undefined
    },
    {
      id: 'templates',
      label: 'Acknowledgment Templates',
      description: 'Customizable 1-to-1 auto-replies',
      icon: Layers
    },
    {
      id: 'settings',
      label: 'Mailbox Settings',
      description: 'Webhooks, routing & anti-loop rules',
      icon: Sliders
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Inbox Automation &amp; Auto-Acknowledgment
              </h1>
              {stats.unread > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold shadow-2xs">
                  {stats.unread} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              TaskNera incoming email routing, single-thread auto-acknowledgments &amp; team response management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => {
              fetchConversationsData();
              fetchMailboxesData();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Refresh All Inbox Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Simulate Inbound</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sub-Navigation Sidebar + Active View Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sub-Navigation Sidebar (3 cols on desktop) */}
        <aside className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inbox Navigation
            </div>

            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSubView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubView(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <div className="leading-tight">{item.label}</div>
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-2 shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : typeof item.badge === 'string' && item.badge.includes('new')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Mailbox Health Widget */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hidden lg:block space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Active Mailboxes
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                5 Connected
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              {(Object.keys(DEPARTMENTS) as Department[]).map(dept => (
                <div key={dept} className="flex items-center justify-between text-slate-600">
                  <span className="truncate">{DEPARTMENTS[dept].name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Tab Content (9 cols on desktop) */}
        <section className="lg:col-span-9 min-w-0">
          {activeSubView === 'overview' && (
            <InboxOverviewTab
              stats={stats}
              mailboxes={mailboxes}
              conversations={conversations}
              selectedDept={selectedDept}
              onSelectDept={setSelectedDept}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onOpenConversation={handleOpenConversation}
              onNavigateToTab={setActiveSubView}
            />
          )}

          {activeSubView === 'departments' && (
            <DepartmentalInboxesTab
              mailboxes={mailboxes}
              isAdmin={isAdmin}
              currentUser={user}
              onRefresh={() => {
                fetchMailboxesData();
                fetchConversationsData(true);
              }}
              onToast={onToast}
              onSelectDepartmentForInbox={dept => {
                setSelectedDept(dept);
                setActiveSubView('conversations');
              }}
            />
          )}

          {activeSubView === 'conversations' && (
            <EmailConversationsTab
              conversations={conversations}
              loading={loading}
              selectedDept={selectedDept}
              onSelectDept={setSelectedDept}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenConversation={handleOpenConversation}
              onStatusChange={handleStatusChange}
              onRefresh={() => fetchConversationsData(false)}
            />
          )}

          {activeSubView === 'templates' && (
            <AcknowledgmentTemplatesTab
              isAdmin={isAdmin}
              onToast={onToast}
            />
          )}

          {activeSubView === 'settings' && (
            <MailboxSettingsTab
              mailboxes={mailboxes}
              isAdmin={isAdmin}
              onRefresh={() => {
                fetchMailboxesData();
                fetchConversationsData(true);
              }}
              onToast={onToast}
              onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
            />
          )}
        </section>
      </div>

      {/* Conversation Detail Modal / Drawer */}
      {selectedConversation && (
        <InboxConversationModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onRefresh={() => fetchConversationsData(true)}
          onToast={onToast}
          currentUser={user}
        />
      )}

      {/* Simulate Inbound Email Modal */}
      {isSimulateModalOpen && (
        <SimulateInboundModal
          onClose={() => setIsSimulateModalOpen(false)}
          onSuccess={() => {
            fetchConversationsData(false);
            fetchMailboxesData();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}
