'use client';

import React, { useState, useEffect } from 'react';
import { OutreachCampaign, AppSettings } from '@/types/outreach';
import {
  X,
  Send,
  RefreshCw,
  FileEdit,
  Mail,
  ShieldCheck,
  Check,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';

interface EmailPreviewModalProps {
  campaign: OutreachCampaign | null;
  stage?: 'initial' | 'followup_1' | 'followup_2' | 'followup_3';
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  settings: AppSettings;
}

export function EmailPreviewModal({
  campaign,
  stage: initialStage = 'initial',
  isOpen,
  onClose,
  onRefresh,
  settings
}: EmailPreviewModalProps) {
  const [activeStage, setActiveStage] = useState<'initial' | 'followup_1' | 'followup_2' | 'followup_3'>(
    initialStage
  );
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setActiveStage(initialStage);
  }, [initialStage, campaign]);

  useEffect(() => {
    if (!campaign) return;
    if (activeStage === 'initial') {
      setSubject(campaign.initialSubject || '');
      setBody(campaign.initialEmailBody || '');
    } else if (activeStage === 'followup_1') {
      setSubject(campaign.followUp1Subject || '');
      setBody(campaign.followUp1Body || '');
    } else if (activeStage === 'followup_2') {
      setSubject(campaign.followUp2Subject || '');
      setBody(campaign.followUp2Body || '');
    } else if (activeStage === 'followup_3') {
      setSubject(campaign.followUp3Subject || '');
      setBody(campaign.followUp3Body || '');
    }
  }, [activeStage, campaign]);

  if (!isOpen || !campaign) return null;

  const handleSend = async () => {
    setIsSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/outreach/${campaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: activeStage,
          subject,
          body
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      setFeedback('Email sent successfully!');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setFeedback(`Error: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/outreach/${campaign.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: activeStage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate email');

      setSubject(data.generated.subject);
      setBody(data.generated.body);
      setFeedback('Fresh AI variation generated!');
      onRefresh();
    } catch (err: unknown) {
      const e = err as Error;
      setFeedback(`Error: ${e.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getStageSentAt = () => {
    if (activeStage === 'initial') return campaign.initialSentAt;
    if (activeStage === 'followup_1') return campaign.followUp1SentAt;
    if (activeStage === 'followup_2') return campaign.followUp2SentAt;
    if (activeStage === 'followup_3') return campaign.followUp3SentAt;
    return null;
  };

  const isSent = Boolean(getStageSentAt());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Email Preview: {campaign.companyName}
              </h3>
              <p className="text-xs text-slate-400">
                Reason: &ldquo;{campaign.reason}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage Tabs (Initial, Follow-Up 1, Follow-Up 2, Follow-Up 3) */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveStage('initial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStage === 'initial'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            Initial Email
            {campaign.initialSentAt && <span className="text-[10px] text-emerald-300">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStage === 'followup_1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            Follow-Up 1 (Day 2)
            {campaign.followUp1SentAt && <span className="text-[10px] text-emerald-300">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStage === 'followup_2'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            Follow-Up 2 (Day 4)
            {campaign.followUp2SentAt && <span className="text-[10px] text-emerald-300">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStage === 'followup_3'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            Follow-Up 3 (Day 6)
            {campaign.followUp3SentAt && <span className="text-[10px] text-emerald-300">✓</span>}
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-300">
            {feedback}
          </div>
        )}

        {/* Email Client Mockup Window */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-inner">
          {/* Email Headers */}
          <div className="border-b border-slate-800 bg-slate-900 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold w-14">From:</span>
                <span className="text-slate-200">
                  {settings.senderName} &lt;{settings.senderEmail}&gt;
                </span>
              </div>
              {isSent ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Sent on{' '}
                  {new Date(getStageSentAt()!).toLocaleDateString()}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  <Clock className="h-3 w-3" /> Unsent / Scheduled
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold w-14">To:</span>
              <span className="text-slate-200 font-mono">{campaign.email}</span>
            </div>

            {campaign.ccEmails && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold w-14">CC:</span>
                <span className="text-slate-400 font-mono">{campaign.ccEmails}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
              <span className="text-slate-500 font-semibold w-14">Subject:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-950 border border-indigo-500/50 p-1.5 text-xs font-semibold text-indigo-300 focus:outline-none"
                />
              ) : (
                <span className="font-semibold text-indigo-300">{subject || '(No subject generated)'}</span>
              )}
            </div>
          </div>

          {/* Email Body */}
          <div className="p-4 bg-slate-950/70 min-h-[220px]">
            {isEditing ? (
              <textarea
                rows={10}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-indigo-500/50 p-3 text-xs text-slate-200 focus:outline-none whitespace-pre-line leading-relaxed font-sans"
              />
            ) : body ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {body}
                </div>
                {/* Appended signature */}
                <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 whitespace-pre-line font-sans">
                  {settings.emailSignature}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <Sparkles className="h-8 w-8 text-indigo-400 mb-2" />
                <p className="text-xs">Email content has not been generated for this stage yet.</p>
                <button
                  onClick={handleRegenerate}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Generate {activeStage} with AI
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate Variation
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <FileEdit className="h-3.5 w-3.5" />
              {isEditing ? 'Done Editing' : 'Edit Email'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !body}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isSent ? 'Resend This Email' : 'Send Email Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
