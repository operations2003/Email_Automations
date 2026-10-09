'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, OutreachService, DEFAULT_SERVICES, OutreachCampaign } from '@/types/outreach';
import { CompanyManagement } from './CompanyManagement';
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
  UploadCloud
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

  // Lead Assignment to Atul state
  const [assignMode, setAssignMode] = useState<'single' | 'bulk'>('single');
  const [assigningLead, setAssigningLead] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [assignErrorMsg, setAssignErrorMsg] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Single lead inputs
  const [singleCompany, setSingleCompany] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleContact, setSingleContact] = useState('');
  const [singleWebsite, setSingleWebsite] = useState('');
  const [singleService, setSingleService] = useState('');
  const [singleNotes, setSingleNotes] = useState('');
  const [singleAssignedTo, setSingleAssignedTo] = useState('Atul');

  // Bulk lead inputs
  const [bulkText, setBulkText] = useState('');
  const [bulkService, setBulkService] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkAssignedTo, setBulkAssignedTo] = useState('Atul');

  const handleAssignSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCompany.trim() || !singleEmail.trim()) {
      setAssignErrorMsg('Company Name and Email are required.');
      return;
    }
    if (!singleEmail.includes('@')) {
      setAssignErrorMsg('Please enter a valid email address.');
      return;
    }

    setAssigningLead(true);
    setAssignErrorMsg(null);
    setAssignSuccessMsg(null);

    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: singleCompany.trim(),
          email: singleEmail.trim(),
          recipientName: singleContact.trim(),
          companyWebsite: singleWebsite.trim(),
          reason: singleService.trim() || 'Introduce TaskNera services and offerings.',
          notes: singleNotes.trim(),
          assignedTo: singleAssignedTo.trim() || 'Atul',
          assignedBy: 'Sheetal Bedi (Admin)',
          forceCreate: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setAssignSuccessMsg(`Assigned "${singleCompany.trim()}" to ${singleAssignedTo.trim() || 'Atul'} successfully!`);
        setSingleCompany('');
        setSingleEmail('');
        setSingleContact('');
        setSingleWebsite('');
        setSingleNotes('');
        onRefreshCampaigns?.();
        setTimeout(() => setAssignSuccessMsg(null), 4000);
      } else {
        setAssignErrorMsg(data.error || data.message || 'Could not assign company.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAssignErrorMsg(error.message || 'Network error assigning company.');
    } finally {
      setAssigningLead(false);
    }
  };

  const handleAssignBulkLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setAssignErrorMsg('Please paste at least one company and email.');
      return;
    }

    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedItems: Array<{ companyName: string; email: string; recipientName?: string; reason?: string; notes?: string; assignedTo: string; assignedBy: string }> = [];

    for (const line of lines) {
      const parts = line.split(/[,|\t]/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        let company = parts[0];
        let email = parts[1];
        const contact = parts[2] || '';

        if (company.includes('@') && !email.includes('@')) {
          const temp = company;
          company = email;
          email = temp;
        }

        if (company && email.includes('@')) {
          parsedItems.push({
            companyName: company,
            email: email,
            recipientName: contact,
            reason: bulkService.trim() || 'Introduce TaskNera services and offerings.',
            notes: bulkNotes.trim(),
            assignedTo: bulkAssignedTo.trim() || 'Atul',
            assignedBy: 'Sheetal Bedi (Admin)'
          });
        }
      }
    }

    if (parsedItems.length === 0) {
      setAssignErrorMsg('Could not find valid lines with "Company, email". Example:\nAcme Corp, contact@acme.com');
      return;
    }

    setAssigningLead(true);
    setAssignErrorMsg(null);
    setAssignSuccessMsg(null);

    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedItems)
      });

      const data = await res.json();
      if (data.success) {
        setAssignSuccessMsg(`Successfully assigned ${data.count || parsedItems.length} leads to ${bulkAssignedTo.trim() || 'Atul'}!`);
        setBulkText('');
        onRefreshCampaigns?.();
        setTimeout(() => setAssignSuccessMsg(null), 5000);
      } else {
        setAssignErrorMsg(data.error || 'Failed to bulk assign companies.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAssignErrorMsg(error.message || 'Network error bulk assigning companies.');
    } finally {
      setAssigningLead(false);
    }
  };

  const handleDeleteAssignedLead = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from assigned leads?`)) return;
    setDeletingLeadId(id);
    try {
      const res = await fetch(`/api/outreach/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshCampaigns?.();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    } finally {
      setDeletingLeadId(null);
    }
  };

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
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Test Sandbox Mode is On</p>
            <p className="text-amber-800 mt-0.5 text-[11px] leading-relaxed">
              Emails are only saved inside the app for testing. <strong>No real emails are sent to inboxes</strong>. To send real emails, choose <strong>Gmail / SMTP</strong> below and save.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">Live Email Sending is Active ({formData.provider.toUpperCase()})</p>
            <p className="text-emerald-800 mt-0.5 text-[11px]">
              When you click send, real emails will be delivered to recipients.
            </p>
          </div>
        </div>
      )}

      {/* Assign Leads to Atul (Team Queue) Section */}
      <div className="rounded-lg border border-indigo-500/30 bg-[#14171c] p-4 space-y-4 shadow-lg shadow-indigo-500/5">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23272f] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Assign Leads to Atul</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Admin Queue
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Add company name and email targets for Atul. They will appear highlighted in Atul&apos;s queue when he logs in.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#0d0f12] p-1 rounded-lg border border-[#23272f]">
            <button
              type="button"
              onClick={() => {
                setAssignMode('single');
                setAssignErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                assignMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Single Lead</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignMode('bulk');
                setAssignErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                assignMode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UploadCloud className="h-3 w-3" />
              <span>Bulk Paste</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {assignSuccessMsg && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{assignSuccessMsg}</span>
          </div>
        )}

        {assignErrorMsg && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{assignErrorMsg}</span>
          </div>
        )}

        {/* Single Lead Form */}
        {assignMode === 'single' ? (
          <form onSubmit={handleAssignSingleLead} className="space-y-3 bg-[#0d0f12] p-3.5 rounded-lg border border-[#23272f]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Technologies"
                  value={singleCompany}
                  onChange={e => setSingleCompany(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Target Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. founder@acme.com"
                  value={singleEmail}
                  onChange={e => setSingleEmail(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Contact Person / Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar (CTO)"
                  value={singleContact}
                  onChange={e => setSingleContact(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Company Website (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme.com"
                  value={singleWebsite}
                  onChange={e => setSingleWebsite(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Service / Pitch Offering
                </label>
                <select
                  value={singleService}
                  onChange={e => setSingleService(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Default Pitch (TaskNera Full Services)</option>
                  {currentServices.map(s => (
                    <option key={s.id} value={`${s.name} - ${s.pitch}`}>
                      {s.icon || '💼'} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Assign To
                </label>
                <select
                  value={singleAssignedTo}
                  onChange={e => setSingleAssignedTo(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Atul">Atul (atul@tasknera.com)</option>
                  <option value="Team">General Team Queue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Notes / Guidance for Atul (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Emphasize our 2-week pilot sprint and full-stack capabilities"
                value={singleNotes}
                onChange={e => setSingleNotes(e.target.value)}
                className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={assigningLead || !singleCompany.trim() || !singleEmail.trim()}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {assigningLead ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                <span>Assign Lead to {singleAssignedTo}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAssignBulkLeads} className="space-y-3 bg-[#0d0f12] p-3.5 rounded-lg border border-[#23272f]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">
                  Paste Companies & Emails (One per line) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  Format: <code>Company Name, email@domain.com, Contact Person</code>
                </span>
              </div>
              <textarea
                rows={5}
                placeholder={`Acme Corp, founder@acme.com, Alex
Nova Labs, contact@novalabs.io, Priya
Fintech Hub, partnerships@fintechhub.com, Rahul`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full rounded-md bg-[#14171c] border border-[#23272f] p-2.5 text-xs font-mono text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Service to Pitch for these Leads
                </label>
                <select
                  value={bulkService}
                  onChange={e => setBulkService(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Default Pitch (TaskNera Full Services)</option>
                  {currentServices.map(s => (
                    <option key={s.id} value={`${s.name} - ${s.pitch}`}>
                      {s.icon || '💼'} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Assign To
                </label>
                <select
                  value={bulkAssignedTo}
                  onChange={e => setBulkAssignedTo(e.target.value)}
                  className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Atul">Atul (atul@tasknera.com)</option>
                  <option value="Team">General Team Queue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Notes / Guidance for Atul (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Focus on our custom web and mobile app development speed"
                value={bulkNotes}
                onChange={e => setBulkNotes(e.target.value)}
                className="w-full rounded-md bg-[#14171c] border border-[#23272f] py-1.5 px-2.5 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={assigningLead || !bulkText.trim()}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {assigningLead ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ListPlus className="h-3.5 w-3.5" />
                )}
                <span>Bulk Assign All Leads to {bulkAssignedTo}</span>
              </button>
            </div>
          </form>
        )}

        {/* Currently Assigned Leads Table */}
        {(() => {
          const assignedList = (campaigns || []).filter(
            c => (c.assignedTo && c.assignedTo.toLowerCase().includes('atul')) || (c.assignedTo && c.assignedTo.trim().length > 0)
          );
          return (
            <div className="pt-2 border-t border-[#23272f]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Leads in Atul&apos;s Queue ({assignedList.length})
                  </span>
                  <span className="text-[11px] text-gray-400">
                    • Atul will see these highlighted when he logs in
                  </span>
                </div>
                {onRefreshCampaigns && (
                  <button
                    type="button"
                    onClick={onRefreshCampaigns}
                    className="p-1 rounded hover:bg-[#23272f] text-gray-400 hover:text-gray-200 transition-colors"
                    title="Refresh assigned list"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>

              {assignedList.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[#23272f] rounded-lg bg-[#0d0f12]/50 text-gray-400 text-xs">
                  No leads assigned to Atul yet. Add a company and email above to assign it.
                </div>
              ) : (
                <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#14171c] text-gray-400 text-[11px] border-b border-[#23272f]">
                      <tr>
                        <th className="py-2 px-3">Company</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Assigned To</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f242d]">
                      {assignedList.map(lead => (
                        <tr key={lead.id} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-medium text-gray-200">
                            {lead.companyName}
                            {lead.recipientName && (
                              <span className="text-[10px] text-gray-400 block font-normal">
                                {lead.recipientName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-300 text-[11px]">
                            {lead.email}
                          </td>
                          <td className="py-2 px-3 text-gray-400">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                              👤 {lead.assignedTo || 'Atul'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[11px] text-gray-300">
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignedLead(lead.id, lead.companyName)}
                              disabled={deletingLeadId === lead.id}
                              className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                              title="Delete / Unassign"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Delivery Provider */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4 text-[#7c3aed]" />
            How to send emails
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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
              className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none cursor-pointer"
            >
              <option value="simulated">Test Sandbox (Save in app only, do not send real emails)</option>
              <option value="smtp">Gmail / Google Workspace / SMTP (Send real emails)</option>
              <option value="resend">Resend API (Send real emails)</option>
            </select>
          </div>

          {/* SMTP Fields */}
          {formData.provider === 'smtp' && (
            <div className="pt-3 border-t border-gray-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Quick setup presets:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Gmail / Google
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Outlook / 365
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('custom')}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SMTP Server</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={formData.smtpHost || ''}
                    onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                    className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Port</label>
                    <input
                      type="number"
                      placeholder="465"
                      value={formData.smtpPort || 465}
                      onChange={e => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 465 })}
                      className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Security</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.smtpSecure ?? true}
                        onChange={e => setFormData({ ...formData, smtpSecure: e.target.checked })}
                        className="rounded border-gray-300 text-[#7c3aed] focus:ring-0 accent-[#7c3aed]"
                      />
                      <span className="text-xs text-gray-700 font-medium">SSL Enabled</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Email</label>
                  <input
                    type="text"
                    placeholder="yourname@gmail.com"
                    value={formData.smtpUser || ''}
                    onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                    className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">App Password</label>
                  <input
                    type="password"
                    placeholder="16-letter App Password"
                    value={formData.smtpPass || ''}
                    onChange={e => setFormData({ ...formData, smtpPass: e.target.value })}
                    className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-[11px] text-gray-700 flex items-start gap-2.5 border border-purple-200">
                <Info className="h-4 w-4 text-[#7c3aed] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-gray-900">Google Workspace (@tasknera.com) & Gmail Requirement:</strong> Google requires a 16-character <strong>App Password</strong> (e.g. <code>abcd efgh ijkl mnop</code>) for automated SMTP email sending. If your password is not accepted, generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline text-[#7c3aed] font-semibold">myaccount.google.com/apppasswords</a> and paste it above.
                </span>
              </div>
            </div>
          )}

          {/* Resend Fields */}
          {formData.provider === 'resend' && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resend API Key</label>
              <input
                type="password"
                placeholder="re_..."
                value={formData.resendApiKey || ''}
                onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>
          )}

          {/* Test Email */}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Test your email connection
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your-own-email@example.com"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                className="flex-1 rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !testEmailTo}
                className="flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
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
                className={`mt-2.5 rounded-xl border p-3 text-xs flex items-start gap-2 ${
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-[#7c3aed]" />
            Your Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={formData.senderName}
                onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Email</label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={e => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default CC Email</label>
              <input
                type="text"
                value={formData.defaultCc}
                onChange={e => setFormData({ ...formData, defaultCc: e.target.value })}
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#7c3aed]" />
            Email Signature
          </h3>
          <p className="text-[11px] text-gray-500">
            This will be attached at the end of every email you send.
          </p>
          <textarea
            rows={4}
            value={formData.emailSignature}
            onChange={e => setFormData({ ...formData, emailSignature: e.target.value })}
            className="w-full rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none whitespace-pre-line leading-relaxed font-sans"
          />
        </div>

        {/* Timing */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#7c3aed]" />
            Follow-up Timing & Style
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Days between follow-ups</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.followUpIntervalDays}
                onChange={e =>
                  setFormData({ ...formData, followUpIntervalDays: parseInt(e.target.value) || 2 })
                }
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 font-mono focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Writing style</label>
              <select
                value={formData.aiTone}
                onChange={e =>
                  setFormData({
                    ...formData,
                    aiTone: e.target.value as AppSettings['aiTone']
                  })
                }
                className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none cursor-pointer"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#7c3aed]" />
                Services & Offerings
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Customize the TaskNera services and offerings available when composing outreach emails.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetServices}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-xs font-medium transition-colors cursor-pointer"
                title="Reset to default TaskNera services"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleStartAddService}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="h-3 w-3" />
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* Inline Add / Edit Form */}
          {showAddService && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7c3aed] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {editingServiceId ? 'Edit Service' : 'Add New Service'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DevOps & Cloud Consulting"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Icon / Emoji
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="🚀"
                      value={serviceForm.icon}
                      onChange={e => setServiceForm({ ...serviceForm, icon: e.target.value })}
                      className="w-14 rounded-xl bg-white border border-gray-200 py-2 text-center text-xs text-gray-900 focus:border-[#7c3aed] focus:outline-none"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto text-xs">
                      {['🎯', '💻', '🤖', '📋', '🚀', '⚡', '☁️', '🛡️'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, icon: emoji })}
                          className="px-1.5 py-1 rounded hover:bg-gray-100 text-xs transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Short Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud migration, CI/CD, and AWS cost reduction"
                  value={serviceForm.tagline}
                  onChange={e => setServiceForm({ ...serviceForm, tagline: e.target.value })}
                  className="w-full rounded-xl bg-white border border-gray-200 py-2 px-3 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Outreach Goal / Email Pitch <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Introduce TaskNera's cloud architecture review and DevOps pipeline setup for engineering teams."
                  value={serviceForm.pitch}
                  onChange={e => setServiceForm({ ...serviceForm, pitch: e.target.value })}
                  className="w-full rounded-xl bg-white border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">
                  This pitch text will be filled into the outreach goal and guide the email writer.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelServiceForm}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={!serviceForm.name.trim() || !serviceForm.pitch.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {editingServiceId ? 'Update Service' : 'Add to Services'}
                </button>
              </div>
            </div>
          )}

          {/* Current Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentServices.map(service => (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/70 hover:border-purple-200 hover:bg-white transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{service.icon || '💼'}</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{service.name}</h4>
                        {service.tagline && (
                          <p className="text-[10px] text-[#7c3aed] font-medium">{service.tagline}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditService(service)}
                        className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-900 cursor-pointer"
                        title="Edit service"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 rounded-md hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer"
                        title="Delete service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-2.5 rounded-xl border border-gray-200 mt-1">
                    {service.pitch}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Connectivity */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Database Storage
            </h3>
            <button
              type="button"
              onClick={testDatabase}
              disabled={testingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {testingDb ? (
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
              ) : (
                <Database className="h-3 w-3 text-emerald-600" />
              )}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 font-medium">Database Type</span>
              <p className="font-bold text-gray-900 mt-0.5">MongoDB Atlas</p>
              <p className="text-[10px] text-gray-500 font-mono">cluster0.2ba7uww</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 font-medium">Database Name</span>
              <p className="font-bold text-gray-900 mt-0.5">tasknera</p>
              <p className="text-[10px] text-gray-500">Automatic local fallback</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 font-medium">Cloud Sync</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 font-bold">Automatic</span>
              </div>
              <p className="text-[10px] text-gray-500">Saves online and offline</p>
            </div>
          </div>

          {dbResult?.tested && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                dbResult.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div>
                <p className="font-bold">
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

        {/* Company Management */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <CompanyManagement isAdmin={isAdmin} />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] px-5 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
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
