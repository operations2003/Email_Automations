import fs from 'fs/promises';
import path from 'path';
import { AppSettings } from '@/types/outreach';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'Swati Verma',
  senderEmail: 'swati@tasknera.com',
  defaultCc: 'sales@mycompany.com',
  companyName: 'TaskNera Solutions',
  emailSignature: `Best regards,\nSwati Verma\nBusiness Development & Partnerships\nTaskNera Solutions\nDirect: +1 (555) 349-8821 | https://tasknera.io`,
  aiTone: 'Professional',
  followUpIntervalDays: 2,
  maxFollowUps: 3,
  provider: 'simulated',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    // If not exists, save defaults and return
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
