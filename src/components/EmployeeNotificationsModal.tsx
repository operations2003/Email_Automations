'use client';

import React, { useState, useMemo } from 'react';
import { OutreachCampaign } from '@/types/outreach';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  Calendar,
  Clock,
  UserCheck,
  Send,
  Eye,
  FastForward,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Play
} from 'lucide-react';

export interface FollowUpItem {
  id: string;
  campaign: OutreachCampaign;
  stage: 'followup_1' | 'followup_2' | 'followup_3';
  stageName: string;
  dayOffset: number;
  subject: string;
  body: string;
  scheduledAt: string | null;
  scheduledDateStr: string; // YYYY-MM-DD
  sentAt: string | null;
  assignedTo: string;
  isDue: boolean;
  isSent: boolean;
  isPending: boolean;
  isOverdue: boolean;
  isPaused: boolean;
}

interface EmployeeNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: OutreachCampaign[];
  onPreview: (campaign: OutreachCampaign, stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3') => void;
  onSendFollowUp: (campaign: OutreachCampaign, stage: 'followup_1' | 'followup_2' | 'followup_3') => Promise<void>;
  onFastForward: (campaign: OutreachCampaign) => Promise<void>;
  onRunScheduler: () => Promise<void>;
  isSchedulerRunning: boolean;
  onNavigateToCampaign?: (campaign: OutreachCampaign) => void;
}

