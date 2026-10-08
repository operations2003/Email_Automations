import fs from 'fs/promises';
import path from 'path';
import { AppSettings, DEFAULT_SERVICES } from '@/types/outreach';
import { getDb } from './mongodb';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'Swati Verma',
  senderEmail: 'swati@tasknera.com',
  defaultCc: 'team@tasknera.com',
  companyName: 'TaskNera Solutions',
  emailSignature: `Best regards,\nSwati Verma\nTaskNera Solutions\nhttps://tasknera.io | swati@tasknera.com`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: 'simulated',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  services: DEFAULT_SERVICES
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('settings');
      const doc = await col.findOne({ key: 'global_app_settings' });
      if (doc) {
        const { _id, key, ...rest } = doc as any;
        const services = rest.services && rest.services.length > 0 ? rest.services : DEFAULT_SERVICES;
        return { ...DEFAULT_SETTINGS, ...rest, services };
      } else {
        // initialize default settings in MongoDB
        await col.insertOne({ key: 'global_app_settings', ...DEFAULT_SETTINGS });
        return DEFAULT_SETTINGS;
      }
    }
  } catch (err) {
    console.warn('[Settings] MongoDB getSettings failed, using fallback:', err);
  }

  // Fallback to local file
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const services = parsed.services && parsed.services.length > 0 ? parsed.services : DEFAULT_SERVICES;
    return { ...DEFAULT_SETTINGS, ...parsed, services };
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...newSettings };

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('settings');
      await col.updateOne(
        { key: 'global_app_settings' },
        { $set: { key: 'global_app_settings', ...updated } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[Settings] MongoDB updateSettings failed:', err);
  }

  // Keep local backup in sync
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  return updated;
}
