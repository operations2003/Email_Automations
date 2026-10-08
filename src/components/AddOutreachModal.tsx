'use client';

import React, { useState } from 'react';
import { OutreachCampaign, GeneratedEmailResult } from '@/types/outreach';
import {
  X,
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  Users,
  FileText
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
  const [ccEmails, setCcEmails] = useState('sales@mycompany.com');
  const [reason, setReason] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [notes, setNotes] = useState('');

  // AI Generated output state
  const [generatedResult, setGeneratedResult] = useState<GeneratedEmailResult | null>(null);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Status flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    setCcEmails('sales@mycompany.com');
    setReason('');
    setRecipientName('');
    setCompanyWebsite('');
    setNotes('');
    setGeneratedResult(null);
    setSubject('');
    setEmailBody('');
    setError(null);
    setDuplicateWarning(null);
    setIsEditing(false);
  };

  const handleGenerate = async (forceDuplicate = false) => {
    if (!companyName.trim()) {
      setError('Please provide a Company Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid recipient email address.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a Reason for Email.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Step 1: Create campaign record first (with duplicate check)
      const createRes = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          email,
          ccEmails,
          reason,
          recipientName,
          companyWebsite,
          notes,
          forceCreate: forceDuplicate
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        if (createData.isDuplicate) {
          setDuplicateWarning({
            existingId: createData.existingId,
            existingCompany: createData.existingCompany,
            message: createData.message
          });
          setIsGenerating(false);
          return;
        }
        throw new Error(createData.error || 'Failed to create campaign');
      }

      const campaign: OutreachCampaign = createData.campaign;

      // Step 2: Trigger AI Generation
      const genRes = await fetch(`/api/outreach/${campaign.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Failed to generate email');

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
      // Look up campaign ID or run client-side generator request
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

      if (!campaign) throw new Error('Campaign not found');

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
      if (!sendRes.ok) throw new Error(sendData.error || 'Failed to send email');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Add New Outreach Target</h2>
              <p className="text-xs text-slate-400">
                AI generates a professional personalized email & prepares 3 automated follow-ups.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Duplicate warning modal overlay */}
        {duplicateWarning && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-300">Contact Already Exists</h4>
                <p className="text-xs text-amber-200/80 mt-1">{duplicateWarning.message}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectExisting(duplicateWarning.existingId);
                      resetForm();
                      onClose();
                    }}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    View Existing Campaign
                  </button>
                  <button
                    onClick={() => {
                      setDuplicateWarning(null);
                      handleGenerate(true);
                    }}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  >
                    Create New Campaign Anyway
                  </button>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column: Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Acme Technologies or SIXT"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="e.g. hr@acme.com or sumit@sixt.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Keep in CC
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. sales@mycompany.com, team@tasknera.com"
                  value={ccEmails}
                  onChange={e => setCcEmails(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <textarea
                  rows={3}
                  placeholder='e.g. "Introduce our recruitment services and discuss how we can help them hire software developers."'
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The reason drives AI personalization, intent classification, and non-generic angles.
              </p>
            </div>

            {/* Optional Collapsible Fields */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sumit Sharma"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 py-1.5 px-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Company Website (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://sixt.com"
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 py-1.5 px-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Primary Generate Button */}
            {!generatedResult && (
              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Synthesizing Unique AI Email...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate AI Email & Follow-Up Sequence
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: AI Live Preview */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                AI Generated Output
              </span>
              {generatedResult && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    Quality Checked
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {generatedResult.wordCount} words
                  </span>
                </div>
              )}
            </div>

            {generatedResult ? (
              <div className="flex-1 flex flex-col space-y-3">
                {/* Subject Field */}
                <div>
                  <span className="block text-[11px] font-medium text-slate-400 mb-1">Subject:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-indigo-500/50 p-2 text-xs font-medium text-indigo-300 focus:outline-none"
                    />
                  ) : (
                    <div className="rounded-lg bg-slate-950 p-2.5 text-xs font-semibold text-indigo-300 border border-slate-800">
                      {subject}
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div className="flex-1 flex flex-col">
                  <span className="block text-[11px] font-medium text-slate-400 mb-1">Email Body:</span>
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full flex-1 rounded-lg bg-slate-950 border border-indigo-500/50 p-2.5 text-xs text-slate-200 focus:outline-none font-sans whitespace-pre-line"
                    />
                  ) : (
                    <div className="flex-1 rounded-lg bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800 whitespace-pre-line leading-relaxed overflow-y-auto max-h-[220px]">
                      {emailBody}
                    </div>
                  )}
                </div>

                {/* Automation notice */}
                <div className="rounded-lg bg-indigo-950/20 border border-indigo-500/20 p-2.5 text-[11px] text-indigo-300/90">
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    Automated 3-Stage Follow-Up Sequence Configured:
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Day 0: Initial • Day 2: Follow-Up 1 • Day 4: Follow-Up 2 • Day 6: Final Loop. Stops instantly if recipient replies!
                  </p>
                </div>

                {/* Actions row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      title="Generate a completely different variation"
                    >
                      <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <FileEdit className="h-3 w-3" />
                      {isEditing ? 'Done Editing' : 'Edit'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      {isSending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send Email & Schedule
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">Awaiting Target Information</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Fill in the company details and click "Generate AI Email" to synthesize a unique, personalized pitch.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
