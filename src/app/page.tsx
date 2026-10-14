'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OutreachCampaign, OutreachStatus, ReplyStatus, AppSettings, DEFAULT_SETTINGS } from '@/types/outreach';
import { Navbar } from '@/components/Navbar';
import { OutreachTable } from '@/components/OutreachTable';
import { DashboardView } from '@/components/DashboardView';
import { FollowUpsView } from '@/components/FollowUpsView';
import { SettingsView } from '@/components/SettingsView';
import { CompanyManagement } from '@/components/CompanyManagement';
import { AddOutreachModal } from '@/components/AddOutreachModal';
import { EmailPreviewModal } from '@/components/EmailPreviewModal';
import { HistoryModal } from '@/components/HistoryModal';
import { EmployeeNotificationsModal } from '@/components/EmployeeNotificationsModal';
import { LoginScreen } from '@/components/LoginScreen';
import { useAuth } from '@/context/AuthContext';
import { Company } from '@/types/company';
import { CheckCircle2, AlertCircle, Info, Sparkles, Shield, Bell, Clock } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'outreach' | 'companies' | 'dashboard' | 'followups' | 'settings'>('outreach');
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedCompanyForOutreach, setSelectedCompanyForOutreach] = useState<Company | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'due' | 'upcoming' | 'sent'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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

  // Refresh campaigns without auto-dispatching follow-ups
  const handleRunScheduler = async () => {
    setIsSchedulerRunning(true);
    try {
      await fetchCampaigns();
      showToast('Follow-ups refreshed. They remain intact until you click Send.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Could not refresh follow-ups', 'error');
    } finally {
      setIsSchedulerRunning(false);
    }
  };

  // Periodic campaign refresh (every 30 seconds)
  useEffect(() => {
    fetchCampaigns();
    fetchSettings();

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCampaigns, fetchSettings]);

  // Refresh campaigns whenever user switches tabs
  useEffect(() => {
    fetchCampaigns();
  }, [activeTab, fetchCampaigns]);

  // Handle single campaign generation
  const handleGenerate = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Writing email for ${campaign.companyName}...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Email draft ready!`, 'success');
        await fetchCampaigns();
        setPreviewCampaign(data.campaign);
        setPreviewStage('initial');
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not write email', 'error');
    }
  };

  // Handle regenerate
  const handleRegenerate = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Writing a new version for ${campaign.companyName}...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'initial' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('New version ready!', 'success');
        await fetchCampaigns();
        setPreviewCampaign(data.campaign);
        setPreviewStage('initial');
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not write new version', 'error');
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
        if (data.delivery?.provider?.startsWith('simulated')) {
          showToast(`Initial email sent! Status updated to Initial Email Sent.`, 'success');
        } else {
          showToast(`Email sent! Next follow-up is scheduled.`, 'success');
        }
        await fetchCampaigns();
      } else {
        showToast(data.error || 'Could not send email', 'error');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      showToast(error.message || 'Could not send email', 'error');
    }
  };

  // Handle putting into follow-ups sequence
  const handleScheduleFollowUp = async (campaign: OutreachCampaign) => {
    try {
      showToast(`Queueing ${campaign.companyName} for follow-up...`, 'info');
      const res = await fetch(`/api/outreach/${campaign.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalDays: settings.followUpIntervalDays || 2 })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Placed in follow-ups pipeline!`, 'success');
        await fetchCampaigns();
      } else {
        showToast(data.error || 'Failed to place in follow-ups', 'error');
      }
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Error scheduling follow-up', 'error');
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
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const isStopped =
      c.replyStatus === 'Replied' ||
      c.status === 'Follow-Up Paused' ||
      c.status === 'Closed' ||
      c.status === 'Completed - No Response' ||
      c.status === 'Blocked' ||
      c.status === 'Bounced' ||
      c.status === 'Unsubscribed';
    if (isStopped || !c.initialSentAt) return false;

    return (
      (!c.followUp1SentAt && c.followUp1ScheduledAt && new Date(c.followUp1ScheduledAt) <= todayEnd) ||
      (c.followUp1SentAt && !c.followUp2SentAt && c.followUp2ScheduledAt && new Date(c.followUp2ScheduledAt) <= todayEnd) ||
      (c.followUp2SentAt && !c.followUp3SentAt && c.followUp3ScheduledAt && new Date(c.followUp3ScheduledAt) <= todayEnd)
    );
  }).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center">
        <div className="h-7 w-7 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg text-xs">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          ) : (
            <Info className="h-4 w-4 text-slate-700" />
          )}
          <span className="font-medium text-slate-900">{toastMessage.text}</span>
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
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        notificationCount={dueTodayCount}
      />

      {/* Main App Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Real-time Unified Follow-Up Reminder Banner for Today */}
        {dueTodayCount > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-amber-950">
                    Follow-Up Notification: Today {dueTodayCount} {dueTodayCount === 1 ? 'company has' : 'companies have'} a follow-up due!
                  </p>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300/60 shadow-2xs">
                    Action Needed
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                  Follow-up cycle is active. Review tailored AI drafts, filter due leads, or trigger the automated queue runner.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFollowUpFilter('due');
                  setActiveTab('followups');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  activeTab === 'followups' && followUpFilter === 'due'
                    ? 'bg-amber-200 text-amber-950 border-amber-300 shadow-2xs'
                    : 'bg-amber-100/90 hover:bg-amber-200 text-amber-950 border-amber-200/80 shadow-2xs'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-800" />
                <span>Filter Due Today ({dueTodayCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open Notifications &amp; Draft ({dueTodayCount})</span>
              </button>
            </div>
          </div>
        )}

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

        {activeTab === 'companies' && (
          <CompanyManagement
            isAdmin={isAdmin}
            onStartOutreach={(company) => {
              setSelectedCompanyForOutreach(company);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          isAdmin ? (
            <DashboardView
              onRunScheduler={handleRunScheduler}
              isSchedulerRunning={isSchedulerRunning}
              onOpenNewModal={() => {
                setSelectedCompanyForOutreach(null);
                setIsAddModalOpen(true);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Everyday outreach analytics and employee performance metrics can only be viewed by Sheetal Bedi (Admin).
              </p>
            </div>
          )
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
              const stageLabel = stage === 'followup_1' ? 'Follow-Up 1' : stage === 'followup_2' ? 'Follow-Up 2' : 'Follow-Up 3';
              try {
                showToast(`Sending ${stageLabel} to ${c.companyName}...`, 'info');
                const res = await fetch(`/api/outreach/${c.id}/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stage })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  showToast(`${stageLabel} sent successfully! Status updated to "${data.campaign?.status || 'First Follow-Up Done'}".`, 'success');
                  await fetchCampaigns();
                } else {
                  throw new Error(data.error || `Could not send ${stageLabel}`);
                }
              } catch (err: unknown) {
                const e = err as Error;
                console.error(e);
                showToast(e.message || 'Error sending follow-up', 'error');
              }
            }}
            onFastForward={handleFastForward}
            onRunScheduler={handleRunScheduler}
            isSchedulerRunning={isSchedulerRunning}
            onRefresh={fetchCampaigns}
            activeFilter={followUpFilter}
            onFilterChange={setFollowUpFilter}
          />
        )}

        {activeTab === 'settings' && (
          isAdmin ? (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              campaigns={campaigns}
              onRefreshCampaigns={fetchCampaigns}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                System settings, API secrets, and delivery credentials can only be viewed or modified by Sheetal Bedi (Admin).
              </p>
            </div>
          )
        )}
      </main>

      {/* Add Company Outreach Modal */}
      <AddOutreachModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedCompanyForOutreach(null);
        }}
        initialCompany={selectedCompanyForOutreach}
        services={settings?.services}
        onServicesChange={newServices => {
          if (settings) {
            setSettings({ ...settings, services: newServices });
          }
        }}
        onSuccess={() => {
          fetchCampaigns();
          fetchSettings();
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

      {/* Employee Notifications Modal for Follow-ups at Particular Day */}
      <EmployeeNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
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
            } else {
              const data = await res.json().catch(() => ({}));
              showToast(data.error || 'Failed to send follow-up', 'error');
            }
          } catch (err) {
            console.error(err);
            showToast('Error sending follow-up', 'error');
          }
        }}
        onFastForward={handleFastForward}
        onRunScheduler={handleRunScheduler}
        isSchedulerRunning={isSchedulerRunning}
      />
    </div>
  );
}
