'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Mail,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { CreateCompanyRequest } from '@/types/company';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

interface ParsedRowPreview {
  index: number;
  name: string;
  email: string;
  website?: string;
  industry?: string;
  description?: string;
  isValid: boolean;
  errorReason?: string;
}

export function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);

  // Column Mappings
  const [nameCol, setNameCol] = useState<string>('');
  const [emailCol, setEmailCol] = useState<string>('');
  const [websiteCol, setWebsiteCol] = useState<string>('');
  const [industryCol, setIndustryCol] = useState<string>('');
  const [descCol, setDescCol] = useState<string>('');

  // Status & processing
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    existingCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const resetAll = () => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setHeaders([]);
    setRawRows([]);
    setNameCol('');
    setEmailCol('');
    setWebsiteCol('');
    setIndustryCol('');
    setDescCol('');
    setIsParsing(false);
    setIsImporting(false);
    setError(null);
    setImportResult(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Download sample template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Company Name': 'Acme Global Innovations',
        'Email Address': 'contact@acmeglobal.com',
        'Industry': 'recruitment',
        'Website': 'https://acmeglobal.com',
        'Description': 'Target enterprise account for talent sourcing & workforce solutions'
      },
      {
        'Company Name': 'Apex Cloud Systems',
        'Email Address': 'partners@apexcloud.io',
        'Industry': 'software solutions',
        'Website': 'https://apexcloud.io',
        'Description': 'Fast-growing tech firm looking for engineering staffing'
      },
      {
        'Company Name': 'Zenith Health Solutions',
        'Email Address': 'hr@zenithhealth.org',
        'Industry': 'recruitment services',
        'Website': 'https://zenithhealth.org',
        'Description': 'Healthcare technology services and staffing mandates'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 28 }, // Company Name
      { wch: 28 }, // Email Address
      { wch: 22 }, // Industry
      { wch: 28 }, // Website
      { wch: 45 }  // Description
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    XLSX.writeFile(wb, 'Company_Import_Template.xlsx');
  };

  // Process file buffer
  const processWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    const sheets = workbook.SheetNames;
    if (!sheets || sheets.length === 0) {
      setError('The selected file contains no sheets.');
      return;
    }

    setSheetNames(sheets);
    const initialSheet = sheets[0];
    setSelectedSheet(initialSheet);
    parseSheet(workbook, initialSheet);
  };

  const parseSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        setError(`Sheet "${sheetName}" is empty.`);
        return;
      }

      // Read raw rows as objects with header strings
      const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        blankrows: false
      });

      if (json.length === 0) {
        setError('No data rows found in this sheet.');
        setRawRows([]);
        setHeaders([]);
        return;
      }

      // Extract unique headers
      const firstRow = json[0];
      const detectedHeaders = Object.keys(firstRow).filter(k => !k.startsWith('__EMPTY'));

      if (detectedHeaders.length === 0) {
        setError('No column headers detected in the sheet.');
        return;
      }

      setHeaders(detectedHeaders);
      setRawRows(json);

      // Auto-detect best column matches
      const findBestMatch = (keywords: string[]): string => {
        for (const h of detectedHeaders) {
          const clean = h.trim().toLowerCase();
          if (keywords.some(k => clean === k || clean.includes(k))) {
            return h;
          }
        }
        return '';
      };

      const matchedName = findBestMatch(['company name', 'company', 'organization', 'account', 'firm', 'name', 'client', 'business']);
      const matchedEmail = findBestMatch(['email address', 'primary email', 'contact email', 'email', 'e-mail', 'mail']);
      const matchedWebsite = findBestMatch(['website', 'url', 'web', 'domain', 'site']);
      const matchedIndustry = findBestMatch(['industry', 'sector', 'category', 'vertical', 'domain']);
      const matchedDesc = findBestMatch(['description', 'notes', 'note', 'about', 'summary', 'detail']);

      setNameCol(matchedName || detectedHeaders[0] || '');
      setEmailCol(matchedEmail || (detectedHeaders.length > 1 ? detectedHeaders[1] : ''));
      setWebsiteCol(matchedWebsite || '');
      setIndustryCol(matchedIndustry || '');
      setDescCol(matchedDesc || '');
      setError(null);
    } catch (err: unknown) {
      const e = err as Error;
      setError('Error reading sheet data: ' + e.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    loadSelectedFile(selected);
  };

  const loadSelectedFile = (selected: File) => {
    setError(null);
    setIsParsing(true);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        processWorkbook(workbook, selected.name);
      } catch (err: unknown) {
        const e = err as Error;
        setError('Failed to parse file: ' + e.message);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from disk.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      const ext = dropped.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        loadSelectedFile(dropped);
      } else {
        setError('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      }
    }
  };

  // Compile parsed rows preview
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const parsedRows: ParsedRowPreview[] = rawRows.map((row, idx) => {
    const name = nameCol ? String(row[nameCol] ?? '').trim() : '';
    const email = emailCol ? String(row[emailCol] ?? '').trim().toLowerCase() : '';
    const website = websiteCol ? String(row[websiteCol] ?? '').trim() : '';
    const industry = industryCol ? String(row[industryCol] ?? '').trim() : '';
    const description = descCol ? String(row[descCol] ?? '').trim() : '';

    let isValid = true;
    let errorReason = '';

    if (!name) {
      isValid = false;
      errorReason = 'Missing Company Name';
    } else if (!email) {
      isValid = false;
      errorReason = 'Missing Email';
    } else if (!emailRegex.test(email)) {
      isValid = false;
      errorReason = 'Invalid Email format';
    }

    return {
      index: idx + 1,
      name,
      email,
      website,
      industry,
      description,
      isValid,
      errorReason
    };
  });

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  // Submit bulk import
  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      setError('No valid companies to import. Please check your column mappings.');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const payload: CreateCompanyRequest[] = validRows.map(r => ({
        name: r.name,
        email: r.email,
        website: r.website || '',
        industry: r.industry || 'recruitment',
        description: r.description || ''
      }));

      const res = await fetch('/api/companies/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: payload })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete import.');
      }

      setImportResult({
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
        existingCount: data.existingCount || 0
      });

      onSuccess(data.importedCount);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error occurred while saving companies.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Import Companies from Excel</h3>
              <p className="text-xs text-slate-500">
                Upload a spreadsheet (.xlsx, .xls, or .csv) to batch import target companies and emails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer font-medium"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success Result View */}
        {importResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">Import Finished Successfully!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                <span className="font-semibold text-emerald-700">{importResult.importedCount} new companies</span> were added to the directory and are now available for employee outreach.
              </p>
              {importResult.skippedCount > 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  ({importResult.skippedCount} rows skipped because they already existed or had invalid formatting)
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                Close &amp; View Directory Cards
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-4">
            {/* File Dropzone / Picker */}
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto mb-3 text-slate-600">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag &amp; drop your Excel file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) spreadsheets
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] text-slate-600 font-medium mt-4 shadow-2xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Requires Company Name &amp; Email columns</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File info bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-xs">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB &bull; {rawRows.length} rows found
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sheetNames.length > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span>Sheet:</span>
                        <select
                          value={selectedSheet}
                          onChange={(e) => {
                            const newSheet = e.target.value;
                            setSelectedSheet(newSheet);
                            // re-read file
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const d = new Uint8Array(evt.target?.result as ArrayBuffer);
                              const wb = XLSX.read(d, { type: 'array' });
                              parseSheet(wb, newSheet);
                            };
                            reader.readAsArrayBuffer(file);
                          }}
                          className="bg-white border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none"
                        >
                          {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={resetAll}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>
                </div>

                {/* Column Mapping Section */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Column Mapping</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Match your spreadsheet headers)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Auto-detected from sheet
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Company Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={nameCol}
                        onChange={(e) => setNameCol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={emailCol}
                        onChange={(e) => setEmailCol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Website URL <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={websiteCol}
                        onChange={(e) => setWebsiteCol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Industry */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Industry / Sector <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={industryCol}
                        onChange={(e) => setIndustryCol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- None (Default: recruitment) --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Notes / Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={descCol}
                        onChange={(e) => setDescCol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation & Preview Summary Stats */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      Total in Sheet: <strong className="text-slate-900">{parsedRows.length}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready to Import: <strong>{validRows.length}</strong>
                    </span>
                    {invalidRows.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-100/60 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        Skipped (Invalid): <strong>{invalidRows.length}</strong>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Previewing top {Math.min(parsedRows.length, 6)} rows
                  </span>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-10">#</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Company Name</th>
                          <th className="py-2 px-3">Email Address</th>
                          <th className="py-2 px-3">Industry</th>
                          <th className="py-2 px-3">Website</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedRows.slice(0, 15).map((row) => (
                          <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">{row.index}</td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                  {row.errorReason}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {row.name || <span className="text-slate-300 italic">Empty</span>}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">
                              {row.email || <span className="text-slate-300 italic">Empty</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {row.industry || 'recruitment'}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                              {row.website || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isImporting}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || validRows.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing {validRows.length} Companies...</span>
                      </>
                    ) : (
                      <>
                        <span>Import {validRows.length} Companies</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
