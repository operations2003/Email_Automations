'use client';

import React, { useEffect, useState } from 'react';
import { OutreachCampaign, EmailHistoryEvent } from '@/types/outreach';
import {
  X,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Mail,
  Calendar,
  Send,
  Sparkles,
  ArrowDown
} from 'lucide-react';

interface HistoryModalProps {
  campaign: OutreachCampaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ campaign, isOpen, onClose }: HistoryModalProps) {
  const [historyData, setHistoryData] = useState<{
    history: EmailHistoryEvent[];
    emails: {
      initial: { sentAt?: string; subject?: string; body?: string };
      followUp1: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
      followUp2: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
      followUp3: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaign || !isOpen) return;
    setLoading(true);
    fetch(`/api/outreach/${campaign.id}/history`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistoryData(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [campaign, isOpen]);

  if (!isOpen || !campaign) return null;

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Not yet sent';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Outreach Timeline & History: {campaign.companyName}
                </h3>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                  {campaign.email}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Status: <strong className="text-indigo-400">{campaign.status}</strong> • Reply Status: <strong className="text-emerald-400">{campaign.replyStatus}</strong>
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

        {/* Content Body: Timeline */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {/* Conversation Stages Breakdown (Section 17 requirement) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Initial Email Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Initial Email
                </span>
                {campaign.initialSentAt ? (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                    Sent
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mb-2">
                {formatDate(campaign.initialSentAt)}
              </p>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1" title={campaign.initialSubject}>
                {campaign.initialSubject || 'Not generated yet'}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                {campaign.initialEmailBody || 'No draft body.'}
              </p>
            </div>

            {/* Follow-Up 1 Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Follow-Up 1 (+2d)
                </span>
                {campaign.followUp1SentAt ? (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                    Sent
                  </span>
                ) : campaign.followUp1ScheduledAt ? (
                  <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.2 text-[10px] text-cyan-400">
                    Scheduled
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-500">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mb-2">
                {campaign.followUp1SentAt ? formatDate(campaign.followUp1SentAt) : campaign.followUp1ScheduledAt ? `Due: ${formatDate(campaign.followUp1ScheduledAt)}` : '—'}
              </p>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1" title={campaign.followUp1Subject}>
                {campaign.followUp1Subject || 'Auto-generated when due'}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                {campaign.followUp1Body || 'Pending scheduled execution.'}
              </p>
            </div>

            {/* Follow-Up 2 Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">
                  Follow-Up 2 (+4d)
                </span>
                {campaign.followUp2SentAt ? (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                    Sent
                  </span>
                ) : campaign.followUp2ScheduledAt ? (
                  <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.2 text-[10px] text-cyan-400">
                    Scheduled
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-500">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mb-2">
                {campaign.followUp2SentAt ? formatDate(campaign.followUp2SentAt) : campaign.followUp2ScheduledAt ? `Due: ${formatDate(campaign.followUp2ScheduledAt)}` : '—'}
              </p>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1" title={campaign.followUp2Subject}>
                {campaign.followUp2Subject || 'Auto-generated when due'}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                {campaign.followUp2Body || 'Pending scheduled execution.'}
              </p>
            </div>

            {/* Follow-Up 3 Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                  Follow-Up 3 (+6d)
                </span>
                {campaign.followUp3SentAt ? (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                    Sent
                  </span>
                ) : campaign.followUp3ScheduledAt ? (
                  <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.2 text-[10px] text-cyan-400">
                    Scheduled
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-500">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mb-2">
                {campaign.followUp3SentAt ? formatDate(campaign.followUp3SentAt) : campaign.followUp3ScheduledAt ? `Due: ${formatDate(campaign.followUp3ScheduledAt)}` : '—'}
              </p>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1" title={campaign.followUp3Subject}>
                {campaign.followUp3Subject || 'Closing loop draft'}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                {campaign.followUp3Body || 'Pending scheduled execution.'}
              </p>
            </div>
          </div>

          {/* Chronological Event Audit Log */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Activity & Communication Event Stream
            </h4>

            <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 ml-3">
              {campaign.history && campaign.history.length > 0 ? (
                campaign.history.map(item => (
                  <div key={item.id} className="relative group">
                    {/* Dot on timeline */}
                    <div
                      className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${
                        item.type.includes('reply')
                          ? 'bg-emerald-400'
                          : item.type.includes('sent')
                          ? 'bg-indigo-400'
                          : item.type.includes('paused')
                          ? 'bg-amber-400'
                          : 'bg-slate-600'
                      }`}
                    />

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      {item.subject && (
                        <div className="mt-2 text-[11px] text-indigo-300 bg-slate-950/60 p-2 rounded border border-slate-800">
                          <strong>Subject:</strong> {item.subject}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
