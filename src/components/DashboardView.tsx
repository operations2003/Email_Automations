'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Send,
  Clock,
  MessageSquare,
  RefreshCw,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  User,
  Search,
  Filter,
  BarChart2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Mail,
  ArrowUpRight,
  Shield,
  Sparkles
} from 'lucide-react';
import {
  DailyStatRecord,
  DailySentEmailLog,
  EmployeeStatSummary,
  DailySummaryStats
} from '@/types/outreach';

interface DashboardStats {
  totalCompanies: number;
  totalEmailsSent: number;
  initialSent: number;
  upcomingFollowUps: number;
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
    inFollowUps: number;
    followUp1: number;
    followUp2: number;
    replied: number;
    completed: number;
    paused: number;
    bounced: number;
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
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyStatRecord[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeStatSummary[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Everyday Analytics
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '14d' | '30d' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (data.dailyAnalytics) setDailyAnalytics(data.dailyAnalytics);
        if (data.employeeSummary) setEmployeeSummary(data.employeeSummary);
        if (data.dailySummary) setDailySummary(data.dailySummary);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Filter daily analytics by employee and date range
  const filteredDailyData = useMemo(() => {
    if (!dailyAnalytics || dailyAnalytics.length === 0) return [];

    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    const getCutoffDate = () => {
      if (dateRange === 'today') return todayStr;
      const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 9999;
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    const cutoff = getCutoffDate();

    return dailyAnalytics
      .filter(record => {
        if (dateRange === 'today') return record.date === todayStr;
        return record.date >= cutoff;
      })
      .map(record => {
        // If an employee is selected, filter emails to that employee
        const filteredEmails = record.emails.filter(e => {
          if (selectedEmployee !== 'all' && e.employee.toLowerCase() !== selectedEmployee.toLowerCase()) {
            return false;
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchCompany = e.companyName.toLowerCase().includes(q);
            const matchEmail = e.recipientEmail.toLowerCase().includes(q);
            const matchSubj = e.subject.toLowerCase().includes(q);
            const matchEmp = e.employee.toLowerCase().includes(q);
            if (!matchCompany && !matchEmail && !matchSubj && !matchEmp) {
              return false;
            }
          }
          return true;
        });

        // Recalculate metrics for this filtered view
        let initialCount = 0;
        let fu1Count = 0;
        let fu2Count = 0;
        let fu3Count = 0;

        filteredEmails.forEach(e => {
          if (e.stage === 'initial') initialCount++;
          else if (e.stage === 'followup_1') fu1Count++;
          else if (e.stage === 'followup_2') fu2Count++;
          else if (e.stage === 'followup_3') fu3Count++;
        });

        return {
          ...record,
          totalSent: filteredEmails.length,
          initialSent: initialCount,
          followUp1Sent: fu1Count,
          followUp2Sent: fu2Count,
          followUp3Sent: fu3Count,
          emails: filteredEmails
        };
      })
      .filter(record => {
        // If search is active, show only records that have matching emails
        if (searchQuery.trim()) {
          return record.emails.length > 0;
        }
        return true;
      });
  }, [dailyAnalytics, selectedEmployee, dateRange, searchQuery]);

  // Dynamic KPI calculations based on filtered employee
  const dynamicKPIs = useMemo(() => {
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yDate.getFullYear()}-${pad2(yDate.getMonth() + 1)}-${pad2(yDate.getDate())}`;

    let todaySent = 0;
    let todayInitial = 0;
    let todayFollowUps = 0;

    let yesterdaySent = 0;
    let yesterdayFollowUps = 0;

    let totalFilteredSent = 0;
    let peakCount = 0;
    let peakDate = '';

    filteredDailyData.forEach(d => {
      totalFilteredSent += d.totalSent;
      if (d.date === todayStr) {
        todaySent += d.totalSent;
        todayInitial += d.initialSent;
        todayFollowUps += (d.followUp1Sent + d.followUp2Sent + d.followUp3Sent);
      }
      if (d.date === yesterdayStr) {
        yesterdaySent += d.totalSent;
        yesterdayFollowUps += (d.followUp1Sent + d.followUp2Sent + d.followUp3Sent);
      }
      if (d.totalSent > peakCount) {
        peakCount = d.totalSent;
        peakDate = d.formattedDate;
      }
    });

    const activeDaysCount = filteredDailyData.filter(d => d.totalSent > 0).length;
    const dailyAvg = activeDaysCount > 0 ? (totalFilteredSent / activeDaysCount).toFixed(1) : '0';

    const diffVsYesterday = todaySent - yesterdaySent;
    const percentChange = yesterdaySent > 0
      ? Math.round(((todaySent - yesterdaySent) / yesterdaySent) * 100)
      : (todaySent > 0 ? 100 : 0);

    return {
      todaySent,
      todayInitial,
      todayFollowUps,
      yesterdaySent,
      yesterdayFollowUps,
      totalFilteredSent,
      dailyAvg,
      diffVsYesterday,
      percentChange,
      peakCount,
      peakDate: peakDate || 'Today'
    };
  }, [filteredDailyData]);

  // Toggle expanding a date's email list
  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-600 mb-2" />
        <span className="text-xs font-medium text-slate-500">Loading everyday analytics &amp; metrics...</span>
      </div>
    );
  }

  const s = stats || {
    totalCompanies: 0,
    totalEmailsSent: 0,
    initialSent: 0,
    upcomingFollowUps: 0,
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
      inFollowUps: 0,
      followUp1: 0,
      followUp2: 0,
      replied: 0,
      completed: 0,
      paused: 0,
      bounced: 0
    }
  };

  // Find max sends across days for chart scaling
  const maxSendsInChart = Math.max(
    ...filteredDailyData.map(d => d.totalSent),
    10
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Outreach Analytics &amp; Telemetry</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Shield className="h-3 w-3" />
                Admin Audit Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete daily monitoring of outgoing emails, employee sending activity, sequence cadence, and responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-slate-800' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Outreach</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: EVERYDAY EMPLOYEE MAIL ANALYTICS (PRIMARY) */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Section Title & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <BarChart2 className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Employee Everyday Email Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-by-day volume of outreach emails sent by your team members, cadence distribution, and timeline logs.
            </p>
          </div>

          {/* Quick Controls: Employee Filter & Time Horizon */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Employee Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedEmployee('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedEmployee === 'all'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Employees
              </button>
              {employeeSummary.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.name)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedEmployee.toLowerCase() === emp.name.toLowerCase()
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-3 w-3 text-slate-400" />
                  <span>{emp.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({emp.totalSent})</span>
                </button>
              ))}
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '14d', label: '14 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'all', label: 'All Time' }
                ] as const
              ).map(range => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    dateRange === range.id
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Everyday Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Emails Sent */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">Mails Sent Today</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dynamicKPIs.todaySent}
                </span>
                <span className="text-xs text-slate-500">emails sent</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                <span className="font-medium text-indigo-700">{dynamicKPIs.todayInitial} Initial</span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-slate-700">{dynamicKPIs.todayFollowUps} Follow-ups</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">vs Yesterday ({dynamicKPIs.yesterdaySent})</span>
                {dynamicKPIs.diffVsYesterday >= 0 ? (
                  <span className="inline-flex items-center font-semibold text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +{dynamicKPIs.percentChange}%
                  </span>
                ) : (
                  <span className="inline-flex items-center font-semibold text-rose-600">
                    {dynamicKPIs.percentChange}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Yesterday's Output */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Sent Yesterday</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dynamicKPIs.yesterdaySent}
                </span>
                <span className="text-xs text-slate-500">emails</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {dynamicKPIs.yesterdayFollowUps} follow-ups executed
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Completed in yesterday&apos;s queue
              </div>
            </div>
          </div>

          {/* Card 3: Daily Average & Velocity */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Daily Average</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {dynamicKPIs.dailyAvg}
                </span>
                <span className="text-xs text-slate-500">mails / active day</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {dynamicKPIs.totalFilteredSent} total emails in selected range
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Peak day</span>
                <span className="font-semibold text-slate-700">{dynamicKPIs.peakDate} ({dynamicKPIs.peakCount})</span>
              </div>
            </div>
          </div>

          {/* Card 4: Employee Performance & Responses */}
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">Response Rate</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                  {s.responseRate}%
                </span>
                <span className="text-xs text-slate-500">({s.replies} replies)</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                <span>Primary Sender:</span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployee === 'all' ? (employeeSummary[0]?.name || 'Atul') : selectedEmployee}
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-emerald-800">
                <span>Cadence Adherence</span>
                <span className="font-semibold">100% on schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* INTERACTIVE EVERYDAY VOLUME CHART */}
        {/* ---------------------------------------------------- */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Everyday Mail Volume Timeline
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Visual day-by-day distribution of Initial Outreach vs Follow-Up touchpoints
                {selectedEmployee !== 'all' ? ` for ${selectedEmployee}` : ' across all employees'}
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600"></span>
                <span className="text-slate-600 font-medium">Initial Outreach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500"></span>
                <span className="text-slate-600 font-medium">Follow-Up 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500"></span>
                <span className="text-slate-600 font-medium">Follow-Up 2 &amp; 3</span>
              </div>
            </div>
          </div>

          {/* Visual Bars Container */}
          <div className="mt-4 pt-4 border-t border-slate-200/70">
            {filteredDailyData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No email sending activity found for the selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-3 items-end min-h-[160px]">
                {/* Reverse to display chronologically left-to-right (oldest -> newest) */}
                {filteredDailyData.slice(0, 10).reverse().map((day, idx) => {
                  const total = day.totalSent;
                  const heightPercent = total > 0 ? Math.max(Math.round((total / maxSendsInChart) * 100), 12) : 6;
                  const isHovered = hoveredBarIndex === idx;

                  const initPct = total > 0 ? (day.initialSent / total) * 100 : 0;
                  const fu1Pct = total > 0 ? (day.followUp1Sent / total) * 100 : 0;
                  const fuOtherPct = total > 0 ? ((day.followUp2Sent + day.followUp3Sent) / total) * 100 : 0;

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      onClick={() => toggleDateExpanded(day.date)}
                      className="group flex flex-col items-center cursor-pointer transition-all"
                    >
                      {/* Tooltip / Volume Bubble */}
                      <div className="mb-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                            day.isToday
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : isHovered
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {total}
                        </span>
                      </div>

                      {/* Stacked Bar */}
                      <div className="w-full max-w-[42px] h-[120px] bg-slate-200/50 rounded-lg overflow-hidden flex flex-col-reverse p-0.5 shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-md flex flex-col-reverse overflow-hidden transition-all duration-500"
                        >
                          {/* Initial Sent Segment */}
                          {initPct > 0 && (
                            <div
                              style={{ height: `${initPct}%` }}
                              className="w-full bg-indigo-600"
                              title={`${day.initialSent} Initial Sent`}
                            />
                          )}
                          {/* Follow-Up 1 Segment */}
                          {fu1Pct > 0 && (
                            <div
                              style={{ height: `${fu1Pct}%` }}
                              className="w-full bg-sky-500"
                              title={`${day.followUp1Sent} Follow-Up 1`}
                            />
                          )}
                          {/* Follow-Up 2 & 3 Segment */}
                          {fuOtherPct > 0 && (
                            <div
                              style={{ height: `${fuOtherPct}%` }}
                              className="w-full bg-amber-500"
                              title={`${day.followUp2Sent + day.followUp3Sent} Follow-Up 2/3`}
                            />
                          )}
                          {total === 0 && (
                            <div className="w-full h-full bg-slate-200 rounded-sm" />
                          )}
                        </div>
                      </div>

                      {/* Date Label */}
                      <div className="mt-2 text-center">
                        <span className={`block text-[10px] font-semibold tracking-tight ${day.isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>
                          {day.formattedDate.replace(/, \d{4}/, '')}
                        </span>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-tighter">
                          {day.dayName.slice(0, 3)}
                        </span>
                        {day.isToday && (
                          <span className="mt-0.5 inline-block px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-100 text-indigo-700">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* EMPLOYEE PERFORMANCE SCORECARD */}
        {/* ---------------------------------------------------- */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Team Member Output &amp; Capacity
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Breakdown of emails dispatched, cadence balance, and active engagement per employee.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {employeeSummary.length} Active Sender{employeeSummary.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeSummary.map(emp => {
              const isSelected = selectedEmployee.toLowerCase() === emp.name.toLowerCase();
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(isSelected ? 'all' : emp.name)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-2xs">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {emp.name}
                          {emp.name.toLowerCase().includes('atul') && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Primary
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">{emp.email}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      {isSelected ? 'Filtered' : 'Filter'}
                    </span>
                  </div>

                  {/* Employee Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/80 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block font-medium">Today</span>
                      <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
                        {emp.todaySent}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block font-medium">Total Sent</span>
                      <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                        {emp.totalSent}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block font-medium">Replies</span>
                      <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                        {emp.repliesReceived}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Initial: <strong className="text-slate-800">{emp.initialSent}</strong></span>
                    <span>Follow-ups: <strong className="text-slate-800">{emp.followUpsSent}</strong></span>
                    <span>Yield: <strong className="text-emerald-700">{emp.responseRate}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* DAY-BY-DAY TELEMETRY & AUDIT TABLE */}
        {/* ---------------------------------------------------- */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Day-by-Day Email Dispatch Logs
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Everyday history of all outreach emails sent by your employee. Click any day to inspect recipient and company details.
              </p>
            </div>

            {/* In-table Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search company, recipient, subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Total Sent</th>
                  <th className="py-2.5 px-4 text-center">Initial Outreach</th>
                  <th className="py-2.5 px-4 text-center">Follow-ups Sent</th>
                  <th className="py-2.5 px-4">Active Sender(s)</th>
                  <th className="py-2.5 px-4 text-center">Responses</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDailyData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No email records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredDailyData.map(day => {
                    const isExpanded = expandedDates.has(day.date);
                    return (
                      <React.Fragment key={day.date}>
                        <tr
                          className={`transition-colors cursor-pointer ${
                            day.isToday
                              ? 'bg-indigo-50/30 hover:bg-indigo-50/50'
                              : 'hover:bg-slate-50/80'
                          }`}
                          onClick={() => toggleDateExpanded(day.date)}
                        >
                          {/* Date Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{day.formattedDate}</span>
                              {day.isToday && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  Today
                                </span>
                              )}
                              {day.isYesterday && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  Yesterday
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{day.dayName}</span>
                          </td>

                          {/* Total Sent */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              day.totalSent > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'text-slate-400'
                            }`}>
                              {day.totalSent} {day.totalSent === 1 ? 'mail' : 'mails'}
                            </span>
                          </td>

                          {/* Initial Sent */}
                          <td className="py-3 px-4 text-center font-medium text-slate-700">
                            {day.initialSent > 0 ? (
                              <span className="text-slate-900 font-bold">{day.initialSent}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Follow-ups Sent */}
                          <td className="py-3 px-4 text-center">
                            {day.followUp1Sent + day.followUp2Sent + day.followUp3Sent > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                {day.followUp1Sent > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                    {day.followUp1Sent} FU1
                                  </span>
                                )}
                                {day.followUp2Sent > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    {day.followUp2Sent} FU2
                                  </span>
                                )}
                                {day.followUp3Sent > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    {day.followUp3Sent} FU3
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Active Sender */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {day.activeEmployees.length > 0 ? (
                                day.activeEmployees.map(emp => (
                                  <span
                                    key={emp}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                                  >
                                    <User className="h-3 w-3 text-slate-500" />
                                    {emp}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[11px]">No sends</span>
                              )}
                            </div>
                          </td>

                          {/* Responses */}
                          <td className="py-3 px-4 text-center">
                            {day.repliesCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <MessageSquare className="h-2.5 w-2.5" />
                                {day.repliesCount}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Action / Toggle */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDateExpanded(day.date);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span>{day.emails.length} logs</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDABLE INLINE EMAILS TRAY */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={7} className="p-4 border-t border-slate-200">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-2 border-b border-slate-200/70">
                                  <span>Sent Emails Timeline for {day.formattedDate}</span>
                                  <span className="text-slate-500 font-normal">
                                    {day.emails.length} email{day.emails.length === 1 ? '' : 's'} recorded
                                  </span>
                                </div>

                                {day.emails.length === 0 ? (
                                  <div className="py-4 text-center text-xs text-slate-400">
                                    No detailed email records recorded on this day.
                                  </div>
                                ) : (
                                  <div className="divide-y divide-slate-200/60 max-h-80 overflow-y-auto rounded-lg border border-slate-200/80 bg-white">
                                    {day.emails.map(email => (
                                      <div
                                        key={email.id}
                                        className="p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                              {email.companyName}
                                            </span>
                                            <span className="text-slate-400">·</span>
                                            <span className="text-slate-600 font-mono text-[11px]">
                                              {email.recipientEmail}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 truncate max-w-lg">
                                            <strong className="text-slate-700">Subject:</strong> {email.subject || 'Outreach Email'}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                          {/* Stage Badge */}
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            email.stage === 'initial'
                                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                              : email.stage === 'followup_1'
                                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                                          }`}>
                                            {email.stageLabel}
                                          </span>

                                          {/* Employee Badge */}
                                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                                            <User className="h-2.5 w-2.5 text-slate-400" />
                                            {email.employee}
                                          </span>

                                          {/* Time */}
                                          {email.timeFormatted && (
                                            <span className="text-[10px] text-slate-400 font-mono">
                                              {email.timeFormatted}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: HIGH-LEVEL PIPELINE FUNNEL & STAGES */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Overall Pipeline &amp; Conversion Snapshot
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative aggregate metrics across all active campaigns and stages.
            </p>
          </div>
        </div>

        {/* 4 Standard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Companies */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Companies</span>
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.totalCompanies}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.activeSequences} active sequences</p>
            </div>
          </div>

          {/* Total Sent */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Sent (Initial)</span>
              <Send className="h-4 w-4 text-slate-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.initialSent}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.initialSent} initial emails sent</p>
            </div>
          </div>

          {/* Total Responses */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Responses</span>
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-700 tracking-tight">{s.replies}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.responseRate}% response rate ({s.replies} replied)</p>
            </div>
          </div>

          {/* Follow-ups Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Follow-ups Queue</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-amber-700 tracking-tight">{s.upcomingFollowUps}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {s.followUpsDueToday > 0 ? `${s.followUpsDueToday} due today · ` : ''}{s.upcomingFollowUps} upcoming
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown by Stage */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Pipeline Stage Breakdown
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center">
              <span className="text-xs text-slate-500 block font-medium">Draft</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">
                {s.pipelineBreakdown.draft}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center">
              <span className="text-xs text-slate-500 block font-medium">Initial Sent</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">
                {s.pipelineBreakdown.initialSent}
              </span>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-center">
              <span className="text-xs text-blue-800 block font-semibold">In Follow-ups</span>
              <span className="text-lg font-bold text-blue-900 mt-1 block">
                {s.pipelineBreakdown.inFollowUps}
              </span>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-center">
              <span className="text-xs text-emerald-800 block font-semibold">Replied</span>
              <span className="text-lg font-bold text-emerald-900 mt-1 block">
                {s.pipelineBreakdown.replied}
              </span>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-center">
              <span className="text-xs text-amber-800 block font-semibold">Paused</span>
              <span className="text-lg font-bold text-amber-900 mt-1 block">
                {s.pipelineBreakdown.paused}
              </span>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-center">
              <span className="text-xs text-rose-800 block font-semibold">Bounced</span>
              <span className="text-lg font-bold text-rose-900 mt-1 block">
                {s.pipelineBreakdown.bounced}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
