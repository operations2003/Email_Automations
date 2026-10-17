import { readCampaigns } from './db';
import { isSuppressed } from './suppression';

export interface SchedulerExecutionReport {
  timestamp: string;
  checkedCount: number;
  processedCount: number;
  suppressedSkippedCount: number;
  dueCount?: number;
  logs: Array<{
    campaignId: string;
    companyName: string;
    action: string;
    stage: string;
    timestamp: string;
  }>;
}

/**
 * Diagnostic & Due-Checker for Follow-Up Sequences.
 *
 * NOTE: Automated background email dispatch is disabled per operational policy.
 * Follow-up emails must remain intact (Pending / Due) until the user manually
 * reviews and clicks "Send" for that follow-up. This function never marks
 * follow-ups as done or modifies campaigns automatically.
 */
export async function runDueFollowUps(): Promise<SchedulerExecutionReport> {
  const campaigns = await readCampaigns();
  const now = new Date();
  const logs: SchedulerExecutionReport['logs'] = [];
  let dueCount = 0;
  let suppressedSkippedCount = 0;

  for (const campaign of campaigns) {
    // 1. Skip terminal or paused campaigns
    if (
      campaign.replyStatus === 'Replied' ||
      campaign.replyStatus === 'Bounced' ||
      campaign.replyStatus === 'Unsubscribed' ||
      campaign.status === 'Follow-Up Paused' ||
      campaign.status === 'Closed' ||
      campaign.status === 'Completed - No Response' ||
      campaign.status === 'Draft' ||
      campaign.status === 'Bounced' ||
      campaign.status === 'Blocked' ||
      campaign.status === 'Not Interested' ||
      campaign.status === 'Unsubscribed'
    ) {
      continue;
    }

    // 2. Check suppression list
    if (await isSuppressed(campaign.email)) {
      suppressedSkippedCount++;
      continue;
    }

    // Check if Follow-Up 1 is pending/due
    if (campaign.initialSentAt && !campaign.followUp1SentAt && campaign.followUp1ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp1ScheduledAt);
      if (scheduledTime <= now) {
        dueCount++;
        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Follow-Up 1 due for manual send (kept intact)',
          stage: 'followup_1',
          timestamp: now.toISOString()
        });
        continue;
      }
    }

    // Check if Follow-Up 2 is pending/due
    if (campaign.followUp1SentAt && !campaign.followUp2SentAt && campaign.followUp2ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp2ScheduledAt);
      if (scheduledTime <= now) {
        dueCount++;
        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Follow-Up 2 due for manual send (kept intact)',
          stage: 'followup_2',
          timestamp: now.toISOString()
        });
        continue;
      }
    }

    // Check if Follow-Up 3 is pending/due
    if (campaign.followUp2SentAt && !campaign.followUp3SentAt && campaign.followUp3ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp3ScheduledAt);
      if (scheduledTime <= now) {
        dueCount++;
        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Follow-Up 3 due for manual send (kept intact)',
          stage: 'followup_3',
          timestamp: now.toISOString()
        });
        continue;
      }
    }
  }

  return {
    timestamp: now.toISOString(),
    checkedCount: campaigns.length,
    processedCount: 0, // No auto-sends; manual send only
    suppressedSkippedCount,
    dueCount,
    logs
  };
}
