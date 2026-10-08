'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setError(null);
    setLoading(true);
    const res = await login(targetEmail, targetPass);
    if (!res.success) {
      setError(res.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2 shadow-lg shadow-blue-500/10">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AutoReach AI</h1>
          <p className="text-xs text-gray-400">
            Role-Based Access Control • Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#23272f] bg-[#14171c] p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="name@tasknera.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-[#0d0f12] border border-[#23272f] py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-[#0d0f12] border border-[#23272f] py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Role Selectors */}
          <div className="border-t border-[#23272f] pt-5 space-y-3">
            <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
              Quick Role Sign-In
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() => handleQuickLogin('sheetalbedi@tasknera.com', 'tasknera@2003')}
                className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Sheetal Bedi (Admin)</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                      Full Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate">sheetalbedi@tasknera.com</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Settings, API keys, delete targets & full oversight
                  </p>
                </div>
              </button>

              {/* Employee Card - Atul */}
              <button
                type="button"
                onClick={() => handleQuickLogin('atul@tasknera.com', 'atul@1010')}
                className="flex items-start gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-left transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">Atul (Employee)</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                      Employee
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate">atul@tasknera.com</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Draft, generate, send outreach & record replies
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center">
          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
            <KeyRound className="h-3 w-3" />
            <span>Secure Role-Based Access Control (RBAC) Active</span>
          </p>
        </div>
      </div>
    </div>
  );
}