function formatDateToIsoString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function EmployeeNotificationsModal({
  isOpen,
  onClose,
  campaigns,
  onPreview,
  onSendFollowUp,
  onFastForward,
  onRunScheduler,
  isSchedulerRunning,
  onNavigateToCampaign
}: EmployeeNotificationsModalProps) {
  const { user, isAdmin } = useAuth();
  const now = new Date();
  const todayStr = formatDateToIsoString(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateToIsoString(tomorrow);

  // States for filtering
  const [selectedDayOption, setSelectedDayOption] = useState<'today' | 'tomorrow' | 'overdue' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    user?.name?.toLowerCase().includes('atul') ? 'Atul' : 'all'
  );
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Extract all follow-up tasks from campaigns
  const allFollowUpItems: FollowUpItem[] = useMemo(() => {
    const items: FollowUpItem[] = [];

    for (const c of campaigns) {
      if (!c.initialSentAt && !c.followUp1ScheduledAt) continue;

      const isStopped =
        c.replyStatus === 'Replied' ||
        c.status === 'Follow-Up Paused' ||
        c.status === 'Closed' ||
        c.status === 'Completed - No Response';

      const assigned = (c.assignedTo && c.assignedTo.trim()) || 'Atul';

      // Follow-up 1
      if (c.followUp1ScheduledAt) {
        const schDate = new Date(c.followUp1ScheduledAt);
        const schDateStr = formatDateToIsoString(schDate);
        const isSent = Boolean(c.followUp1SentAt);
        const isDue = Boolean(!isSent && schDate <= now && !isStopped);
        const isOverdue = Boolean(!isSent && schDate < now && schDateStr < todayStr && !isStopped);

        items.push({
          id: `${c.id}-fu1`,
          campaign: c,
          stage: 'followup_1',
          stageName: 'Follow-up 1',
          dayOffset: 2,
          subject: c.followUp1Subject,
          body: c.followUp1Body,
          scheduledAt: c.followUp1ScheduledAt,
          scheduledDateStr: schDateStr,
          sentAt: c.followUp1SentAt || null,
          assignedTo: assigned,
          isDue,
          isSent,
          isPending: !isSent && !isDue,
          isOverdue,
          isPaused: isStopped && !isSent
        });
      }

      // Follow-up 2
      if (c.followUp2ScheduledAt || c.followUp1SentAt) {
        const sch2 = c.followUp2ScheduledAt;
        if (sch2) {
          const schDate = new Date(sch2);
          const schDateStr = formatDateToIsoString(schDate);
          const isSent = Boolean(c.followUp2SentAt);
          const isDue = Boolean(!isSent && schDate <= now && !isStopped);
          const isOverdue = Boolean(!isSent && schDate < now && schDateStr < todayStr && !isStopped);

          items.push({
            id: `${c.id}-fu2`,
            campaign: c,
            stage: 'followup_2',
            stageName: 'Follow-up 2',
            dayOffset: 4,
            subject: c.followUp2Subject,
            body: c.followUp2Body,
            scheduledAt: sch2,
            scheduledDateStr: schDateStr,
            sentAt: c.followUp2SentAt || null,
            assignedTo: assigned,
            isDue,
            isSent,
            isPending: !isSent && !isDue,
            isOverdue,
            isPaused: isStopped && !isSent
          });
        }
      }

      // Follow-up 3
      if (c.followUp3ScheduledAt || c.followUp2SentAt) {
        const sch3 = c.followUp3ScheduledAt;
        if (sch3) {
          const schDate = new Date(sch3);
          const schDateStr = formatDateToIsoString(schDate);
          const isSent = Boolean(c.followUp3SentAt);
          const isDue = Boolean(!isSent && schDate <= now && !isStopped);
          const isOverdue = Boolean(!isSent && schDate < now && schDateStr < todayStr && !isStopped);

          items.push({
            id: `${c.id}-fu3`,
            campaign: c,
            stage: 'followup_3',
            stageName: 'Follow-up 3',
            dayOffset: 6,
            subject: c.followUp3Subject,
            body: c.followUp3Body,
            scheduledAt: sch3,
            scheduledDateStr: schDateStr,
            sentAt: c.followUp3SentAt || null,
            assignedTo: assigned,
            isDue,
            isSent,
            isPending: !isSent && !isDue,
            isOverdue,
            isPaused: isStopped && !isSent
          });
        }
      }
    }

    return items;
  }, [campaigns, now, todayStr]);

  // Unique list of employees
  const employeeList = useMemo(() => {
    const list = new Set<string>();
    list.add('Atul');
    list.add('Sheetal Bedi');
    allFollowUpItems.forEach(item => {
      if (item.assignedTo) list.add(item.assignedTo);
    });
    return Array.from(list);
  }, [allFollowUpItems]);

  // Filter by employee
  const employeeFilteredItems = useMemo(() => {
    if (selectedEmployee === 'all') return allFollowUpItems;
    return allFollowUpItems.filter(item =>
      item.assignedTo.toLowerCase().includes(selectedEmployee.toLowerCase())
    );
  }, [allFollowUpItems, selectedEmployee]);

  // Filter by particular day or condition
  const filteredItems = useMemo(() => {
    return employeeFilteredItems.filter(item => {
      if (selectedDayOption === 'today') {
        return item.scheduledDateStr === todayStr || (item.isDue && !item.isSent);
      }
      if (selectedDayOption === 'tomorrow') {
        return item.scheduledDateStr === tomorrowStr;
      }
      if (selectedDayOption === 'overdue') {
        return item.isOverdue;
      }
      if (selectedDayOption === 'custom') {
        return item.scheduledDateStr === customDate;
      }
      return true; // 'all'
    });
  }, [employeeFilteredItems, selectedDayOption, todayStr, tomorrowStr, customDate]);

  // Counts for quick tabs
  const todayCount = useMemo(() => {
    return employeeFilteredItems.filter(
      i => i.scheduledDateStr === todayStr || (i.isDue && !i.isSent)
    ).length;
  }, [employeeFilteredItems, todayStr]);

  const tomorrowCount = useMemo(() => {
    return employeeFilteredItems.filter(i => i.scheduledDateStr === tomorrowStr).length;
  }, [employeeFilteredItems, tomorrowStr]);

  const overdueCount = useMemo(() => {
    return employeeFilteredItems.filter(i => i.isOverdue).length;
  }, [employeeFilteredItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-200/60 shadow-xs">
              <Bell className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Employee Follow-up Notifications
                </h2>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[11px] font-semibold">
                  Scheduled Tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor and execute follow-ups assigned to employees at particular days
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="border-b border-slate-200 bg-white px-6 py-3.5 space-y-3">
          {/* Employee Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                Employee:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedEmployee('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedEmployee === 'all'
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  All Employees
                </button>
                {employeeList.map(emp => (
                  <button
                    key={emp}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedEmployee.toLowerCase() === emp.toLowerCase()
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-transparent'
                    }`}
                  >
                    <span>{emp}</span>
                    {emp.toLowerCase().includes('atul') && (
                      <span className="text-[9px] bg-amber-200/60 text-amber-800 px-1 rounded font-normal">
                        Member
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>


          </div>

          {/* Particular Day Selection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Day:
              </span>
              <button
                onClick={() => setSelectedDayOption('today')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedDayOption === 'today'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>Today</span>
                {todayCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedDayOption === 'today'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {todayCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSelectedDayOption('tomorrow')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedDayOption === 'tomorrow'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>Tomorrow</span>
                {tomorrowCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {tomorrowCount}
                  </span>
                )}
              </button>

              {overdueCount > 0 && (
                <button
                  onClick={() => setSelectedDayOption('overdue')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedDayOption === 'overdue'
                      ? 'bg-rose-700 text-white font-semibold shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span>Overdue</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                    {overdueCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => setSelectedDayOption('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedDayOption === 'all'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                All Scheduled ({employeeFilteredItems.length})
              </button>
            </div>

            {/* Custom Particular Day Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Pick Particular Day:</span>
              <input
                type="date"
                value={customDate}
                onChange={e => {
                  setCustomDate(e.target.value);
                  setSelectedDayOption('custom');
                }}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer font-medium ${
                  selectedDayOption === 'custom'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Selected Day Context Banner */}
        <div className="bg-slate-100/60 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-medium">
              Follow-ups for{' '}
              <strong className="text-slate-900 font-semibold">
                {selectedDayOption === 'today'
                  ? `Today (${formatDisplayDate(todayStr)})`
                  : selectedDayOption === 'tomorrow'
                  ? `Tomorrow (${formatDisplayDate(tomorrowStr)})`
                  : selectedDayOption === 'overdue'
                  ? 'Overdue Follow-ups'
                  : selectedDayOption === 'custom'
                  ? formatDisplayDate(customDate)
                  : 'All Scheduled Cadences'}
              </strong>
            </span>
            {selectedEmployee !== 'all' && (
              <span className="text-slate-500">
                · assigned to <strong className="text-slate-800 font-semibold">{selectedEmployee}</strong>
              </span>
            )}
          </div>
          <span className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[11px]">
            {filteredItems.length} {filteredItems.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Follow-up Tasks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/40">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No follow-ups for this particular day
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedDayOption === 'custom'
                  ? `There are no outreach follow-ups scheduled for ${formatDisplayDate(customDate)}.`
                  : selectedEmployee !== 'all'
                  ? `No follow-up tasks are scheduled for ${selectedEmployee} on this day.`
                  : 'All caught up! No follow-ups are due on the selected date.'}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setSelectedDayOption('all')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                >
                  View All Scheduled Follow-ups
                </button>
                {selectedDayOption !== 'today' && (
                  <button
                    onClick={() => setSelectedDayOption('today')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    Check Today
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredItems.map(item => {
              const isProcessing = sendingId === item.id;
              const scheduledDateObj = item.scheduledAt ? new Date(item.scheduledAt) : null;
              const formattedTime = scheduledDateObj
                ? scheduledDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs transition-all hover:shadow-md ${
                    item.isDue
                      ? 'border-amber-200/80 ring-1 ring-amber-100'
                      : item.isOverdue
                      ? 'border-rose-200/80 ring-1 ring-rose-100'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Lead Details & Follow-up Metadata */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {item.campaign.companyName}
                        </span>
                        {item.campaign.recipientName && (
                          <span className="text-xs text-slate-500">
                            ({item.campaign.recipientName})
                          </span>
                        )}
                        <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-semibold border border-slate-200/60">
                          {item.stageName}
                        </span>
                        <span className="rounded-md bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[11px] font-medium border border-indigo-200/60 flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {item.assignedTo}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{item.campaign.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {formatDisplayDate(item.scheduledDateStr)}
                          {formattedTime && ` at ${formattedTime}`}
                        </span>

                        {item.isDue ? (
                          <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.2 text-[10px] font-semibold">
                            Due Today
                          </span>
                        ) : item.isOverdue ? (
                          <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.2 text-[10px] font-semibold">
                            Overdue
                          </span>
                        ) : item.isSent ? (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 text-[10px] font-semibold">
                            Sent
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.2 text-[10px] font-medium">
                            Scheduled
                          </span>
                        )}
                      </div>

                      {item.subject && (
                        <div className="pt-1">
                          <p className="text-xs text-slate-600 italic line-clamp-1">
                            &quot;{item.subject}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => onPreview(item.campaign, item.stage)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-xs"
                        title="Preview Follow-up Email"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Preview Draft</span>
                      </button>

                      {!item.isDue && !item.isSent && (
                        <button
                          onClick={async () => {
                            await onFastForward(item.campaign);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-800 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                          title="Advance schedule for instant demo"
                        >
                          <FastForward className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Automatic follow-up cadence engine active (2-day default interval)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
