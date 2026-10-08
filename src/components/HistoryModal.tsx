'use client';

import React, { useEffect, useState } from 'react';
import { OutreachCampaign, EmailHistoryEvent } from '@/types/outreach';
import {
  X,
  MessageSquare,
  Clock
} from 'lucide-react';

interface HistoryModalProps {
  campaign: OutreachCampaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ campaign, isOpen, onClose }: HistoryModalProps) {
  const [, setHistoryData] = useState<{
    history: EmailHistoryEvent[];
    emails: {
      initial: { sentAt?: string; subject?: string; body?: string };
      followUp1: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
      followUp2: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
      followUp3: { scheduledAt?: string; sentAt?: string; subject?: string; body?: string };
    };
  } | null>(null);

  useEffect(() => {
    if (!campaign || !isOpen) return;
    fetch(`/api/outreach/${campaign.id}/history`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistoryData(data);
        }
      })
      .catch(err => console.error(err));
  }, [campaign, isOpen]);

  if (!isOpen || !campaign) return null;

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Not yet sent';
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-[#23272f] bg-[#14171c] p-6 shadow-2xl my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23272f] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white tracking-tight">
                {campaign.companyName}
              </h3>
              <span className="font-mono text-xs text-gray-400">
                ({campaign.email})
              </span>
              {campaign.mailTopic && (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                  {campaign.mailTopic}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Status: <span className="text-gray-200 font-medium">{campaign.status}</span> · Reply: <span className="text-emerald-400 font-medium">{campaign.replyStatus}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-[#23272f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body: Timeline */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-2">
          {/* Sequence Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Initial */}
            <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] p-3 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                First Email
              </span>
              <p className="font-medium text-gray-200 line-clamp-1">{campaign.initialSubject || 'Draft'}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                {campaign.initialSentAt ? formatDate(campaign.initialSentAt) : 'Not sent yet'}
              </p>
            </div>

            {/* FU 1 */}
            <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] p-3 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Follow-up 1 (Day 2)
              </span>
              <p className="font-medium text-gray-200 line-clamp-1">{campaign.followUp1Subject || 'Scheduled'}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                {campaign.followUp1SentAt ? formatDate(campaign.followUp1SentAt) : campaign.followUp1ScheduledAt ? `Due ${formatDate(campaign.followUp1ScheduledAt)}` : 'Waiting'}
              </p>
            </div>

            {/* FU 2 */}
            <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] p-3 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Follow-up 2 (Day 4)
              </span>
              <p className="font-medium text-gray-200 line-clamp-1">{campaign.followUp2Subject || 'Scheduled'}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                {campaign.followUp2SentAt ? formatDate(campaign.followUp2SentAt) : campaign.followUp2ScheduledAt ? `Due ${formatDate(campaign.followUp2ScheduledAt)}` : 'Waiting'}
              </p>
            </div>

            {/* FU 3 */}
            <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] p-3 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                Follow-up 3 (Day 6)
              </span>
              <p className="font-medium text-gray-200 line-clamp-1">{campaign.followUp3Subject || 'Final follow-up'}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-1">
                {campaign.followUp3SentAt ? formatDate(campaign.followUp3SentAt) : campaign.followUp3ScheduledAt ? `Due ${formatDate(campaign.followUp3ScheduledAt)}` : 'Waiting'}
              </p>
            </div>
          </div>

          {/* Event Stream */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              Email History
            </h4>

            <div className="relative pl-5 space-y-3 border-l border-[#23272f] ml-2">
              {campaign.history && campaign.history.length > 0 ? (
                campaign.history.map(item => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 border border-[#14171c]" />
                    <div className="rounded-lg border border-[#23272f] bg-[#0d0f12] p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-200">{item.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-[#23272f] pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-[#23272f] px-3.5 py-1 text-xs font-medium text-gray-300 hover:bg-[#23272f]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
