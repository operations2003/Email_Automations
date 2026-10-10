'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedEmailResult, OutreachService } from '@/types/outreach';
import { Company } from '@/types/company';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Building2,
  Mail,
  FileText,
  User,
  Globe,
  PenTool,
  Copy,
  Check,
  Tag
} from 'lucide-react';

interface AddOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSelectExisting: (id: string) => void;
  services?: OutreachService[];
  onServicesChange?: (newServices: OutreachService[]) => void;
  initialCompany?: { name: string; email: string; website?: string; recipientName?: string } | null;
}

export function AddOutreachModal({
  isOpen,
  onClose,
  onSuccess,
  onSelectExisting,
  services: initialServices,
  onServicesChange,
  initialCompany
}: AddOutreachModalProps) {
  // Company selection state
  const [availableCompanies, setAvailableCompanies] = useState<Pick<Company, 'id' | 'name' | 'email'>[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [saveToDirectory, setSaveToDirectory] = useState(true);

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [mailTopic, setMailTopic] = useState('recruitment services');
  const [reason, setReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Pre-configured pitches tailored for each mail topic category
  const DEFAULT_TOPIC_PITCHES: Record<string, string> = {
    'Virtual Customer Support (VCS)': "TaskNera provides dedicated, human-led customer support across voice, live chat, email, WhatsApp, and social media. Our support teams help businesses manage customer enquiries, resolve issues, handle follow-ups, and maintain service quality through structured workflows, quality monitoring, and SLA-aligned delivery.",
    'VCS': "TaskNera provides dedicated, human-led customer support across voice, live chat, email, WhatsApp, and social media. Our support teams help businesses manage customer enquiries, resolve issues, handle follow-ups, and maintain service quality through structured workflows, quality monitoring, and SLA-aligned delivery.",
    'Recruitment & Talent Acquisition': "TaskNera supports end-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to shortlisting and interview coordination, we help businesses build relevant talent pipelines and streamline recruitment operations.",
    'Recruitment Services': "TaskNera supports end-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to shortlisting and interview coordination, we help businesses build relevant talent pipelines and streamline recruitment operations.",
    'recruitment services': "TaskNera supports end-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to shortlisting and interview coordination, we help businesses build relevant talent pipelines and streamline recruitment operations.",
    'HR Technology & Digital Solutions': "TaskNera combines recruitment intelligence and HR technology to help businesses streamline hiring, employee management, and business relationship workflows. With HireIQ ATS and HRMS already in place, TaskNera delivers technology-enabled solutions including recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, analytics, and workflow automation, alongside an in-house CRM designed to connect client relationships, recruitment pipelines, and workforce operations through an integrated digital ecosystem.",
    'Software Solutions': "TaskNera combines recruitment intelligence and HR technology to help businesses streamline hiring, employee management, and business relationship workflows. With HireIQ ATS and HRMS already in place, TaskNera delivers technology-enabled solutions including recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, analytics, and workflow automation, alongside an in-house CRM designed to connect client relationships, recruitment pipelines, and workforce operations through an integrated digital ecosystem.",
    'software solutions': "TaskNera combines recruitment intelligence and HR technology to help businesses streamline hiring, employee management, and business relationship workflows. With HireIQ ATS and HRMS already in place, TaskNera delivers technology-enabled solutions including recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, analytics, and workflow automation, alongside an in-house CRM designed to connect client relationships, recruitment pipelines, and workforce operations through an integrated digital ecosystem.",
    'HireIQ — ATS & Recruitment Intelligence': "HireIQ by TaskNera is an AI-powered recruitment intelligence platform that supports job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, ranking, and structured candidate evaluation. The planned CRM integration extends these capabilities by connecting client accounts, hiring requirements, communication history, follow-ups, and business opportunities with recruitment activities, providing end-to-end visibility from client acquisition and job requirements through candidate selection and placement.",
    'ATS + CRM Application — HireIQ by TaskNera': "HireIQ by TaskNera is an AI-powered recruitment intelligence platform that supports job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, ranking, and structured candidate evaluation. The planned CRM integration extends these capabilities by connecting client accounts, hiring requirements, communication history, follow-ups, and business opportunities with recruitment activities, providing end-to-end visibility from client acquisition and job requirements through candidate selection and placement.",
    'ATS + CRM app': "HireIQ by TaskNera is an AI-powered recruitment intelligence platform that supports job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, ranking, and structured candidate evaluation. The planned CRM integration extends these capabilities by connecting client accounts, hiring requirements, communication history, follow-ups, and business opportunities with recruitment activities, providing end-to-end visibility from client acquisition and job requirements through candidate selection and placement.",
    'HRMS & Employee Lifecycle Management': "TaskNera's HRMS supports essential employee lifecycle and workforce management activities, including employee records, onboarding and offboarding, attendance, leave management, payroll workflows, performance, and training. The planned CRM integration connects customer accounts, business opportunities, and service requirements with relevant workforce operations, helping organizations improve coordination between customer-facing teams and internal people-management processes to create a connected, visible, and efficient business operations ecosystem.",
    'HRMS + CRM Application': "TaskNera's HRMS supports essential employee lifecycle and workforce management activities, including employee records, onboarding and offboarding, attendance, leave management, payroll workflows, performance, and training. The planned CRM integration connects customer accounts, business opportunities, and service requirements with relevant workforce operations, helping organizations improve coordination between customer-facing teams and internal people-management processes to create a connected, visible, and efficient business operations ecosystem.",
    'HRMS + CRm': "TaskNera's HRMS supports essential employee lifecycle and workforce management activities, including employee records, onboarding and offboarding, attendance, leave management, payroll workflows, performance, and training. The planned CRM integration connects customer accounts, business opportunities, and service requirements with relevant workforce operations, helping organizations improve coordination between customer-facing teams and internal people-management processes to create a connected, visible, and efficient business operations ecosystem."
  };

  // Fetch available companies for all users
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCompanies();
    }
  }, [isOpen]);

  // Pre-fill when an initial company is provided
  useEffect(() => {
    if (initialCompany && isOpen) {
      setSelectedCompanyId('');
      setCompanyName(initialCompany.name || '');
      setEmail(initialCompany.email || '');
      setCompanyWebsite(initialCompany.website || '');
      if (initialCompany.recipientName) {
        setRecipientName(initialCompany.recipientName);
      }
    }
  }, [initialCompany, isOpen]);

  const fetchAvailableCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await fetch('/api/companies/for-employees');
      const data = await res.json();
      if (data.success) {
        setAvailableCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    const company = availableCompanies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompanyId(companyId);
      setCompanyName(company.name);
      setEmail(company.email);
    } else {
      setSelectedCompanyId('');
    }
  };

  // Generated draft state
  const [generatedResult, setGeneratedResult] = useState<GeneratedEmailResult | null>(null);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Status flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingId: string;
    existingCompany: string;
    message: string;
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedCompanyId('');
    setCompanyName('');
    setEmail('');
    setCcEmails('');
    setMailTopic('recruitment services');
    setReason('');
    setRecipientName('');
    setCompanyWebsite('');
    setGeneratedResult(null);
    setSubject('');
    setEmailBody('');
    setError(null);
    setDuplicateWarning(null);
    setIsEditing(false);
    setIsCopied(false);
    setCurrentCampaignId(null);
  };

  const handleCopyMail = async () => {
    if (!emailBody) return;
    try {
      const fullContent = subject ? `Subject: ${subject}\n\n${emailBody}` : emailBody;
      await navigator.clipboard.writeText(fullContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = subject ? `Subject: ${subject}\n\n${emailBody}` : emailBody;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGenerate = async (forceDuplicate = false) => {
    if (!companyName.trim()) {
      setError('Please enter or select a company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!mailTopic && !reason.trim()) {
      setError('Please select a Mail Topic or enter outreach context.');
      return;
    }

    const topicPitch = mailTopic ? DEFAULT_TOPIC_PITCHES[mailTopic] || mailTopic : '';
    const effectiveReason = reason.trim()
      ? (mailTopic ? `[${mailTopic}] ${reason.trim()}` : reason.trim())
      : (topicPitch || 'AI candidate screening & automated resume matching to eliminate recruiter review bottlenecks and save 8-10 hours/week.');

    setError(null);
    setIsGenerating(true);

    try {
      const createRes = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim(),
          ccEmails: ccEmails.trim(),
          mailTopic: mailTopic.trim(),
          reason: effectiveReason,
          recipientName: recipientName.trim(),
          companyWebsite: companyWebsite.trim(),
          forceDuplicate
        })
      });

      const createData = await createRes.json();

      if (createRes.status === 409 && createData.duplicate) {
        setDuplicateWarning({
          existingId: createData.existingCampaignId,
          existingCompany: createData.existingCompany,
          message: createData.message
        });
        setIsGenerating(false);
        return;
      }

      if (!createRes.ok) {
        throw new Error(createData.error || 'Could not save details');
      }

      const campaign = createData.campaign;
      setCurrentCampaignId(campaign.id);

      const genRes = await fetch(`/api/outreach/${campaign.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial', mailTopic: mailTopic.trim() })
      });

      const genData = await genRes.json();
      if (!genRes.ok) {
        throw new Error(genData.error || 'Could not write email');
      }

      setGeneratedResult(genData.generated);
      setSubject(genData.generated.subject);
      setEmailBody(genData.generated.body);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAndSend = async () => {
    if (isSending) return;
    if (!companyName.trim()) {
      setError('Please enter or select a company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!mailTopic && !reason.trim()) {
      setError('Please select a Mail Topic or enter outreach context.');
      return;
    }

    const topicPitch = mailTopic ? DEFAULT_TOPIC_PITCHES[mailTopic] || mailTopic : '';
    const effectiveReason = reason.trim()
      ? (mailTopic ? `[${mailTopic}] ${reason.trim()}` : reason.trim())
      : (topicPitch || 'AI candidate screening & automated resume matching to eliminate recruiter review bottlenecks and save 8-10 hours/week.');

    setError(null);
    setIsSending(true);

    try {
      // 1. Create outreach target
      const createRes = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim(),
          ccEmails: ccEmails.trim(),
          mailTopic: mailTopic.trim(),
          reason: effectiveReason,
          recipientName: recipientName.trim(),
          companyWebsite: companyWebsite.trim(),
          forceDuplicate: false
        })
      });

      const createData = await createRes.json();
      if (createRes.status === 409 && createData.duplicate) {
        setDuplicateWarning({
          existingId: createData.existingCampaignId,
          existingCompany: createData.existingCompany,
          message: createData.message
        });
        setIsSending(false);
        return;
      }
      if (!createRes.ok) throw new Error(createData.error || 'Could not save company');

      const campaign = createData.campaign;
      setCurrentCampaignId(campaign.id);

      // 2. Generate email
      const genRes = await fetch(`/api/outreach/${campaign.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial', mailTopic: mailTopic.trim() })
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Could not write email');

      // 3. Send email immediately via configured SMTP (operations@tasknera.com)
      const sendRes = await fetch(`/api/outreach/${campaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'initial',
          subject: genData.generated.subject,
          body: genData.generated.body
        })
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Could not send email');

      onSuccess();
      resetForm();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async () => {
    if (!companyName) return;
    setIsGenerating(true);
    setError(null);

    try {
      let targetId = currentCampaignId;
      if (!targetId) {
        const res = await fetch('/api/outreach?q=' + encodeURIComponent(email));
        const data = await res.json();
        targetId = data.campaigns?.[0]?.id;
      }

      if (targetId) {
        const regenRes = await fetch(`/api/outreach/${targetId}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'initial' })
        });
        const regenData = await regenRes.json();
        setGeneratedResult(regenData.generated);
        setSubject(regenData.generated.subject);
        setEmailBody(regenData.generated.body);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (isSending) return;
    setIsSending(true);
    setError(null);

    try {
      let targetId = currentCampaignId;
      if (!targetId) {
        const res = await fetch('/api/outreach?q=' + encodeURIComponent(email));
        const data = await res.json();
        targetId = data.campaigns?.[0]?.id;
      }

      if (!targetId) throw new Error('Email record not found');

      const sendRes = await fetch(`/api/outreach/${targetId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'initial',
          subject,
          body: emailBody
        })
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Could not send email');

      onSuccess();
      resetForm();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = () => {
    onSuccess();
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">New Outreach Email</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compose tailored B2B outreach across TaskNera workforce &amp; software offerings.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-900">This email was already added</p>
                <p className="text-amber-800">
                  {duplicateWarning.message} for{' '}
                  <strong className="text-slate-900 font-semibold">{duplicateWarning.existingCompany}</strong>.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectExisting(duplicateWarning.existingId);
                      resetForm();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer text-xs"
                  >
                    Open Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateWarning(null);
                      handleGenerate(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
                  >
                    Create anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Left: Input fields */}
          <div className="space-y-4">
            {/* Company Selection / Quick Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Saved Company <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {selectedCompanyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId('');
                    }}
                    className="text-[11px] text-slate-600 hover:text-slate-900 underline transition-colors cursor-pointer font-medium"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedCompanyId}
                  onChange={e => handleCompanySelect(e.target.value)}
                  disabled={loadingCompanies}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-8 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {loadingCompanies ? 'Loading companies...' : '-- Choose from saved companies or type below --'}
                  </option>
                  {availableCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.email})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Company Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                {selectedCompanyId && (
                  <span className="text-[10px] text-emerald-700 font-medium">Auto-filled from directory</span>
                )}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 font-mono placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CC (Optional)
                </label>
                <input
                  type="text"
                  placeholder="team@mycompany.com"
                  value={ccEmails}
                  onChange={e => setCcEmails(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 font-mono placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Auto save checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="saveToDirectory"
                checked={saveToDirectory}
                onChange={e => setSaveToDirectory(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
              />
              <label htmlFor="saveToDirectory" className="text-[11px] text-slate-600 cursor-pointer select-none">
                Save / update in Company Directory for the team
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Person&apos;s Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="acme.com"
                    value={companyWebsite}
                    onChange={e => setCompanyWebsite(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mail Topic (Category) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mail Topic <span className="text-rose-500">*</span>
                </label>
                {mailTopic && (
                  <span className="text-[10px] text-slate-600 font-medium">
                    Active: {mailTopic}
                  </span>
                )}
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={mailTopic}
                  onChange={e => setMailTopic(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-8 text-xs text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Choose a mail topic...</option>
                  <option value="Virtual Customer Support (VCS)">Virtual Customer Support (VCS)</option>
                  <option value="Recruitment & Talent Acquisition">Recruitment & Talent Acquisition</option>
                  <option value="HR Technology & Digital Solutions">HR Technology & Digital Solutions</option>
                  <option value="HireIQ — ATS & Recruitment Intelligence">HireIQ — ATS & Recruitment Intelligence</option>
                  <option value="HRMS & Employee Lifecycle Management">HRMS & Employee Lifecycle Management</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Quick-select topic pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { id: 'Virtual Customer Support (VCS)', label: 'Virtual Customer Support (VCS)' },
                  { id: 'Recruitment & Talent Acquisition', label: 'Recruitment & Talent Acquisition' },
                  { id: 'HR Technology & Digital Solutions', label: 'HR Tech & Digital Solutions' },
                  { id: 'HireIQ — ATS & Recruitment Intelligence', label: 'HireIQ (ATS + CRM)' },
                  { id: 'HRMS & Employee Lifecycle Management', label: 'HRMS + CRM' }
                ].map(topic => {
                  const isSelected = mailTopic === topic.id ||
                    (topic.id === 'Virtual Customer Support (VCS)' && (mailTopic === 'VCS')) ||
                    (topic.id === 'Recruitment & Talent Acquisition' && (mailTopic === 'Recruitment Services' || mailTopic === 'recruitment services')) ||
                    (topic.id === 'HR Technology & Digital Solutions' && (mailTopic === 'Software Solutions' || mailTopic === 'software solutions')) ||
                    (topic.id === 'HireIQ — ATS & Recruitment Intelligence' && (mailTopic === 'ATS + CRM Application — HireIQ by TaskNera' || mailTopic === 'ATS + CRM app')) ||
                    (topic.id === 'HRMS & Employee Lifecycle Management' && (mailTopic === 'HRMS + CRM Application' || mailTopic === 'HRMS + CRm'));
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setMailTopic(topic.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/70'
                        }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Outreach Context / Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <textarea
                  rows={2}
                  placeholder={
                    mailTopic
                      ? `Optional custom notes for ${mailTopic}`
                      : "e.g. Any custom notes or specific prospect context"
                  }
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {!generatedResult && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || isSending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 py-2.5 px-3 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Composing draft...</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="h-3.5 w-3.5 text-white" />
                      <span>Draft &amp; Review</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Draft preview */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Draft Preview
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 font-medium border border-slate-200">
                  {mailTopic || 'TaskNera Standard'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {generatedResult && (
                  <button
                    type="button"
                    onClick={handleCopyMail}
                    className="flex items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700 transition-colors cursor-pointer"
                    title="Copy full email (subject + body)"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
                {generatedResult && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {generatedResult.wordCount} words
                  </span>
                )}
              </div>
            </div>

            {generatedResult ? (
              <div className="flex-1 flex flex-col space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-500">Subject</label>
                    {generatedResult.alternativeSubjects && generatedResult.alternativeSubjects.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">Subject Variations</span>
                    )}
                  </div>
                  {generatedResult.alternativeSubjects && generatedResult.alternativeSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {generatedResult.alternativeSubjects.map((altSubj, idx) => {
                        const labels = ['Direct', 'Value', 'Conversational'];
                        const isSelected = subject === altSubj;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSubject(altSubj)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                            title={altSubj}
                          >
                            <span className={`font-semibold mr-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{labels[idx] || `V${idx + 1}`}:</span>
                            {altSubj.length > 34 ? altSubj.slice(0, 34) + '…' : altSubj}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  ) : (
                    <div className="rounded-lg bg-white p-2.5 text-xs font-medium text-slate-900 border border-slate-200">
                      {subject}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Body</label>
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full flex-1 rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800 whitespace-pre-line"
                    />
                  ) : (
                    <div className="flex-1 rounded-lg bg-white p-3 text-xs text-slate-700 border border-slate-200 whitespace-pre-line leading-relaxed overflow-y-auto max-h-[220px]">
                      {emailBody}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMail}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                      title="Copy full email to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <FileText className="h-8 w-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-slate-700 font-semibold">Your draft will show here</p>
                <p className="text-slate-500 mt-1 max-w-xs">
                  Fill in the details on the left and click &quot;Draft &amp; Review&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
