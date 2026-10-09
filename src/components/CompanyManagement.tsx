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

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23272f] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">Company Directory</h3>
              <p className="text-xs text-gray-400">
                Manage target companies for cold outreach campaigns. Both employees and administrators can add and update companies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-lg bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-48 sm:w-60"
            />
          </div>

          <button
            onClick={handleStartAdd}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="p-5 bg-[#14171c] border border-[#2b303c] rounded-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#23272f] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">
                {editingId ? 'Edit Company Details' : 'Add New Target Company'}
              </h4>
            </div>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Acme Corporation"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Primary Contact Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="e.g. hr@acme.com or founder@acme.com"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono"
                  placeholder="e.g. https://acme.com"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Industry / Sector
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. SaaS, Fintech, Healthcare, Staffing"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Notes &amp; Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md bg-[#0d0f12] border border-[#23272f] p-2.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Background notes, target positions, recruitment mandate requirements..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#23272f]">
            <button
              onClick={handleCancelForm}
              disabled={saving}
              className="px-3 py-1.5 border border-[#23272f] text-gray-300 rounded-lg hover:bg-[#1a1e24] text-xs font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim() || !formData.email.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
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
          <div className="text-center py-12 text-gray-400 text-xs">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-600 animate-pulse" />
            Loading company directory...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-[#23272f] bg-[#14171c]/50 p-8">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <h4 className="text-sm font-semibold text-white mb-1">
              {searchQuery ? 'No companies matching your search' : 'No target companies added yet'}
            </h4>
            <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
              {searchQuery
                ? `No company names or emails match "${searchQuery}". Try a different search term.`
                : 'Both employees and admins can add target companies here to launch tailored email campaigns.'}
            </p>
            <button
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Company</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="group relative p-4 bg-[#14171c] border border-[#23272f] hover:border-[#333a46] rounded-xl transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {company.name}
                        </h4>
                        {company.industry && (
                          <span className="inline-block text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            {company.industry}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1">
                      {onStartOutreach && (
                        <button
                          onClick={() => onStartOutreach(company)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition-colors"
                          title={`Send outreach email to ${company.name}`}
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Mail</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(company)}
                        disabled={saving}
                        className="p-1 text-gray-400 hover:text-white hover:bg-[#23272f] rounded-md transition-colors"
                        title="Edit company"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          disabled={saving}
                          className="p-1 text-gray-400 hover:text-rose-400 hover:bg-[#23272f] rounded-md transition-colors"
                          title="Delete company (Admin only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="font-mono text-gray-300">{company.email}</span>
                    </div>

                    {company.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline truncate"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 pt-1 border-t border-[#1e232b] mt-1.5">
                        {company.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1e232b] text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span>Added {new Date(company.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {company.createdBy && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-600" />
                      <span>by {company.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {companies.length > 0 && (
        <div className="text-[11px] text-gray-500 text-center pt-2">
          Total: {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered in directory
        </div>
      )}
    </div>
  );
}