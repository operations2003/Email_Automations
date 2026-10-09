import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getDb } from './mongodb';

export type SuppressionReason = 'unsubscribed' | 'bounced' | 'complaint' | 'manual';

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  campaignId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (process.platform === 'linux' && process.cwd().startsWith('/var/task'))
);

const DATA_DIR = isServerless ? path.join('/tmp', 'tasknera_data') : path.join(process.cwd(), 'data');
const SUPPRESSION_FILE = path.join(DATA_DIR, 'suppression.json');

// Memory cache fallback
let inMemorySuppressions: SuppressionEntry[] = [];

// App secret for generating secure unsubscribe tokens
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || 'tasknera_unsub_secret_2024';

/**
 * Generates an HMAC-secured unsubscribe token for a recipient
 */
export function generateUnsubscribeToken(email: string, campaignId: string = ''): string {
  const cleanEmail = email.trim().toLowerCase();
  const data = `${cleanEmail}:${campaignId}`;
  const hmac = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(data).digest('hex').substring(0, 32);
  const payload = Buffer.from(JSON.stringify({ email: cleanEmail, campaignId, sig: hmac })).toString('base64url');
  return payload;
}

/**
 * Validates an unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): { valid: boolean; email?: string; campaignId?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const { email, campaignId, sig } = JSON.parse(raw);
    if (!email || !sig) return { valid: false };

    const expected = crypto
      .createHmac('sha256', UNSUBSCRIBE_SECRET)
      .update(`${email}:${campaignId || ''}`)
      .digest('hex')
      .substring(0, 32);

    if (sig === expected) {
      return { valid: true, email, campaignId };
    }
  } catch {
    // ignore parsing failure
  }
  return { valid: false };
}

/**
 * Builds RFC 8058 compliant List-Unsubscribe headers
 */
export function getUnsubscribeHeaders(
  email: string,
  campaignId: string = '',
  baseUrl?: string
): {
  'List-Unsubscribe': string;
  'List-Unsubscribe-Post': string;
} {
  const rawHost = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'tasknera.com';
  const cleanHost = rawHost.trim().replace(/^https?:\/\//, '');
  const host = `https://${cleanHost}`;

  const token = generateUnsubscribeToken(email, campaignId);
  const httpUrl = `${host}/api/unsubscribe?token=${encodeURIComponent(token)}`;
  const mailtoUrl = `mailto:unsubscribe@tasknera.com?subject=Unsubscribe%20${encodeURIComponent(email)}`;

  return {
    'List-Unsubscribe': `<${httpUrl}>, <${mailtoUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
}

/**
 * Checks if an email is suppressed (unsubscribed, bounced, or complaint)
 */
export async function isSuppressed(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;

  // 1. MongoDB
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<SuppressionEntry>('suppressions');
      const found = await col.findOne({ email: clean });
      if (found) return true;
    }
  } catch (err) {
    console.warn('[Suppression] MongoDB check failed, checking fallback:', err);
  }

  // 2. Memory / file fallback
  const list = await getSuppressionList();
  return list.some(entry => entry.email.toLowerCase() === clean);
}

/**
 * Retrieves the full suppression list
 */
export async function getSuppressionList(): Promise<SuppressionEntry[]> {
  // 1. MongoDB
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection<SuppressionEntry>('suppressions');
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
      const mapped = docs.map(({ _id, ...rest }: any) => rest as SuppressionEntry);
      inMemorySuppressions = mapped;
      return mapped;
    }
  } catch (err) {
    console.warn('[Suppression] MongoDB read failed, using fallback:', err);
  }

  // 2. File fallback
  try {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
    const data = await fs.readFile(SUPPRESSION_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      inMemorySuppressions = parsed;
      return parsed;
    }
  } catch {
    // file does not exist yet
  }

  return inMemorySuppressions;
}

/**
 * Adds an email to the suppression list
 */
export async function addToSuppression(
  email: string,
  reason: SuppressionReason,
  campaignId?: string,
  notes?: string
): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return;

  const now = new Date().toISOString();
  const entry: SuppressionEntry = {
    email: clean,
    reason,
    campaignId,
    notes,
    createdAt: now,
    updatedAt: now
  };

  // 1. MongoDB
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('suppressions');
      await col.updateOne(
        { email: clean },
        { $set: entry },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[Suppression] MongoDB upsert failed, using file fallback:', err);
  }

  // 2. Update memory & file
  const list = await getSuppressionList();
  const idx = list.findIndex(e => e.email === clean);
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.unshift(entry);
  }
  inMemorySuppressions = list;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
    await fs.writeFile(SUPPRESSION_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Suppression] File write failed:', err);
  }
}

/**
 * Removes an email from suppression (e.g. manual reactivate)
 */
export async function removeFromSuppression(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  let removed = false;

  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('suppressions');
      const res = await col.deleteOne({ email: clean });
      if (res.deletedCount > 0) removed = true;
    }
  } catch (err) {
    console.warn('[Suppression] MongoDB delete failed:', err);
  }

  const list = await getSuppressionList();
  const filtered = list.filter(e => e.email !== clean);
  if (filtered.length !== list.length) {
    inMemorySuppressions = filtered;
    removed = true;
    try {
      await fs.writeFile(SUPPRESSION_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  return removed;
}
