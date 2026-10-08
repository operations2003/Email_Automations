import fs from 'fs/promises';
import path from 'path';
import { OutreachCampaign, EmailHistoryEvent } from '../types/outreach.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'outreach.json');

const SEED_CAMPAIGNS: OutreachCampaign[] = [
  {
    id: 'camp-sixt-001',
    companyName: 'SIXT Research & Development India',
    email: 'sumit.sharma@sixt.com',
    ccEmails: 'swati@tasknera.com',
    reason: 'Explore whether we can support SIXT with additional software engineering hiring capacity.',
    recipientName: 'Sumit Sharma',
    companyWebsite: 'https://www.sixt.tech',
    notes: 'Fast growing autonomous mobility and backend engineering hub in Bangalore.',
    initialSubject: 'Exploring Engineering Hiring Support for SIXT',
    initialEmailBody: `Hi Sumit,\n\nI’ve been tracking SIXT’s engineering milestones in India and know how crucial dependable engineering capacity is right now.\n\nSpecifically regarding our focus: delivering dedicated support to explore whether we can support SIXT with additional software engineering hiring capacity. We provide pre-screened senior software developers and dedicated pods ready to contribute within 48 to 72 hours—bypassing traditional headhunter overhead and lengthy recruiter delays.\n\nWould you be open to a brief 10-minute introductory call this Thursday or Friday?`,
    initialSentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1Subject: 'Resources & capacity for SIXT Research & Development India',
    followUp1Body: `Hi Sumit,\n\nSharing a quick follow-up to my earlier message regarding our support for SIXT Research & Development India.\n\nWe maintain a live roster of senior engineers who are available immediately for full-time or fractional support.\n\nDoes your schedule allow a quick 10-minute touchpoint this week?`,
    followUp1ScheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1SentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    followUp2Subject: 'Specific use case for SIXT Research & Development India',
    followUp2Body: `Hi Sumit,\n\nOne of our partners cut their technical recruitment costs by 45% while decreasing time-to-hire from 7 weeks to 6 days.\n\nHappy to share a 2-minute overview if you'd like a quick look.`,
    followUp2ScheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    followUp2SentAt: null,
    followUp3Subject: '',
    followUp3Body: '',
    followUp3ScheduledAt: null,
    followUp3SentAt: null,
    status: 'Follow-Up 1 Sent',
    replyStatus: 'Not Replied',
    lastActivity: 'Follow-Up 2 scheduled for today',
    lastActivityTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-1',
        type: 'initial_generated',
        title: 'Initial Email Draft Generated',
        description: 'AI synthesized personalized initial outreach email.',
        subject: 'Exploring Engineering Hiring Support for SIXT',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-2',
        type: 'initial_sent',
        title: 'Initial Outreach Sent',
        description: 'Sent to sumit.sharma@sixt.com with CC to swati@tasknera.com.',
        subject: 'Exploring Engineering Hiring Support for SIXT',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-3',
        type: 'followup_1_sent',
        title: 'Follow-Up 1 Sent',
        description: 'Automated 2-day reminder + value-add sent.',
        subject: 'Resources & capacity for SIXT Research & Development India',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'camp-acme-002',
    companyName: 'Acme Technologies',
    email: 'hr@acme.com',
    ccEmails: 'sales@mycompany.com',
    reason: 'Introduce our recruitment services and discuss how we can help them hire software developers.',
    recipientName: 'Priya Nambiar',
    companyWebsite: 'https://acmetech.global',
    notes: 'Series B FinTech company looking to double their engineering team.',
    initialSubject: 'Supporting Acme Technologies with Software Hiring',
    initialEmailBody: `Hi Priya,\n\nNoticeable momentum around Acme Technologies prompted me to reach out directly regarding your technical team expansion.\n\nSpecifically regarding our focus: delivering dedicated support to introduce our recruitment services and discuss how we can help them hire software developers. Our model pairs your engineering leadership with senior talent tested on real-world system architecture, ensuring zero ramp-up compromise on code quality.\n\nAre you open to a quick 10-minute conversation to see if this aligns with your current priorities?`,
    initialSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1Subject: 'Quick follow-up regarding Acme Technologies',
    followUp1Body: `Hi Priya,\n\nI wanted to float my previous note back to your radar in case it slipped through during a busy week.\n\nIn addition to on-demand developers, we also offer trial periods where you evaluate engineer work before committing to long-term engagements.\n\nDoes your schedule allow a quick 10-minute touchpoint this week?`,
    followUp1ScheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1SentAt: null,
    followUp2Subject: '',
    followUp2Body: '',
    followUp2ScheduledAt: null,
    followUp2SentAt: null,
    followUp3Subject: '',
    followUp3Body: '',
    followUp3ScheduledAt: null,
    followUp3SentAt: null,
    status: 'Initial Email Sent',
    replyStatus: 'Not Replied',
    lastActivity: 'Initial Email Sent, Follow-Up 1 in 1 day',
    lastActivityTimestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-acme-1',
        type: 'initial_generated',
        title: 'Initial Email Draft Generated',
        description: 'AI synthesized personalized pitch.',
        subject: 'Supporting Acme Technologies with Software Hiring',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-acme-2',
        type: 'initial_sent',
        title: 'Initial Outreach Sent',
        description: 'Sent to hr@acme.com with CC to sales@mycompany.com.',
        subject: 'Supporting Acme Technologies with Software Hiring',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export async function readCampaigns(): Promise<OutreachCampaign[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : SEED_CAMPAIGNS;
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DB_FILE, JSON.stringify(SEED_CAMPAIGNS, null, 2), 'utf-8');
    } catch {
      // ignore
    }
    return SEED_CAMPAIGNS;
  }
}

export async function writeCampaigns(campaigns: OutreachCampaign[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
}

export async function findCampaignById(id: string): Promise<OutreachCampaign | null> {
  const campaigns = await readCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export async function findCampaignByEmail(email: string): Promise<OutreachCampaign | null> {
  const campaigns = await readCampaigns();
  const clean = email.trim().toLowerCase();
  return campaigns.find(c => c.email.trim().toLowerCase() === clean) || null;
}

export async function saveCampaign(campaign: OutreachCampaign): Promise<OutreachCampaign> {
  const campaigns = await readCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = { ...campaign, updatedAt: new Date().toISOString() };
  } else {
    campaigns.unshift({ ...campaign, updatedAt: new Date().toISOString() });
  }
  await writeCampaigns(campaigns);
  return campaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const campaigns = await readCampaigns();
  const filtered = campaigns.filter(c => c.id !== id);
  if (filtered.length !== campaigns.length) {
    await writeCampaigns(filtered);
    return true;
  }
  return false;
}

export async function addHistoryEvent(campaignId: string, event: Omit<EmailHistoryEvent, 'id'>): Promise<void> {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) return;
  const newEvent: EmailHistoryEvent = {
    ...event,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };
  campaign.history = [newEvent, ...(campaign.history || [])];
  campaign.lastActivity = event.title;
  campaign.lastActivityTimestamp = event.timestamp;
  campaign.updatedAt = new Date().toISOString();
  await saveCampaign(campaign);
}
