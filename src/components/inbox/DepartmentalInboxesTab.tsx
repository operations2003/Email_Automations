'use client';

import React, { useState } from 'react';
import {
  Department,
  DEPARTMENTS,
  MailboxOverview
} from '@/types/inbox';
import {
  toggleMailboxConnection,
  updateMailbox
} from '@/lib/inbox-api';
import {
  Inbox,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  Power,
  Sliders,
  ShieldCheck,
  Building,
  User,
  X,
  ExternalLink,
  Lock,
  Mail
} from 'lucide-react';

interface DepartmentalInboxesTabProps {
  mailboxes: MailboxOverview[];
  isAdmin: boolean;
  currentUser?: { name: string; email: string; role?: string } | null;
  onRefresh: () => void;
  onToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onSelectDepartmentForInbox: (dept: Department) => void;
}

export function DepartmentalInboxesTab({
  mailboxes,
  isAdmin,
  currentUser,
  onRefresh,
  onToast,
  onSelectDepartmentForInbox
}: DepartmentalInboxesTabProps) {
  // Modal & Confirmation states
  const [disconnectConfirmDept, setDisconnectConfirmDept] = useState<Department | null>(null);
  const [editingMailbox, setEditingMailbox] = useState<MailboxOverview | null>(null);
  const [isAddMailboxOpen, setIsAddMailboxOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add mailbox form
  const [newMailboxDept, setNewMailboxDept] = useState<Department>('operations');
  const [newMailboxEmail, setNewMailboxEmail] = useState('');
  const [newMailboxName, setNewMailboxName] = useState('');
  const [newMailboxDesc, setNewMailboxDesc] = useState('');

  // Edit form state
  const [editDesc, setEditDesc] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Handle Connect / Reconnect
  const handleConnect = async (dept: Department) => {
    setActionLoading(true);
    try {
      await toggleMailboxConnection(dept, 'reconnect');
      onToast(`Mailbox for ${DEPARTMENTS[dept].name} connected successfully`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to connect mailbox', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Disconnect with confirmation
  const handleDisconnectConfirm = async () => {
    if (!disconnectConfirmDept) return;
    setActionLoading(true);
    try {
      await toggleMailboxConnection(disconnectConfirmDept, 'disconnect');
      onToast(`Mailbox for ${DEPARTMENTS[disconnectConfirmDept].name} disconnected`, 'info');
      setDisconnectConfirmDept(null);
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to disconnect mailbox', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Auto-Ack
  const handleToggleAutoAck = async (dept: Department, currentStatus: boolean) => {
    try {
      await updateMailbox(dept, { autoAckEnabled: !currentStatus });
      onToast(
        `Auto-Acknowledgment ${!currentStatus ? 'enabled' : 'disabled'} for ${DEPARTMENTS[dept].name}`,
        'success'
      );
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to update auto-ack status', 'error');
    }
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (mb: MailboxOverview) => {
    setEditingMailbox(mb);
    setEditDesc(mb.description || '');
    setEditEmail(mb.email || '');
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingMailbox) return;
    setActionLoading(true);
    try {
      await updateMailbox(editingMailbox.department, {
        description: editDesc,
        email: editEmail
      });
      onToast(`Mailbox settings saved for ${DEPARTMENTS[editingMailbox.department].name}`, 'success');
      setEditingMailbox(null);
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // For Employee: Filter authorized mailboxes or show all if Admin
  // If employee has assigned departments, filter; otherwise default to employee access for all standard inboxes
  const visibleMailboxes = mailboxes.filter(mb => {
    if (isAdmin) return true;
    if (mb.assignedEmployees && mb.assignedEmployees.length > 0) {
      return (
        mb.assignedEmployees.includes(currentUser?.name || '') ||
        mb.assignedEmployees.includes(currentUser?.email || '')
      );
    }
    return true; // Default access to view assigned inquiries
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Departmental Mailboxes
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {visibleMailboxes.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming departmental accounts, auto-acknowledgment policies, connection status &amp; employee routing.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddMailboxOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Mailbox Account
          </button>
        )}
      </div>

      {/* Mailbox Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleMailboxes.map(mb => {
          const info = DEPARTMENTS[mb.department] || DEPARTMENTS.operations;
          const isConnected = mb.status === 'connected';

          return (
            <div
              key={mb.department}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Top Row: Department Badge & Connection Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${info.badgeClass}`}>
                    {info.name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 capitalize">
                      {mb.status}
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <h3 className="text-sm font-bold text-slate-900 font-mono tracking-tight break-all mb-1">
                  {mb.email}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {mb.description || info.description}
                </p>

                {/* Mailbox Meta Table */}
                <div className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Auto-Acknowledgment:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        mb.autoAckEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {mb.autoAckEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pending Inquiries:</span>
                    <span className="font-bold text-amber-700">
                      {mb.pendingHumanCount} awaiting team
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Conversations:</span>
                    <span className="font-semibold text-slate-800">{mb.totalConversations}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-200/60">
                    <span>Last Sync:</span>
                    <span>
                      {mb.lastSyncedAt
                        ? new Date(mb.lastSyncedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDepartmentForInbox(mb.department)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  Open Inbox
                </button>

                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    {/* Auto-Ack Toggle */}
                    <button
                      onClick={() => handleToggleAutoAck(mb.department, mb.autoAckEnabled)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded border cursor-pointer transition-colors ${
                        mb.autoAckEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Toggle automated acknowledgments"
                    >
                      {mb.autoAckEnabled ? 'Ack: On' : 'Ack: Off'}
                    </button>

                    {/* Edit Settings */}
                    <button
                      onClick={() => handleOpenEdit(mb)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Edit Mailbox Settings"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                    </button>

                    {/* Connect / Disconnect */}
                    {isConnected ? (
                      <button
                        onClick={() => setDisconnectConfirmDept(mb.department)}
                        className="px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer"
                        title="Disconnect Mailbox"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(mb.department)}
                        disabled={actionLoading}
                        className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
                        title="Reconnect Mailbox"
                      >
                        Reconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                    Authorized
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disconnect Confirmation Dialog */}
      {disconnectConfirmDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Disconnect {DEPARTMENTS[disconnectConfirmDept].name} Mailbox?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to pause incoming synchronization for{' '}
                  <strong>{DEPARTMENTS[disconnectConfirmDept].email}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              When disconnected, automatic acknowledgments and inbound routing for this mailbox will be suspended until reconnected.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisconnectConfirmDept(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectConfirm}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mailbox Settings Modal */}
      {editingMailbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit {DEPARTMENTS[editingMailbox.department].name} Mailbox Settings
                </h3>
              </div>
              <button
                onClick={() => setEditingMailbox(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mailbox Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Departmental Purpose &amp; Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMailbox(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mailbox Modal */}
      {isAddMailboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Connect New Departmental Mailbox</h3>
              </div>
              <button
                onClick={() => setIsAddMailboxOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={newMailboxDept}
                  onChange={e => setNewMailboxDept(e.target.value as Department)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="operations">Operations</option>
                  <option value="careers">Careers</option>
                  <option value="hr">Human Resources</option>
                  <option value="recruitment">Recruitment</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. TaskNera Global Support"
                  value={newMailboxName}
                  onChange={e => setNewMailboxName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mailbox Address
                </label>
                <input
                  type="email"
                  placeholder="support@tasknera.com"
                  value={newMailboxEmail}
                  onChange={e => setNewMailboxEmail(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Operational scope for this mailbox account..."
                  value={newMailboxDesc}
                  onChange={e => setNewMailboxDesc(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddMailboxOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newMailboxEmail) {
                    onToast('Mailbox address is required', 'error');
                    return;
                  }
                  try {
                    await updateMailbox(newMailboxDept, {
                      name: newMailboxName || DEPARTMENTS[newMailboxDept].name,
                      email: newMailboxEmail,
                      description: newMailboxDesc || DEPARTMENTS[newMailboxDept].description,
                      status: 'connected',
                      autoAckEnabled: true
                    });
                    onToast(`Mailbox account for ${DEPARTMENTS[newMailboxDept].name} registered`, 'success');
                    setIsAddMailboxOpen(false);
                    onRefresh();
                  } catch (err: any) {
                    onToast(err.message || 'Failed to add mailbox', 'error');
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
              >
                Connect Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
