'use client';

import React, { useState, useEffect } from 'react';
import {
  Department,
  DEPARTMENTS,
  AcknowledgmentTemplate
} from '@/types/inbox';
import {
  X,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Mail,
  Copy,
  Clock,
  Layers
} from 'lucide-react';

interface InboxTemplatesModalProps {
  onClose: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function InboxTemplatesModal({ onClose, onToast }: InboxTemplatesModalProps) {
  const [selectedDept, setSelectedDept] = useState<Department>('operations');
  const [templates, setTemplates] = useState<AcknowledgmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for currently selected department template
  const [currentForm, setCurrentForm] = useState<Partial<AcknowledgmentTemplate>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inbox/templates');
      const data = await res.json();
      if (data.success && data.templates) {
        setTemplates(data.templates);
        const active = data.templates.find((t: AcknowledgmentTemplate) => t.department === selectedDept);
        if (active) setCurrentForm(active);
      }
    } catch {
      onToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDept = (dept: Department) => {
    setSelectedDept(dept);
    const match = templates.find(t => t.department === dept);
    if (match) {
      setCurrentForm(match);
    }
  };

  const handleInsertVariable = (varName: string) => {
    setCurrentForm(prev => ({
      ...prev,
      bodyTemplate: (prev.bodyTemplate || '') + `{${varName}}`
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/inbox/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentForm)
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Template for ${DEPARTMENTS[selectedDept].name} saved successfully`, 'success');
        // Update local list
        setTemplates(prev => prev.map(t => t.department === selectedDept ? data.template : t));
      } else {
        onToast(data.error || 'Failed to save template', 'error');
      }
    } catch {
      onToast('Error saving template', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview generator
  const previewSubject = (currentForm.subjectTemplate || '')
    .replace('{subject}', 'Proposal for Enterprise Automation')
    .replace('{ticketNumber}', 'TNK-1024')
    .replace('{department}', DEPARTMENTS[selectedDept].name);

  const previewBody = (currentForm.bodyTemplate || '')
    .replace(/\{senderName\}/g, 'Sarah Jenkins')
    .replace(/\{senderEmail\}/g, 'sarah.jenkins@acmepartners.com')
    .replace(/\{department\}/g, DEPARTMENTS[selectedDept].name)
    .replace(/\{subject\}/g, 'Proposal for Enterprise Automation')
    .replace(/\{ticketNumber\}/g, 'TNK-1024')
    .replace(/\{companyName\}/g, 'TaskNera Solutions')
    .replace(/\{receivedAt\}/g, 'Mon, Oct 26, 02:15 PM');

  const deptInfo = DEPARTMENTS[selectedDept];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Departmental Auto-Acknowledgment Templates
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure tailored acknowledgment responses for Operations, Careers, HR, Recruitment, and Support.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Department Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-1 overflow-x-auto">
          {(Object.keys(DEPARTMENTS) as Department[]).map(deptKey => {
            const info = DEPARTMENTS[deptKey];
            const isActive = selectedDept === deptKey;
            return (
              <button
                key={deptKey}
                onClick={() => handleSelectDept(deptKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-all border-t border-x cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-200 -mb-px shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    deptKey === 'operations'
                      ? 'bg-blue-600'
                      : deptKey === 'careers'
                      ? 'bg-emerald-600'
                      : deptKey === 'hr'
                      ? 'bg-purple-600'
                      : deptKey === 'recruitment'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                />
                {info.name}
              </button>
            );
          })}
        </div>

        {/* Main Content (Editor + Preview Split) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/40">
          {/* Left: Template Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${deptInfo.badgeClass}`}>
                    {deptInfo.name} Mailbox
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {deptInfo.email}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={currentForm.isActive !== false}
                    onChange={e => setCurrentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Active Auto-Acknowledgment</span>
                </label>
              </div>

              {/* From Name & From Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={currentForm.fromName || ''}
                    onChange={e => setCurrentForm(prev => ({ ...prev, fromName: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="e.g. TaskNera Operations"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={currentForm.fromEmail || ''}
                    onChange={e => setCurrentForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="e.g. operations@tasknera.com"
                  />
                </div>
              </div>

              {/* Subject Template */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Template
                </label>
                <input
                  type="text"
                  value={currentForm.subjectTemplate || ''}
                  onChange={e => setCurrentForm(prev => ({ ...prev, subjectTemplate: e.target.value }))}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Re: {subject} [Ref: #{ticketNumber}]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Preserves original subject and adds reference tracking for 1-to-1 email threading.
                </span>
              </div>

              {/* Variable Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Available Dynamic Variables (Click to Insert)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'senderName',
                    'senderEmail',
                    'ticketNumber',
                    'subject',
                    'department',
                    'companyName',
                    'receivedAt'
                  ].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded cursor-pointer transition-colors"
                    >
                      +{`{${v}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Template */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Acknowledgment Message Body
                </label>
                <textarea
                  rows={9}
                  value={currentForm.bodyTemplate || ''}
                  onChange={e => setCurrentForm(prev => ({ ...prev, bodyTemplate: e.target.value }))}
                  className="w-full text-xs font-sans rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                  placeholder="Dear {senderName}, ..."
                />
              </div>

              {/* Turnaround hours */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-600">Expected Response Window:</span>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={currentForm.estimatedTurnaroundHours || 24}
                  onChange={e => setCurrentForm(prev => ({ ...prev, estimatedTurnaroundHours: Number(e.target.value) }))}
                  className="w-16 text-xs text-center rounded border border-slate-300 py-1"
                />
                <span className="text-xs text-slate-500">hours</span>
              </div>
            </div>
          </div>

          {/* Right: Live Preview Box (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  Live Recipient Preview
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Auto-Generated
                </span>
              </div>

              {/* Mock Email Client Window */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3 text-xs">
                <div className="space-y-1 text-slate-600 border-b border-slate-200 pb-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {currentForm.fromName || 'TaskNera'}
                      </span>{' '}
                      <span className="text-slate-400 font-mono text-[11px]">
                        &lt;{currentForm.fromEmail || deptInfo.email}&gt;
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <div>
                    <span className="text-slate-400">To:</span>{' '}
                    <span className="text-slate-700">Sarah Jenkins &lt;sarah.jenkins@acmepartners.com&gt;</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Subject:</span>{' '}
                    <span className="font-semibold text-slate-900">{previewSubject}</span>
                  </div>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-sans text-xs pt-1">
                  {previewBody}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>In-Reply-To preserved</span>
                  <span>Strictly 1 auto-ack per conversation</span>
                </div>
              </div>
            </div>

            {/* Department Rules note */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-800 space-y-1.5">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Delivery Safety Guaranteed
              </span>
              <p className="text-[11px] leading-relaxed text-blue-700">
                - Outgoing acknowledgments strictly preserve the email thread using RFC headers (In-Reply-To &amp; References).
              </p>
              <p className="text-[11px] leading-relaxed text-blue-700">
                - Spammers, bots, no-reply mailboxes, and automated mailer-daemons are automatically filtered out.
              </p>
              <p className="text-[11px] leading-relaxed text-blue-700">
                - Exactly <strong>one acknowledgment</strong> is sent per conversation thread to prevent auto-responder loops.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <button
            type="button"
            onClick={fetchTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : `Save ${deptInfo.name} Template`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
