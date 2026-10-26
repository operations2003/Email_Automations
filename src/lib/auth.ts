import { AuthUser } from '@/types/auth';
import { getDb } from './mongodb';

// System Roles & Credentials (configurable via environment variables for secure production)
export const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'sheetalbedi@tasknera.com',
  password: process.env.ADMIN_PASSWORD || 'tasknera@2003',
  name: process.env.ADMIN_NAME || 'Sheetal Bedi',
  role: 'admin' as const,
};

export const EMPLOYEE_CREDENTIALS = {
  email: process.env.EMPLOYEE_EMAIL || 'atul@tasknera.com',
  password: process.env.EMPLOYEE_PASSWORD || 'atul@1010',
  name: process.env.EMPLOYEE_NAME || 'Atul',
  role: 'employee' as const,
};

// Alternative employee credentials
export const DEFAULT_EMPLOYEE_CREDENTIALS = {
  email: process.env.DEFAULT_EMPLOYEE_EMAIL || 'employee@tasknera.com',
  password: process.env.DEFAULT_EMPLOYEE_PASSWORD || 'employee@2003',
  name: 'TaskNera Team Member',
  role: 'employee' as const,
};

export async function validateCredentials(email: string, password: string): Promise<AuthUser | null> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check Hardcoded Admin
  if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
    return {
      id: 'usr-admin-001',
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
  }

  // 2. Check Primary Hardcoded Employee (Atul)
  if (cleanEmail === EMPLOYEE_CREDENTIALS.email.toLowerCase() && password === EMPLOYEE_CREDENTIALS.password) {
    return {
      id: 'usr-emp-atul',
      email: EMPLOYEE_CREDENTIALS.email,
      name: EMPLOYEE_CREDENTIALS.name,
      role: 'employee',
      createdAt: new Date().toISOString()
    };
  }

  // 3. Check Alternative Employee
  if (cleanEmail === DEFAULT_EMPLOYEE_CREDENTIALS.email.toLowerCase() && password === DEFAULT_EMPLOYEE_CREDENTIALS.password) {
    return {
      id: 'usr-emp-001',
      email: DEFAULT_EMPLOYEE_CREDENTIALS.email,
      name: DEFAULT_EMPLOYEE_CREDENTIALS.name,
      role: 'employee',
      createdAt: new Date().toISOString()
    };
  }

  // 3. Check MongoDB Atlas `users` collection if any additional team members were added
  try {
    const db = await getDb();
    if (db) {
      const col = db.collection('users');
      const userDoc = await col.findOne({ email: cleanEmail });
      if (userDoc && (userDoc.password === password || userDoc.passwordHash === password)) {
        return {
          id: userDoc.id || userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name || 'Employee',
          role: userDoc.role === 'admin' ? 'admin' : 'employee',
          createdAt: userDoc.createdAt || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('[Auth] Database user query fallback:', err);
  }

  return null;
}

export function createAuthToken(user: AuthUser): string {
  const payload = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(jsonStr);
    if (data.exp && Date.now() > data.exp) {
      return null;
    }
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role
    };
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: Request): AuthUser | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return verifyAuthToken(token);
    }
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match && match[1]) {
      return verifyAuthToken(decodeURIComponent(match[1]));
    }
  } catch {
    // ignore
  }
  return null;
}
