'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, OutreachService, DEFAULT_SERVICES } from '@/types/outreach';
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
  Sparkles
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
      <div className="flex items-center justify-between pb-3 border-b border-[#23272f]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Set your sender info, email connection (Gmail / SMTP), and follow-up timing.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <Check className="h-3.5 w-3.5" />
            Settings saved
          </div>
        )}
      </div>

      {/* Provider Status Alert */}
      {formData.provider === 'simulated' ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-300">Test Sandbox Mode is On</p>
            <p className="text-gray-300 mt-0.5 text-[11px]">
              Emails are only saved inside the app for testing. <strong>No real emails are sent to inboxes</strong>. To send real emails, choose <strong>Gmail / SMTP</strong> below and save.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-300">Live Email Sending is Active ({formData.provider.toUpperCase()})</p>
            <p className="text-gray-300 mt-0.5 text-[11px]">
              When you click send, real emails will be delivered to recipients.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Delivery Provider */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-3.5">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-blue-400" />
            How to send emails
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Sending method
            </label>
            <select
              value={formData.provider}
              onChange={e =>
                setFormData({
                  ...formData,
                  provider: e.target.value as AppSettings['provider']
                })
              }
              className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-3 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="simulated">Test Sandbox (Save in app only, do not send real emails)</option>
              <option value="smtp">Gmail / Google Workspace / SMTP (Send real emails)</option>
              <option value="resend">Resend API (Send real emails)</option>
            </select>
          </div>

          {/* SMTP Fields */}
          {formData.provider === 'smtp' && (
            <div className="pt-3 border-t border-[#23272f] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Quick setup:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="px-2 py-0.5 rounded border border-[#23272f] text-[11px] text-gray-300 hover:bg-[#23272f]"
                  >
                    Gmail / Google
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className="px-2 py-0.5 rounded border border-[#23272f] text-[11px] text-gray-300 hover:bg-[#23272f]"
                  >
                    Outlook / 365
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('custom')}
                    className="px-2 py-0.5 rounded border border-[#23272f] text-[11px] text-gray-300 hover:bg-[#23272f]"
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">SMTP Server</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={formData.smtpHost || ''}
                    onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Port</label>
                    <input
                      type="number"
                      placeholder="465"
                      value={formData.smtpPort || 465}
                      onChange={e => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 465 })}
                      className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Security</label>
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.smtpSecure ?? true}
                        onChange={e => setFormData({ ...formData, smtpSecure: e.target.checked })}
                        className="rounded border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-300">SSL Enabled</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">Your Email</label>
                  <input
                    type="text"
                    placeholder="yourname@gmail.com"
                    value={formData.smtpUser || ''}
                    onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">App Password</label>
                  <input
                    type="password"
                    placeholder="16-letter App Password"
                    value={formData.smtpPass || ''}
                    onChange={e => setFormData({ ...formData, smtpPass: e.target.value })}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-md bg-[#0d0f12] p-2.5 text-[11px] text-gray-400 flex items-start gap-2 border border-[#23272f]">
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Tip for Gmail: Create an <strong>App Password</strong> in your Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.
                </span>
              </div>
            </div>
          )}

          {/* Resend Fields */}
          {formData.provider === 'resend' && (
            <div className="pt-3 border-t border-[#23272f]">
              <label className="block text-xs text-gray-300 mb-1">Resend API Key</label>
              <input
                type="password"
                placeholder="re_..."
                value={formData.resendApiKey || ''}
                onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Test Email */}
          <div className="pt-3 border-t border-[#23272f]">
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Test your email connection
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your-own-email@example.com"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                className="flex-1 rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !testEmailTo}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
              >
                {testingEmail ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                <span>Send Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2 rounded-md border p-2.5 text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/5 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="text-[11px]">{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sender Info */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-3.5">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-blue-400" />
            Your Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Your Name</label>
              <input
                type="text"
                value={formData.senderName}
                onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Your Email</label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={e => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Your Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Default CC Email</label>
              <input
                type="text"
                value={formData.defaultCc}
                onChange={e => setFormData({ ...formData, defaultCc: e.target.value })}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-blue-400" />
            Email Signature
          </h3>
          <p className="text-[11px] text-gray-400">
            This will be attached at the end of every email you send.
          </p>
          <textarea
            rows={4}
            value={formData.emailSignature}
            onChange={e => setFormData({ ...formData, emailSignature: e.target.value })}
            className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] p-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none whitespace-pre-line leading-relaxed font-sans"
          />
        </div>

        {/* Timing */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Follow-up Timing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Days between follow-ups</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.followUpIntervalDays}
                onChange={e =>
                  setFormData({ ...formData, followUpIntervalDays: parseInt(e.target.value) || 2 })
                }
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Writing style</label>
              <select
                value={formData.aiTone}
                onChange={e =>
                  setFormData({
                    ...formData,
                    aiTone: e.target.value as AppSettings['aiTone']
                  })
                }
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Consultative">Consultative</option>
                <option value="Direct">Direct & Short</option>
                <option value="Friendly">Friendly</option>
                <option value="Persuasive">Persuasive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Services & Offerings */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                Services & Offerings
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Customize the TaskNera services and offerings available when composing outreach emails.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetServices}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#23272f] hover:bg-[#1a1f26] text-gray-400 hover:text-gray-200 text-xs transition-colors"
                title="Reset to default TaskNera services"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleStartAddService}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* Inline Add / Edit Form */}
          {showAddService && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {editingServiceId ? 'Edit Service' : 'Add New Service'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Service Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DevOps & Cloud Consulting"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Icon / Emoji
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="🚀"
                      value={serviceForm.icon}
                      onChange={e => setServiceForm({ ...serviceForm, icon: e.target.value })}
                      className="w-14 rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 text-center text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto text-xs">
                      {['🎯', '💻', '🤖', '📋', '🚀', '⚡', '☁️', '🛡️'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, icon: emoji })}
                          className="px-1.5 py-1 rounded hover:bg-[#23272f] text-xs transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Short Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud migration, CI/CD, and AWS cost reduction"
                  value={serviceForm.tagline}
                  onChange={e => setServiceForm({ ...serviceForm, tagline: e.target.value })}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Outreach Goal / Email Pitch <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Introduce TaskNera's cloud architecture review and DevOps pipeline setup for engineering teams."
                  value={serviceForm.pitch}
                  onChange={e => setServiceForm({ ...serviceForm, pitch: e.target.value })}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400">
                  This pitch text will be filled into the outreach goal and guide the email writer.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="px-3 py-1 rounded-md border border-[#23272f] hover:bg-[#23272f] text-gray-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={!serviceForm.name.trim() || !serviceForm.pitch.trim()}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50"
                >
                  {editingServiceId ? 'Update Service' : 'Add to Services'}
                </button>
              </div>
            </div>
          )}

          {/* Current Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {currentServices.map(service => (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between p-3 rounded-lg border border-[#23272f] bg-[#0d0f12] hover:border-gray-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{service.icon || '💼'}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{service.name}</h4>
                        {service.tagline && (
                          <p className="text-[10px] text-blue-400 font-medium">{service.tagline}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditService(service)}
                        className="p-1 rounded hover:bg-[#23272f] text-gray-400 hover:text-gray-200"
                        title="Edit service"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-400"
                        title="Delete service"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed bg-[#14171c] p-2 rounded border border-[#23272f]/60 mt-1">
                    {service.pitch}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Connectivity */}
        <div className="rounded-lg border border-[#23272f] bg-[#14171c] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Database Storage
            </h3>
            <button
              type="button"
              onClick={testDatabase}
              disabled={testingDb}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d0f12] hover:bg-[#1a1f26] border border-[#23272f] text-gray-300 text-xs transition-colors disabled:opacity-50"
            >
              {testingDb ? (
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
              ) : (
                <Database className="h-3 w-3 text-emerald-400" />
              )}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-md bg-[#0d0f12] border border-[#23272f]">
              <span className="text-[10px] text-gray-400">Database Type</span>
              <p className="font-medium text-white">MongoDB Atlas</p>
              <p className="text-[10px] text-gray-400 font-mono">cluster0.2ba7uww</p>
            </div>

            <div className="p-2.5 rounded-md bg-[#0d0f12] border border-[#23272f]">
              <span className="text-[10px] text-gray-400">Database Name</span>
              <p className="font-medium text-white">tasknera</p>
              <p className="text-[10px] text-gray-400">Automatic local fallback</p>
            </div>

            <div className="p-2.5 rounded-md bg-[#0d0f12] border border-[#23272f]">
              <span className="text-[10px] text-gray-400">Cloud Sync</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-medium">Automatic</span>
              </div>
              <p className="text-[10px] text-gray-400">Saves online and offline</p>
            </div>
          </div>

          {dbResult?.tested && (
            <div
              className={`p-3 rounded-md border text-xs flex items-center justify-between ${
                dbResult.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div>
                <p className="font-medium">
                  {dbResult.connected
                    ? `Connected to MongoDB Atlas (${dbResult.databaseName || 'tasknera'})`
                    : 'MongoDB connection offline. Using local files.'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {dbResult.connected
                    ? `Latency: ${dbResult.latencyMs ?? 0}ms • Campaigns: ${dbResult.campaignsCount ?? 0}`
                    : `Details: ${dbResult.error || 'Server selection timeout'}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
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
