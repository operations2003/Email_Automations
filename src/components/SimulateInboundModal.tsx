'use client';

import React, { useState } from 'react';
import { Department, DEPARTMENTS } from '@/types/inbox';
import {
  X,
  Play,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Mail,
  Zap,
  ArrowRight
} from 'lucide-react';

interface SimulateInboundModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function SimulateInboundModal({
  onClose,
  onSuccess,
  onToast
}: SimulateInboundModalProps) {
  const [preset, setPreset] = useState<string>('operations_partnership');
  const [senderName, setSenderName] = useState('Alex Morgan');
  const [senderEmail, setSenderEmail] = useState('alex.morgan@novapartner.io');
  const [department, setDepartment] = useState<Department>('operations');
  const [subject, setSubject] = useState('Partnership Inquiry: Automation workflows for Q4');
  const [body, setBody] = useState(
    `Hi TaskNera Team,\n\nWe are exploring a strategic automation partnership for our enterprise clients in North America. Could you share your operational capabilities and schedule a brief call this week?\n\nBest regards,\nAlex Morgan\nVP of Strategic Partnerships, NovaPartner`
  );

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    setSimulationResult(null);

    if (presetKey === 'operations_partnership') {
      setSenderName('Alex Morgan');
      setSenderEmail('alex.morgan@novapartner.io');
      setDepartment('operations');
      setSubject('Partnership Inquiry: Automation workflows for Q4');
      setBody(
        `Hi TaskNera Team,\n\nWe are exploring a strategic automation partnership for our enterprise clients in North America. Could you share your operational capabilities and schedule a brief call this week?\n\nBest regards,\nAlex Morgan\nVP of Strategic Partnerships, NovaPartner`
      );
    } else if (presetKey === 'careers_application') {
      setSenderName('Priya Sharma');
      setSenderEmail('priya.sharma@engineermail.com');
      setDepartment('careers');
      setSubject('Application: Senior Full-Stack Engineer - Priya Sharma');
      setBody(
        `Dear TaskNera Talent Acquisition,\n\nI would love to be considered for the Senior Full-Stack Engineer role at TaskNera Solutions. I have 6+ years of experience in Next.js, Node.js, and cloud backend architecture.\n\nAttached is my portfolio and resume link for your review: https://priyasharma.dev/cv\n\nThank you,\nPriya Sharma`
      );
    } else if (presetKey === 'hr_inquiry') {
      setSenderName('Marcus Vance');
      setSenderEmail('corporate.services@partnergroup.com');
      setDepartment('hr');
      setSubject('Employment Verification Request - Department Inquiry');
      setBody(
        `Hello TaskNera People Operations,\n\nWe are processing an official employment verification request regarding a former team member. Please confirm the appropriate point of contact and documentation checklist for HR clearance.\n\nThank you,\nMarcus Vance\nCorporate Services`
      );
    } else if (presetKey === 'recruitment_partnership') {
      setSenderName('Claire Bennett');
      setSenderEmail('claire.bennett@apexrecruiting.co');
      setDepartment('recruitment');
      setSubject('Recruitment Partnership — Technical Talent Pipeline');
      setBody(
        `Hi Team,\n\nApex Recruiting specializes in senior engineering and product leadership placements. We would like to introduce our contingency sourcing model to TaskNera's talent leaders.\n\nAre you available for a 15-minute briefing next Tuesday?\n\nKind regards,\nClaire Bennett`
      );
    } else if (presetKey === 'support_ticket') {
      setSenderName('David Chen');
      setSenderEmail('david.chen@clientbrand.com');
      setDepartment('support');
      setSubject('Issue: Webhook integration returning 504 timeout');
      setBody(
        `Hi Support Team,\n\nOur production integration with your API endpoint encountered multiple 504 timeouts at 11:20 AM UTC today.\n\nCould your engineering team check the upstream server status and assist us in diagnosing the request logs?\n\nThanks,\nDavid Chen\nDevOps Lead, ClientBrand`
      );
    } else if (presetKey === 'spam_automated') {
      setSenderName('Automated Mail System');
      setSenderEmail('no-reply@mailer-bot.example.net');
      setDepartment('operations');
      setSubject('Automatic reply: System maintenance scheduled');
      setBody(`This is an automated system notification. Please do not reply to this email.`);
    }
  };

  const handleSimulate = async () => {
    setLoading(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/inbox/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: senderEmail,
          fromName: senderName,
          to: DEPARTMENTS[department].email,
          subject,
          text: body,
          department
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.simulationResult);
        onToast('Incoming email processed successfully!', 'success');
        onSuccess();
      } else {
        onToast(data.error || 'Simulation failed', 'error');
      }
    } catch {
      onToast('Error simulating incoming email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inbound Email Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Simulate incoming external emails to test routing, anti-spam, and auto-acknowledgments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Test Scenario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'operations_partnership', label: 'Operations Inquiry', color: 'border-blue-300' },
                { id: 'careers_application', label: 'Careers Job Application', color: 'border-emerald-300' },
                { id: 'hr_inquiry', label: 'HR Verification', color: 'border-purple-300' },
                { id: 'recruitment_partnership', label: 'Recruitment Proposal', color: 'border-amber-300' },
                { id: 'support_ticket', label: 'IT Support Ticket', color: 'border-rose-300' },
                { id: 'spam_automated', label: 'Spam/Bot Auto-Exclude', color: 'border-slate-300' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer ${
                    preset === p.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sender & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sender Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value as Department)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                <option value="operations">Operations ({DEPARTMENTS.operations.email})</option>
                <option value="careers">Careers ({DEPARTMENTS.careers.email})</option>
                <option value="hr">HR ({DEPARTMENTS.hr.email})</option>
                <option value="recruitment">Recruitment ({DEPARTMENTS.recruitment.email})</option>
                <option value="support">Support ({DEPARTMENTS.support.email})</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Body Content
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Live Result Callout */}
          {simulationResult && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Simulation Execution Result
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                  {simulationResult.conversation?.ticketNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {simulationResult.conversation?.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Auto-Acknowledgment:</span>
                  <span
                    className={`font-semibold ${
                      simulationResult.acknowledgmentSent ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    {simulationResult.acknowledgmentSent ? 'Dispatched' : 'Skipped / Excluded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Spam / Bot Check:</span>
                  <span
                    className={`font-semibold ${
                      simulationResult.conversation?.status === 'spam'
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {simulationResult.conversation?.status === 'spam' ? 'Flagged as Spam' : 'Passed (Clean)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Conversation Status:</span>
                  <span className="font-semibold text-slate-800">
                    {simulationResult.conversation?.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {simulationResult.reason && (
                <div className="text-[11px] text-slate-500 italic mt-1">
                  Note: {simulationResult.reason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <span className="text-[11px] text-slate-400">
            Simulates SendGrid Inbound Parse or SMTP receiving hook
          </span>
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
              onClick={handleSimulate}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {loading ? 'Processing...' : 'Send Simulated Inbound Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
