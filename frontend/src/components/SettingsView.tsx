'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/types/outreach';
import {
  Settings as SettingsIcon,
  Save,
  Check,
  Shield,
  Key,
  Mail,
  User,
  Building2,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<AppSettings> = { ...formData };
      if (customApiKey.trim()) {
        payload.openAiApiKey = customApiKey.trim();
      }
      await onUpdateSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">System Settings & Defaults</h2>
            <p className="text-xs text-slate-400">
              Configure your sender identity, reusable email signature, AI persona tone, and schedule intervals.
            </p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <Check className="h-4 w-4" />
            Settings Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender Identity Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            Sender Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Sender Name
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={e => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Your Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Default Keep in CC
              </label>
              <input
                type="text"
                value={formData.defaultCc}
                onChange={e => setFormData({ ...formData, defaultCc: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Email Signature Section (Section 27) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-400" />
              Reusable Email Signature
            </h3>
            <span className="text-[11px] text-slate-400">
              Appended automatically without AI alterations
            </span>
          </div>

          <textarea
            rows={5}
            value={formData.emailSignature}
            onChange={e => setFormData({ ...formData, emailSignature: e.target.value })}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed whitespace-pre-line"
          />
          <p className="text-[11px] text-slate-500">
            This exact signature will be appended to every initial and follow-up email sent.
          </p>
        </div>

        {/* Schedule & Follow-Up Rules (Section 26) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            Follow-Up Automation Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Follow-Up Interval (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.followUpIntervalDays}
                onChange={e =>
                  setFormData({ ...formData, followUpIntervalDays: parseInt(e.target.value) || 2 })
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default: 2 days (Day 0 → 2 → 4 → 6)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Maximum Follow-Ups
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.maxFollowUps}
                onChange={e =>
                  setFormData({ ...formData, maxFollowUps: parseInt(e.target.value) || 3 })
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default: exactly 3 follow-ups</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Default AI Tone
              </label>
              <select
                value={formData.aiTone}
                onChange={e =>
                  setFormData({
                    ...formData,
                    aiTone: e.target.value as AppSettings['aiTone']
                  })
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Professional">Professional & Direct</option>
                <option value="Consultative">Consultative & Value-Focused</option>
                <option value="Direct">Direct & Concise</option>
                <option value="Friendly">Friendly & Collaborative</option>
                <option value="Persuasive">Persuasive & Growth-Oriented</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Guarantees human, non-spammy phrasing</p>
            </div>
          </div>
        </div>

        {/* AI & Delivery Engine Configuration */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-400" />
            AI & Email Delivery Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                OpenAI API Key (Optional)
              </label>
              <input
                type="password"
                placeholder={
                  formData.openAiApiKey
                    ? `Current Key: ${formData.openAiApiKey}`
                    : 'sk-... (Leave empty to use built-in smart AI engine)'
                }
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Protected server-side. The app also includes an intelligent local generative variation engine that runs out of the box with zero setup!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Dispatch Provider
              </label>
              <select
                value={formData.provider}
                onChange={e =>
                  setFormData({
                    ...formData,
                    provider: e.target.value as AppSettings['provider']
                  })
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="simulated">Simulated Sandbox (Immediate delivery log)</option>
                <option value="resend">Resend API (Live production delivery)</option>
                <option value="smtp">Custom SMTP Server</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Sandbox mode records delivery timestamps, headers, and logs safely without accidental spam.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
