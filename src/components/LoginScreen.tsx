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
    <div className="min-h-screen h-screen max-h-screen bg-[#f3f4f8] text-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none">
      {/* Main Split Card Container */}
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-gray-100">

        {/* Left Column: Clean White Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-5 w-2.5 rounded-xs bg-[#7c3aed]" />
              <span className="font-bold text-sm text-gray-900 tracking-tight">AutoReach AI</span>
            </div>

            {/* Greetings Header */}
            <div className="space-y-1 mb-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Hello,<br />
                Welcome Back
              </h1>
              <p className="text-xs text-gray-500 font-normal">
                Sign in to access your company outreach workspace
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 mb-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span className="truncate">{error}</span>
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <input
                  type="email"
                  required
                  placeholder="name@tasknera.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 py-2.5 px-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-colors"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white border border-gray-200 py-2.5 pl-3.5 pr-10 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#7c3aed] focus:ring-0 cursor-pointer accent-[#7c3aed]"
                  />
                  <span className="text-[11px]">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setError('Please contact your administrator (sheetalbedi@tasknera.com) to reset your credentials.')}
                  className="text-gray-400 hover:text-[#7c3aed] transition-colors text-[11px] cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Solid Purple Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow transition-all active:scale-[0.99] disabled:opacity-50 mt-1 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Footer with Sign Up */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                className="text-[#7c3aed] font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Solid Purple Illustration Container - Nothing Extra */}
        <div className="hidden lg:flex lg:col-span-6 bg-[#7c3aed] p-6 lg:p-8 items-center justify-center overflow-hidden rounded-r-3xl relative">
          <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden shadow-lg bg-[#7c3aed]">
            <Image
              src="/auth-banner.jpg"
              alt="AutoReach AI Security and Authentication"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
