import { NextResponse } from 'next/server';
import { readCampaigns } from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await readCampaigns();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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

    for (const c of campaigns) {
      if (c.status === 'Draft') {
        draft++;
      }

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
      if (c.replyStatus === 'Replied' || c.status === 'Replied') replies++;
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
    }

    const totalFollowUpsSent = fu1Sent + fu2Sent + fu3Sent;
    const responseRate = initialSent > 0 ? Math.round((replies / initialSent) * 100) : 0;

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
          inFollowUps: upcomingFollowUps, // In breakdown, followups contains record of all upcoming followups
          followUp1: fu1Sent,
          followUp2: fu2Sent,
          replied: replies,
          completed,
          paused,
          bounced
        }
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
