'use client';

import React, { useState, useEffect } from 'react';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Mail,
  Globe,
  Briefcase,
  Clock,
  User,
  Check,
  AlertTriangle,
  Send,
  Search,
  Sparkles
} from 'lucide-react';

interface CompanyManagementProps {
  isAdmin?: boolean;
  onStartOutreach?: (company: Company) => void;
}

export function CompanyManagement({ isAdmin = false, onStartOutreach }: CompanyManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const selectAllRef = React.useRef<HTMLInputElement | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: '',
    email: '',
    description: '',
    website: '',
    industry: ''
  });

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setError(null);
      const res = await fetch('/api/companies');
      const data = await res.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch {
      setError('Network error fetching companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Form handlers
  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      description: '',
      website: '',
      industry: ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleStartEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      email: company.email,
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || ''
    });
    setShowForm(true);
    setError(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      description: '',
      website: '',
      industry: ''
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Company name and email are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
      const method = editingId ? 'PUT' : 'POST';
      
      const body: CreateCompanyRequest | UpdateCompanyRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        description: formData.description?.trim() || '',
        website: formData.website?.trim() || '',
        industry: formData.industry?.trim() || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || `Company ${editingId ? 'updated' : 'created'} successfully`);
        handleCancelForm();
        await fetchCompanies();
      } else {
        setError(data.error || `Failed to ${editingId ? 'update' : 'create'} company`);
      }
    } catch {
      setError('Network error saving company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      setError('Only administrators can delete companies from the directory.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || 'Company deleted successfully');
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await fetchCompanies();
      } else {
        setError(data.error || 'Failed to delete company');
      }
    } catch {
      setError('Network error deleting company');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      setError('Only administrators can delete companies from the directory.');
      return;
    }

    const count = selectedIds.size;
    if (count === 0) return;

    if (!confirm(`Are you sure you want to delete ${count} selected ${count === 1 ? 'company' : 'companies'}? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingBulk(true);
    setError(null);

    try {
      const res = await fetch('/api/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || `Successfully deleted ${count} ${count === 1 ? 'company' : 'companies'}`);
        setSelectedIds(new Set());
        await fetchCompanies();
      } else {
        setError(data.error || 'Failed to delete selected companies');
      }
    } catch {
      setError('Network error deleting companies');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const filteredCompanies = companies.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const allFilteredSelected = filteredCompanies.length > 0 && filteredCompanies.every(c => selectedIds.has(c.id));
  const someFilteredSelected = filteredCompanies.some(c => selectedIds.has(c.id)) && !allFilteredSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredCompanies.forEach(c => next.delete(c.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredCompanies.forEach(c => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Company Directory</h3>
              <p className="text-xs text-slate-500">
                Manage target prospective accounts for workforce and digital solution outreach.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-lg bg-white border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none w-48 sm:w-60 shadow-xs"
            />
          </div>

          <button
            onClick={handleStartAdd}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-900">
                {editingId ? 'Edit Company Details' : 'Add New Target Company'}
              </h4>
            </div>
            <button
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  placeholder="e.g. Acme Corporation"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Contact Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none font-mono"
                  placeholder="e.g. hr@acme.com or founder@acme.com"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none font-mono"
                  placeholder="e.g. https://acme.com"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Industry / Sector
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  placeholder="e.g. SaaS, Fintech, Healthcare, Staffing"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notes &amp; Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg bg-white border border-slate-200 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none resize-none"
                placeholder="Background notes, target positions, recruitment mandate requirements..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={handleCancelForm}
              disabled={saving}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim() || !formData.email.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : editingId ? 'Update Company' : 'Save Company'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Companies Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-400 animate-pulse" />
            Loading company directory...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-white p-8">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              {searchQuery ? 'No companies matching your search' : 'No target companies added yet'}
            </h4>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              {searchQuery
                ? `No company names or emails match "${searchQuery}". Try a different search term.`
                : 'Both employees and admins can add target companies here to launch tailored email campaigns.'}
            </p>
            <button
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Company</span>
            </button>
          </div>
        ) : (
          <>
            {/* Selection & Bulk Actions Toolbar */}
            {filteredCompanies.length > 0 && isAdmin && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                    />
                    <span>Select All</span>
                    <span className="text-slate-400 font-normal">({filteredCompanies.length})</span>
                  </label>

                  {selectedIds.size > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-white shadow-xs">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={saving || isDeletingBulk}
                      className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className={`group relative p-5 bg-white border ${
                    selectedIds.has(company.id)
                      ? 'border-slate-800 ring-1 ring-slate-800/10 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  } rounded-xl transition-all shadow-xs flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(company.id)}
                            onChange={() => handleToggleSelect(company.id)}
                            aria-label={`Select ${company.name}`}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer shrink-0 transition"
                          />
                        )}
                        <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-xs">
                          <Building2 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 transition-colors">
                            {company.name}
                          </h4>
                          {company.industry && (
                            <span className="inline-block text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                              {company.industry}
                            </span>
                          )}
                        </div>
                      </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1.5">
                      {onStartOutreach && (
                        <button
                          onClick={() => onStartOutreach(company)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                          title={`Send outreach email to ${company.name}`}
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Mail</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(company)}
                        disabled={saving}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Edit company"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          disabled={saving}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete company (Admin only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-800">{company.email}</span>
                    </div>

                    {company.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-slate-900 underline truncate font-medium"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 pt-2 border-t border-slate-100 mt-2">
                        {company.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Added {new Date(company.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {company.createdBy && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>by {company.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          </>
        )}
      </div>

      {companies.length > 0 && (
        <div className="text-[11px] text-slate-500 text-center pt-2">
          Total: {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered in directory
        </div>
      )}
    </div>
  );
}