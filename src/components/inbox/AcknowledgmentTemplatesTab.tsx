'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Department,
  DEPARTMENTS,
  AcknowledgmentTemplate
} from '@/types/inbox';
import { fetchTemplates, saveTemplate } from '@/lib/inbox-api';
import {
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Mail,
  Copy,
  Clock,
  ShieldCheck,
  Building,
  Check,
  Power,
  Info
} from 'lucide-react';

interface AcknowledgmentTemplatesTabProps {
  isAdmin: boolean;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

// Allowed placeholder variables
const ALLOWED_PLACEHOLDERS = [
  { token: '{{sender_name}}', label: 'Sender Name', desc: 'Full name or email user part' },
  { token: '{{department_name}}', label: 'Department Name', desc: 'e.g. Operations, Careers, HR' },
  { token: '{{company_name}}', label: 'Company Name', desc: 'Sender company name or TaskNera' },
  { token: '{{ticket_number}}', label: 'Ticket Number', desc: 'e.g. TNK-8921' },
  { token: '{{received_at}}', label: 'Received Time', desc: 'Formatted date and time' }
];

export function AcknowledgmentTemplatesTab({
  isAdmin,
  onToast
}: AcknowledgmentTemplatesTabProps) {
  const [selectedDept, setSelectedDept] = useState<Department>('operations');
  const [templates, setTemplates] = useState<AcknowledgmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active form state for the selected template
  const [currentForm, setCurrentForm] = useState<Partial<AcknowledgmentTemplate>>({
    name: '',
    subjectTemplate: '',
    bodyTemplate: '',
    isActive: true
  });

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
      const active = data.find(t => t.department === selectedDept);
      if (active) {
        setCurrentForm(active);
      }
    } catch {
      onToast('Failed to load acknowledgment templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Change department tab
  const handleSelectDept = (dept: Department) => {
    setSelectedDept(dept);
    const match = templates.find(t => t.department === dept);
    if (match) {
      setCurrentForm(match);
    } else {
      setCurrentForm({
        department: dept,
        name: `${DEPARTMENTS[dept].name} Auto-Acknowledgment`,
        subjectTemplate: `Re: {{subject}} [{{ticket_number}}]`,
        bodyTemplate: `Hi {{sender_name}},\n\nThank you for reaching out to TaskNera ${DEPARTMENTS[dept].name}.\nWe have received your message regarding "{{subject}}". Our team will review your inquiry shortly.\n\nBest regards,\nTaskNera ${DEPARTMENTS[dept].name} Team`,
        isActive: true
      });
    }
  };

  // Insert placeholder into body
  const handleInsertToken = (token: string) => {
    if (!isAdmin) return;
    setCurrentForm(prev => ({
      ...prev,
      bodyTemplate: (prev.bodyTemplate || '') + ' ' + token + ' '
    }));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  // Detect unsupported placeholders
  const unsupportedPlaceholders = useMemo(() => {
    const text = `${currentForm.subjectTemplate || ''} ${currentForm.bodyTemplate || ''}`;
    const matches = text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    const allowed = new Set(ALLOWED_PLACEHOLDERS.map(p => p.token));
    // also allow {{subject}}
    allowed.add('{{subject}}');

    const invalid: string[] = [];
    matches.forEach(m => {
      if (!allowed.has(m) && !invalid.includes(m)) {
        invalid.push(m);
      }
    });
    return invalid;
  }, [currentForm.subjectTemplate, currentForm.bodyTemplate]);

  // Save template changes
  const handleSave = async () => {
    if (!isAdmin) {
      onToast('Only Administrators can edit and save templates', 'error');
      return;
    }

    if (unsupportedPlaceholders.length > 0) {
      onToast(`Please remove unsupported placeholder(s): ${unsupportedPlaceholders.join(', ')}`, 'error');
      return;
    }

    if (!currentForm.subjectTemplate?.trim()) {
      onToast('Email subject template cannot be empty', 'error');
      return;
    }

    if (!currentForm.bodyTemplate?.trim()) {
      onToast('Email body template cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<AcknowledgmentTemplate> = {
        ...currentForm,
        department: selectedDept
      };

      const updated = await saveTemplate(payload);
      onToast(`Template for ${DEPARTMENTS[selectedDept].name} saved successfully`, 'success');
      setTemplates(prev => {
        const idx = prev.findIndex(t => t.department === selectedDept);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setCurrentForm(updated);
    } catch (err: any) {
      onToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Render live preview content with real mock sample values
  const previewSubject = useMemo(() => {
    const raw = currentForm.subjectTemplate || '';
    return raw
      .replace(/\{\{subject\}\}/g, 'Inquiry regarding Enterprise Automation')
      .replace(/\{subject\}/g, 'Inquiry regarding Enterprise Automation')
      .replace(/\{\{ticket_number\}\}/g, 'TNK-9421')
      .replace(/\{ticketNumber\}/g, 'TNK-9421')
      .replace(/\{\{department_name\}\}/g, DEPARTMENTS[selectedDept].name)
      .replace(/\{department\}/g, DEPARTMENTS[selectedDept].name);
  }, [currentForm.subjectTemplate, selectedDept]);

  const previewBody = useMemo(() => {
    const raw = currentForm.bodyTemplate || '';
    return raw
      .replace(/\{\{sender_name\}\}/g, 'Alex Morgan')
      .replace(/\{sender_name\}/g, 'Alex Morgan')
      .replace(/\{\{department_name\}\}/g, DEPARTMENTS[selectedDept].name)
      .replace(/\{department\}/g, DEPARTMENTS[selectedDept].name)
      .replace(/\{\{company_name\}\}/g, 'Apex Solutions')
      .replace(/\{company\}/g, 'Apex Solutions')
      .replace(/\{\{ticket_number\}\}/g, 'TNK-9421')
      .replace(/\{ticketNumber\}/g, 'TNK-9421')
      .replace(/\{\{received_at\}\}/g, 'Today at 02:45 PM')
      .replace(/\{\{subject\}\}/g, 'Inquiry regarding Enterprise Automation');
  }, [currentForm.bodyTemplate, selectedDept]);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Departmental Acknowledgment Templates
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              5 Departments Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated 1-to-1 acknowledgments are sent immediately upon receiving inbound emails.
            Admins can configure subjects, bodies, and token variables with real-time preview.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Read-only mode. Administrator privileges required to edit templates.</span>
          </div>
        )}
      </div>

      {/* Department Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {(Object.keys(DEPARTMENTS) as Department[]).map(deptKey => {
          const info = DEPARTMENTS[deptKey];
          const isSelected = selectedDept === deptKey;
          const template = templates.find(t => t.department === deptKey);
          const isEnabled = template ? template.isActive : true;

          return (
            <button
              key={deptKey}
              onClick={() => handleSelectDept(deptKey)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/10'
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isSelected ? 'bg-white/20 text-white border-white/30' : info.badgeClass
                }`}>
                  {info.name}
                </span>

                <span
                  className={`h-2 w-2 rounded-full ${
                    isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={isEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>

              <div className={`text-[11px] font-mono truncate ${
                isSelected ? 'text-slate-300' : 'text-slate-500'
              }`}>
                {info.email}
              </div>

              <div className="mt-2 text-[10px] flex items-center justify-between">
                <span className={isSelected ? 'text-slate-400' : 'text-slate-400'}>
                  {isEnabled ? 'Active' : 'Disabled'}
                </span>
                {template?.updatedAt && (
                  <span className={isSelected ? 'text-slate-400' : 'text-slate-400'}>
                    {new Date(template.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Editor & Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {DEPARTMENTS[selectedDept].name} Template Settings
              </h3>
              <span className="text-[11px] text-slate-400">
                Mailbox: {DEPARTMENTS[selectedDept].email}
              </span>
            </div>

            {/* Enable/Disable switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Auto-Ack:</span>
              <button
                type="button"
                disabled={!isAdmin}
                onClick={() =>
                  setCurrentForm(prev => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  currentForm.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Power className="h-3 w-3" />
                <span>{currentForm.isActive ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          {/* Template Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={currentForm.name || ''}
              onChange={e => setCurrentForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Operations Acknowledgment"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Email Subject Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={currentForm.subjectTemplate || ''}
              onChange={e =>
                setCurrentForm(prev => ({ ...prev, subjectTemplate: e.target.value }))
              }
              placeholder="Re: {{subject}} [{{ticket_number}}]"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Placeholders Toolbar */}
          <div className="rounded-lg bg-slate-50/80 p-3 border border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Supported Placeholders (Click to insert):
              </span>
              {copiedToken && (
                <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="h-3 w-3" /> Inserted
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_PLACEHOLDERS.map(p => (
                <button
                  key={p.token}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => handleInsertToken(p.token)}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={p.desc}
                >
                  {p.token}
                </button>
              ))}
            </div>

            {/* Unsupported placeholder alert if any */}
            {unsupportedPlaceholders.length > 0 && (
              <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Unsupported placeholder detected:</span>{' '}
                  <code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-rose-900">
                    {unsupportedPlaceholders.join(', ')}
                  </code>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Please use only authorized variables from the list above.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Email Body Template */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email Body Text
              </label>
              <span className="text-[10px] text-slate-400">Plain text with variable replacement</span>
            </div>
            <textarea
              rows={9}
              disabled={!isAdmin}
              value={currentForm.bodyTemplate || ''}
              onChange={e =>
                setCurrentForm(prev => ({ ...prev, bodyTemplate: e.target.value }))
              }
              placeholder="Enter acknowledgment message body..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono leading-relaxed disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSelectDept(selectedDept)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || unsupportedPlaceholders.length > 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Template'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Email Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Live Recipient Preview</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sample Data
            </span>
          </div>

          {/* Email Client Mock Frame */}
          <div className="flex-1 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col overflow-hidden shadow-2xs">
            {/* Mock Email Header */}
            <div className="p-3 bg-white border-b border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 text-[11px] font-medium w-12 shrink-0">From:</span>
                <span className="font-semibold text-slate-800 truncate">
                  TaskNera {DEPARTMENTS[selectedDept].name} &lt;{DEPARTMENTS[selectedDept].email}&gt;
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 text-[11px] font-medium w-12 shrink-0">To:</span>
                <span className="text-slate-600 truncate">
                  Alex Morgan &lt;alex.morgan@apexsolutions.com&gt;
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-1 border-t border-slate-50">
                <span className="text-slate-400 text-[11px] font-medium w-12 shrink-0">Subject:</span>
                <span className="font-bold text-slate-900 truncate">
                  {previewSubject || 'No subject'}
                </span>
              </div>
            </div>

            {/* Mock Email Body */}
            <div className="p-4 flex-1 bg-white text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {previewBody || 'No template body configured.'}
            </div>

            {/* Email Footer Brand */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Automated acknowledgment delivered by TaskNera Inbound Router &bull; Ref: TNK-9421
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
