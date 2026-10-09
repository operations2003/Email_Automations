'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedEmailResult, OutreachService } from '@/types/outreach';
import { Company } from '@/types/company';
import {
  X,
  Send,
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
    'VCS': "TaskNera HR Solutions provides flexible workforce and staffing support to help businesses meet their talent requirements efficiently. We aim to simplify workforce planning, support hiring needs, and help organizations find suitable talent while reducing the time and effort involved in managing staffing requirements. Our services can be tailored to your organization's needs and growth plans.",
    'Recruitment Services': "TaskNera HR Solutions helps businesses streamline their recruitment process, from identifying potential candidates to screening and shortlisting suitable talent. Our goal is to help organizations reduce hiring effort, improve recruitment efficiency, and connect with candidates who match their job requirements. We support businesses in building stronger teams through a more organized and effective hiring process.",
    'recruitment services': "TaskNera HR Solutions helps businesses streamline their recruitment process, from identifying potential candidates to screening and shortlisting suitable talent. Our goal is to help organizations reduce hiring effort, improve recruitment efficiency, and connect with candidates who match their job requirements. We support businesses in building stronger teams through a more organized and effective hiring process.",
    'Software Solutions': "TaskNera HR Solutions delivers technology-driven software solutions that help businesses simplify workflows, reduce manual tasks, and improve operational efficiency. Our solutions focus on recruitment intelligence, human resource management, and customer relationship management, enabling organizations to manage essential business activities more effectively through digital tools tailored to their operational needs.",
    'software solutions': "TaskNera HR Solutions delivers technology-driven software solutions that help businesses simplify workflows, reduce manual tasks, and improve operational efficiency. Our solutions focus on recruitment intelligence, human resource management, and customer relationship management, enabling organizations to manage essential business activities more effectively through digital tools tailored to their operational needs.",
    'ATS + CRM Application — HireIQ by TaskNera': "HireIQ by TaskNera is an AI-powered recruitment intelligence solution designed to make hiring smarter and more efficient. It helps recruitment teams analyze job descriptions, evaluate resumes against defined criteria, identify suitable candidates, and organize recruitment activities. Combined with CRM capabilities, it helps teams manage candidate information and recruitment interactions in a more structured workflow, reducing repetitive work and supporting informed hiring decisions.",
    'ATS + CRM app': "HireIQ by TaskNera is an AI-powered recruitment intelligence solution designed to make hiring smarter and more efficient. It helps recruitment teams analyze job descriptions, evaluate resumes against defined criteria, identify suitable candidates, and organize recruitment activities. Combined with CRM capabilities, it helps teams manage candidate information and recruitment interactions in a more structured workflow, reducing repetitive work and supporting informed hiring decisions.",
    'HRMS + CRM Application': "TaskNera HR Solutions offers an integrated HRMS and CRM solution designed to simplify employee management and customer relationship workflows. The HRMS supports essential HR activities such as attendance, leave management, employee records, and payroll workflows, while CRM capabilities help businesses manage leads, customer information, and interactions. Together, these solutions aim to improve coordination, reduce administrative workload, and provide businesses with better visibility into their day-to-day operations.",
    'HRMS + CRm': "TaskNera HR Solutions offers an integrated HRMS and CRM solution designed to simplify employee management and customer relationship workflows. The HRMS supports essential HR activities such as attendance, leave management, employee records, and payroll workflows, while CRM capabilities help businesses manage leads, customer information, and interactions. Together, these solutions aim to improve coordination, reduce administrative workload, and provide businesses with better visibility into their day-to-day operations."
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-[#23272f] bg-[#14171c] p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23272f] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">New Outreach Email</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Personalized B2B cold outreach for AI ATS &amp; candidate screening intelligence.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-md p-1.5 text-gray-400 hover:bg-[#23272f] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-300">This email was already added</p>
                <p className="text-gray-300">
                  {duplicateWarning.message} for{' '}
                  <strong className="text-white">{duplicateWarning.existingCompany}</strong>.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectExisting(duplicateWarning.existingId);
                      resetForm();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    Open Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateWarning(null);
                      handleGenerate(true);
                    }}
                    className="px-3 py-1.5 rounded-md border border-[#23272f] hover:bg-[#23272f] text-gray-300"
                  >
                    Create anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1.5 rounded-md text-gray-400 hover:text-gray-200"
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
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Left: Input fields */}
          <div className="space-y-4">
            {/* Company Selection / Quick Picker (Optional for both Admin and Employee) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-300">
                  Select Saved Company <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                {selectedCompanyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId('');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <select
                  value={selectedCompanyId}
                  onChange={e => handleCompanySelect(e.target.value)}
                  disabled={loadingCompanies}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
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
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Company Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-300">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                {selectedCompanyId && (
                  <span className="text-[10px] text-emerald-400 font-medium">Auto-filled from directory</span>
                )}
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white font-mono placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  CC (Optional)
                </label>
                <input
                  type="text"
                  placeholder="team@mycompany.com"
                  value={ccEmails}
                  onChange={e => setCcEmails(e.target.value)}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 px-3 text-xs text-white font-mono placeholder-gray-400 focus:border-blue-500 focus:outline-none"
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
                className="h-3.5 w-3.5 rounded border-[#23272f] bg-[#0d0f12] text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="saveToDirectory" className="text-[11px] text-gray-400 cursor-pointer select-none">
                Save / update in Company Directory for the team
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Person&apos;s Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="acme.com"
                    value={companyWebsite}
                    onChange={e => setCompanyWebsite(e.target.value)}
                    className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mail Topic (Category) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-300">
                  Mail Topic <span className="text-rose-400">*</span>
                </label>
                {mailTopic && (
                  <span className="text-[10px] text-blue-400 font-medium">
                    Active: {mailTopic}
                  </span>
                )}
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <select
                  value={mailTopic}
                  onChange={e => setMailTopic(e.target.value)}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-8 text-xs text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Choose a mail topic...</option>
                  <option value="VCS">VCS (Flexible Workforce & Staffing)</option>
                  <option value="Recruitment Services">Recruitment Services</option>
                  <option value="Software Solutions">Software Solutions</option>
                  <option value="ATS + CRM Application — HireIQ by TaskNera">ATS + CRM Application — HireIQ by TaskNera</option>
                  <option value="HRMS + CRM Application">HRMS + CRM Application</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Quick-select topic pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { id: 'VCS', label: 'VCS' },
                  { id: 'Recruitment Services', label: 'Recruitment Services' },
                  { id: 'Software Solutions', label: 'Software Solutions' },
                  { id: 'ATS + CRM Application — HireIQ by TaskNera', label: 'HireIQ (ATS + CRM)' },
                  { id: 'HRMS + CRM Application', label: 'HRMS + CRM' }
                ].map(topic => {
                  const isSelected = mailTopic === topic.id || 
                    (topic.id === 'Recruitment Services' && mailTopic === 'recruitment services') ||
                    (topic.id === 'Software Solutions' && mailTopic === 'software solutions') ||
                    (topic.id === 'ATS + CRM Application — HireIQ by TaskNera' && mailTopic === 'ATS + CRM app') ||
                    (topic.id === 'HRMS + CRM Application' && mailTopic === 'HRMS + CRm');
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setMailTopic(topic.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs border border-blue-500 font-semibold'
                          : 'bg-[#14171c] text-gray-300 border border-[#23272f] hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Outreach Context / Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <textarea
                  rows={2}
                  placeholder={
                    mailTopic
                      ? `Optional custom notes for ${mailTopic} (AI automatically customizes pitch for this topic)`
                      : "e.g. Any custom notes (Optional - AI automatically applies angle & intelligence)"
                  }
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {!generatedResult && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || isSending}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[#23272f] bg-[#14171c] hover:bg-[#1f242d] py-2.5 px-3 text-xs font-medium text-gray-200 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Writing draft...</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="h-3.5 w-3.5 text-blue-400" />
                      <span>Draft & Review</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAndSend}
                  disabled={isGenerating || isSending}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 py-2.5 px-3 text-xs font-medium text-white transition-colors disabled:opacity-50 shadow-sm"
                  title="Automatically write draft and send email immediately"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>⚡ Auto-Send Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Draft preview */}
          <div className="flex flex-col rounded-lg border border-[#23272f] bg-[#0d0f12] p-4">
            <div className="flex items-center justify-between border-b border-[#23272f] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-300">
                  Draft Preview
                </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 font-medium border border-blue-500/20">
                  {mailTopic || 'AI Engine'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {generatedResult && (
                  <button
                    type="button"
                    onClick={handleCopyMail}
                    className="flex items-center gap-1 rounded bg-[#1c2128] hover:bg-[#23272f] border border-[#2b303b] px-2 py-0.5 text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy full email (subject + body)"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-gray-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
                {generatedResult && (
                  <span className="text-[11px] text-gray-400 font-mono">
                    {generatedResult.wordCount} words
                  </span>
                )}
              </div>
            </div>

            {generatedResult ? (
              <div className="flex-1 flex flex-col space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-gray-400">Subject</label>
                    {generatedResult.alternativeSubjects && generatedResult.alternativeSubjects.length > 0 && (
                      <span className="text-[10px] text-gray-400 font-medium">3 AI Angles Available</span>
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
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 font-medium ring-1 ring-blue-500/30'
                                : 'bg-[#14171c] border-[#23272f] text-gray-400 hover:text-gray-200 hover:border-gray-600'
                            }`}
                            title={altSubj}
                          >
                            <span className="font-semibold text-gray-400 mr-1">{labels[idx] || `V${idx + 1}`}:</span>
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
                      className="w-full rounded-md bg-[#14171c] border border-[#23272f] p-2 text-xs font-medium text-white focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-md bg-[#14171c] p-2 text-xs font-medium text-gray-200 border border-[#23272f]">
                      {subject}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-[11px] text-gray-400 mb-1">Body</label>
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full flex-1 rounded-md bg-[#14171c] border border-[#23272f] p-2 text-xs text-gray-200 focus:outline-none whitespace-pre-line"
                    />
                  ) : (
                    <div className="flex-1 rounded-md bg-[#14171c] p-3 text-xs text-gray-300 border border-[#23272f] whitespace-pre-line leading-relaxed overflow-y-auto max-h-[220px]">
                      {emailBody}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#23272f]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="px-2.5 py-1 rounded-md border border-[#23272f] text-xs text-gray-300 hover:bg-[#23272f] transition-colors"
                    >
                      Try Another Version
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-2.5 py-1 rounded-md border border-[#23272f] text-xs text-gray-300 hover:bg-[#23272f] transition-colors"
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMail}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#23272f] text-xs text-gray-300 hover:bg-[#23272f] hover:text-white transition-colors cursor-pointer"
                      title="Copy full email to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Mail</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSending ? 'Sending...' : 'Send Email'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 text-xs">
                <FileText className="h-8 w-8 text-gray-400 mb-2 stroke-[1.5]" />
                <p className="text-gray-300 font-medium">Your draft will show here</p>
                <p className="text-gray-400 mt-1 max-w-xs">
                  Fill in the details on the left and click &quot;Write Email Draft&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
