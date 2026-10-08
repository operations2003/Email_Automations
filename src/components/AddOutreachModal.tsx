'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedEmailResult, OutreachService, DEFAULT_SERVICES } from '@/types/outreach';
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
  Plus,
  Sparkles,
  Briefcase
} from 'lucide-react';

interface AddOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSelectExisting: (id: string) => void;
  services?: OutreachService[];
  onServicesChange?: (newServices: OutreachService[]) => void;
}

export function AddOutreachModal({
  isOpen,
  onClose,
  onSuccess,
  onSelectExisting,
  services: initialServices,
  onServicesChange
}: AddOutreachModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [reason, setReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Dynamic Services state
  const [servicesList, setServicesList] = useState<OutreachService[]>(
    initialServices && initialServices.length > 0 ? initialServices : DEFAULT_SERVICES
  );
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [customPitch, setCustomPitch] = useState('');
  const [customIcon, setCustomIcon] = useState('🚀');

  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      setServicesList(initialServices);
    }
  }, [initialServices]);

  const handleSaveCustomService = async () => {
    if (!customName.trim() || !customPitch.trim()) return;

    const newService: OutreachService = {
      id: 'srv_' + Math.random().toString(36).substring(2, 9),
      name: customName.trim(),
      icon: customIcon.trim() || '🚀',
      tagline: customTagline.trim(),
      pitch: customPitch.trim(),
      isDefault: false
    };

    const updated = [...servicesList, newService];
    setServicesList(updated);
    setSelectedService(newService.id);
    setReason(newService.pitch);
    setShowAddCustom(false);
    setCustomName('');
    setCustomTagline('');
    setCustomPitch('');
    setCustomIcon('🚀');

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: updated })
      });
      if (onServicesChange) {
        onServicesChange(updated);
      }
    } catch (err) {
      console.error('Failed to save custom service:', err);
    }
  };

  const handleDeleteCustomService = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = servicesList.filter(s => s.id !== serviceId);
    setServicesList(updated);
    if (selectedService === serviceId) {
      setSelectedService(null);
    }
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: updated })
      });
      if (onServicesChange) {
        onServicesChange(updated);
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
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
    setCompanyName('');
    setEmail('');
    setCcEmails('');
    setReason('');
    setSelectedService(null);
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
      setError('Please enter a company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter why you want to email them.');
      return;
    }

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
          reason: reason.trim(),
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
        body: JSON.stringify({ stage: 'initial' })
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
      setError('Please enter a company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter why you want to email them.');
      return;
    }

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
          reason: reason.trim(),
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
        body: JSON.stringify({ stage: 'initial' })
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
    if (!companyName || !reason) return;
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
              Send an email from the TaskNera team regarding our services or custom goals.
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
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Company Name <span className="text-rose-400">*</span>
              </label>
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Select TaskNera Service
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>{showAddCustom ? 'Cancel' : 'Add Custom Service'}</span>
                </button>
              </div>

              {/* Inline Custom Service Creator */}
              {showAddCustom && (
                <div className="mb-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Create Custom Offering
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-400 mb-0.5">Service Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. DevOps & Cloud"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        className="w-full rounded bg-[#0d0f12] border border-[#23272f] py-1 px-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Icon</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          maxLength={4}
                          value={customIcon}
                          onChange={e => setCustomIcon(e.target.value)}
                          className="w-9 rounded bg-[#0d0f12] border border-[#23272f] py-1 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-0.5 text-xs">
                          {['🎯', '💻', '🤖', '📋', '🚀', '⚡'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setCustomIcon(emoji)}
                              className="px-1 py-0.5 rounded hover:bg-[#23272f] text-xs"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Tagline (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cloud migration, CI/CD, AWS cost audit"
                      value={customTagline}
                      onChange={e => setCustomTagline(e.target.value)}
                      className="w-full rounded bg-[#0d0f12] border border-[#23272f] py-1 px-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Email Pitch / Goal *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Introduce TaskNera's cloud infrastructure review and DevOps pipeline setup."
                      value={customPitch}
                      onChange={e => setCustomPitch(e.target.value)}
                      className="w-full rounded bg-[#0d0f12] border border-[#23272f] py-1 px-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomService}
                      disabled={!customName.trim() || !customPitch.trim()}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Save & Select
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Service Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5 max-h-48 overflow-y-auto pr-0.5">
                {servicesList.map(service => {
                  const isSelected = selectedService === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id);
                        setReason(service.pitch);
                      }}
                      className={`group relative flex flex-col text-left p-2 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#23272f] bg-[#14171c] hover:bg-[#1c2128] hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium text-white flex items-center gap-1.5 truncate">
                          <span>{service.icon || '💼'}</span>
                          <span className="truncate">{service.name}</span>
                        </span>
                        {!service.isDefault && (
                          <button
                            type="button"
                            onClick={e => handleDeleteCustomService(service.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-400 p-0.5 rounded transition-opacity"
                            title="Remove service"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {service.tagline && (
                        <span className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {service.tagline}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <label className="block text-xs font-medium text-gray-300 mb-1">
                Why are you emailing them? <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <textarea
                  rows={2}
                  placeholder="e.g. Introduce HireIQ or see if they need help hiring software developers."
                  value={reason}
                  onChange={e => {
                    setReason(e.target.value);
                  }}
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
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 font-medium">
                  TaskNera Team
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
                  <label className="block text-[11px] text-gray-400 mb-1">Subject</label>
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
