import { NextResponse } from 'next/server';
import { readCampaigns } from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await readCampaigns();
    const now = new Date();

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

    for (const c of campaigns) {
      if (c.initialSentAt) initialSent++;
      if (c.followUp1SentAt) fu1Sent++;
      if (c.followUp2SentAt) fu2Sent++;
      if (c.followUp3SentAt) fu3Sent++;

      if (c.replyStatus === 'Replied' || c.status === 'Replied') replies++;
      if (c.status === 'Interested' || c.replyStatus === 'Interested') interested++;
      if (c.status === 'Meeting Scheduled' || c.replyStatus === 'Meeting Requested') meetings++;
      if (c.status === 'Completed - No Response' || c.status === 'Closed') completed++;

      const isStopped =
        c.replyStatus === 'Replied' ||
        c.status === 'Follow-Up Paused' ||
        c.status === 'Closed' ||
        c.status === 'Completed - No Response';

      if (!isStopped && c.initialSentAt) {
        activeSequences++;

        // Check if any follow-up is due (scheduled <= now and not sent)
        const isFu1Due = !c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= now;
        const isFu2Due = c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= now;
        const isFu3Due = c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= now;

        if (isFu1Due || isFu2Due || isFu3Due) {
          dueToday++;
        }
      }
    }

    const totalFollowUpsSent = fu1Sent + fu2Sent + fu3Sent;
    const totalEmailsSent = initialSent + totalFollowUpsSent;
    const responseRate = initialSent > 0 ? Math.round((replies / initialSent) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies: campaigns.length,
        totalEmailsSent,
        initialSent,
        followUpsDueToday: dueToday,
        followUpsSent: totalFollowUpsSent,
        replies,
        interested,
        meetings,
        completedCampaigns: completed,
        activeSequences,
        responseRate,
        pipelineBreakdown: {
          draft: campaigns.filter(c => c.status === 'Draft' || c.status === 'Ready to Send').length,
          initialSent: campaigns.filter(c => c.status === 'Initial Email Sent').length,
          followUp1: campaigns.filter(c => c.status === 'Follow-Up 1 Sent').length,
          followUp2: campaigns.filter(c => c.status === 'Follow-Up 2 Sent').length,
          replied: replies,
          completed: completed,
          paused: campaigns.filter(c => c.status === 'Follow-Up Paused').length
        }
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
