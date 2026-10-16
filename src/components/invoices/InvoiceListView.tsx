import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Eye, 
  Plus,
  ArrowUpDown,
  MoreVertical,
  CheckSquare,
  Square
} from 'lucide-react';
import { Invoice } from '../../types';
import { ExportService } from '../../services/exportService';

interface InvoiceListViewProps {
  invoices: Invoice[];
  onSelectInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onNavigateToUpload: () => void;
  initialFilter?: string;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onNavigateToUpload,
  initialFilter = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'date' | 'total' | 'vendor'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(i => i.id));
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    // Status filter
    if (statusFilter === 'awaiting_review' && inv.reviewStatus !== 'awaiting_review') return false;
    if (statusFilter === 'reviewed' && inv.reviewStatus !== 'reviewed') return false;
    if (statusFilter === 'error' && inv.validationResult.status !== 'error') return false;
    if (statusFilter === 'warnings' && inv.validationResult.status !== 'warnings') return false;
    if (statusFilter === 'validated' && inv.validationResult.status !== 'validated') return false;

    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const inVendor = inv.supplierName.toLowerCase().includes(s);
      const inNumber = inv.invoiceNumber.toLowerCase().includes(s);
      const inPo = (inv.purchaseOrderNumber || '').toLowerCase().includes(s);
      return inVendor || inNumber || inPo;
    }
    return true;
  }).sort((a, b) => {
    if (sortField === 'date') {
      const cmp = (a.invoiceDate || '').localeCompare(b.invoiceDate || '');
      return sortAsc ? cmp : -cmp;
    }
    if (sortField === 'total') {
      return sortAsc ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
    }
    if (sortField === 'vendor') {
      const cmp = a.supplierName.localeCompare(b.supplierName);
      return sortAsc ? cmp : -cmp;
    }
    return 0;
  });

  const handleExportSelected = () => {
    const toExport = invoices.filter(i => selectedIds.includes(i.id));
    if (toExport.length === 0) return;
    ExportService.exportInvoicesToCsv(toExport, 'selected_invoices');
  };

  const handleBatchDelete = () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoices?`)) return;
    selectedIds.forEach(id => onDeleteInvoice(id));
    setSelectedIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Extracted Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {invoices.length} active invoices in your isolated account database.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {invoices.length > 0 && (
            <>
              <button
                onClick={() => ExportService.exportInvoicesToCsv(invoices, 'all_invoices')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center space-x-1.5"
                title="Export all invoices to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => ExportService.exportDetailedInvoicesWithLineItemsToCsv(invoices)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors hidden md:flex items-center space-x-1.5"
                title="Export with itemized line items"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Line Items CSV</span>
              </button>
            </>
          )}

          <button
            onClick={onNavigateToUpload}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Control Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by vendor, invoice #, PO #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">All Invoices ({invoices.length})</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="reviewed">Reviewed & Ready</option>
            <option value="error">Validation Errors</option>
            <option value="warnings">Warnings</option>
            <option value="validated">Fully Validated</option>
          </select>
        </div>

        {/* Selected batch actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2 text-xs bg-blue-50 px-3 py-1 rounded border border-blue-200">
            <span className="font-semibold text-blue-900">{selectedIds.length} selected</span>
            <button
              onClick={handleExportSelected}
              className="text-blue-700 hover:underline font-medium"
            >
              Export
            </button>
            <span className="text-blue-300">&bull;</span>
            <button
              onClick={handleBatchDelete}
              className="text-rose-600 hover:underline font-medium"
            >
              Delete
            </button>
          </div>
        )}

      </div>

      {/* Main Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No invoices match your filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or upload new PDF invoices to begin.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="mt-4 px-3.5 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Upload Invoices
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                      {selectedIds.length === filteredInvoices.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button 
                      onClick={() => { setSortField('vendor'); setSortAsc(!sortAsc); }} 
                      className="flex items-center space-x-1 hover:text-slate-900"
                    >
                      <span>Supplier / Vendor</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">
                    <button 
                      onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }} 
                      className="flex items-center space-x-1 hover:text-slate-900"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3">PO Number</th>
                  <th className="py-3 px-3 text-right">
                    <button 
                      onClick={() => { setSortField('total'); setSortAsc(!sortAsc); }} 
                      className="flex items-center space-x-1 ml-auto hover:text-slate-900"
                    >
                      <span>Total Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 text-center">Validation</th>
                  <th className="py-3 px-3 text-center">Review</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map(inv => {
                  const isSelected = selectedIds.includes(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => toggleSelect(inv.id)} className="text-slate-400 hover:text-slate-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors"
                        >
                          {inv.supplierName}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.originalFilename}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        #{inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {inv.invoiceDate}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500">
                        {inv.purchaseOrderNumber || '-'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {inv.currency} {inv.totalAmount.toFixed(2)}
                      </td>

                      {/* Validation Status Indicator */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          inv.validationResult.status === 'validated'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.validationResult.status === 'warnings'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {inv.validationResult.status === 'validated' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          ) : inv.validationResult.status === 'warnings' ? (
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                          ) : (
                            <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
                          )}
                          {inv.validationResult.status}
                        </span>
                      </td>

                      {/* Review Status Indicator */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.reviewStatus === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.reviewStatus === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded transition-colors"
                            title="Open Review Workspace"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
