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

  // Deliverability, DNS & Reputation states
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsReport, setDnsReport] = useState<{
    domain: string;
    checkedAt: string;
    overallScore: number;
    overallStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    spf: any;
    dkim: any;
    dmarc: any;
    mx: any;
    deliverabilitySummary: string;
  } | null>(null);

  const [checkingReputation, setCheckingReputation] = useState(false);
  const [reputationReport, setReputationReport] = useState<{
    domain: string;
    reputationStatus: 'CLEAN' | 'NEUTRAL' | 'FLAGGED';
    blacklistsChecked: any[];
    ipChecks: any[];
    riskFactors: string[];
    recommendations: string[];
  } | null>(null);

  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [loadingSuppressions, setLoadingSuppressions] = useState(false);
  const [showSuppressionModal, setShowSuppressionModal] = useState(false);
  const [manualSuppressEmail, setManualSuppressEmail] = useState('');
  const [manualSuppressReason, setManualSuppressReason] = useState('unsubscribed');
  const [addingSuppression, setAddingSuppression] = useState(false);
  const [showDeliverabilityGuide, setShowDeliverabilityGuide] = useState(false);

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

  useEffect(() => {
    loadSuppressions();
  }, []);

  const handleVerifyDns = async () => {
    setVerifyingDns(true);
    try {
      const emailDomain = formData.senderEmail?.includes('@') ? formData.senderEmail.split('@')[1] : 'tasknera.com';
      const res = await fetch(`/api/settings/verify-domain?domain=${encodeURIComponent(emailDomain)}&provider=${formData.provider}`);
      const data = await res.json();
      if (data.success && data.report) {
        setDnsReport(data.report);
      }
    } catch (err) {
      console.error('DNS verification failed:', err);
    } finally {
      setVerifyingDns(false);
    }
  };

  const handleCheckReputation = async () => {
    setCheckingReputation(true);
    try {
      const emailDomain = formData.senderEmail?.includes('@') ? formData.senderEmail.split('@')[1] : 'tasknera.com';
      const res = await fetch(`/api/settings/check-reputation?domain=${encodeURIComponent(emailDomain)}&smtpHost=${formData.smtpHost || ''}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReputationReport(data.report);
      }
    } catch (err) {
      console.error('Reputation check failed:', err);
    } finally {
      setCheckingReputation(false);
    }
  };

  const loadSuppressions = async () => {
    setLoadingSuppressions(true);
    try {
      const res = await fetch('/api/suppression');
      const data = await res.json();
      if (data.success && Array.isArray(data.suppressions)) {
        setSuppressions(data.suppressions);
      }
    } catch (err) {
      console.error('Failed to load suppressions:', err);
    } finally {
      setLoadingSuppressions(false);
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSuppressEmail || !manualSuppressEmail.includes('@')) return;
    setAddingSuppression(true);
    try {
      const res = await fetch('/api/suppression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualSuppressEmail, reason: manualSuppressReason })
      });
      const data = await res.json();
      if (data.success) {
        setManualSuppressEmail('');
        await loadSuppressions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSuppression(false);
    }
  };

  const handleRemoveSuppression = async (email: string) => {
    try {
      await fetch(`/api/suppression?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      await loadSuppressions();
    } catch (err) {
      console.error(err);
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

      {/* Assign Leads to Atul (Team Queue) Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Assign Leads to Team Queue</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                  Admin Queue
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign prospective company and contact targets to team members. Assigned targets will be highlighted in their workspace queue.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAssignMode('single');
                setAssignErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                assignMode === 'single'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Single Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignMode('bulk');
                setAssignErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                assignMode === 'bulk'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="h-3 w-3" />
              <span>Bulk Import</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {assignSuccessMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{assignSuccessMsg}</span>
          </div>
        )}

        {assignErrorMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{assignErrorMsg}</span>
          </div>
        )}

        {/* Single Lead Form */}
        {assignMode === 'single' ? (
          <form onSubmit={handleAssignSingleLead} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Technologies"
                  value={singleCompany}
                  onChange={e => setSingleCompany(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@acme.com"
                  value={singleEmail}
                  onChange={e => setSingleEmail(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 font-mono focus:border-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person / Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar (CTO)"
                  value={singleContact}
                  onChange={e => setSingleContact(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Website (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme.com"
                  value={singleWebsite}
                  onChange={e => setSingleWebsite(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 font-mono focus:border-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service / Offering Pitch
                </label>
                <select
                  value={singleService}
                  onChange={e => setSingleService(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                >
                  <option value="">Default Pitch (TaskNera Full Services)</option>
                  {currentServices.map(s => (
                    <option key={s.id} value={`${s.name} - ${s.pitch}`}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To
                </label>
                <select
                  value={singleAssignedTo}
                  onChange={e => setSingleAssignedTo(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                >
                  <option value="Atul">Atul (Operations)</option>
                  <option value="Team">General Team Queue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Context / Notes for Assignee (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Highlight VCS and recruitment solutions"
                value={singleNotes}
                onChange={e => setSingleNotes(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={assigningLead || !singleCompany.trim() || !singleEmail.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {assigningLead ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                <span>Assign Account to {singleAssignedTo}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAssignBulkLeads} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Paste Companies & Emails (One per line) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Format: <code>Company Name, email@domain.com, Contact Person</code>
                </span>
              </div>
              <textarea
                rows={5}
                placeholder={`Acme Corp, contact@acme.com, Alex
Nova Labs, contact@novalabs.io, Priya
Fintech Hub, partnerships@fintechhub.com, Rahul`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs font-mono text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Offering for these Leads
                </label>
                <select
                  value={bulkService}
                  onChange={e => setBulkService(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                >
                  <option value="">Default Pitch (TaskNera Full Services)</option>
                  {currentServices.map(s => (
                    <option key={s.id} value={`${s.name} - ${s.pitch}`}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To
                </label>
                <select
                  value={bulkAssignedTo}
                  onChange={e => setBulkAssignedTo(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                >
                  <option value="Atul">Atul (Operations)</option>
                  <option value="Team">General Team Queue</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Context / Notes for Assignee (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Focus on recruitment intelligence and HireIQ platform"
                value={bulkNotes}
                onChange={e => setBulkNotes(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={assigningLead || !bulkText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {assigningLead ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ListPlus className="h-3.5 w-3.5" />
                )}
                <span>Import and Assign Leads to {bulkAssignedTo}</span>
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
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Assigned Account Queue ({assignedList.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    • Highlighted in team member view upon sign-in
                  </span>
                </div>
                {onRefreshCampaigns && (
                  <button
                    type="button"
                    onClick={onRefreshCampaigns}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Refresh assigned list"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {assignedList.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-slate-500 text-xs">
                  No leads assigned currently. Enter account details above to populate the queue.
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-slate-600 text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Company</th>
                        <th className="py-2.5 px-3 font-semibold">Email</th>
                        <th className="py-2.5 px-3 font-semibold">Assignee</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignedList.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {lead.companyName}
                            {lead.recipientName && (
                              <span className="text-[10px] text-slate-500 block font-normal">
                                {lead.recipientName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                            {lead.email}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                              {lead.assignedTo || 'Atul'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[11px] text-slate-700">
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignedLead(lead.id, lead.companyName)}
                              disabled={deletingLeadId === lead.id}
                              className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Delete / Unassign"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* Deliverability, Authentication & Spam Prevention Hub */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Deliverability, Authentication &amp; Spam Prevention
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Verify SPF, DKIM &amp; DMARC authentication, audit sender reputation, and control sending cadence to guarantee inbox placement.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyDns}
                disabled={verifyingDns}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {verifyingDns ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                <span>Verify Domain DNS</span>
              </button>
              <button
                type="button"
                onClick={handleCheckReputation}
                disabled={checkingReputation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {checkingReputation ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                <span>Check Reputation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loadSuppressions();
                  setShowSuppressionModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Ban className="h-3 w-3 text-rose-500" />
                <span>Suppression List ({suppressions.length})</span>
              </button>
            </div>
          </div>

          {/* DNS Verification Results */}
          {dnsReport && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Domain Authentication:</span>
                  <span className="text-xs font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {dnsReport.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    dnsReport.overallStatus === 'EXCELLENT'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : dnsReport.overallStatus === 'GOOD'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {dnsReport.overallScore}% &bull; {dnsReport.overallStatus}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {dnsReport.deliverabilitySummary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* SPF */}
                <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">SPF Record (Sender Policy Framework)</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      dnsReport.spf.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dnsReport.spf.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dnsReport.spf.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{dnsReport.spf.details}</p>
                  {dnsReport.spf.rawRecord && (
                    <code className="block text-[10px] font-mono text-slate-700 bg-slate-50 p-1 rounded overflow-x-auto">
                      {dnsReport.spf.rawRecord}
                    </code>
                  )}
                  {dnsReport.spf.recommendations?.length > 0 && (
                    <div className="text-[10px] text-amber-700 space-y-0.5 pt-1">
                      {dnsReport.spf.recommendations.map((rec: string, i: number) => (
                        <p key={i}>&bull; {rec}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* DKIM */}
                <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">DKIM (DomainKeys Identified Mail)</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      dnsReport.dkim.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dnsReport.dkim.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dnsReport.dkim.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{dnsReport.dkim.details}</p>
                  <div className="text-[10px] space-y-1 pt-1">
                    {dnsReport.dkim.selectorsChecked?.map((sel: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded">
                        <span className="font-mono text-slate-700">{sel.selector}._domainkey</span>
                        <span className={sel.found ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                          {sel.found ? 'Verified' : 'Not configured'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DMARC */}
                <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">DMARC Policy</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      dnsReport.dmarc.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dnsReport.dmarc.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dnsReport.dmarc.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{dnsReport.dmarc.details}</p>
                  {dnsReport.dmarc.rawRecord && (
                    <code className="block text-[10px] font-mono text-slate-700 bg-slate-50 p-1 rounded overflow-x-auto">
                      {dnsReport.dmarc.rawRecord}
                    </code>
                  )}
                  {dnsReport.dmarc.recommendations?.length > 0 && (
                    <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                      {dnsReport.dmarc.recommendations.map((rec: string, i: number) => (
                        <p key={i}>&bull; {rec}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* MX */}
                <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">MX Inbound &amp; Bounce Handling</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      dnsReport.mx.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dnsReport.mx.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{dnsReport.mx.details}</p>
                  {dnsReport.mx.servers && (
                    <div className="text-[10px] font-mono text-slate-700 bg-slate-50 p-1 rounded max-h-16 overflow-y-auto">
                      {dnsReport.mx.servers.slice(0, 3).map((srv: string, i: number) => (
                        <div key={i}>{srv}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reputation Results */}
          {reputationReport && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Blacklist &amp; IP Reputation:</span>
                  <span className="text-xs font-mono text-slate-700">{reputationReport.domain}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  reputationReport.reputationStatus === 'CLEAN'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  STATUS: {reputationReport.reputationStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {reputationReport.blacklistsChecked.map((bl: any, i: number) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{bl.listName}</div>
                      <div className="text-[10px] text-slate-500">{bl.host}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bl.listed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bl.listed ? 'LISTED' : 'CLEAN'}
                    </span>
                  </div>
                ))}
              </div>

              {reputationReport.recommendations?.length > 0 && (
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-800">Reputation Guidance:</span>
                  {reputationReport.recommendations.map((r: string, i: number) => (
                    <p key={i}>&bull; {r}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sending Cadence & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Sending Limit (Per Mailbox)
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={formData.dailySendingLimit || 50}
                onChange={e => setFormData({ ...formData, dailySendingLimit: parseInt(e.target.value) || 50 })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Recommended: 40-60/day per Google Workspace account to stay under algorithmic radar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Dispatch Interval (Seconds)
              </label>
              <input
                type="number"
                min={15}
                max={300}
                value={formData.minIntervalSeconds || 45}
                onChange={e => setFormData({ ...formData, minIntervalSeconds: parseInt(e.target.value) || 45 })}
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Adds natural jitter delays between automated emails to prevent machine-burst triggers.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.enableUnsubscribeHeader !== false}
                onChange={e => setFormData({ ...formData, enableUnsubscribeHeader: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span className="font-medium">
                Enable RFC 8058 One-Click <code className="font-mono text-slate-900">List-Unsubscribe</code> Headers (Google &amp; Yahoo Mandatory)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.enableUnsubscribeFooter !== false}
                onChange={e => setFormData({ ...formData, enableUnsubscribeFooter: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span className="font-medium">
                Include compliant recipient opt-out link and business entity footer in outgoing email body
              </span>
            </label>
          </div>

          {/* Deliverability Guide Accordion */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDeliverabilityGuide(!showDeliverabilityGuide)}
              className="w-full flex items-center justify-between text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <HelpCircle className="h-4 w-4 text-slate-600" />
                <span>Why Do Some Emails Reach Inbox While Others Land in Spam? (Deliverability Breakdown)</span>
              </div>
              {showDeliverabilityGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDeliverabilityGuide && (
              <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    1. Identical Content Fingerprinting
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    When multiple emails share identical text (e.g. static cold templates), Gmail computes a fuzzy hash. If any recipient flags it as spam, all future identical emails land in Spam with the banner <em>&quot;This message is similar to messages that were identified as spam in the past.&quot;</em> The system now dynamically spins opening lines, value propositions, and subject lines to ensure every message is uniquely worded.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    2. Domain Authentication (SPF, DKIM, DMARC Alignment)
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    In 2024, Google and Yahoo reject or spam-box emails sent without verified SPF and DKIM signatures. Your sender domain (@tasknera.com) must have matching SPF records and DKIM selectors. Sending via Resend requires verifying Resend DNS keys, while sending via Gmail SMTP requires Google Workspace DKIM signing.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    3. Mandatory RFC 8058 One-Click Unsubscribe
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    Google penalizes senders who do not provide easy opt-outs. When recipients have no clear way to unsubscribe, they click &quot;Report Spam&quot;, destroying sender domain reputation. With RFC 8058 headers and opt-out footers enabled, recipients can unsubscribe cleanly without damaging domain trust.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    4. Burst Sending vs Cadence Throttling
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    Sending 30 emails in 2 seconds flags automated rate limits at Google MX servers. Safe cold outreach requires sending emails spaced out by 30 to 60 seconds with randomized jitter to emulate authentic human correspondence.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    5. Hard Bounce Suppression
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    A bounce rate exceeding 2-3% triggers immediate mailbox restrictions. The system now automatically detects hard bounces and unsubscribes, immediately placing them on the suppression list to prevent future touches.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suppression List Modal */}
        {showSuppressionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Email Suppression &amp; Opt-Out List</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuppressionModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Addresses on this list are permanently blocked from all initial emails and automated follow-ups to protect domain sender reputation.
              </p>

              {/* Add manual suppression */}
              <form onSubmit={handleAddSuppression} className="flex gap-2">
                <input
                  type="email"
                  placeholder="contact@domain.com"
                  value={manualSuppressEmail}
                  onChange={e => setManualSuppressEmail(e.target.value)}
                  className="flex-1 rounded-lg bg-white border border-slate-200 py-1.5 px-3 text-xs text-slate-900 font-mono focus:outline-none"
                />
                <select
                  value={manualSuppressReason}
                  onChange={e => setManualSuppressReason(e.target.value)}
                  className="rounded-lg bg-white border border-slate-200 py-1.5 px-2 text-xs text-slate-800"
                >
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                  <option value="complaint">Complaint</option>
                  <option value="manual">Manual</option>
                </select>
                <button
                  type="submit"
                  disabled={addingSuppression || !manualSuppressEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
              </form>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 min-h-[160px]">
                {loadingSuppressions ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading suppression list...</div>
                ) : suppressions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No suppressed contacts yet. Unsubscribes and hard bounces will automatically appear here.
                  </div>
                ) : (
                  suppressions.map((sup, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <div className="font-mono font-medium text-slate-900">{sup.email}</div>
                        <div className="text-[10px] text-slate-500">
                          {sup.reason.toUpperCase()} &bull; {new Date(sup.createdAt).toLocaleDateString()}
                          {sup.notes && ` &bull; ${sup.notes}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSuppression(sup.email)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer px-2 py-1"
                        title="Remove from suppression"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setShowSuppressionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Timing */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-700" />
            Sequence Cadence &amp; Tone
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Days between follow-ups</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.followUpIntervalDays}
                onChange={e =>
                  setFormData({ ...formData, followUpIntervalDays: parseInt(e.target.value) || 2 })
                }
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tone &amp; Style</label>
              <select
                value={formData.aiTone}
                onChange={e =>
                  setFormData({
                    ...formData,
                    aiTone: e.target.value as AppSettings['aiTone']
                  })
                }
                className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Professional">Professional B2B</option>
                <option value="Consultative">Consultative &amp; Analytical</option>
                <option value="Direct">Concise &amp; Direct</option>
                <option value="Friendly">Approachable &amp; Warm</option>
                <option value="Persuasive">Outcome-Focused</option>
              </select>
            </div>
          </div>
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

        {/* Database Connectivity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-700" />
              Database Connectivity &amp; Persistence
            </h3>
            <button
              type="button"
              onClick={testDatabase}
              disabled={testingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {testingDb ? (
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-700" />
              ) : (
                <Database className="h-3 w-3 text-emerald-700" />
              )}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium">Database Type</span>
              <p className="font-semibold text-slate-900 mt-0.5">MongoDB Atlas</p>
              <p className="text-[10px] text-slate-500 font-mono">cluster0.2ba7uww</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium">Database Name</span>
              <p className="font-semibold text-slate-900 mt-0.5">tasknera</p>
              <p className="text-[10px] text-slate-500">Automatic local fallback</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium">Cloud Sync</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 font-semibold">Active &amp; Persistent</span>
              </div>
              <p className="text-[10px] text-slate-500">Redundant storage configured</p>
            </div>
          </div>

          {dbResult?.tested && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                dbResult.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div>
                <p className="font-semibold">
                  {dbResult.connected
                    ? `Connected to MongoDB Atlas (${dbResult.databaseName || 'tasknera'})`
                    : 'MongoDB connection offline. Local fallback active.'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {dbResult.connected
                    ? `Latency: ${dbResult.latencyMs ?? 0}ms • Records: ${dbResult.campaignsCount ?? 0}`
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
