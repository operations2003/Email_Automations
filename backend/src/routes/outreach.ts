import { Router, Request, Response } from 'express';
import {
  readCampaigns,
  saveCampaign,
  findCampaignById,
  findCampaignByEmail,
  deleteCampaign,
  addHistoryEvent
} from '../services/db.js';
import { getSettings } from '../services/settings.js';
import { generateOutreachEmail } from '../services/ai-engine.js';
import { sendOutreachEmail } from '../services/email-service.js';
import { OutreachCampaign, OutreachStatus, ReplyStatus } from '../types/outreach.js';

const router = Router();

// GET /api/outreach - list & search
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.toLowerCase() || '';
    const status = (req.query.status as string) || '';
    const replyStatus = (req.query.replyStatus as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    let campaigns = await readCampaigns();

    if (query) {
      campaigns = campaigns.filter(
        c =>
          c.companyName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.reason.toLowerCase().includes(query) ||
          c.initialSubject.toLowerCase().includes(query)
      );
    }

    if (status && status !== 'all') {
      campaigns = campaigns.filter(c => c.status === status);
    }

    if (replyStatus && replyStatus !== 'all') {
      campaigns = campaigns.filter(c => c.replyStatus === replyStatus);
    }

    campaigns.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortBy === 'companyName') {
        aVal = a.companyName.toLowerCase();
        bVal = b.companyName.toLowerCase();
      } else if (sortBy === 'status') {
        aVal = a.status;
        bVal = b.status;
      } else if (sortBy === 'lastActivity') {
        aVal = new Date(a.lastActivityTimestamp || a.updatedAt).getTime();
        bVal = new Date(b.lastActivityTimestamp || b.updatedAt).getTime();
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach - create target with duplicate check
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      email,
      ccEmails = '',
      reason,
      recipientName = '',
      companyWebsite = '',
      notes = '',
      forceCreate = false
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, error: 'Company Name is required.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Reason for Email is required.' });
    }

    const existing = await findCampaignByEmail(email);
    if (existing && !forceCreate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        existingId: existing.id,
        existingCompany: existing.companyName,
        message: `This contact (${email}) already exists in your outreach list under "${existing.companyName}".`
      });
    }

    const now = new Date().toISOString();
    const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newCampaign: OutreachCampaign = {
      id,
      companyName: companyName.trim(),
      email: email.trim(),
      ccEmails: ccEmails.trim(),
      reason: reason.trim(),
      recipientName: recipientName.trim(),
      companyWebsite: companyWebsite.trim(),
      notes: notes.trim(),
      initialSubject: '',
      initialEmailBody: '',
      initialSentAt: null,
      followUp1Subject: '',
      followUp1Body: '',
      followUp1ScheduledAt: null,
      followUp1SentAt: null,
      followUp2Subject: '',
      followUp2Body: '',
      followUp2ScheduledAt: null,
      followUp2SentAt: null,
      followUp3Subject: '',
      followUp3Body: '',
      followUp3ScheduledAt: null,
      followUp3SentAt: null,
      status: 'Draft',
      replyStatus: 'Not Replied',
      lastActivity: 'Company added to outreach list',
      lastActivityTimestamp: now,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `hist_init_${Date.now()}`,
          type: 'initial_generated',
          title: 'Outreach Record Created',
          description: `Created outreach target for ${companyName.trim()} (${email.trim()}).`,
          timestamp: now
        }
      ]
    };

    await saveCampaign(newCampaign);
    res.json({ success: true, campaign: newCampaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/outreach/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/outreach/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const updates = req.body;
    const oldStatus = campaign.status;
    const oldReplyStatus = campaign.replyStatus;

    Object.assign(campaign, updates);
    campaign.updatedAt = new Date().toISOString();

    if (updates.status && updates.status !== oldStatus) {
      await addHistoryEvent(campaign.id, {
        type: 'status_changed',
        title: `Status changed to ${updates.status}`,
        description: `Campaign status changed from "${oldStatus}" to "${updates.status}".`,
        timestamp: new Date().toISOString()
      });
      campaign.lastActivity = `Status: ${updates.status}`;
    }

    if (updates.replyStatus === 'Replied' && oldReplyStatus !== 'Replied') {
      campaign.status = 'Follow-Up Paused';
      await addHistoryEvent(campaign.id, {
        type: 'reply_received',
        title: 'Reply Received - Follow-Ups Paused',
        description: 'Recipient replied. Automated follow-ups automatically paused.',
        timestamp: new Date().toISOString()
      });
      campaign.lastActivity = 'Replied - Follow-ups paused';
    }

    await saveCampaign(campaign);
    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/outreach/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteCampaign(String(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/generate
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const stage = req.body.stage || 'initial';
    const settings = await getSettings();

    let followUpNumber: 0 | 1 | 2 | 3 = 0;
    let previousSubject: string | undefined = undefined;
    const previousEmails: string[] = [];

    if (stage === 'followup_1') {
      followUpNumber = 1;
      previousSubject = campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
    } else if (stage === 'followup_2') {
      followUpNumber = 2;
      previousSubject = campaign.followUp1Subject || campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
    } else if (stage === 'followup_3') {
      followUpNumber = 3;
      previousSubject = campaign.followUp2Subject || campaign.followUp1Subject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
      if (campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);
    } else {
      followUpNumber = 0;
      previousSubject = campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
    }

    const generated = await generateOutreachEmail(
      {
        companyName: campaign.companyName,
        recipientEmail: campaign.email,
        ccEmails: campaign.ccEmails,
        reason: campaign.reason,
        recipientName: campaign.recipientName,
        companyWebsite: campaign.companyWebsite,
        previousSubject,
        previousEmails,
        followUpNumber,
        tone: req.body.tone || settings.aiTone
      },
      settings.openAiApiKey
    );

    if (followUpNumber === 0) {
      campaign.initialSubject = generated.subject;
      campaign.initialEmailBody = generated.body;
      if (campaign.status === 'Draft') campaign.status = 'Ready to Send';
    } else if (followUpNumber === 1) {
      campaign.followUp1Subject = generated.subject;
      campaign.followUp1Body = generated.body;
    } else if (followUpNumber === 2) {
      campaign.followUp2Subject = generated.subject;
      campaign.followUp2Body = generated.body;
    } else if (followUpNumber === 3) {
      campaign.followUp3Subject = generated.subject;
      campaign.followUp3Body = generated.body;
    }

    campaign.lastActivity = `AI Generated ${stage === 'initial' ? 'Initial Email' : `Follow-Up ${followUpNumber}`}`;
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'initial_generated',
      title: `Generated ${stage === 'initial' ? 'Initial Email' : `Follow-Up ${followUpNumber}`}`,
      description: `AI generated email subject: "${generated.subject}" with ${generated.wordCount} words.`,
      subject: generated.subject,
      body: generated.body,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, campaign, generated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const stage = req.body.stage || 'initial';
    const settings = await getSettings();

    let followUpNumber: 0 | 1 | 2 | 3 = 0;
    const previousEmails: string[] = [];
    let previousSubject = '';

    if (stage === 'followup_1') {
      followUpNumber = 1;
      previousSubject = campaign.followUp1Subject || campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
    } else if (stage === 'followup_2') {
      followUpNumber = 2;
      previousSubject = campaign.followUp2Subject || campaign.followUp1Subject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
      if (campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);
    } else if (stage === 'followup_3') {
      followUpNumber = 3;
      previousSubject = campaign.followUp3Subject || campaign.followUp2Subject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
      if (campaign.followUp1Body) previousEmails.push(campaign.followUp1Body);
      if (campaign.followUp2Body) previousEmails.push(campaign.followUp2Body);
      if (campaign.followUp3Body) previousEmails.push(campaign.followUp3Body);
    } else {
      followUpNumber = 0;
      previousSubject = campaign.initialSubject;
      if (campaign.initialEmailBody) previousEmails.push(campaign.initialEmailBody);
    }

    const generated = await generateOutreachEmail(
      {
        companyName: campaign.companyName,
        recipientEmail: campaign.email,
        ccEmails: campaign.ccEmails,
        reason: campaign.reason,
        recipientName: campaign.recipientName,
        companyWebsite: campaign.companyWebsite,
        previousSubject,
        previousEmails,
        followUpNumber,
        tone: req.body.tone || settings.aiTone
      },
      settings.openAiApiKey
    );

    if (followUpNumber === 0) {
      campaign.initialSubject = generated.subject;
      campaign.initialEmailBody = generated.body;
      if (campaign.status === 'Draft') campaign.status = 'Ready to Send';
    } else if (followUpNumber === 1) {
      campaign.followUp1Subject = generated.subject;
      campaign.followUp1Body = generated.body;
    } else if (followUpNumber === 2) {
      campaign.followUp2Subject = generated.subject;
      campaign.followUp2Body = generated.body;
    } else if (followUpNumber === 3) {
      campaign.followUp3Subject = generated.subject;
      campaign.followUp3Body = generated.body;
    }

    campaign.lastActivity = `AI Regenerated variation for ${stage}`;
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);

    await addHistoryEvent(campaign.id, {
      type: 'regenerated',
      title: `Regenerated fresh variation for ${stage}`,
      description: `New subject: "${generated.subject}" with distinct hook and body.`,
      subject: generated.subject,
      body: generated.body,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, campaign, generated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/send
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const payload = req.body;
    const stage = payload.stage || 'initial';
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
        return res.status(400).json({ success: false, error: 'Email subject and body are required before sending.' });
      }

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
        } catch {}
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

      return res.json({ success: true, message: 'Initial email sent and Follow-Up 1 scheduled', campaign, delivery });
    }

    if (stage === 'followup_1') {
      subjectToSend = subjectToSend || campaign.followUp1Subject;
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

      return res.json({ success: true, campaign, delivery });
    }

    if (stage === 'followup_2') {
      subjectToSend = subjectToSend || campaign.followUp2Subject;
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

      return res.json({ success: true, campaign, delivery });
    }

    if (stage === 'followup_3') {
      subjectToSend = subjectToSend || campaign.followUp3Subject;
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

      return res.json({ success: true, campaign, delivery });
    }

    res.status(400).json({ success: false, error: 'Invalid stage' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/pause
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    campaign.status = 'Follow-Up Paused';
    campaign.lastActivity = 'Follow-ups manually paused';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);
    await addHistoryEvent(campaign.id, {
      type: 'paused',
      title: 'Follow-Ups Paused',
      description: 'Automated follow-ups temporarily halted by user.',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/resume
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const settings = await getSettings();
    const intervalDays = settings.followUpIntervalDays || 2;
    const nextScheduled = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

    if (!campaign.followUp1SentAt) {
      campaign.followUp1ScheduledAt = nextScheduled;
      campaign.status = 'Initial Email Sent';
    } else if (!campaign.followUp2SentAt) {
      campaign.followUp2ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 1 Sent';
    } else if (!campaign.followUp3SentAt) {
      campaign.followUp3ScheduledAt = nextScheduled;
      campaign.status = 'Follow-Up 2 Sent';
    }

    if (campaign.replyStatus === 'Replied') {
      campaign.replyStatus = 'Not Replied';
    }

    campaign.lastActivity = 'Follow-ups resumed by user';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);
    await addHistoryEvent(campaign.id, {
      type: 'resumed',
      title: 'Follow-Ups Resumed',
      description: `Sequence reactivated. Next follow-up scheduled for ${new Date(nextScheduled).toLocaleDateString()}.`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/reply
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const replyType: ReplyStatus = req.body.replyType || 'Replied';
    const replySnippet = req.body.snippet || 'Thanks for reaching out! Let us schedule some time to connect next week.';
    const now = new Date().toISOString();

    campaign.replyStatus = replyType;
    campaign.status = replyType === 'Interested' ? 'Interested' : replyType === 'Meeting Requested' ? 'Meeting Scheduled' : 'Follow-Up Paused';
    campaign.lastActivity = `Inbound response: "${replySnippet.substring(0, 50)}..."`;
    campaign.lastActivityTimestamp = now;
    campaign.updatedAt = now;

    await saveCampaign(campaign);
    await addHistoryEvent(campaign.id, {
      type: 'reply_received',
      title: `Inbound Reply Received (${replyType})`,
      description: `Recipient responded: "${replySnippet}". All pending follow-ups immediately stopped.`,
      timestamp: now
    });

    res.json({
      success: true,
      message: 'Inbound reply registered. Pending follow-ups automatically paused.',
      campaign
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/outreach/:id/fast-forward
router.post('/:id/fast-forward', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    if (campaign.followUp1ScheduledAt && !campaign.followUp1SentAt) {
      campaign.followUp1ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    } else if (campaign.followUp2ScheduledAt && !campaign.followUp2SentAt) {
      campaign.followUp2ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    } else if (campaign.followUp3ScheduledAt && !campaign.followUp3SentAt) {
      campaign.followUp3ScheduledAt = new Date(Date.now() - 1000 * 60).toISOString();
    }

    campaign.lastActivity = 'Fast-forwarded schedule +2 days for testing';
    campaign.lastActivityTimestamp = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    await saveCampaign(campaign);
    await addHistoryEvent(campaign.id, {
      type: 'edited',
      title: 'Time Simulation: Advanced +2 Days',
      description: 'Scheduled follow-up moved to due now for instant verification.',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Schedule advanced +2 days. Follow-up is now due for execution.', campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/outreach/:id/history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const campaign = await findCampaignById(String(req.params.id));
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    res.json({
      success: true,
      companyName: campaign.companyName,
      email: campaign.email,
      status: campaign.status,
      replyStatus: campaign.replyStatus,
      history: campaign.history || [],
      emails: {
        initial: {
          sentAt: campaign.initialSentAt,
          subject: campaign.initialSubject,
          body: campaign.initialEmailBody
        },
        followUp1: {
          scheduledAt: campaign.followUp1ScheduledAt,
          sentAt: campaign.followUp1SentAt,
          subject: campaign.followUp1Subject,
          body: campaign.followUp1Body
        },
        followUp2: {
          scheduledAt: campaign.followUp2ScheduledAt,
          sentAt: campaign.followUp2SentAt,
          subject: campaign.followUp2Subject,
          body: campaign.followUp2Body
        },
        followUp3: {
          scheduledAt: campaign.followUp3ScheduledAt,
          sentAt: campaign.followUp3SentAt,
          subject: campaign.followUp3Subject,
          body: campaign.followUp3Body
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
