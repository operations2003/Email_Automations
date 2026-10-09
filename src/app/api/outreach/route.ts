import { NextRequest, NextResponse } from 'next/server';
import { readCampaigns, saveCampaign, findCampaignByEmail, addHistoryEvent } from '@/lib/db';
import { OutreachCampaign, OutreachStatus, ReplyStatus } from '@/types/outreach';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const replyStatus = searchParams.get('replyStatus') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let campaigns = await readCampaigns();

    // Search filter
    if (query) {
      campaigns = campaigns.filter(
        c =>
          c.companyName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.reason.toLowerCase().includes(query) ||
          (c.mailTopic && c.mailTopic.toLowerCase().includes(query)) ||
          c.initialSubject.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (status && status !== 'all') {
      campaigns = campaigns.filter(c => c.status === status);
    }

    // ReplyStatus filter
    if (replyStatus && replyStatus !== 'all') {
      campaigns = campaigns.filter(c => c.replyStatus === replyStatus);
    }

    // Sorting
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
        // createdAt
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return NextResponse.json({ success: true, count: campaigns.length, campaigns });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support bulk assignment array: [{ companyName, email, ... }] or { items: [...] }
    const items = Array.isArray(body) ? body : body.items ? body.items : null;
    if (items && Array.isArray(items) && items.length > 0) {
      const createdCampaigns: OutreachCampaign[] = [];
      const now = new Date().toISOString();
      for (const item of items) {
        if (!item.companyName || !item.email) continue;
        const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const camp: OutreachCampaign = {
          id,
          companyName: item.companyName.trim(),
          email: item.email.trim(),
          ccEmails: item.ccEmails?.trim() || '',
          reason: item.reason?.trim() || 'Introduce TaskNera services and offerings.',
          recipientName: item.recipientName?.trim() || '',
          companyWebsite: item.companyWebsite?.trim() || '',
          notes: item.notes?.trim() || '',
          assignedTo: item.assignedTo?.trim() || 'Atul',
          assignedBy: item.assignedBy?.trim() || 'Sheetal Bedi (Admin)',
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
          status: 'Draft' as OutreachStatus,
          replyStatus: 'Not Replied' as ReplyStatus,
          lastActivity: `Assigned to ${item.assignedTo?.trim() || 'Atul'} by Admin`,
          lastActivityTimestamp: now,
          createdAt: now,
          updatedAt: now,
          history: [
            {
              id: `hist_init_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              type: 'initial_generated',
              title: `Assigned to ${item.assignedTo?.trim() || 'Atul'}`,
              description: `Admin assigned ${item.companyName.trim()} for outreach.`,
              timestamp: now
            }
          ]
        };
        await saveCampaign(camp);
        createdCampaigns.push(camp);
      }
      return NextResponse.json({ success: true, count: createdCampaigns.length, campaigns: createdCampaigns });
    }

    const {
      companyName,
      email,
      ccEmails = '',
      mailTopic = '',
      reason,
      recipientName = '',
      companyWebsite = '',
      notes = '',
      assignedTo = '',
      assignedBy = '',
      forceCreate = false,
      forceDuplicate = false
    } = body;

    // Validate inputs
    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ success: false, error: 'Company Name is required.' }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const defaultReason = mailTopic
      ? `Outreach regarding ${mailTopic}`
      : 'AI candidate screening & automated resume matching to eliminate recruiter review bottlenecks and save 8-10 hours/week.';
    const finalReason = (reason && reason.trim()) ? reason.trim() : defaultReason;

    // Duplicate check
    const existing = await findCampaignByEmail(email);
    if (existing && !forceCreate && !forceDuplicate) {
      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          duplicate: true,
          existingCampaignId: existing.id,
          existingId: existing.id,
          existingCompany: existing.companyName,
          message: `This contact (${email}) already exists in your outreach list under "${existing.companyName}".`
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const id = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newCampaign: OutreachCampaign = {
      id,
      companyName: companyName.trim(),
      email: email.trim(),
      ccEmails: ccEmails.trim(),
      mailTopic: mailTopic ? mailTopic.trim() : '',
      reason: finalReason,
      recipientName: recipientName.trim(),
      companyWebsite: companyWebsite.trim(),
      notes: notes.trim(),
      assignedTo: assignedTo?.trim() || undefined,
      assignedBy: assignedBy?.trim() || undefined,
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
      status: 'Draft' as OutreachStatus,
      replyStatus: 'Not Replied' as ReplyStatus,
      lastActivity: assignedTo ? `Assigned to ${assignedTo} by Admin` : 'Company added to outreach list',
      lastActivityTimestamp: now,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `hist_init_${Date.now()}`,
          type: 'initial_generated',
          title: assignedTo ? `Assigned to ${assignedTo}` : 'Outreach Record Created',
          description: assignedTo ? `Admin assigned ${companyName.trim()} for outreach.` : `Created outreach target for ${companyName.trim()} (${email.trim()}).`,
          timestamp: now
        }
      ]
    };

    await saveCampaign(newCampaign);

    return NextResponse.json({ success: true, campaign: newCampaign });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
