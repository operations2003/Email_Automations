'use client';

import React, { useState } from 'react';
import {
  InboxConversation,
  Department,
  DEPARTMENTS,
  MailboxOverview
} from '@/types/inbox';
import { InboxStats } from '@/lib/inbox-api';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Inbox,
  Filter,
  Calendar,
  ChevronRight,
  User,
  Building
} from 'lucide-react';

interface InboxOverviewTabProps {
  stats: InboxStats;
  mailboxes: MailboxOverview[];
  conversations: InboxConversation[];
  selectedDept: string;
  onSelectDept: (dept: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onOpenConversation: (conv: InboxConversation) => void;
  onNavigateToTab: (tab: 'departments' | 'conversations' | 'templates' | 'settings') => void;
}

export function InboxOverviewTab({
  stats,
  mailboxes,
  conversations,
  selectedDept,
  onSelectDept,
  dateRange,
  onDateRangeChange,
  onOpenConversation,
  onNavigateToTab
}: InboxOverviewTabProps) {
  // Recent 6 conversations
  const recentConversations = conversations.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards (6 metrics as required) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Incoming Emails */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Received</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Mail className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Across all mailboxes</span>
        </div>

        {/* 2. Automatic Acknowledgments Sent */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Auto-Acks Sent</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{stats.autoAckSent}</div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">1-to-1 threaded responses</span>
        </div>

        {/* 3. Pending Team Responses */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Awaiting Team</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800">{stats.pendingHuman}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Human action required</span>
        </div>

        {/* 4. Responded Conversations */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Responded</span>
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.responded}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Team reply dispatched</span>
        </div>

        {/* 5. Resolved Conversations */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Resolved</span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.resolved}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Cases closed</span>
        </div>

        {/* 6. Failed Acknowledgments */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Failed Acks</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-800">{stats.failedAck}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">Retry available</span>
        </div>
      </div>

      {/* Connected Mailboxes Health Summary */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Departmental Mailbox Health &amp; Sync Status
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('departments')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Manage Mailboxes <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {mailboxes.map(mb => {
            const info = DEPARTMENTS[mb.department] || DEPARTMENTS.operations;
            const isConnected = mb.status === 'connected';

            return (
              <div
                key={mb.department}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${info.badgeClass}`}>
                    {info.name}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                  />
                </div>
                <div className="text-xs font-mono text-slate-700 truncate font-medium">
                  {mb.email}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>Auto-Ack:</span>
                  <span className={`font-semibold ${mb.autoAckEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {mb.autoAckEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>Pending:</span>
                  <span className="font-semibold text-amber-700">{mb.pendingHumanCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Incoming Emails with Department & Date Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Incoming Departmental Emails</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time feed of parsed messages, auto-acknowledgments, and pending responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={e => onSelectDept(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Departments</option>
                <option value="operations">Operations</option>
                <option value="careers">Careers</option>
                <option value="hr">Human Resources</option>
                <option value="recruitment">Recruitment</option>
                <option value="support">Support</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={dateRange}
                onChange={e => onDateRangeChange(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <button
              onClick={() => onNavigateToTab('conversations')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              View Full Inbox
            </button>
          </div>
        </div>

        {/* List of Recent Emails */}
        {recentConversations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">No recent incoming emails</p>
            <p className="text-xs text-slate-500 mt-1">
              Emails arriving to your departmental mailboxes will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentConversations.map(conv => {
              const deptInfo = DEPARTMENTS[conv.department] || DEPARTMENTS.operations;
              return (
                <div
                  key={conv.id}
                  onClick={() => onOpenConversation(conv)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    conv.isUnread ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="pt-1">
                      {conv.isUnread ? (
                        <span className="block h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                          {conv.ticketNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${deptInfo.badgeClass}`}>
                          {deptInfo.name}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.sender.name || conv.sender.email}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate font-mono">
                          &lt;{conv.sender.email}&gt;
                        </span>
                        {conv.sender.company && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {conv.sender.company}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {conv.subject}
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {conv.lastMessageSnippet}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    {/* Auto-Ack status */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        conv.acknowledgmentStatus === 'sent'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : conv.acknowledgmentStatus === 'skipped'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : conv.acknowledgmentStatus === 'failed'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {conv.acknowledgmentStatus === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                      {conv.acknowledgmentStatus === 'skipped' && <ShieldAlert className="h-3 w-3" />}
                      {conv.acknowledgmentStatus === 'failed' && <AlertCircle className="h-3 w-3" />}
                      Auto-Ack: {conv.acknowledgmentStatus}
                    </span>

                    {/* Conversation Status */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        conv.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : conv.status === 'pending_human' || conv.status === 'awaiting_team_response'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : conv.status === 'responded' || conv.status === 'waiting_on_customer'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {conv.status === 'pending_human' || conv.status === 'awaiting_team_response'
                        ? 'Awaiting Team Response'
                        : conv.status === 'responded' || conv.status === 'waiting_on_customer'
                        ? 'Responded'
                        : conv.status === 'resolved'
                        ? 'Resolved'
                        : 'New'}
                    </span>

                    <span className="text-[11px] text-slate-400 min-w-[70px] text-right">
                      {new Date(conv.lastMessageTimestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
