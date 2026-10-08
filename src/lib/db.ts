import fs from 'fs/promises';
import path from 'path';
import { OutreachCampaign, EmailHistoryEvent } from '@/types/outreach';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'outreach.json');

// Initial seed campaigns to showcase the application immediately
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
    initialSentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    followUp1Subject: 'Resources & capacity for SIXT Research & Development India',
    followUp1Body: `Hi Sumit,\n\nSharing a quick follow-up to my earlier message regarding our support for SIXT Research & Development India.\n\nWe maintain a live roster of senior engineers who are available immediately for full-time or fractional support.\n\nDoes your schedule allow a quick 10-minute touchpoint this week?`,
    followUp1ScheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1SentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    followUp2Subject: 'Specific use case for SIXT Research & Development India',
    followUp2Body: `Hi Sumit,\n\nOne of our partners cut their technical recruitment costs by 45% while decreasing time-to-hire from 7 weeks to 6 days.\n\nHappy to share a 2-minute overview if you'd like a quick look.`,
    followUp2ScheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Due very soon today!
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
    initialSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    followUp1Subject: 'Quick follow-up regarding Acme Technologies',
    followUp1Body: `Hi Priya,\n\nI wanted to float my previous note back to your radar in case it slipped through during a busy week.\n\nIn addition to on-demand developers, we also offer trial periods where you evaluate engineer work before committing to long-term engagements.\n\nDoes your schedule allow a quick 10-minute touchpoint this week?`,
    followUp1ScheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
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
  },
  {
    id: 'camp-cloudscale-003',
    companyName: 'CloudScale Systems',
    email: 'cto@cloudscale.io',
    ccEmails: 'sales@mycompany.com',
    reason: 'Introduce our software product to automate cloud DevOps pipelines.',
    recipientName: 'Marcus Vance',
    companyWebsite: 'https://cloudscalesys.internal',
    notes: 'DevOps automation focus.',
    initialSubject: 'Modernizing Workflow Efficiency at CloudScale Systems',
    initialEmailBody: `Hi Marcus,\n\nWe built our platform specifically to eliminate repetitive manual overhead for fast-moving companies like CloudScale Systems.\n\nSpecifically regarding our focus: delivering dedicated support to automate cloud DevOps pipelines. Teams using our platform report a 40% reduction in turnaround times along with comprehensive audit transparency.\n\nDoes your calendar have 10 minutes open early next week for a zero-obligation discussion?`,
    initialSentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1Subject: 'Brief check-in regarding CloudScale Systems',
    followUp1Body: `Hi Marcus,\n\nI know how quickly inboxes fill up, so I wanted to touch back briefly on the note I sent a couple of days ago.\n\nWe recently released an interactive sandbox demo that showcases the workflow improvements in under 3 minutes.\n\nWould you be interested in a 5-minute chat to discuss?`,
    followUp1ScheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1SentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    followUp2Subject: 'Specific use case for CloudScale Systems',
    followUp2Body: `Hi Marcus,\n\nA common question we hear from technical teams: how complex is the deployment? Setup is literally single-click and runs alongside your current stack without conflicts.\n\nHappy to share a 2-minute overview if you'd like a quick look.`,
    followUp2ScheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    followUp2SentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    followUp3Subject: 'Closing the loop for CloudScale Systems',
    followUp3Body: `Hi Marcus,\n\nI wanted to make one final attempt to connect regarding our support for CloudScale Systems. If this isn’t a priority right now, no problem at all—I will close out my notes. Wishing you and CloudScale Systems continued success.`,
    followUp3ScheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    followUp3SentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed - No Response',
    replyStatus: 'Not Replied',
    lastActivity: 'All 3 Follow-Ups completed without reply',
    lastActivityTimestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-cs-1',
        type: 'initial_sent',
        title: 'Initial Outreach Sent',
        description: 'Initial pitch sent.',
        subject: 'Modernizing Workflow Efficiency at CloudScale Systems',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-cs-2',
        type: 'followup_1_sent',
        title: 'Follow-Up 1 Sent',
        description: 'First follow-up sent after 2 days.',
        subject: 'Brief check-in regarding CloudScale Systems',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-cs-3',
        type: 'followup_2_sent',
        title: 'Follow-Up 2 Sent',
        description: 'Second follow-up sent after 4 days.',
        subject: 'Specific use case for CloudScale Systems',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-cs-4',
        type: 'followup_3_sent',
        title: 'Follow-Up 3 Sent',
        description: 'Final loop closed after 6 days.',
        subject: 'Closing the loop for CloudScale Systems',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'camp-finovate-004',
    companyName: 'Finovate Labs',
    email: 'partnerships@finovate.com',
    ccEmails: 'bd@mycompany.com',
    reason: 'Partnership opportunity in AI compliance validation.',
    recipientName: 'Elena Rostova',
    companyWebsite: 'https://finovate-labs.io',
    notes: 'Replied positively! Follow-up sequence automatically halted.',
    initialSubject: 'Exploring a Strategic Collaboration with Finovate Labs',
    initialEmailBody: `Hi Elena,\n\nThere is a natural overlap between what our respective organizations focus on in the current market landscape.\n\nSpecifically regarding our focus: delivering dedicated support to explore partnership opportunity in AI compliance validation. We bring specialized technical execution while complementing Finovate Labs’s established client relationships and domain authority.\n\nWould you be open to a brief 10-minute introductory call this Thursday or Friday?`,
    initialSentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1Subject: 'Additional thought for Finovate Labs',
    followUp1Body: `Hi Elena,\n\nReaching back out with a quick additional perspective on how we help organizations like Finovate Labs.\n\nWe have prepared a preliminary one-pager highlighting where our mutual services complement each other.\n\nAre you open to a brief conversation this Friday?`,
    followUp1ScheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    followUp1SentAt: null, // Cancelled because they replied before sending!
    followUp2Subject: '',
    followUp2Body: '',
    followUp2ScheduledAt: null,
    followUp2SentAt: null,
    followUp3Subject: '',
    followUp3Body: '',
    followUp3ScheduledAt: null,
    followUp3SentAt: null,
    status: 'Follow-Up Paused',
    replyStatus: 'Replied',
    lastActivity: 'Recipient replied: "Hi Swati, let\'s speak next Tuesday."',
    lastActivityTimestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'hist-fin-1',
        type: 'initial_sent',
        title: 'Initial Outreach Sent',
        description: 'Sent to partnerships@finovate.com.',
        subject: 'Exploring a Strategic Collaboration with Finovate Labs',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-fin-2',
        type: 'reply_received',
        title: 'Inbound Reply Received',
        description: 'Recipient replied to outreach. Automated follow-ups automatically paused.',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

import { getDb } from './mongodb';

export async function readCampaigns(): Promise<OutreachCampaign[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<OutreachCampaign>('campaigns');
      const count = await col.countDocuments();
      if (count === 0) {
        // Seed database
        await col.insertMany(SEED_CAMPAIGNS as any);
        return SEED_CAMPAIGNS;
      }
      const docs = await col.find({}).sort({ updatedAt: -1, createdAt: -1 }).toArray();
      // Remove mongo _id from objects to conform strictly to OutreachCampaign type
      return docs.map(({ _id, ...rest }: any) => rest as OutreachCampaign);
    }
  } catch (err) {
    console.warn('[DB] MongoDB read failed, falling back to local file storage:', err);
  }

  // Fallback to local file storage
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
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('campaigns');
      await col.deleteMany({});
      if (campaigns.length > 0) {
        await col.insertMany(campaigns as any);
      }
      return;
    }
  } catch (err) {
    console.warn('[DB] MongoDB bulk write failed, using local file storage:', err);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(campaigns, null, 2), 'utf-8');
}

