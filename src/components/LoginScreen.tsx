'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  Eye,
  EyeOff
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
      setError(res.error || 'Authentication failed. Please check your email and password.');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen h-screen max-h-screen bg-slate-100/80 text-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none">
      {/* Main Split Card Container */}
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">

        {/* Left Column: Clean Enterprise Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-semibold text-xs tracking-wider">
                TN
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-900 tracking-tight leading-none">TaskNera</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-normal mt-0.5">Outreach Operations</span>
              </div>
            </div>

            {/* Greetings Header */}
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Sign in to manage outbound sequences and client accounts
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span className="truncate">{error}</span>
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="name@tasknera.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setError('Please contact Sheetal Bedi (sheetalbedi@tasknera.com) to reset credentials.')}
                    className="text-slate-500 hover:text-slate-800 transition-colors text-[11px] cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-3 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
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

              {/* Remember Me */}
              <div className="flex items-center text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                  />
                  <span className="text-[11px]">Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-medium text-white shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 mt-1 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <span>Sign in to TaskNera</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>TaskNera Solutions Workspace</span>
              <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Enterprise Context Panel */}
        <div className="hidden lg:flex lg:col-span-6 bg-slate-950 p-8 lg:p-10 flex-col justify-between text-white relative border-l border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Operational Network Live
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-3">
              TaskNera Business Operations Ecosystem
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Unified outbound outreach and client management across human-led support, recruitment intelligence, and HR technologies.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">Virtual Customer Support (VCS)</span>
                <span className="text-[11px] text-slate-400 leading-normal block">Voice, chat, WhatsApp, and SLA-aligned delivery monitoring.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">Recruitment &amp; Talent Acquisition</span>
                <span className="text-[11px] text-slate-400 leading-normal block">End-to-end permanent, contract, and executive hiring pipelines.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">HireIQ ATS + HRMS Platforms</span>
                <span className="text-[11px] text-slate-400 leading-normal block">Automated JD parsing, resume scoring, and employee workflows.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>operations@tasknera.com</span>
            <span>TaskNera Solutions © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
