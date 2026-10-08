'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/types/outreach';
import {
  Settings as SettingsIcon,
  Save,
  Check,
  Key,
  Mail,
  User,
  Clock,
  RefreshCw,
  Database
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
  const [testingDb, setTestingDb] = useState(false);
  const [dbResult, setDbResult] = useState<{
    tested: boolean;
    connected: boolean;
    latencyMs?: number | null;
    databaseName?: string;
    collections?: string[];
    campaignsCount?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const testDatabase = async () => {
    setTestingDb(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbResult({
        tested: true,
        connected: Boolean(data?.database?.connected),
        latencyMs: data?.database?.latencyMs,
        databaseName: data?.database?.databaseName,
        collections: data?.database?.collections,
        campaignsCount: data?.database?.campaignsCount,
        error: data?.database?.error
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error testing database';
      setDbResult({
        tested: true,
        connected: false,
        error: message
      });
    } finally {
      setTestingDb(false);
    }
  };

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

        {/* Database Connectivity & Persistence Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              Database Connectivity & Storage
            </h3>
            <button
              type="button"
              onClick={testDatabase}
              disabled={testingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {testingDb ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              ) : (
                <Database className="h-3.5 w-3.5 text-emerald-400" />
              )}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Primary Database</span>
              <p className="font-semibold text-slate-200">MongoDB Atlas</p>
              <p className="text-[10px] text-slate-500 font-mono">cluster0.2ba7uww.mongodb.net</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Database Name</span>
              <p className="font-semibold text-slate-200 font-mono">tasknera</p>
              <p className="text-[10px] text-slate-500">Dual-layer auto fallback to local JSON</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Persistence</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">Automatic Cloud Sync</span>
              </div>
              <p className="text-[10px] text-slate-500">Live data writes to MongoDB with offline protection</p>
            </div>
          </div>

          {dbResult?.tested && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                dbResult.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    dbResult.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <p className="font-semibold">
                    {dbResult.connected
                      ? `Successfully connected to MongoDB Atlas (${dbResult.databaseName || 'tasknera'})`
                      : 'MongoDB connection offline. Utilizing local JSON filesystem storage.'}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {dbResult.connected
                      ? `Latency: ${dbResult.latencyMs ?? 0}ms • Collections: ${dbResult.collections?.join(', ') || 'none'} • Campaigns: ${dbResult.campaignsCount ?? 0}`
                      : `Details: ${dbResult.error || 'Server selection timeout'}`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/50">
                {dbResult.connected ? 'Verified' : 'Fallback'}
              </span>
            </div>
          )}
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
