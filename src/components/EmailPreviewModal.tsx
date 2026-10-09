'use client';

import React, { useState, useEffect } from 'react';
import { OutreachCampaign, AppSettings } from '@/types/outreach';
import {
  X,
  Send,
  RefreshCw,
  FileEdit,
  Check,
  Clock,
  Copy
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
  const [isCopied, setIsCopied] = useState(false);
  const [alternativeSubjects, setAlternativeSubjects] = useState<string[]>([]);

  useEffect(() => {
    setActiveStage(initialStage);
    setAlternativeSubjects([]);
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
    if (isSending) return;
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Could not send email');
      }

      const providerName = data.delivery?.provider === 'resend' ? 'Resend' : data.delivery?.provider || 'provider';
      const msg =
        data.delivery?.provider === 'simulated_sandbox'
          ? 'Email saved in Sandbox mode. Connect Resend or SMTP to send real emails.'
          : `✓ Email successfully sent via ${providerName}!${data.delivery?.messageId ? ` (ID: ${data.delivery.messageId})` : ''}`;
      setFeedback(msg);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const e = err as Error;
      setFeedback(`Error sending email: ${e.message}`);
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
      if (!res.ok) throw new Error(data.error || 'Could not rewrite email');

      setSubject(data.generated.subject);
      setBody(data.generated.body);
      if (data.generated.alternativeSubjects) {
        setAlternativeSubjects(data.generated.alternativeSubjects);
      }
      setFeedback('New version created.');
      onRefresh();
    } catch (err: unknown) {
      const e = err as Error;
      setFeedback(`Error: ${e.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!body) return;
    try {
      const fullText = subject ? `Subject: ${subject}\n\n${body}` : body;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = subject ? `Subject: ${subject}\n\n${body}` : body;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {campaign.companyName}
              </h3>
              {campaign.mailTopic && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                  {campaign.mailTopic}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target reason: {campaign.reason}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stage Tabs */}
        <div className="mt-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveStage('initial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeStage === 'initial'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Initial Email
            {campaign.initialSentAt && <span className="text-[10px] text-emerald-400">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeStage === 'followup_1'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Follow-up 1 (Day 2)
            {campaign.followUp1SentAt && <span className="text-[10px] text-emerald-400">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeStage === 'followup_2'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Follow-up 2 (Day 4)
            {campaign.followUp2SentAt && <span className="text-[10px] text-emerald-400">✓</span>}
          </button>
          <button
            onClick={() => setActiveStage('followup_3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeStage === 'followup_3'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Follow-up 3 (Day 6)
            {campaign.followUp3SentAt && <span className="text-[10px] text-emerald-400">✓</span>}
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-medium">
            {feedback}
          </div>
        )}

        {/* Email Client Mockup Window */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-xs">
          {/* Email Headers */}
          <div className="border-b border-slate-200/80 p-3 space-y-2 text-xs bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-12 font-medium">From:</span>
                <span className="text-slate-800">
                  {settings.senderName} &lt;{settings.senderEmail}&gt;
                </span>
              </div>
              {isSent ? (
                <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                  <Check className="h-3 w-3" /> Sent on{' '}
                  {new Date(getStageSentAt()!).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Clock className="h-3 w-3" /> Not sent yet
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-12 font-medium">To:</span>
              <span className="text-slate-800 font-mono">{campaign.email}</span>
            </div>

            {campaign.ccEmails && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-12 font-medium">CC:</span>
                <span className="text-slate-600 font-mono">{campaign.ccEmails}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <span className="text-slate-500 w-12 font-medium">Subject:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="flex-1 rounded-lg bg-white border border-slate-200 p-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              ) : (
                <span className="font-semibold text-slate-900">{subject || '(No subject yet)'}</span>
              )}
            </div>

            {alternativeSubjects && alternativeSubjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 mr-1 font-medium">Angles:</span>
                {alternativeSubjects.map((altSubj, idx) => {
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
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={altSubj}
                    >
                      <span className={`font-semibold mr-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{labels[idx] || `V${idx + 1}`}:</span>
                      {altSubj.length > 32 ? altSubj.slice(0, 32) + '…' : altSubj}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Body */}
          <div className="p-4 min-h-[200px] bg-white">
            {isEditing ? (
              <textarea
                rows={9}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 whitespace-pre-line leading-relaxed"
              />
            ) : body ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {body}
                </div>
                {/* Signature */}
                {settings.emailSignature && (
                  <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 whitespace-pre-line">
                    {settings.emailSignature}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs">
                <p>This email has not been written yet.</p>
                <button
                  onClick={handleRegenerate}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  Write this email
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              <RefreshCw className={`h-3 w-3 inline mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              <FileEdit className="h-3 w-3 inline mr-1" />
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <button
              onClick={handleCopy}
              disabled={!body}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40 font-medium"
              title="Copy subject and body to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied</span>
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
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !body}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>{isSent ? 'Send Again' : 'Send Email'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