export async function findCampaignById(id: string): Promise<OutreachCampaign | null> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<OutreachCampaign>('campaigns');
      const doc = await col.findOne({ id } as any);
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as OutreachCampaign;
      }
      return null;
    }
  } catch (err) {
    console.warn('[DB] MongoDB findById failed, falling back to local:', err);
  }

  const campaigns = await readCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export async function findCampaignByEmail(email: string): Promise<OutreachCampaign | null> {
  const clean = email.trim().toLowerCase();
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<OutreachCampaign>('campaigns');
      const doc = await col.findOne({ email: { $regex: new RegExp(`^${clean}$`, 'i') } } as any);
      if (doc) {
        const { _id, ...rest } = doc as any;
        return rest as OutreachCampaign;
      }
      return null;
    }
  } catch (err) {
    console.warn('[DB] MongoDB findByEmail failed, falling back to local:', err);
  }

  const campaigns = await readCampaigns();
  return campaigns.find(c => c.email.trim().toLowerCase() === clean) || null;
}

export async function saveCampaign(campaign: OutreachCampaign): Promise<OutreachCampaign> {
  const updatedCampaign: OutreachCampaign = {
    ...campaign,
    updatedAt: new Date().toISOString()
  };

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('campaigns');
      await col.updateOne(
        { id: campaign.id },
        { $set: updatedCampaign },
        { upsert: true }
      );
      return updatedCampaign;
    }
  } catch (err) {
    console.warn('[DB] MongoDB saveCampaign failed, falling back to local:', err);
  }

  const campaigns = await readCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = updatedCampaign;
  } else {
    campaigns.unshift(updatedCampaign);
  }
  await writeCampaigns(campaigns);
  return updatedCampaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('campaigns');
      const res = await col.deleteOne({ id } as any);
      return res.deletedCount > 0;
    }
  } catch (err) {
    console.warn('[DB] MongoDB deleteCampaign failed, falling back to local:', err);
  }

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
