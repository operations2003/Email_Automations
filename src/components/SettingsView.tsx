'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, OutreachService, DEFAULT_SERVICES, OutreachCampaign } from '@/types/outreach';
import { useAuth } from '@/context/AuthContext';
import {
  Save,
  Check,
  Key,
  Mail,
  User,
  Clock,
  RefreshCw,
  Database,
  Send,
  AlertTriangle,
  Info,
  Server,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  Building2,
  Users,
  UserCheck,
  ListPlus,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Activity,
  Ban,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  campaigns?: OutreachCampaign[];
  onRefreshCampaigns?: () => void;
}

export function SettingsView({ settings, onUpdateSettings, campaigns = [], onRefreshCampaigns }: SettingsViewProps) {
  const { isAdmin } = useAuth();
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

  // Test Email state
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

// Custom Services state
  const [showAddService, setShowAddService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    name: string;
    icon: string;
    tagline: string;
    pitch: string;
  }>({
    name: '',
    icon: '🚀',
    tagline: '',
    pitch: ''
  });



  const currentServices: OutreachService[] =
    formData.services && formData.services.length > 0
      ? formData.services
      : DEFAULT_SERVICES;

  const handleStartAddService = () => {
    setEditingServiceId(null);
    setServiceForm({
      name: '',
      icon: '🚀',
      tagline: '',
      pitch: ''
    });
    setShowAddService(true);
  };

  const handleStartEditService = (service: OutreachService) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      icon: service.icon || '🚀',
      tagline: service.tagline || '',
      pitch: service.pitch
    });
    setShowAddService(true);
  };

  const handleCancelServiceForm = () => {
    setShowAddService(false);
    setEditingServiceId(null);
    setServiceForm({
      name: '',
      icon: '🚀',
      tagline: '',
      pitch: ''
    });
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim() || !serviceForm.pitch.trim()) {
      return;
    }

    if (editingServiceId) {
      const updated = currentServices.map(s =>
        s.id === editingServiceId
          ? {
              ...s,
              name: serviceForm.name.trim(),
              icon: serviceForm.icon.trim() || '🚀',
              tagline: serviceForm.tagline.trim(),
              pitch: serviceForm.pitch.trim()
            }
          : s
      );
      setFormData(prev => ({ ...prev, services: updated }));
    } else {
      const newService: OutreachService = {
        id: 'srv_' + Math.random().toString(36).substring(2, 9),
        name: serviceForm.name.trim(),
        icon: serviceForm.icon.trim() || '🚀',
        tagline: serviceForm.tagline.trim(),
        pitch: serviceForm.pitch.trim(),
        isDefault: false
      };
      setFormData(prev => ({
        ...prev,
        services: [...currentServices, newService]
      }));
    }

    handleCancelServiceForm();
  };

  const handleDeleteService = (id: string) => {
    const updated = currentServices.filter(s => s.id !== id);
    setFormData(prev => ({ ...prev, services: updated }));
    if (editingServiceId === id) {
      handleCancelServiceForm();
    }
  };

  const handleResetServices = () => {
    setFormData(prev => ({ ...prev, services: DEFAULT_SERVICES }));
    handleCancelServiceForm();
  };

  useEffect(() => {
    setFormData(settings);
    if (!testEmailTo && settings.senderEmail) {
      setTestEmailTo(settings.senderEmail);
    }
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

  const applyPreset = (type: 'gmail' | 'outlook' | 'custom') => {
    if (type === 'gmail') {
      setFormData(prev => ({
        ...prev,
        provider: 'smtp',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: prev.smtpUser || prev.senderEmail || ''
      }));
    } else if (type === 'outlook') {
      setFormData(prev => ({
        ...prev,
        provider: 'smtp',
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: prev.smtpUser || prev.senderEmail || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        provider: 'smtp',
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false
      }));
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

  const handleSendTestEmail = async () => {
    if (!testEmailTo) {
      setTestResult({ success: false, message: 'Please enter an email address to send the test to.' });
      return;
    }

    setTestingEmail(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailTo,
          settingsOverride: formData
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Test email sent! Check your inbox.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Could not send test email.'
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setTestResult({
        success: false,
        message: error.message || 'Could not send test email.'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Set your sender info, email connection (Gmail / SMTP), and follow-up timing.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-xs">
            <Check className="h-3.5 w-3.5" />
            Settings saved
          </div>
        )}
      </div>

      {/* Provider Status Alert */}
      {formData.provider === 'simulated' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Test Sandbox Mode is Active</p>
            <p className="text-amber-800 mt-0.5 text-[11px] leading-relaxed">
              Emails are simulated and saved internally for review. No emails are dispatched to external recipients. Select <strong>Gmail / SMTP</strong> below and save to enable live dispatch.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Live Email Sending Active ({formData.provider.toUpperCase()})</p>
            <p className="text-emerald-800 mt-0.5 text-[11px]">
              Configured for direct email dispatch to target prospect inboxes.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Delivery Provider */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-700" />
            Dispatch &amp; Transmission Method
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Provider
            </label>
            <select
              value={formData.provider}
              onChange={e =>
                setFormData({
                  ...formData,
                  provider: e.target.value as AppSettings['provider']
                })
              }
              className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="simulated">Test Sandbox (Local Simulation — no outbound dispatch)</option>
              <option value="smtp">Google Workspace / SMTP (Direct outbound dispatch)</option>
              <option value="resend">Resend API (Live API delivery)</option>
            </select>
          </div>

          {/* SMTP Fields */}
          {formData.provider === 'smtp' && (
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Quick configuration presets:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Google Workspace / Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Outlook / Office 365
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('custom')}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Server</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={formData.smtpHost || ''}
                    onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                    <input
                      type="number"
                      placeholder="465"
                      value={formData.smtpPort || 465}
                      onChange={e => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 465 })}
                      className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Security</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.smtpSecure ?? true}
                        onChange={e => setFormData({ ...formData, smtpSecure: e.target.checked })}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 accent-slate-900"
                      />
                      <span className="text-xs text-slate-700 font-medium">SSL / TLS Enabled</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outbound User Email</label>
                  <input
                    type="text"
                    placeholder="operations@tasknera.com"
                    value={formData.smtpUser || ''}
                    onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">App Password / SMTP Password</label>
                    {formData.smtpPass === '••••••••' && (
                      <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ● Configured
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={formData.smtpPass === '••••••••' ? '•••••••• (Configured — enter new to replace)' : 'Enter 16-character App Password (or via EMAIL_PASSWORD)'}
                    value={formData.smtpPass === '••••••••' ? '' : (formData.smtpPass || '')}
                    onChange={e => setFormData({ ...formData, smtpPass: e.target.value })}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Can also be loaded securely from <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">EMAIL_PASSWORD</code> environment variable.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-700 flex items-start gap-2.5 border border-slate-200">
                <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-slate-900">Google Workspace (@tasknera.com) &amp; Gmail Requirement:</strong> Google requires a 16-character <strong>App Password</strong> (e.g. <code>abcd efgh ijkl mnop</code>) for automated SMTP email sending. If your standard password is not accepted, generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline text-slate-900 font-semibold">myaccount.google.com/apppasswords</a> and paste it above.
                </span>
              </div>
            </div>
          )}

          {/* Resend Fields */}
          {formData.provider === 'resend' && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resend API Key</label>
              <input
                type="password"
                placeholder="re_..."
                value={formData.resendApiKey || ''}
                onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>
          )}

          {/* Test Email */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Verify Outbound Dispatch
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="test-recipient@domain.com"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                className="flex-1 rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !testEmailTo}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
              >
                {testingEmail ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2.5 rounded-lg border p-3 text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="text-[11px] font-medium">{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sender Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-slate-700" />
            Sender Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Name</label>
              <input
                type="text"
                value={formData.senderName}
                onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email</label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={e => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default CC Address</label>
              <input
                type="text"
                value={formData.defaultCc}
                onChange={e => setFormData({ ...formData, defaultCc: e.target.value })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-700" />
            Email Signature
          </h3>
          <p className="text-[11px] text-slate-500">
            Automatically appended to dispatched outreach and follow-up emails.
          </p>
          <textarea
            rows={4}
            value={formData.emailSignature}
            onChange={e => setFormData({ ...formData, emailSignature: e.target.value })}
            className="w-full rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none whitespace-pre-line leading-relaxed font-sans"
          />
        </div>
        {/* Custom Services & Offerings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-700" />
                Services &amp; Offerings
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure service definitions used for topic matching and cold outreach pitches.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetServices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
                title="Reset to default TaskNera services"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleStartAddService}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="h-3 w-3" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* Inline Add / Edit Form */}
          {showAddService && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-700" />
                  {editingServiceId ? 'Edit Service Definition' : 'Add New Service Definition'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Virtual Customer Support (VCS)"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Label Icon
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="TN"
                    value={serviceForm.icon}
                    onChange={e => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 text-center text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated, human-led customer support teams across omni-channel workflows"
                  value={serviceForm.tagline}
                  onChange={e => setServiceForm({ ...serviceForm, tagline: e.target.value })}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Outreach Goal &amp; Standard Pitch <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. TaskNera provides dedicated, human-led customer support across voice, live chat, email, and WhatsApp..."
                  value={serviceForm.pitch}
                  onChange={e => setServiceForm({ ...serviceForm, pitch: e.target.value })}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={!serviceForm.name.trim() || !serviceForm.pitch.trim()}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {editingServiceId ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </div>
          )}

          {/* Current Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentServices.map(service => (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-slate-700">{service.icon || 'TN'}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{service.name}</h4>
                        {service.tagline && (
                          <p className="text-[10px] text-slate-500 font-medium">{service.tagline}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditService(service)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                        title="Edit service"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                    {service.pitch}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
