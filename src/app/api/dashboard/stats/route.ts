import { NextRequest, NextResponse } from 'next/server';
import { readCampaigns } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import {
  DailyStatRecord,
  DailySentEmailLog,
  EmployeeStatSummary,
  DailySummaryStats
} from '@/types/outreach';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Everyday email analytics are restricted to Sheetal Bedi (Admin).' },
        { status: 403 }
      );
    }

    const campaigns = await readCampaigns();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yDate.getFullYear()}-${pad2(yDate.getMonth() + 1)}-${pad2(yDate.getDate())}`;

    let draft = 0;
    let initialSent = 0;
    let fu1Sent = 0;
    let fu2Sent = 0;
    let fu3Sent = 0;
    let replies = 0;
    let interested = 0;
    let meetings = 0;
    let completed = 0;
    let dueToday = 0;
    let activeSequences = 0;
    let upcomingFollowUps = 0;
    let paused = 0;
    let bounced = 0;

    // Daily records aggregator
    const rawSends: Array<{
      id: string;
      campaignId: string;
      companyName: string;
      recipientEmail: string;
      stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3';
      stageLabel: string;
      subject: string;
      sentAt: string;
      dateStr: string;
      employee: string;
      status: string;
    }> = [];

    const replyDates: Record<string, number> = {};

    for (const c of campaigns) {
      if (c.status === 'Draft') {
        draft++;
      }

      const assignedEmp = (c.assignedTo && c.assignedTo.trim()) || 'Atul';

      // Record of initial email send
      const hasInitialSent = Boolean(
        c.initialSentAt ||
        c.status === 'Initial Email Sent' ||
        c.status === 'First Follow-Up Done' ||
        c.status === 'Follow-Up 1 Sent' ||
        c.status === 'Second Follow-Up Done' ||
        c.status === 'Follow-Up 2 Sent' ||
        c.status === 'Third Follow-Up Done' ||
        c.status === 'Follow-Up 3 Sent' ||
        c.status === 'Replied'
      );
      if (hasInitialSent) initialSent++;

      if (c.followUp1SentAt || c.status === 'First Follow-Up Done' || c.status === 'Follow-Up 1 Sent') fu1Sent++;
      if (c.followUp2SentAt || c.status === 'Second Follow-Up Done' || c.status === 'Follow-Up 2 Sent') fu2Sent++;
      if (c.followUp3SentAt || c.status === 'Third Follow-Up Done' || c.status === 'Follow-Up 3 Sent') fu3Sent++;

      // Replied records
      if (c.replyStatus === 'Replied' || c.status === 'Replied') {
        replies++;
        const replyEvent = (c.history || []).find(h => h.type === 'reply_received');
        const replyIso = replyEvent?.timestamp || c.lastActivityTimestamp || c.updatedAt || c.createdAt;
        if (replyIso) {
          const rDate = replyIso.slice(0, 10);
          replyDates[rDate] = (replyDates[rDate] || 0) + 1;
        }
      }

      if (c.status === 'Interested' || c.replyStatus === 'Interested') interested++;
      if (c.status === 'Meeting Scheduled' || c.replyStatus === 'Meeting Requested') meetings++;
      if (c.status === 'Completed - No Response' || c.status === 'Closed') completed++;
      if (c.status === 'Follow-Up Paused') paused++;
      if (c.status === 'Bounced' || c.replyStatus === 'Bounced') bounced++;

      const isStopped =
        c.replyStatus === 'Replied' ||
        c.status === 'Replied' ||
        c.status === 'Follow-Up Paused' ||
        c.status === 'Closed' ||
        c.status === 'Completed - No Response' ||
        c.status === 'Blocked' ||
        c.status === 'Bounced' ||
        c.replyStatus === 'Bounced' ||
        c.status === 'Unsubscribed';

      // Active sequence with upcoming follow-ups
      if (!isStopped && hasInitialSent) {
        activeSequences++;
        upcomingFollowUps++;

        // Check if any follow-up is due today (scheduled <= todayEnd)
        const isFu1Due = !c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= todayEnd;
        const isFu2Due = c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= todayEnd;
        const isFu3Due = c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= todayEnd;

        if (isFu1Due || isFu2Due || isFu3Due) {
          dueToday++;
        }
      }

      // Collect specific email send events for everyday analytics
      const trackedStages = new Set<string>();

      if (c.initialSentAt) {
        trackedStages.add('initial');
        rawSends.push({
          id: `${c.id}_init`,
          campaignId: c.id,
          companyName: c.companyName,
          recipientEmail: c.email,
          stage: 'initial',
          stageLabel: 'Initial Email',
          subject: c.initialSubject || 'Initial Outreach',
          sentAt: c.initialSentAt,
          dateStr: c.initialSentAt.slice(0, 10),
          employee: assignedEmp,
          status: c.status
        });
      }

      if (c.followUp1SentAt) {
        trackedStages.add('followup_1');
        rawSends.push({
          id: `${c.id}_fu1`,
          campaignId: c.id,
          companyName: c.companyName,
          recipientEmail: c.email,
          stage: 'followup_1',
          stageLabel: 'Follow-Up 1',
          subject: c.followUp1Subject || (c.initialSubject ? `Re: ${c.initialSubject}` : 'Follow-Up 1'),
          sentAt: c.followUp1SentAt,
          dateStr: c.followUp1SentAt.slice(0, 10),
          employee: assignedEmp,
          status: c.status
        });
      }

      if (c.followUp2SentAt) {
        trackedStages.add('followup_2');
        rawSends.push({
          id: `${c.id}_fu2`,
          campaignId: c.id,
          companyName: c.companyName,
          recipientEmail: c.email,
          stage: 'followup_2',
          stageLabel: 'Follow-Up 2',
          subject: c.followUp2Subject || (c.initialSubject ? `Re: ${c.initialSubject}` : 'Follow-Up 2'),
          sentAt: c.followUp2SentAt,
          dateStr: c.followUp2SentAt.slice(0, 10),
          employee: assignedEmp,
          status: c.status
        });
      }

      if (c.followUp3SentAt) {
        trackedStages.add('followup_3');
        rawSends.push({
          id: `${c.id}_fu3`,
          campaignId: c.id,
          companyName: c.companyName,
          recipientEmail: c.email,
          stage: 'followup_3',
          stageLabel: 'Follow-Up 3',
          subject: c.followUp3Subject || (c.initialSubject ? `Re: ${c.initialSubject}` : 'Follow-Up 3'),
          sentAt: c.followUp3SentAt,
          dateStr: c.followUp3SentAt.slice(0, 10),
          employee: assignedEmp,
          status: c.status
        });
      }

      // Check if history events have extra sent records (e.g. re-sent or not marked in top-level fields)
      if (Array.isArray(c.history)) {
        for (const h of c.history) {
          if (!h.timestamp) continue;
          let stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3' | null = null;
          let stageLabel = '';
          if (h.type === 'initial_sent' && !trackedStages.has('initial')) {
            stage = 'initial';
            stageLabel = 'Initial Email';
          } else if (h.type === 'followup_1_sent' && !trackedStages.has('followup_1')) {
            stage = 'followup_1';
            stageLabel = 'Follow-Up 1';
          } else if (h.type === 'followup_2_sent' && !trackedStages.has('followup_2')) {
            stage = 'followup_2';
            stageLabel = 'Follow-Up 2';
          } else if (h.type === 'followup_3_sent' && !trackedStages.has('followup_3')) {
            stage = 'followup_3';
            stageLabel = 'Follow-Up 3';
          }

          if (stage) {
            rawSends.push({
              id: h.id || `${c.id}_${h.type}`,
              campaignId: c.id,
              companyName: c.companyName,
              recipientEmail: c.email,
              stage,
              stageLabel,
              subject: h.subject || c.initialSubject || 'Outreach Email',
              sentAt: h.timestamp,
              dateStr: h.timestamp.slice(0, 10),
              employee: assignedEmp,
              status: c.status
            });
          }
        }
      }
    }

    const totalFollowUpsSent = fu1Sent + fu2Sent + fu3Sent;
    const responseRate = initialSent > 0 ? Math.round((replies / initialSent) * 100) : 0;

    // ----------------------------------------------------
    // BUILD DAY-BY-DAY ANALYTICS
    // ----------------------------------------------------
    const formatTime = (iso: string) => {
      try {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } catch {
        return '';
      }
    };

    const formatDateDisplay = (dateStr: string) => {
      try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    const formatDayName = (dateStr: string) => {
      try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-US', { weekday: 'long' });
      } catch {
        return '';
      }
    };

    // Group sends by date
    const dateMap = new Map<string, typeof rawSends>();
    for (const send of rawSends) {
      if (!dateMap.has(send.dateStr)) {
        dateMap.set(send.dateStr, []);
      }
      dateMap.get(send.dateStr)!.push(send);
    }

    // Ensure today is always present in the day-by-day map even if 0 emails were sent today
    if (!dateMap.has(todayStr)) {
      dateMap.set(todayStr, []);
    }

    // Sort dates descending
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

    const dailyAnalytics: DailyStatRecord[] = sortedDates.map(dStr => {
      const sendsOnDay = dateMap.get(dStr) || [];
      // Sort emails within day by sentAt desc
      sendsOnDay.sort((a, b) => b.sentAt.localeCompare(a.sentAt));

      let dInit = 0;
      let dFu1 = 0;
      let dFu2 = 0;
      let dFu3 = 0;
      const empMap: Record<string, { total: number; initial: number; fu1: number; fu2: number; fu3: number }> = {};
      const activeEmps = new Set<string>();

      const emails: DailySentEmailLog[] = sendsOnDay.map(s => {
        if (s.stage === 'initial') dInit++;
        else if (s.stage === 'followup_1') dFu1++;
        else if (s.stage === 'followup_2') dFu2++;
        else if (s.stage === 'followup_3') dFu3++;

        activeEmps.add(s.employee);
        if (!empMap[s.employee]) {
          empMap[s.employee] = { total: 0, initial: 0, fu1: 0, fu2: 0, fu3: 0 };
        }
        empMap[s.employee].total++;
        if (s.stage === 'initial') empMap[s.employee].initial++;
        else if (s.stage === 'followup_1') empMap[s.employee].fu1++;
        else if (s.stage === 'followup_2') empMap[s.employee].fu2++;
        else if (s.stage === 'followup_3') empMap[s.employee].fu3++;

        return {
          id: s.id,
          campaignId: s.campaignId,
          companyName: s.companyName,
          recipientEmail: s.recipientEmail,
          stage: s.stage,
          stageLabel: s.stageLabel,
          subject: s.subject,
          sentAt: s.sentAt,
          timeFormatted: formatTime(s.sentAt),
          employee: s.employee,
          status: s.status
        };
      });

      return {
        date: dStr,
        formattedDate: formatDateDisplay(dStr),
        dayName: formatDayName(dStr),
        isToday: dStr === todayStr,
        isYesterday: dStr === yesterdayStr,
        totalSent: sendsOnDay.length,
        initialSent: dInit,
        followUp1Sent: dFu1,
        followUp2Sent: dFu2,
        followUp3Sent: dFu3,
        repliesCount: replyDates[dStr] || 0,
        activeEmployees: Array.from(activeEmps),
        employeeStats: empMap,
        emails
      };
    });

    // ----------------------------------------------------
    // BUILD EMPLOYEE PERFORMANCE SUMMARIES
    // ----------------------------------------------------
    const allEmployees = new Set<string>(['Atul']);
    for (const send of rawSends) {
      if (send.employee) allEmployees.add(send.employee);
    }
    for (const c of campaigns) {
      if (c.assignedTo?.trim()) allEmployees.add(c.assignedTo.trim());
    }

    const employeeSummary: EmployeeStatSummary[] = Array.from(allEmployees).map(empName => {
      const empSends = rawSends.filter(s => s.employee.toLowerCase() === empName.toLowerCase());
      const todaySends = empSends.filter(s => s.dateStr === todayStr);
      const yesterdaySends = empSends.filter(s => s.dateStr === yesterdayStr);

      const empInit = empSends.filter(s => s.stage === 'initial').length;
      const empFus = empSends.filter(s => s.stage !== 'initial').length;

      // Find replies for campaigns handled by this employee
      const empCampaigns = campaigns.filter(c => {
        const a = (c.assignedTo && c.assignedTo.trim()) || 'Atul';
        return a.toLowerCase() === empName.toLowerCase();
      });
      const empReplies = empCampaigns.filter(c => c.replyStatus === 'Replied' || c.status === 'Replied').length;
      const empResponseRate = empInit > 0 ? Math.round((empReplies / empInit) * 100) : 0;

      const lastSent = empSends.length > 0
        ? empSends.reduce((latest, s) => (s.sentAt > latest ? s.sentAt : latest), empSends[0].sentAt)
        : undefined;

      const emailAddress = empName.toLowerCase().includes('atul') ? 'atul@tasknera.com' : `${empName.toLowerCase().replace(/\s+/g, '')}@tasknera.com`;

      return {
        id: `emp_${empName.toLowerCase().replace(/\s+/g, '_')}`,
        name: empName,
        email: emailAddress,
        role: 'Employee / Outreach Specialist',
        totalSent: empSends.length,
        todaySent: todaySends.length,
        yesterdaySent: yesterdaySends.length,
        initialSent: empInit,
        followUpsSent: empFus,
        repliesReceived: empReplies,
        responseRate: empResponseRate,
        lastActive: lastSent
      };
    }).sort((a, b) => b.totalSent - a.totalSent);

    // ----------------------------------------------------
    // BUILD DAILY SUMMARY STATS
    // ----------------------------------------------------
    const todayStat = dailyAnalytics.find(d => d.date === todayStr);
    const yesterdayStat = dailyAnalytics.find(d => d.date === yesterdayStr);

    const todaySentCount = todayStat ? todayStat.totalSent : 0;
    const yesterdaySentCount = yesterdayStat ? yesterdayStat.totalSent : 0;
    const countDiff = todaySentCount - yesterdaySentCount;
    const percentDiff = yesterdaySentCount > 0
      ? Math.round(((todaySentCount - yesterdaySentCount) / yesterdaySentCount) * 100)
      : (todaySentCount > 0 ? 100 : 0);

    // Rolling windows
    const getDaysAgoStr = (daysAgo: number) => {
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
      return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
    };

    const d7Ago = getDaysAgoStr(7);
    const d14Ago = getDaysAgoStr(14);
    const d30Ago = getDaysAgoStr(30);

    const last7DaysSent = rawSends.filter(s => s.dateStr >= d7Ago).length;
    const last14DaysSent = rawSends.filter(s => s.dateStr >= d14Ago).length;
    const last30DaysSent = rawSends.filter(s => s.dateStr >= d30Ago).length;

    // Peak day
    let peakDay = { date: todayStr, formattedDate: formatDateDisplay(todayStr), count: 0 };
    for (const d of dailyAnalytics) {
      if (d.totalSent > peakDay.count) {
        peakDay = { date: d.date, formattedDate: d.formattedDate, count: d.totalSent };
      }
    }

    const activeSendingDays = dailyAnalytics.filter(d => d.totalSent > 0).length;
    const dailyAverageSent = activeSendingDays > 0
      ? Math.round((rawSends.length / activeSendingDays) * 10) / 10
      : 0;

    const dailySummary: DailySummaryStats = {
      todaySent: todaySentCount,
      yesterdaySent: yesterdaySentCount,
      changeVsYesterdayPercent: percentDiff,
      changeVsYesterdayCount: countDiff,
      last7DaysSent,
      last14DaysSent,
      last30DaysSent,
      dailyAverageSent,
      peakDay,
      activeSendingDays
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies: campaigns.length,
        totalEmailsSent: initialSent, // Total send keeps the record of initial email send
        initialSent,
        upcomingFollowUps, // Record of all upcoming followups
        followUpsDueToday: dueToday,
        followUpsSent: totalFollowUpsSent,
        replies, // Total response is replied records
        interested,
        meetings,
        completedCampaigns: completed,
        activeSequences,
        responseRate,
        pipelineBreakdown: {
          draft,
          initialSent,
          inFollowUps: upcomingFollowUps,
          followUp1: fu1Sent,
          followUp2: fu2Sent,
          replied: replies,
          completed,
          paused,
          bounced
        }
      },
      dailyAnalytics,
      employeeSummary,
      dailySummary
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API Stats Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
