'use client';

import React, { useState } from 'react';
import {
  Department,
  DEPARTMENTS,
  MailboxOverview
} from '@/types/inbox';
import {
  Sliders,
  ShieldCheck,
  Webhook,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Power,
  Lock,
  Mail,
  Zap,
  Info,
  ExternalLink,
  Save,
  CheckCircle2
} from 'lucide-react';

interface MailboxSettingsTabProps {
  mailboxes: MailboxOverview[];
  isAdmin: boolean;
  onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onOpenSimulateModal: () => void;
}

export function MailboxSettingsTab({
  mailboxes,
  isAdmin,
  onRefresh,
  onToast,
  onOpenSimulateModal
}: MailboxSettingsTabProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('tnk_live_sec_993428df1980a3c');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // General settings state
  const [loopProtection, setLoopProtection] = useState(true);
  const [dedupWindow, setDedupWindow] = useState('24h');
  const [defaultDelay, setDefaultDelay] = useState('0'); // immediate
  const [savingSettings, setSavingSettings] = useState(false);

  const webhookEndpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/api/inbox/webhook`
    : 'https://email-automations-six.vercel.app/api/inbox/webhook';

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    onToast('Inbound Webhook URL copied to clipboard', 'info');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    onToast('Webhook Secret Key copied', 'info');
  };

  const handleSaveGeneralSettings = async () => {
    if (!isAdmin) {
      onToast('Only Administrators can modify mailbox settings', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      // Simulate API call or save to app settings
      await new Promise(r => setTimeout(r, 600));
      onToast('Mailbox security and routing configurations updated', 'success');
    } catch {
      onToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Description */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Departmental Mailbox &amp; Ingestion Configuration
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Active Inbound Router
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage inbound webhook endpoints, authentication secrets, anti-spam filters, and automatic routing rules.
          </p>
        </div>

        <button
          onClick={onOpenSimulateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Simulate Inbound Event</span>
        </button>
      </div>

      {/* Grid: Webhook Settings & Security Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound Webhook Integration */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Webhook className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Inbound Webhook Endpoint</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Configure this HTTPS endpoint in your mail transfer agent (SendGrid Inbound Parse, Mailgun Routes, Postmark, or AWS SES) to forward inbound emails into TaskNera.
          </p>

          {/* Webhook URL Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Webhook URL (POST)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookEndpoint}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Webhook Secret Key */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Webhook Secret (Bearer / Header Token)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={webhookSecret}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopySecret}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Header: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">x-inbox-signature</code> or query param <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">token</code>
            </span>
          </div>

          {/* Sample Inbound Payload Reference */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
            <span className="font-semibold text-slate-700 block">Accepted Inbound Fields:</span>
            <code className="text-[10px] font-mono text-slate-600 block">
              {`{ "from": "client@example.com", "to": "operations@tasknera.com", "subject": "Inquiry", "body": "...", "messageId": "<...>" }`}
            </code>
          </div>
        </div>

        {/* Protection & Anti-Loop Rules */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Anti-Loop &amp; Delivery Guardrails</h3>
          </div>

          {/* Rule 1: Single Ack per Thread */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Single Acknowledgment per Thread</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Prevents duplicate auto-replies when a client replies multiple times within an existing conversation thread.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
            </span>
          </div>

          {/* Rule 2: Automated Loop Suppression */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">Auto-Reply Loop Suppression</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Checks headers (<code className="text-[10px] bg-slate-200/70 px-1 rounded">Auto-Submitted</code>, <code className="text-[10px] bg-slate-200/70 px-1 rounded">X-Autoreply</code>) and sender strings (mailer-daemon, noreply) to prevent infinite reply loops.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={loopProtection}
                onChange={e => setLoopProtection(e.target.checked)}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Rule 3: Deduplication Time Window */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              Inbound Deduplication Window
            </label>
            <select
              value={dedupWindow}
              onChange={e => setDedupWindow(e.target.value)}
              disabled={!isAdmin}
              className="w-full text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50"
            >
              <option value="6h">6 Hours</option>
              <option value="12h">12 Hours</option>
              <option value="24h">24 Hours (Recommended)</option>
              <option value="48h">48 Hours</option>
            </select>
          </div>

          {/* Save Button */}
          {isAdmin && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={handleSaveGeneralSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Save Guardrails'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Department Routing Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Configured Department Routing Table</h3>
          </div>
          <span className="text-xs text-slate-400">
            Routing is performed via the destination recipient address
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Inbound Mailbox</th>
                <th className="px-4 py-3">Auto-Acknowledgment</th>
                <th className="px-4 py-3">Default Assignee Team</th>
                <th className="px-4 py-3">Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(Object.keys(DEPARTMENTS) as Department[]).map(deptKey => {
                const info = DEPARTMENTS[deptKey];
                const mailbox = mailboxes.find(m => m.department === deptKey);
                const isConnected = mailbox ? mailbox.status !== 'disconnected' : true;
                const autoAck = mailbox ? mailbox.autoAckEnabled : true;

                return (
                  <tr key={deptKey} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${info.badgeClass}`}>
                        {info.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-900">
                      {info.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        autoAck
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {autoAck ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {info.name} Specialists
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
