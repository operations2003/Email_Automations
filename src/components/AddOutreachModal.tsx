'use client';

import React, { useState } from 'react';
import { GeneratedEmailResult } from '@/types/outreach';
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
  PenTool
} from 'lucide-react';

interface AddOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSelectExisting: (id: string) => void;
}

export function AddOutreachModal({
  isOpen,
  onClose,
  onSuccess,
  onSelectExisting
}: AddOutreachModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [reason, setReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);

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

  const handleRegenerate = async () => {
    if (!companyName || !reason) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/outreach?q=' + encodeURIComponent(email));
      const data = await res.json();
      const campaign = data.campaigns?.[0];

      if (campaign) {
        const regenRes = await fetch(`/api/outreach/${campaign.id}/regenerate`, {
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
      const res = await fetch('/api/outreach?q=' + encodeURIComponent(email));
      const data = await res.json();
      const campaign = data.campaigns?.[0];

      if (!campaign) throw new Error('Email record not found');

      const sendRes = await fetch(`/api/outreach/${campaign.id}/send`, {
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
                <span className="text-[10px] text-gray-400">Click to fill goal</span>
              </div>

              {/* Service presets */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService('hireiq');
                    setReason("Introduce HireIQ, TaskNera's AI platform for instant JD-to-candidate matching and automated resume screening.");
                  }}
                  className={`flex flex-col text-left p-2 rounded-md border transition-all ${
                    selectedService === 'hireiq'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#23272f] bg-[#14171c] hover:bg-[#1c2128] hover:border-blue-500/40'
                  }`}
                >
                  <span className="text-xs font-medium text-blue-400">🎯 HireIQ (AI Screening)</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JD matching & resume scoring</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedService('staffing');
                    setReason("Offer TaskNera's on-demand tech staffing—providing pre-vetted senior developers and engineering pods within 48 to 72 hours.");
                  }}
                  className={`flex flex-col text-left p-2 rounded-md border transition-all ${
                    selectedService === 'staffing'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-[#23272f] bg-[#14171c] hover:bg-[#1c2128] hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-xs font-medium text-emerald-400">💻 Tech Staffing</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Senior devs in 48-72 hours</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedService('software');
                    setReason("Introduce TaskNera's custom software and AI development services for building scalable web, mobile, and cloud solutions.");
                  }}
                  className={`flex flex-col text-left p-2 rounded-md border transition-all ${
                    selectedService === 'software'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#23272f] bg-[#14171c] hover:bg-[#1c2128] hover:border-purple-500/40'
                  }`}
                >
                  <span className="text-xs font-medium text-purple-400">🤖 Custom Software & AI</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Full-cycle product builds</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedService('ats');
                    setReason("Share TaskNera's recruitment automation and ATS workflow solutions to speed up candidate pipelines.");
                  }}
                  className={`flex flex-col text-left p-2 rounded-md border transition-all ${
                    selectedService === 'ats'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-[#23272f] bg-[#14171c] hover:bg-[#1c2128] hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-xs font-medium text-amber-400">📋 Recruiting Automation</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">ATS & pipeline workflows</span>
                </button>
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
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 py-2.5 px-4 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Writing draft...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Write Email Draft</span>
                  </>
                )}
              </button>
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
              {generatedResult && (
                <span className="text-[11px] text-gray-400 font-mono">
                  {generatedResult.wordCount} words
                </span>
              )}
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
