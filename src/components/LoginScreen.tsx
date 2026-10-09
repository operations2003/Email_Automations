'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Activity,
  Layers,
  Send,
  Building2
} from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please check your work email and password.');
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
      setError(res.error || 'Authentication failed. Please check credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-slate-900 selection:text-white">
      {/* Background Subtle Dot Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Main Container Card */}
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Form & Access Control (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white z-10">
          <div>
            {/* TaskNera Monogram & Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs tracking-wider shadow-xs">
                  TN
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-900 tracking-tight block leading-none">TaskNera</span>
                  <span className="text-[11px] text-slate-500 font-medium">Enterprise Pipeline Operations</span>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Network Online
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-500">
                Enter your authorized TaskNera workspace credentials to continue.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 mb-5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@tasknera.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setError('Contact Sheetal Bedi (sheetalbedi@tasknera.com) for password resets.')}
                    className="text-slate-500 hover:text-slate-900 transition-colors text-[11px] font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-300 py-2 pl-9 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                  />
                  <span className="text-[11px]">Remember this session</span>
                </label>
                <span className="text-[11px] text-slate-400">TLS 1.3 256-bit AES</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign in to TaskNera</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Role Access Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Authorized Team Fast Access
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sheetalbedi@tasknera.com', 'tasknera@2003')}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-900 block truncate group-hover:text-slate-950">
                      Sheetal Bedi
                    </span>
                    <span className="text-[10px] text-slate-500 block">Administrator</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('atul@tasknera.com', 'atul@1010')}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-900 block truncate group-hover:text-slate-950">
                      Atul
                    </span>
                    <span className="text-[10px] text-slate-500 block">Lead Operations</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>© 2026 TaskNera HR Solutions</span>
            <span>https://tasknera.io</span>
          </div>
        </div>

        {/* Right Column: Sleek Enterprise Pipeline Operations Preview (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-slate-900 p-8 lg:p-10 flex-col justify-between text-white relative border-l border-slate-800">
          {/* Subtle Grid Accent */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* Header Pill */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>SLA Delivery Engine</span>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-white mb-1.5">
                Outreach Pipeline Live Stream
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated multi-stage sequences across VCS, recruitment pipelines, and HR tech solutions.
              </p>
            </div>

            {/* Live Campaign Mock Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-slate-300" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block leading-tight">Apex Retail Global</span>
                    <span className="text-[10px] text-slate-500 font-mono">support@apexretail.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Delivered
                </span>
              </div>

              {/* Sequence Mini Stages */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Sequence Stage:</span>
                  <span className="text-slate-200 font-medium">Stage 1: Introductory VCS Outreach</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Next Action:</span>
                  <span className="text-slate-300 font-mono text-[10px]">Follow-up #1 in 48h</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Assigned Operator:</span>
                  <span className="text-slate-200 font-medium">Atul (Lead Operations)</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                  Delivery SLA
                </span>
                <span className="text-lg font-bold text-white tracking-tight font-mono">99.8%</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Zero bounce
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                  Active Services
                </span>
                <span className="text-lg font-bold text-white tracking-tight font-mono">5 Verticals</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Layers className="h-3 w-3" /> Full lifecycle
                </span>
              </div>
            </div>

            {/* Core Capability Badges */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Virtual Customer Support (VCS) across voice &amp; chat</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>End-to-end recruitment &amp; high-volume talent staffing</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>HireIQ ATS + HRMS digital platforms</span>
              </div>
            </div>
          </div>

          {/* Footer in right column */}
          <div className="relative z-10 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Send className="h-3 w-3 text-slate-500" />
              <span>operations@tasknera.com</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">v2.4.0</span>
          </div>
        </div>

      </div>
    </div>
  );
}
