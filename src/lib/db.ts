import fs from 'fs/promises';
import path from 'path';
import { OutreachCampaign, EmailHistoryEvent } from '@/types/outreach';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'outreach.json');

// Production clean initial campaigns list (empty for clean user entry)
const SEED_CAMPAIGNS: OutreachCampaign[] = [];

import { getDb } from './mongodb';

export async function readCampaigns(): Promise<OutreachCampaign[]> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<OutreachCampaign>('campaigns');
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch {
      // ignore
    }
    return [];
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
