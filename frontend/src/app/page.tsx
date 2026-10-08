'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OutreachCampaign, OutreachStatus, ReplyStatus, AppSettings, DEFAULT_SETTINGS } from '@/types/outreach';
import { Navbar } from '@/components/Navbar';
import { OutreachTable } from '@/components/OutreachTable';
import { DashboardView } from '@/components/DashboardView';
import { FollowUpsView } from '@/components/FollowUpsView';
import { SettingsView } from '@/components/SettingsView';
import { AddOutreachModal } from '@/components/AddOutreachModal';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { HistoryModal } from '@/components/HistoryModal';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'outreach' | 'dashboard' | 'followups' | 'settings'>('outreach');
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<OutreachCampaign | null>(null);
  const [previewStage, setPreviewStage] = useState<'initial' | 'followup_1' | 'followup_2' | 'followup_3'>('initial');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [historyCampaign, setHistoryCampaign] = useState<OutreachCampaign | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Scheduler state
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/outreach');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // Update settings handler
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast('Settings saved successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    }
  };

  // Run Follow-Up Scheduler tick
  const handleRunScheduler = async () => {
    setIsSchedulerRunning(true);
    try {
      const res = await fetch('/api/scheduler/tick', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const processed = data.report.processedCount;
        if (processed > 0) {
          showToast(`Scheduler executed: ${processed} follow-up email(s) dispatched!`, 'success');
        } else {
          showToast('Scheduler check complete: No follow-up emails currently due.', 'info');
        }
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
      showToast('Scheduler execution failed', 'error');
    } finally {
      setIsSchedulerRunning(false);
    }
  };

  // Periodic background scheduler check (every 30 seconds)
  useEffect(() => {
    fetchCampaigns();
    fetchSettings();

    const interval = setInterval(() => {
      fetch('/api/scheduler/tick', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.report.processedCount > 0) {
            fetchCampaigns();
            showToast(`Auto-Scheduler: ${data.report.processedCount} due follow-up(s) sent!`, 'success');
          }
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCampaigns, fetchSettings]);

  // Handle single campaign generation
  const handleGenerate = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Generating unique AI email for ${campaign.companyName}...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`AI email generated for ${campaign.companyName}!`, 'success');
        await fetchCampaigns();
        setPreviewCampaign(data.campaign);
        setPreviewStage('initial');
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Generation failed', 'error');
    }
  };

  // Handle regenerate
  const handleRegenerate = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Regenerating fresh variation for ${campaign.companyName}...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Fresh subject and email variation generated!', 'success');
        await fetchCampaigns();
        setPreviewCampaign(data.campaign);
        setPreviewStage('initial');
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Regeneration failed', 'error');
    }
  };

  // Handle send initial email
  const handleSend = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Sending email to ${campaign.companyName}...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Initial outreach sent! Follow-Up 1 scheduled for +2 days.`, 'success');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send email', 'error');
    }
  };

  // Handle manual status changes
  const handleStatusChange = async (campaignId: string, newStatus: OutreachStatus) => {
    try {
      const res = await fetch(`/api/outreach/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Status updated to "${newStatus}"`, 'info');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle manual reply status changes
  const handleReplyStatusChange = async (campaignId: string, newReplyStatus: ReplyStatus) => {
    try {
      const res = await fetch(`/api/outreach/${campaignId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyType: newReplyStatus })
      });
      if (res.ok) {
        showToast(`Reply marked as "${newReplyStatus}". Follow-ups automatically paused!`, 'success');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate inbound reply
  const handleSimulateReply = async (campaign: OutreachCampaign) => {
    try {
      const res = await fetch(`/api/outreach/${campaign.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyType: 'Replied',
          snippet: `Hi ${settings.senderName}, thanks for reaching out. We would be open to a quick 10-minute chat.`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Inbound reply simulated from ${campaign.companyName}! All pending follow-ups immediately paused.`, 'success');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fast forward schedule +2 days for instant testing
  const handleFastForward = async (campaign: OutreachCampaign) => {
    try {
      const res = await fetch(`/api/outreach/${campaign.id}/fast-forward`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Schedule advanced +2 days for ${campaign.companyName}. Follow-up is now due!`, 'info');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete campaign
  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this outreach target?')) return;
    try {
      const res = await fetch(`/api/outreach/${campaignId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Outreach record deleted', 'info');
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate due today count
  const dueTodayCount = campaigns.filter(c => {
    const now = new Date();
    const isStopped =
      c.replyStatus === 'Replied' ||
      c.status === 'Follow-Up Paused' ||
      c.status === 'Closed' ||
      c.status === 'Completed - No Response';
    if (isStopped || !c.initialSentAt) return false;

    return (
      (!c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= now) ||
      (c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= now) ||
      (c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= now)
    );
  }).length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-2xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          ) : (
            <Info className="h-4 w-4 text-indigo-400" />
          )}
          <span className="font-medium text-slate-200">{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewModal={() => setIsAddModalOpen(true)}
        onRunScheduler={handleRunScheduler}
        isSchedulerRunning={isSchedulerRunning}
        dueTodayCount={dueTodayCount}
      />

      {/* Main App Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1920px] mx-auto w-full">
        {activeTab === 'outreach' && (
          <OutreachTable
            campaigns={campaigns}
            loading={loading}
            onRefresh={fetchCampaigns}
            onGenerate={handleGenerate}
            onPreview={(c, stage = 'initial') => {
              setPreviewCampaign(c);
              setPreviewStage(stage);
              setIsPreviewOpen(true);
            }}
            onRegenerate={handleRegenerate}
            onSend={handleSend}
            onViewHistory={c => {
              setHistoryCampaign(c);
              setIsHistoryOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onReplyStatusChange={handleReplyStatusChange}
            onSimulateReply={handleSimulateReply}
            onFastForward={handleFastForward}
            onDelete={handleDelete}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            replyFilter={replyFilter}
            setReplyFilter={setReplyFilter}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onRunScheduler={handleRunScheduler}
            isSchedulerRunning={isSchedulerRunning}
            onOpenNewModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'followups' && (
          <FollowUpsView
            campaigns={campaigns}
            onPreview={(c, stage) => {
              setPreviewCampaign(c);
              setPreviewStage(stage);
              setIsPreviewOpen(true);
            }}
            onSendFollowUp={async (c, stage) => {
              try {
                showToast(`Sending ${stage} to ${c.companyName}...`, 'info');
                const res = await fetch(`/api/outreach/${c.id}/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stage })
                });
                if (res.ok) {
                  showToast(`${stage} sent successfully!`, 'success');
                  await fetchCampaigns();
                }
              } catch (err) {
                console.error(err);
              }
            }}
            onFastForward={handleFastForward}
            onRunScheduler={handleRunScheduler}
            isSchedulerRunning={isSchedulerRunning}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Add Company Outreach Modal */}
      <AddOutreachModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchCampaigns();
          showToast('Campaign created and email processed successfully!', 'success');
        }}
        onSelectExisting={id => {
          const found = campaigns.find(c => c.id === id);
          if (found) {
            setPreviewCampaign(found);
            setIsPreviewOpen(true);
          }
        }}
      />

      {/* Email Preview Modal */}
      <EmailPreviewModal
        campaign={previewCampaign}
        stage={previewStage}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onRefresh={fetchCampaigns}
        settings={settings}
      />

      {/* History & Timeline Modal */}
      <HistoryModal
        campaign={historyCampaign}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
