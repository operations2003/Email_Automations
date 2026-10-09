import { NextRequest, NextResponse } from 'next/server';
import { findCampaignById, saveCampaign, addHistoryEvent } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { sendOutreachEmail } from '@/lib/email-service';
import { generateOutreachEmail } from '@/lib/ai-engine';
import { getUserFromRequest } from '@/lib/auth';
import { isSuppressed } from '@/lib/suppression';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin' && user.role !== 'employee') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to send emails.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const campaign = await findCampaignById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    if (!campaign.email || !campaign.email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing recipient email address.' },
        { status: 400 }
      );
    }

    if (await isSuppressed(campaign.email)) {
      return NextResponse.json(
        {
          success: false,
          error: `Recipient ${campaign.email} is on the suppression list (unsubscribed or bounced). Email sending aborted to protect domain reputation.`
        },
        { status: 400 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const stage = payload.stage || 'initial'; // 'initial' | 'followup_1' | 'followup_2' | 'followup_3'
    const settings = await getSettings();
    const intervalDays = settings.followUpIntervalDays || 2;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const now = new Date();
    const nowIso = now.toISOString();

    let subjectToSend = payload.subject;
    let bodyToSend = payload.body;

    if (stage === 'initial') {
      subjectToSend = subjectToSend || campaign.initialSubject;
      bodyToSend = bodyToSend || campaign.initialEmailBody;

      if (!subjectToSend || !bodyToSend) {
        return NextResponse.json(
          { success: false, error: 'Email subject and body are required before sending.' },
          { status: 400 }
        );
      }

      // Send email
      const delivery = await sendOutreachEmail(
        {
          to: campaign.email,
          cc: campaign.ccEmails,
          subject: subjectToSend,
          body: bodyToSend,
          signature: settings.emailSignature,
          campaignId: campaign.id,
          stage: 'initial'
        },
        settings
      );

      const nextScheduled = new Date(now.getTime() + intervalMs).toISOString();

      // Pre-synthesize follow-up 1 preview if desired, or set scheduled date
      let fu1Subj = campaign.followUp1Subject;
      let fu1Body = campaign.followUp1Body;
      if (!fu1Subj || !fu1Body) {
        try {
          const genFu1 = await generateOutreachEmail(
            {
              companyName: campaign.companyName,
              recipientEmail: campaign.email,
              ccEmails: campaign.ccEmails,
              reason: campaign.reason,
              recipientName: campaign.recipientName,
              companyWebsite: campaign.companyWebsite,
              previousSubject: subjectToSend,
              previousEmails: [bodyToSend],
              followUpNumber: 1,
              tone: settings.aiTone
            },
            settings.openAiApiKey
          );
          fu1Subj = genFu1.subject;
          fu1Body = genFu1.body;
        } catch {
          // ignore
        }
      }

      campaign.initialSubject = subjectToSend;
      campaign.initialEmailBody = bodyToSend;
      campaign.initialSentAt = nowIso;
      campaign.followUp1Subject = fu1Subj || '';
      campaign.followUp1Body = fu1Body || '';
      campaign.followUp1ScheduledAt = nextScheduled;
      campaign.status = 'Initial Email Sent';
      campaign.lastActivity = 'Initial email sent. Follow-Up 1 scheduled.';
      campaign.lastActivityTimestamp = nowIso;
      campaign.updatedAt = nowIso;

      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'initial_sent',
        title: 'Initial Email Sent',
        description: `Delivered to ${campaign.email}${campaign.ccEmails ? ` (CC: ${campaign.ccEmails})` : ''}. Follow-Up 1 scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
        subject: subjectToSend,
        body: bodyToSend,
        timestamp: nowIso
      });

      return NextResponse.json({
        success: true,
        message: 'Initial email sent and Follow-Up 1 scheduled',
        campaign,
        delivery
      });
    }

    if (stage === 'followup_1') {
      subjectToSend =
        subjectToSend ||
        campaign.followUp1Subject ||
        (campaign.initialSubject ? `Re: ${campaign.initialSubject.replace(/^(re:\s*)+/i, '').trim()}` : '');
      bodyToSend = bodyToSend || campaign.followUp1Body;

      const delivery = await sendOutreachEmail(
        {
          to: campaign.email,
          cc: campaign.ccEmails,
          subject: subjectToSend,
          body: bodyToSend,
          signature: settings.emailSignature,
          campaignId: campaign.id,
          stage: 'followup_1'
        },
        settings
      );

      const nextScheduled = new Date(now.getTime() + intervalMs).toISOString();

      campaign.followUp1Subject = subjectToSend;
      campaign.followUp1Body = bodyToSend;
      campaign.followUp1SentAt = nowIso;
      campaign.followUp2ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 1 Sent';
      campaign.lastActivity = 'Follow-Up 1 sent. Follow-Up 2 scheduled.';
      campaign.lastActivityTimestamp = nowIso;
      campaign.updatedAt = nowIso;

      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'followup_1_sent',
        title: 'Follow-Up 1 Sent',
        description: `Delivered to ${campaign.email}. Follow-Up 2 scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
        subject: subjectToSend,
        body: bodyToSend,
        timestamp: nowIso
      });

      return NextResponse.json({ success: true, campaign, delivery });
    }

    if (stage === 'followup_2') {
      subjectToSend =
        subjectToSend ||
        campaign.followUp2Subject ||
        (campaign.initialSubject ? `Re: ${campaign.initialSubject.replace(/^(re:\s*)+/i, '').trim()}` : '');
      bodyToSend = bodyToSend || campaign.followUp2Body;

      const delivery = await sendOutreachEmail(
        {
          to: campaign.email,
          cc: campaign.ccEmails,
          subject: subjectToSend,
          body: bodyToSend,
          signature: settings.emailSignature,
          campaignId: campaign.id,
          stage: 'followup_2'
        },
        settings
      );

      const nextScheduled = new Date(now.getTime() + intervalMs).toISOString();

      campaign.followUp2Subject = subjectToSend;
      campaign.followUp2Body = bodyToSend;
      campaign.followUp2SentAt = nowIso;
      campaign.followUp3ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 2 Sent';
      campaign.lastActivity = 'Follow-Up 2 sent. Follow-Up 3 scheduled.';
      campaign.lastActivityTimestamp = nowIso;
      campaign.updatedAt = nowIso;

      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'followup_2_sent',
        title: 'Follow-Up 2 Sent',
        description: `Delivered to ${campaign.email}. Final follow-up scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
        subject: subjectToSend,
        body: bodyToSend,
        timestamp: nowIso
      });

      return NextResponse.json({ success: true, campaign, delivery });
    }

    if (stage === 'followup_3') {
      subjectToSend =
        subjectToSend ||
        campaign.followUp3Subject ||
        (campaign.initialSubject ? `Re: ${campaign.initialSubject.replace(/^(re:\s*)+/i, '').trim()}` : '');
      bodyToSend = bodyToSend || campaign.followUp3Body;

      const delivery = await sendOutreachEmail(
        {
          to: campaign.email,
          cc: campaign.ccEmails,
          subject: subjectToSend,
          body: bodyToSend,
          signature: settings.emailSignature,
          campaignId: campaign.id,
          stage: 'followup_3'
        },
        settings
      );

      campaign.followUp3Subject = subjectToSend;
      campaign.followUp3Body = bodyToSend;
      campaign.followUp3SentAt = nowIso;
      campaign.status = 'Completed - No Response';
      campaign.lastActivity = 'Follow-Up 3 sent (Sequence completed)';
      campaign.lastActivityTimestamp = nowIso;
      campaign.updatedAt = nowIso;

      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'followup_3_sent',
        title: 'Follow-Up 3 Sent (Final)',
        description: `Final closing loop delivered to ${campaign.email}.`,
        subject: subjectToSend,
        body: bodyToSend,
        timestamp: nowIso
      });

      return NextResponse.json({ success: true, campaign, delivery });
    }

    return NextResponse.json({ success: false, error: 'Invalid stage' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
