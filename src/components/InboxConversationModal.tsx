'use client';

import React, { useState } from 'react';
import {
  InboxConversation,
  InboxMessage,
  Department,
  DEPARTMENTS
} from '@/types/inbox';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  User,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  UserCheck
} from 'lucide-react';

interface InboxConversationModalProps {
  conversation: InboxConversation;
  onClose: () => void;
  onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
  currentUser?: { name: string; email: string } | null;
}

export function InboxConversationModal({
  conversation,
  onClose,
  onRefresh,
  onToast,
  currentUser
}: InboxConversationModalProps) {
  const [conv, setConv] = useState<InboxConversation>(conversation);
  const [replyText, setReplyText] = useState('');
  const [markResolvedOnSend, setMarkResolvedOnSend] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [retryingAck, setRetryingAck] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const deptInfo = DEPARTMENTS[conv.department];

  // Reassign department
  const handleDepartmentChange = async (newDept: Department) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: newDept })
      });
      const data = await res.json();
      if (data.success) {
        setConv(data.conversation);
        onToast(`Conversation reassigned to ${DEPARTMENTS[newDept].name}`, 'success');
        onRefresh();
      }
    } catch {
      onToast('Failed to reassign department', 'error');
    }
  };

  // Status toggle
  const handleStatusChange = async (newStatus: InboxConversation['status']) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setConv(data.conversation);
        onToast(`Status marked as ${newStatus.replace('_', ' ')}`, 'success');
        onRefresh();
      }
    } catch {
      onToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Retry or dispatch auto-acknowledgment
  const handleRetryAck = async () => {
    setRetryingAck(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}/acknowledge`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        onToast('Auto-acknowledgment dispatched successfully', 'success');
        // Refresh conversation details
        const refreshed = await fetch(`/api/inbox/conversations/${conv.id}`).then(r => r.json());
        if (refreshed.success) {
          setConv(refreshed.conversation);
        }
        onRefresh();
      } else {
        onToast(data.error || 'Failed to send acknowledgment', 'error');
      }
    } catch {
      onToast('Error dispatching acknowledgment', 'error');
    } finally {
      setRetryingAck(false);
    }
  };

  // Reassign team member
  const handleAssigneeChange = async (newAssignee: string) => {
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: newAssignee || null })
      });
      const data = await res.json();
      if (data.success) {
        setConv(data.conversation);
        onToast(`Inquiry assigned to ${newAssignee || 'Unassigned'}`, 'success');
        onRefresh();
      }
    } catch {
      onToast('Failed to update assignee', 'error');
    }
  };

  // Send human reply
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/inbox/conversations/${conv.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText: replyText.trim(),
          userName: currentUser?.name || 'Operations Lead',
          userEmail: currentUser?.email || deptInfo.email
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');

        if (markResolvedOnSend) {
          await fetch(`/api/inbox/conversations/${conv.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved' })
          });
        }

        onToast('Reply sent successfully', 'success');
        // Reload conversation with new message
        const refreshed = await fetch(`/api/inbox/conversations/${conv.id}`).then(r => r.json());
        if (refreshed.success) {
          setConv(refreshed.conversation);
        }
        onRefresh();
      } else {
        onToast(data.error || 'Failed to send reply', 'error');
      }
    } catch {
      onToast('Error sending reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wide">
                {conv.ticketNumber}
              </span>

              {/* Department selector */}
              <div className="relative inline-block">
                <select
                  value={conv.department}
                  onChange={e => handleDepartmentChange(e.target.value as Department)}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer appearance-none pr-6 ${deptInfo.badgeClass}`}
                >
                  <option value="operations">Operations</option>
                  <option value="careers">Careers</option>
                  <option value="hr">Human Resources</option>
                  <option value="recruitment">Recruitment</option>
                  <option value="support">Support</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
              </div>

              {/* Status Badge */}
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  conv.status === 'resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : conv.status === 'pending_human'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : conv.status === 'waiting_on_customer'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {conv.status === 'pending_human'
                  ? 'Pending Team Action'
                  : conv.status === 'waiting_on_customer'
                  ? 'Waiting on Sender'
                  : conv.status === 'resolved'
                  ? 'Resolved'
                  : 'Spam / Automated'}
              </span>

              {/* Assignee Selector */}
              <div className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-2xs">
                <UserCheck className="h-3 w-3 text-slate-400" />
                <select
                  value={conv.assignedTo || ''}
                  onChange={e => handleAssigneeChange(e.target.value)}
                  className="bg-transparent text-slate-700 font-medium outline-none cursor-pointer text-[11px]"
                >
                  <option value="">Unassigned</option>
                  <option value="Sheetal Bedi (Admin)">Sheetal Bedi (Admin)</option>
                  <option value="Atul (Operations)">Atul (Operations)</option>
                  {currentUser?.name && !['Sheetal Bedi (Admin)', 'Atul (Operations)'].includes(currentUser.name) && (
                    <option value={currentUser.name}>{currentUser.name}</option>
                  )}
                </select>
              </div>

              {/* Auto-Ack status pill */}
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  conv.acknowledgmentStatus === 'sent'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : conv.acknowledgmentStatus === 'skipped'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : conv.acknowledgmentStatus === 'failed'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {conv.acknowledgmentStatus === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                {conv.acknowledgmentStatus === 'failed' && <AlertCircle className="h-3 w-3" />}
                {conv.acknowledgmentStatus === 'skipped' && <ShieldAlert className="h-3 w-3" />}
                Auto-Ack: {conv.acknowledgmentStatus.toUpperCase()}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-snug break-words">
              {conv.subject}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{conv.sender.name || 'Unknown'}</span> (
                <a href={`mailto:${conv.sender.email}`} className="text-blue-600 hover:underline">
                  {conv.sender.email}
                </a>
                )
              </span>
              {conv.sender.company && (
                <span className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {conv.sender.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Mailbox: <span className="font-mono">{conv.mailbox}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {conv.status !== 'resolved' ? (
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={updatingStatus}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Resolved
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('pending_human')}
                disabled={updatingStatus}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-300 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Auto-Ack Notice Bar */}
        {conv.acknowledgmentStatus === 'sent' && (
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2 flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Departmental Auto-Acknowledgment sent to <strong>{conv.sender.email}</strong> on{' '}
                {new Date(conv.acknowledgmentSentAt || '').toLocaleString()}.
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 font-mono">
              Thread preserved
            </span>
          </div>
        )}

        {conv.acknowledgmentStatus === 'skipped' && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                Auto-Acknowledgment was skipped ({conv.acknowledgmentSkipReason || 'Spam, bot, or automated sender'}).
              </span>
            </span>
            <button
              onClick={handleRetryAck}
              disabled={retryingAck}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer disabled:opacity-50"
            >
              {retryingAck ? 'Sending...' : 'Force Send Acknowledgment'}
            </button>
          </div>
        )}

        {conv.acknowledgmentStatus === 'failed' && (
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-2 flex items-center justify-between text-xs text-rose-800">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>
                Auto-Acknowledgment failed: <em>{conv.acknowledgmentError}</em>
              </span>
            </span>
            <button
              onClick={handleRetryAck}
              disabled={retryingAck}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
            >
              {retryingAck ? 'Retrying...' : 'Retry Now'}
            </button>
          </div>
        )}

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {(!conv.messages || conv.messages.length === 0) ? (
            <div className="text-center py-12 text-slate-400">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages loaded for this conversation.</p>
            </div>
          ) : (
            conv.messages.map((msg: InboxMessage, idx: number) => {
              const isInbound = msg.direction === 'inbound';
              const isAck = msg.direction === 'outbound_ack';
              const isHuman = msg.direction === 'outbound_human';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-xs border ${
                      isInbound
                        ? 'bg-white text-slate-900 border-slate-200 rounded-tl-xs'
                        : isAck
                        ? 'bg-blue-50/70 text-slate-900 border-blue-200 rounded-tr-xs'
                        : 'bg-slate-900 text-white border-slate-800 rounded-tr-xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 mb-2 border-b pb-1.5 border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            isInbound ? 'text-slate-800' : isAck ? 'text-blue-900' : 'text-slate-100'
                          }`}
                        >
                          {msg.from.name || msg.from.email}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            isInbound
                              ? 'bg-slate-100 text-slate-600'
                              : isAck
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-900/60 text-emerald-200'
                          }`}
                        >
                          {isInbound ? 'Inbound' : isAck ? 'Auto-Ack' : 'Team Reply'}
                        </span>
                      </div>
                      <span className={`text-[11px] ${isInbound ? 'text-slate-400' : isAck ? 'text-blue-600' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Subject line (if different) */}
                    {msg.subject && msg.subject !== conv.subject && (
                      <div className={`text-xs font-semibold mb-1 ${isInbound ? 'text-slate-700' : isAck ? 'text-blue-800' : 'text-slate-200'}`}>
                        Subject: {msg.subject}
                      </div>
                    )}

                    {/* Body */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.bodyText}
                    </div>

                    {/* Metadata footer */}
                    {msg.messageId && (
                      <div className="mt-2 pt-1 border-t border-slate-200/40 text-[10px] opacity-60 font-mono flex items-center justify-between">
                        <span>ID: {msg.messageId.slice(0, 32)}...</span>
                        {msg.inReplyTo && <span>Threaded</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Human Reply Composer */}
        <div className="border-t border-slate-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-blue-600" />
              Reply from {deptInfo.name} ({deptInfo.email})
            </span>
            <span className="text-[11px] text-slate-400">
              Preserves thread for {conv.sender.email}
            </span>
          </div>

          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Type your reply to ${conv.sender.name || conv.sender.email}...`}
            rows={3}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          />

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                Response target: under {deptInfo.id === 'support' ? '4h' : '24h'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 mr-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markResolvedOnSend}
                  onChange={e => setMarkResolvedOnSend(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-[11px] font-medium">Mark Resolved</span>
              </label>

              <button
                type="button"
                onClick={() => setReplyText('')}
                disabled={!replyText.trim() || sendingReply}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendingReply}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
