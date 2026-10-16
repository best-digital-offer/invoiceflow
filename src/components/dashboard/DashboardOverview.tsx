import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  UploadCloud, 
  GitCompare, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Invoice } from '../../types';
import { ExportService } from '../../services/exportService';

interface DashboardOverviewProps {
  invoices: Invoice[];
  onNavigate: (view: string) => void;
  onSelectInvoice: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  invoices,
  onNavigate,
  onSelectInvoice,
}) => {
  // Real database metrics (Requirement #5: All calculated from actual records)
  const totalCount = invoices.length;
  const awaitingReviewCount = invoices.filter(i => i.reviewStatus === 'awaiting_review').length;
  const validatedCount = invoices.filter(i => i.validationResult.status === 'validated').length;
  const errorCount = invoices.filter(i => i.validationResult.status === 'error').length;
  const warningsCount = invoices.filter(i => i.validationResult.status === 'warnings').length;

  // Total invoice value
  const totalVolume = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Recent 5 invoices sorted by date descending
  const recentInvoices = [...invoices].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Accounts Payable Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification metrics and recent extraction activity.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('reconciliation')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <GitCompare className="w-3.5 h-3.5 text-blue-600" />
            <span>Reconcile Spreadsheet</span>
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Invoices</span>
          </button>
        </div>
      </div>

      {/* 4 Core Real Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Processed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoices
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center">
            <span>Cumulative value:</span>
            <span className="font-mono font-bold text-slate-800 ml-1">
              ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Awaiting Review */}
        <div 
          onClick={() => onNavigate('invoices?filter=awaiting_review')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Awaiting Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-2 font-mono">
            {awaitingReviewCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
            <span>Requires human sign-off</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 3: Successfully Validated */}
        <div 
          onClick={() => onNavigate('invoices?filter=validated')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Validated & Clean
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-2 font-mono">
            {validatedCount}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
            <span>Zero formula discrepancies</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Card 4: Discrepancies / Errors */}
        <div 
          onClick={() => onNavigate('invoices?filter=error')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Discrepancies / Incomplete
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-900 mt-2 font-mono">
            {errorCount}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 flex items-center justify-between">
            <span>{errorCount > 0 ? 'Math sum imbalance detected' : 'No critical math errors'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

      </div>

      {/* Discrepancy Alert Banner if errors exist */}
      {errorCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Attention Required:</span> {errorCount} invoice(s) have mathematical balance discrepancies between line items, taxes, and stated total.
            </div>
          </div>
          <button
            onClick={() => onNavigate('invoices?filter=error')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs transition-colors shrink-0 ml-3"
          >
            Review Discrepancies
          </button>
        </div>
      )}

      {/* Recent Invoice Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Invoice Activity
            </h3>
            <p className="text-xs text-slate-500">
              Latest invoices processed through the deterministic extraction pipeline.
            </p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All ({invoices.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No invoices processed yet. Click &quot;Upload Invoices&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-700 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Validation</th>
                  <th className="py-2.5 px-3 text-center">Review Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.supplierName}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {inv.currency} {inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.validationResult.status === 'validated'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : inv.validationResult.status === 'warnings'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {inv.validationResult.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        inv.reviewStatus === 'reviewed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.reviewStatus === 'reviewed' ? 'Reviewed' : 'Awaiting'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        
        {/* Workflow 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Spreadsheet Reconciliation</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload your bank feed or ERP accounting ledger (CSV) to automatically match against your {invoices.length} extracted invoices with transparent variance calculations.
            </p>
            <button
              onClick={() => onNavigate('reconciliation')}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Launch Reconciliation Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workflow 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Export Spreadsheet-Ready Data</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all {invoices.length} invoices into clean, UTF-8 formatted CSV or Excel-compatible sheets with validated subtotal, tax, and line-item breakdowns.
            </p>
            <button
              onClick={() => ExportService.exportInvoicesToCsv(invoices, 'invoiceflow_export')}
              className="mt-3 text-xs font-semibold text-emerald-700 hover:underline flex items-center space-x-1"
            >
              <span>Download Invoices CSV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
