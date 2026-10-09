'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const email = searchParams.get('email') || '';
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center relative overflow-hidden">
        {/* Top accent badge */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {success ? (
          <div className="space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                You Have Been Unsubscribed
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {email ? (
                  <>
                    <span className="font-semibold text-slate-800">{email}</span> has been permanently removed from our outreach list.
                  </>
                ) : (
                  'Your email address has been permanently removed from our outreach list.'
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Opt-out Guarantee</span>
              </div>
              <p>
                You will not receive any further automated follow-ups or marketing correspondence from our team. Your preferences have been saved immediately.
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              TaskNera Solutions &bull; Privacy & Deliverability Standards
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Email Preferences
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {error === 'invalid_token'
                  ? 'The unsubscribe link appears to be invalid or expired. Please check the original email or contact us directly.'
                  : 'Manage your communication preferences with TaskNera.'}
              </p>
            </div>

            <div className="pt-4">
              <a
                href="mailto:operations@tasknera.com?subject=Unsubscribe%20Request"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Privacy Team
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
