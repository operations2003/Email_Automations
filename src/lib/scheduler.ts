import { readCampaigns, saveCampaign, addHistoryEvent } from './db';
import { getSettings } from './settings';
import { generateOutreachEmail } from './ai-engine';
import { sendOutreachEmail } from './email-service';
import { isSuppressed } from './suppression';
import { OutreachCampaign } from '@/types/outreach';

export interface SchedulerExecutionReport {
  timestamp: string;
  checkedCount: number;
  processedCount: number;
  suppressedSkippedCount: number;
  logs: Array<{
    campaignId: string;
    companyName: string;
    action: string;
    stage: string;
    timestamp: string;
  }>;
}

export async function runDueFollowUps(): Promise<SchedulerExecutionReport> {
  const campaigns = await readCampaigns();
  const settings = await getSettings();
  const now = new Date();
  const logs: SchedulerExecutionReport['logs'] = [];
  let processedCount = 0;
  let suppressedSkippedCount = 0;

  for (const campaign of campaigns) {
    // 1. Critical Stop Check: If recipient replied, unsubscribed, bounced, or campaign is paused/closed
    if (
      campaign.replyStatus === 'Replied' ||
      campaign.replyStatus === 'Bounced' ||
      campaign.replyStatus === 'Unsubscribed' ||
      campaign.status === 'Follow-Up Paused' ||
      campaign.status === 'Closed' ||
      campaign.status === 'Completed - No Response' ||
      campaign.status === 'Draft' ||
      campaign.status === 'Ready to Send' ||
      campaign.status === 'Bounced' ||
      campaign.status === 'Unsubscribed'
    ) {
      continue;
    }

    // 2. Deliverability Protection: Check suppression list before any follow-up
    if (await isSuppressed(campaign.email)) {
      campaign.status = 'Unsubscribed';
      campaign.replyStatus = 'Unsubscribed';
      campaign.lastActivity = 'Suppressed recipient detected: Sequence permanently paused';
      campaign.updatedAt = now.toISOString();
      await saveCampaign(campaign);
      suppressedSkippedCount++;
      continue;
    }

    const intervalDays = settings.followUpIntervalDays || 2;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    // Check Follow-Up 1
    if (campaign.initialSentAt && !campaign.followUp1SentAt && campaign.followUp1ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp1ScheduledAt);
      if (scheduledTime <= now) {
        // Enforce natural sending throttle if this is not the first send in this run
        if (processedCount > 0) {
          const jitterMs = 1500 + Math.floor(Math.random() * 2000);
          await new Promise(r => setTimeout(r, jitterMs));
        }

        // Generate Follow-up 1 if not yet generated
        let subject = campaign.followUp1Subject;
        let body = campaign.followUp1Body;

        if (!subject || !body) {
          const gen = await generateOutreachEmail(
            {
              companyName: campaign.companyName,
              recipientEmail: campaign.email,
              ccEmails: campaign.ccEmails,
              reason: campaign.reason,
              recipientName: campaign.recipientName,
              companyWebsite: campaign.companyWebsite,
              previousSubject: campaign.initialSubject,
              previousEmails: [campaign.initialEmailBody],
              followUpNumber: 1,
              tone: settings.aiTone
            },
            settings.openAiApiKey
          );
          subject = gen.subject;
          body = gen.body;
        }

        // Send email
        await sendOutreachEmail(
          {
            to: campaign.email,
            cc: campaign.ccEmails,
            subject,
            body,
            signature: settings.emailSignature,
            campaignId: campaign.id,
            stage: 'followup_1'
          },
          settings
        );

        const sentTimestamp = new Date().toISOString();
        const nextScheduled = new Date(Date.now() + intervalMs).toISOString();

        campaign.followUp1Subject = subject;
        campaign.followUp1Body = body;
        campaign.followUp1SentAt = sentTimestamp;
        campaign.followUp2ScheduledAt = nextScheduled;
        campaign.status = 'Follow-Up 1 Sent';
        campaign.lastActivity = 'Follow-Up 1 automatically sent by scheduler';
        campaign.lastActivityTimestamp = sentTimestamp;

        await saveCampaign(campaign);
        await addHistoryEvent(campaign.id, {
          type: 'followup_1_sent',
          title: 'Automated Follow-Up 1 Sent',
          description: `Follow-Up 1 sent via scheduler. Next follow-up scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
          subject,
          body,
          timestamp: sentTimestamp
        });

        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Sent Follow-Up 1 and scheduled Follow-Up 2',
          stage: 'followup_1',
          timestamp: sentTimestamp
        });

        processedCount++;
        continue;
      }
    }

    // Check Follow-Up 2
    if (campaign.followUp1SentAt && !campaign.followUp2SentAt && campaign.followUp2ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp2ScheduledAt);
      if (scheduledTime <= now) {
        if (processedCount > 0) {
          const jitterMs = 1500 + Math.floor(Math.random() * 2000);
          await new Promise(r => setTimeout(r, jitterMs));
        }

        let subject = campaign.followUp2Subject;
        let body = campaign.followUp2Body;

        if (!subject || !body) {
          const gen = await generateOutreachEmail(
            {
              companyName: campaign.companyName,
              recipientEmail: campaign.email,
              ccEmails: campaign.ccEmails,
              reason: campaign.reason,
              recipientName: campaign.recipientName,
              companyWebsite: campaign.companyWebsite,
              previousSubject: campaign.followUp1Subject || campaign.initialSubject,
              previousEmails: [campaign.initialEmailBody, campaign.followUp1Body],
              followUpNumber: 2,
              tone: settings.aiTone
            },
            settings.openAiApiKey
          );
          subject = gen.subject;
          body = gen.body;
        }

        await sendOutreachEmail(
          {
            to: campaign.email,
            cc: campaign.ccEmails,
            subject,
            body,
            signature: settings.emailSignature,
            campaignId: campaign.id,
            stage: 'followup_2'
          },
          settings
        );

        const sentTimestamp = new Date().toISOString();
        const nextScheduled = new Date(Date.now() + intervalMs).toISOString();

        campaign.followUp2Subject = subject;
        campaign.followUp2Body = body;
        campaign.followUp2SentAt = sentTimestamp;
        campaign.followUp3ScheduledAt = nextScheduled;
        campaign.status = 'Follow-Up 2 Sent';
        campaign.lastActivity = 'Follow-Up 2 automatically sent by scheduler';
        campaign.lastActivityTimestamp = sentTimestamp;

        await saveCampaign(campaign);
        await addHistoryEvent(campaign.id, {
          type: 'followup_2_sent',
          title: 'Automated Follow-Up 2 Sent',
          description: `Follow-Up 2 sent via scheduler. Final follow-up scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
          subject,
          body,
          timestamp: sentTimestamp
        });

        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Sent Follow-Up 2 and scheduled Follow-Up 3',
          stage: 'followup_2',
          timestamp: sentTimestamp
        });

        processedCount++;
        continue;
      }
    }

    // Check Follow-Up 3 (Final closing loop)
    if (campaign.followUp2SentAt && !campaign.followUp3SentAt && campaign.followUp3ScheduledAt) {
      const scheduledTime = new Date(campaign.followUp3ScheduledAt);
      if (scheduledTime <= now) {
        if (processedCount > 0) {
          const jitterMs = 1500 + Math.floor(Math.random() * 2000);
          await new Promise(r => setTimeout(r, jitterMs));
        }

        let subject = campaign.followUp3Subject;
        let body = campaign.followUp3Body;

        if (!subject || !body) {
          const gen = await generateOutreachEmail(
            {
              companyName: campaign.companyName,
              recipientEmail: campaign.email,
              ccEmails: campaign.ccEmails,
              reason: campaign.reason,
              recipientName: campaign.recipientName,
              companyWebsite: campaign.companyWebsite,
              previousSubject: campaign.followUp2Subject || campaign.followUp1Subject,
              previousEmails: [campaign.initialEmailBody, campaign.followUp1Body, campaign.followUp2Body],
              followUpNumber: 3,
              tone: settings.aiTone
            },
            settings.openAiApiKey
          );
          subject = gen.subject;
          body = gen.body;
        }

        await sendOutreachEmail(
          {
            to: campaign.email,
            cc: campaign.ccEmails,
            subject,
            body,
            signature: settings.emailSignature,
            campaignId: campaign.id,
            stage: 'followup_3'
          },
          settings
        );

        const sentTimestamp = new Date().toISOString();

        campaign.followUp3Subject = subject;
        campaign.followUp3Body = body;
        campaign.followUp3SentAt = sentTimestamp;
        campaign.status = 'Completed - No Response';
        campaign.lastActivity = 'Follow-Up 3 sent (Loop closed - No response)';
        campaign.lastActivityTimestamp = sentTimestamp;

        await saveCampaign(campaign);
        await addHistoryEvent(campaign.id, {
          type: 'followup_3_sent',
          title: 'Final Follow-Up 3 Sent',
          description: 'Final loop closed. Sequence completed.',
          subject,
          body,
          timestamp: sentTimestamp
        });

        logs.push({
          campaignId: campaign.id,
          companyName: campaign.companyName,
          action: 'Sent Final Follow-Up 3 (Campaign completed)',
          stage: 'followup_3',
          timestamp: sentTimestamp
        });

        processedCount++;
        continue;
      }
    }
  }

  return {
    timestamp: now.toISOString(),
    checkedCount: campaigns.length,
    processedCount,
    suppressedSkippedCount,
    logs
  };
}
