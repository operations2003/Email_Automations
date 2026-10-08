import fs from 'fs/promises';
import path from 'path';
import { AppSettings, DEFAULT_SERVICES } from '@/types/outreach';
import { getDb } from './mongodb';

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (process.platform === 'linux' && process.cwd().startsWith('/var/task'))
);

const DATA_DIR = isServerless ? path.join('/tmp', 'tasknera_data') : path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BUNDLED_SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'TaskNera Operations',
  senderEmail: 'operations@tasknera.com',
  defaultCc: 'operations@tasknera.com',
  companyName: 'TaskNera Solutions',
  emailSignature: `Best regards,\nOperations Team\nTaskNera Solutions\nhttps://tasknera.io | operations@tasknera.com`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: 'operations@tasknera.com',
  smtpPass: 'jkzn vahv blrc irdy',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  services: DEFAULT_SERVICES
};

let inMemorySettings: AppSettings = { ...DEFAULT_SETTINGS };

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('settings');
      const doc = await col.findOne({ key: 'global_app_settings' });
      if (doc) {
        const { _id, key, ...rest } = doc as any;
        const services = rest.services && rest.services.length > 0 ? rest.services : DEFAULT_SERVICES;
        inMemorySettings = { ...DEFAULT_SETTINGS, ...rest, services };
        return inMemorySettings;
      } else {
        // initialize default settings in MongoDB
        await col.insertOne({ key: 'global_app_settings', ...DEFAULT_SETTINGS }).catch(() => {});
        return DEFAULT_SETTINGS;
      }
    }
  } catch (err) {
    console.warn('[Settings] MongoDB getSettings failed, using fallback:', err);
  }

  // Fallback to writable file
  try {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const services = parsed.services && parsed.services.length > 0 ? parsed.services : DEFAULT_SERVICES;
    inMemorySettings = { ...DEFAULT_SETTINGS, ...parsed, services };
    return inMemorySettings;
  } catch {
    // If on serverless, attempt to read bundled settings.json
    if (isServerless) {
      try {
        const bundled = await fs.readFile(BUNDLED_SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(bundled);
        const services = parsed.services && parsed.services.length > 0 ? parsed.services : DEFAULT_SERVICES;
        inMemorySettings = { ...DEFAULT_SETTINGS, ...parsed, services };
        return inMemorySettings;
      } catch {
        // ignore
      }
    }
    return inMemorySettings;
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
