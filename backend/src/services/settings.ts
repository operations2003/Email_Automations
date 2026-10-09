import fs from 'fs/promises';
import path from 'path';
import { AppSettings, DEFAULT_SETTINGS } from '../types/outreach.js';
import { getMongoDb } from './mongodb.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function applyEnvOverrides(settings: AppSettings): AppSettings {
  if (process.env.RESEND_API_KEY) {
    if (!settings.resendApiKey || settings.provider === 'simulated') {
      settings.resendApiKey = process.env.RESEND_API_KEY;
      settings.provider = 'resend';
    }
  }
  if (process.env.EMAIL_FROM) {
    settings.senderEmail = process.env.EMAIL_FROM;
  }
  return settings;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection('settings');
      const doc = await col.findOne({ key: 'global_app_settings' });
      if (doc) {
        const { _id, key, ...rest } = doc as any;
        return applyEnvOverrides({ ...DEFAULT_SETTINGS, ...rest });
      } else {
        const initial = applyEnvOverrides({ ...DEFAULT_SETTINGS });
        await col.insertOne({ key: 'global_app_settings', ...initial });
        return initial;
      }
    }
  } catch (err) {
    console.warn('[Backend Settings] MongoDB getSettings failed, using fallback:', err);
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return applyEnvOverrides({ ...DEFAULT_SETTINGS, ...parsed });
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    } catch {
      // ignore
    }
    return applyEnvOverrides({ ...DEFAULT_SETTINGS });
  }
}

export async function updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...newSettings };

  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection('settings');
      await col.updateOne(
        { key: 'global_app_settings' },
        { $set: { key: 'global_app_settings', ...updated } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[Backend Settings] MongoDB updateSettings failed:', err);
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  return updated;
}
