'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRoleDemo: (role: 'admin' | 'employee') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'autoreach_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage or verify with /api/auth/me
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Try localStorage first for instant UI paint
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.email && mounted) {
              setUser(parsed);
            }
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }

        // Verify with server session
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && mounted) {
            setUser(data.user);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
          }
        } else if (res.status === 401 && !cached && mounted) {
          // If no session exists, default to Admin for seamless first-load or let user login
          // We will require explicit login so the RBAC is obvious and functional
        }
      } catch (err) {
        console.warn('[Auth] Session check error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const switchRoleDemo = useCallback(async (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      await login('sheetalbedi@tasknera.com', 'tasknera@2003');
    } else {
      await login('atul@tasknera.com', 'atul@1010');
    }
  }, [login]);

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isEmployee,
        login,
        logout,
        switchRoleDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
