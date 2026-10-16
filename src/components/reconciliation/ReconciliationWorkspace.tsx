import React, { useState } from 'react';
import { 
  GitCompare, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Invoice, ReconciliationMatchStatus, ReconciliationRowComparison, ReconciliationRun, SpreadsheetColumnMapping } from '../../types';
import { ReconciliationEngine } from '../../services/reconciliationEngine';
import { ExportService } from '../../services/exportService';
import { storageService } from '../../services/storage';

interface ReconciliationWorkspaceProps {
  invoices: Invoice[];
  onNavigateToInvoice: (id: string) => void;
}

export const ReconciliationWorkspace: React.FC<ReconciliationWorkspaceProps> = ({
  invoices,
  onNavigateToInvoice,
}) => {
  // Step 1: Upload or paste CSV
  // Step 2: Column mapping
  // Step 3: Interactive Reconciliation Side-by-Side Table
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [spreadsheetName, setSpreadsheetName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<SpreadsheetColumnMapping>({
    invoiceNumberCol: '',
    supplierCol: '',
    dateCol: '',
    amountCol: '',
  });

  const [activeRun, setActiveRun] = useState<ReconciliationRun | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle file upload
  const handleFile = (file: File) => {
    setSpreadsheetName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCsvText(text);
      processCsvData(text, file.name);
    };
    reader.readAsText(file);
  };

  const processCsvData = (text: string, name: string) => {
    try {
      const { headers: detectedHeaders, rows } = ReconciliationEngine.parseSpreadsheetData(text);
      if (detectedHeaders.length === 0 || rows.length === 0) {
        alert('Could not parse any rows from this CSV spreadsheet. Please check format.');
        return;
      }
      setHeaders(detectedHeaders);
      setParsedRows(rows);
      const autoMap = ReconciliationEngine.autoDetectColumnMapping(detectedHeaders);
      setColumnMapping(autoMap);
      setSpreadsheetName(name);
      setStep('mapping');
    } catch (e) {
      alert('Error parsing spreadsheet: ' + String(e));
    }
  };

  const handleLoadSampleLedger = () => {
    const sample = ReconciliationEngine.getSampleReconciliationCsv();
    setRawCsvText(sample);
    processCsvData(sample, 'ERP_Q3_Accounts_Payable_Ledger.csv');
  };

  const handleRunReconciliation = () => {
    const user = storageService.getCurrentUser();
    if (!user) return;

    const run = ReconciliationEngine.reconcile(
      spreadsheetName || 'Accounting_Ledger.csv',
      parsedRows,
      columnMapping,
      invoices,
      user.id
    );

    setActiveRun(run);
    storageService.saveReconciliation(run);
    setStep('results');
  };

  const handleConfirmMatch = (rowId: string) => {
    if (!activeRun) return;
    const nextComparisons = activeRun.comparisons.map(c => {
      if (c.id === rowId) {
        return { ...c, userConfirmed: true, userRejected: false };
      }
      return c;
    });
    const updated = { ...activeRun, comparisons: nextComparisons };
    setActiveRun(updated);
    storageService.saveReconciliation(updated);
  };

  const handleRejectMatch = (rowId: string) => {
    if (!activeRun) return;
    const nextComparisons = activeRun.comparisons.map(c => {
      if (c.id === rowId) {
        return { ...c, userConfirmed: false, userRejected: true };
      }
      return c;
    });
    const updated = { ...activeRun, comparisons: nextComparisons };
    setActiveRun(updated);
    storageService.saveReconciliation(updated);
  };

  const filteredComparisons = (activeRun?.comparisons || []).filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const inSpreadsheet = c.spreadsheetInvoiceNumber.toLowerCase().includes(s) || c.spreadsheetSupplier.toLowerCase().includes(s);
      const inInvoice = c.matchedInvoice?.invoiceNumber.toLowerCase().includes(s) || c.matchedInvoice?.supplierName.toLowerCase().includes(s);
      return inSpreadsheet || inInvoice;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <GitCompare className="w-5 h-5 mr-2 text-blue-600" />
            Spreadsheet Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare ERP / accounting ledger CSV records against extracted invoices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {step === 'results' && activeRun && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Spreadsheet</span>
              </button>

              <button
                onClick={() => ExportService.exportReconciliationReportToCsv(activeRun)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </>
          )}

          {step === 'upload' && (
            <button
              onClick={handleLoadSampleLedger}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Sample Accounting Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 text-center hover:border-slate-400 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Upload Accounting Spreadsheet (CSV)
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Export records from QuickBooks, Xero, NetSuite, SAP, or Excel and drop here to reconcile against your {invoices.length} extracted invoices.
            </p>

            <div className="mt-5">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer transition-colors inline-block">
                Choose CSV File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => e.target.files && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Explanation of matching methodology */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Exact Match (100%)</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Matches identical invoice numbers and amounts within 2 cents tolerance. Automatically verified.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-700 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Amount Mismatch</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Invoice number is identified in ledger, but amounts differ (e.g. unrecorded taxes, shipping fees, or deductions).
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-700 font-bold">
                <XCircle className="w-4 h-4" />
                <span>Missing Records</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Identifies payments in ledger without corresponding PDF invoices, or invoices uploaded that are missing from the ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Map Spreadsheet Columns: {spreadsheetName}
              </h3>
              <p className="text-xs text-slate-500">
                Found {parsedRows.length} rows and {headers.length} columns. Confirm the mapped fields below.
              </p>
            </div>
            <button
              onClick={() => setStep('upload')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Number Column *
              </label>
              <select
                value={columnMapping.invoiceNumberCol}
                onChange={e => setColumnMapping(prev => ({ ...prev, invoiceNumberCol: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-slate-300 font-medium"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supplier / Vendor Column *
              </label>
              <select
                value={columnMapping.supplierCol}
                onChange={e => setColumnMapping(prev => ({ ...prev, supplierCol: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-slate-300 font-medium"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Date Column *
              </label>
              <select
                value={columnMapping.dateCol}
                onChange={e => setColumnMapping(prev => ({ ...prev, dateCol: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-slate-300 font-medium"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Amount Column *
              </label>
              <select
                value={columnMapping.amountCol}
                onChange={e => setColumnMapping(prev => ({ ...prev, amountCol: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-slate-300 font-medium"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sample Preview of First 2 Rows */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Spreadsheet Preview (First 2 Rows)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded text-[11px] font-mono">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-sans font-semibold">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="p-2 border-r border-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 2).map((r, i) => (
                    <tr key={i}>
                      {headers.map(h => (
                        <td key={h} className="p-2 border-r border-slate-200 text-slate-600 truncate max-w-[150px]">
                          {r[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleRunReconciliation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>Execute Reconciliation Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Interactive Reconciliation Results Table */}
      {step === 'results' && activeRun && (
        <div className="space-y-4">
          
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Total Records</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {activeRun.comparisons.length}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30">
              <span className="text-emerald-700 font-semibold">Exact / Probable Matches</span>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">
                {activeRun.matchedCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-amber-200 bg-amber-50/30">
              <span className="text-amber-700 font-semibold">Amount Mismatches</span>
              <div className="text-lg font-bold text-amber-800 mt-0.5">
                {activeRun.discrepancyCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-rose-200 bg-rose-50/30">
              <span className="text-rose-700 font-semibold">Unmatched Records</span>
              <div className="text-lg font-bold text-rose-800 mt-0.5">
                {activeRun.unmatchedCount}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search vendor or invoice #..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium"
              >
                <option value="all">All Statuses ({activeRun.comparisons.length})</option>
                <option value="exact_match">Exact Matches</option>
                <option value="probable_match">Probable Matches</option>
                <option value="amount_mismatch">Amount Discrepancies</option>
                <option value="unmatched_spreadsheet">Unmatched Spreadsheet</option>
                <option value="unmatched_invoice">Unmatched Invoices in DB</option>
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-32">Match Status</th>
                    <th className="py-3 px-3">Spreadsheet Ledger Record</th>
                    <th className="py-3 px-3">InvoiceFlow Matched Invoice</th>
                    <th className="py-3 px-3 w-28 text-right">Variance</th>
                    <th className="py-3 px-3 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredComparisons.map(comp => (
                    <tr 
                      key={comp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        comp.userRejected ? 'opacity-40 bg-slate-50' : ''
                      }`}
                    >
                      {/* Status & Confidence Badge */}
                      <td className="py-3 px-3 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          comp.status === 'exact_match'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comp.status === 'probable_match'
                            ? 'bg-blue-100 text-blue-800'
                            : comp.status === 'amount_mismatch'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {comp.status.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] font-mono text-slate-500">
                          {comp.confidenceScore}% confidence
                        </div>
                      </td>

                      {/* Spreadsheet Ledger Details */}
                      <td className="py-3 px-3 align-top">
                        {comp.spreadsheetRowIndex > 0 ? (
                          <div>
                            <div className="font-semibold text-slate-900">
                              {comp.spreadsheetSupplier || '(No vendor specified)'}
                            </div>
                            <div className="text-slate-500 flex items-center space-x-2 font-mono text-[11px] mt-0.5">
                              <span>#{comp.spreadsheetInvoiceNumber || 'N/A'}</span>
                              <span>&bull;</span>
                              <span>{comp.spreadsheetDate || 'No date'}</span>
                            </div>
                            <div className="text-slate-900 font-mono font-bold mt-1">
                              ${comp.spreadsheetAmount.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No corresponding row in spreadsheet</span>
                        )}
                      </td>

                      {/* Matched Database Invoice Details */}
                      <td className="py-3 px-3 align-top">
                        {comp.matchedInvoice ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">
                                {comp.matchedInvoice.supplierName}
                              </span>
                              <button
                                onClick={() => onNavigateToInvoice(comp.matchedInvoice!.id)}
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                              >
                                View Doc &rarr;
                              </button>
                            </div>
                            <div className="text-slate-500 flex items-center space-x-2 font-mono text-[11px] mt-0.5">
                              <span>#{comp.matchedInvoice.invoiceNumber}</span>
                              <span>&bull;</span>
                              <span>{comp.matchedInvoice.invoiceDate}</span>
                            </div>
                            <div className="text-slate-900 font-mono font-bold mt-1">
                              {comp.matchedInvoice.currency} {comp.matchedInvoice.totalAmount.toFixed(2)}
                            </div>

                            {/* Audit notes / reason */}
                            <div className="text-[10px] text-slate-500 mt-1.5 leading-snug bg-slate-50 p-1.5 rounded">
                              {comp.matchReasons[0]}
                            </div>
                          </div>
                        ) : (
                          <div className="text-rose-600 text-xs italic">
                            Unmatched: No corresponding invoice in database
                          </div>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="py-3 px-3 align-top text-right font-mono font-bold">
                        {comp.amountVariance === 0 ? (
                          <span className="text-emerald-700">$0.00</span>
                        ) : (
                          <span className="text-rose-700">
                            {comp.amountVariance > 0 ? '+' : ''}${comp.amountVariance.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Actions: Confirm / Reject match */}
                      <td className="py-3 px-3 align-top text-center">
                        {comp.userConfirmed ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                            <Check className="w-3 h-3 mr-1" />
                            Confirmed
                          </span>
                        ) : comp.userRejected ? (
                          <span className="inline-flex items-center text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded">
                            Rejected
                          </span>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleConfirmMatch(comp.id)}
                              className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Confirm Match"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectMatch(comp.id)}
                              className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Reject Match"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
