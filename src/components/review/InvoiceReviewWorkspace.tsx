import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ArrowLeft, 
  Calculator,
  Download,
  Info,
  Calendar,
  Building,
  Hash
} from 'lucide-react';
import { Currency, Invoice, InvoiceLineItem, InvoiceStatus } from '../../types';
import { InvoicePdfDocumentViewer } from './InvoicePdfDocumentViewer';
import { DeterministicValidationEngine } from '../../services/validationEngine';
import { ExportService } from '../../services/exportService';

interface InvoiceReviewWorkspaceProps {
  currentInvoice: Invoice;
  allInvoices: Invoice[];
  onSave: (updated: Invoice) => void;
  onSelectInvoice: (id: string) => void;
  onBackToList: () => void;
  roundingTolerance?: number;
}

export const InvoiceReviewWorkspace: React.FC<InvoiceReviewWorkspaceProps> = ({
  currentInvoice,
  allInvoices,
  onSave,
  onSelectInvoice,
  onBackToList,
  roundingTolerance = 0.02,
}) => {
  const [formData, setFormData] = useState<Invoice>(currentInvoice);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync state when current invoice changes
  useEffect(() => {
    setFormData(currentInvoice);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice(null);
  }, [currentInvoice.id]);

  // Compute live validation result as the user edits fields
  const liveValidation = DeterministicValidationEngine.validate(formData, {
    roundingTolerance,
    existingInvoices: allInvoices,
    currentInvoiceId: formData.id,
  });

  // Batch navigation index
  const currentIndex = allInvoices.findIndex(inv => inv.id === formData.id);
  const totalCount = allInvoices.length;

  const handleFieldChange = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleNumberFieldChange = (field: 'subtotal' | 'discount' | 'taxAmount' | 'shippingAmount' | 'totalAmount', raw: string) => {
    const val = parseFloat(raw);
    handleFieldChange(field, isNaN(val) ? 0 : val);
  };

  // Line item modifications
  const handleLineItemChange = (index: number, updates: Partial<InvoiceLineItem>) => {
    const nextLines = [...formData.lineItems];
    const target = { ...nextLines[index], ...updates };

    // Auto-calculate line total if qty or price changed and lineTotal not explicitly overridden
    if ('quantity' in updates || 'unitPrice' in updates) {
      target.lineTotal = Math.round((target.quantity * target.unitPrice) * 100) / 100;
    }

    nextLines[index] = target;
    setFormData(prev => ({
      ...prev,
      lineItems: nextLines,
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddLineItem = () => {
    const newLine: InvoiceLineItem = {
      id: `li_${Date.now()}_${formData.lineItems.length + 1}`,
      invoiceId: formData.id,
      description: 'New Item Description',
      quantity: 1,
      unitPrice: 0,
      taxAmount: 0,
      lineTotal: 0,
    };
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newLine],
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveLineItem = (index: number) => {
    const nextLines = formData.lineItems.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      lineItems: nextLines,
    }));
    setHasUnsavedChanges(true);
  };

  // Helper: auto-calculate subtotal and total based on line items & charges
  const handleAutoBalance = () => {
    const calculatedSubtotal = Math.round(
      formData.lineItems.reduce((acc, curr) => acc + (curr.lineTotal || 0), 0) * 100
    ) / 100;
    
    const calculatedTotal = Math.round(
      (calculatedSubtotal - formData.discount + formData.taxAmount + formData.shippingAmount) * 100
    ) / 100;

    setFormData(prev => ({
      ...prev,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedTotal,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const toSave: Invoice = {
      ...formData,
      validationResult: liveValidation,
      updatedAt: new Date().toISOString(),
    };
    onSave(toSave);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice('Changes saved locally and queued for cloud sync.');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleMarkAsReviewed = () => {
    const toSave: Invoice = {
      ...formData,
      reviewStatus: 'reviewed',
      validationResult: liveValidation,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(toSave);
    setFormData(toSave);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice('Invoice marked as Reviewed. Changes are saved locally and queued for cloud sync.');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleReprocess = () => {
    // Re-runs deterministic extraction on current source text/data
    const revalidated = DeterministicValidationEngine.validate(formData, {
      roundingTolerance,
      existingInvoices: allInvoices,
      currentInvoiceId: formData.id,
    });
    setFormData(prev => ({
      ...prev,
      validationResult: revalidated,
    }));
    setSaveSuccessNotice('Reprocessed extraction rules and deterministic formulas.');
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Top Action Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToList}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Invoices List
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">
                {formData.supplierName || 'Unknown Vendor'}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                #{formData.invoiceNumber || 'NO-NUMBER'}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                formData.reviewStatus === 'reviewed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.reviewStatus === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Source: <span className="font-medium text-slate-600">{formData.originalFilename}</span> &bull; Extracted via <span className="font-mono">{formData.extractionMethod}</span>
            </div>
          </div>
        </div>

        {/* Batch Stepper & Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Batch Stepper */}
          {totalCount > 1 && currentIndex >= 0 && (
            <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600 mr-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => onSelectInvoice(allInvoices[currentIndex - 1].id)}
                className="p-1 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Previous invoice"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                {currentIndex + 1} of {totalCount}
              </span>
              <button
                disabled={currentIndex === totalCount - 1}
                onClick={() => onSelectInvoice(allInvoices[currentIndex + 1].id)}
                className="p-1 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Next invoice"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleReprocess}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center space-x-1"
            title="Reprocess validation checks"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reprocess</span>
          </button>

          <button
            onClick={() => ExportService.exportInvoicesToCsv([formData], `invoice_${formData.invoiceNumber}`)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center space-x-1"
            title="Export this invoice to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <button
            onClick={handleMarkAsReviewed}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Mark as Reviewed</span>
          </button>
        </div>
      </div>

      {/* Unsaved / Success Alerts */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Pane: Invoice PDF Preview (5 cols) */}
        <div className="lg:col-span-5 h-full p-3 overflow-hidden border-r border-slate-200 flex flex-col">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Original Document Preview</span>
            <span className="text-[11px] font-mono text-slate-400">PDF / Image Canvas</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <InvoicePdfDocumentViewer invoice={formData} />
          </div>
        </div>

        {/* Right Pane: Editable Fields & Line-Item Table (7 cols) */}
        <div className="lg:col-span-7 h-full overflow-y-auto p-4 space-y-5 bg-white">
          
          {/* Validation Status & Discrepancies Alert Box */}
          <div className={`p-4 rounded-lg border text-xs ${
            liveValidation.status === 'validated'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : liveValidation.status === 'warnings'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                {liveValidation.status === 'validated' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : liveValidation.status === 'warnings' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {liveValidation.status === 'validated' && 'All Deterministic Checks Passed'}
                    {liveValidation.status === 'warnings' && 'Deterministic Warnings Detected'}
                    {liveValidation.status === 'error' && 'Mathematical or Validation Discrepancy'}
                  </h4>
                  <p className="mt-0.5 text-slate-600">
                    Calculated Subtotal: <span className="font-mono font-semibold">{formData.currency} {liveValidation.calculatedSubtotal.toFixed(2)}</span> &bull; 
                    Expected Total: <span className="font-mono font-semibold">{formData.currency} {liveValidation.calculatedExpectedTotal.toFixed(2)}</span> &bull; 
                    Reported Total: <span className="font-mono font-semibold">{formData.currency} {Number(formData.totalAmount).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Quick Math Balance Helper */}
              {liveValidation.status === 'error' && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center space-x-1 shrink-0 ml-3 shadow-xs"
                  title="Recalculate subtotal and total based on line items"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Auto-Balance</span>
                </button>
              )}
            </div>

            {/* List of specific violations */}
            {liveValidation.violations.length > 0 && (
              <ul className="mt-3 space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                {liveValidation.violations.map((violation, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      violation.severity === 'error' ? 'bg-rose-600' : 'bg-amber-600'
                    }`} />
                    <span className="leading-snug">
                      <span className="font-semibold uppercase tracking-wider text-[10px] mr-1 opacity-75">
                        [{violation.code}]
                      </span>
                      {violation.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 1: Supplier / Vendor Information */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
              <Building className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Supplier / Vendor Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Supplier / Vendor Name *
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={e => handleFieldChange('supplierName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium bg-white"
                  placeholder="e.g. Acme Cloud Technologies Inc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">
                  Supplier Address
                </label>
                <input
                  type="text"
                  value={formData.supplierAddress}
                  onChange={e => handleFieldChange('supplierAddress', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="Street, City, Postal Code, Country"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Supplier Tax ID / VAT / EIN
                </label>
                <input
                  type="text"
                  value={formData.supplierTaxId}
                  onChange={e => handleFieldChange('supplierTaxId', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                  placeholder="e.g. US-EIN-84-2910394"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Supplier Contact Email
                </label>
                <input
                  type="text"
                  value={formData.supplierEmail || ''}
                  onChange={e => handleFieldChange('supplierEmail', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="billing@supplier.com"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Invoice Metadata & Dates */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Invoice Metadata & Accounting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={e => handleFieldChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold bg-white"
                  placeholder="INV-00123"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={e => handleFieldChange('invoiceDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => handleFieldChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  value={formData.purchaseOrderNumber}
                  onChange={e => handleFieldChange('purchaseOrderNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                  placeholder="PO-99410"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Customer / Bill-to
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={e => handleFieldChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="Client / Organization"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={e => handleFieldChange('paymentTerms', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="Net 30, Due Upon Receipt"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Line Items Table */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Itemized Line Items ({formData.lineItems.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Edit descriptions, quantities, and unit rates. Line totals update automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-2 w-16 text-right">Qty</th>
                    <th className="py-2 px-2 w-28 text-right">Unit Price</th>
                    <th className="py-2 px-2 w-20 text-right">Tax</th>
                    <th className="py-2 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {formData.lineItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-sans">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleLineItemChange(idx, { description: e.target.value })}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 text-xs text-right rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => handleLineItemChange(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 text-xs text-right rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.taxAmount || 0}
                          onChange={e => handleLineItemChange(idx, { taxAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 text-xs text-right rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.lineTotal}
                          onChange={e => handleLineItemChange(idx, { lineTotal: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs text-right rounded border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-2 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Financial Summary & Verification */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Financial Totals & Currency
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={e => handleFieldChange('currency', e.target.value as Currency)}
                  className="w-full px-2.5 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CHF">CHF (Fr)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Subtotal
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={e => handleNumberFieldChange('subtotal', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={e => handleNumberFieldChange('discount', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Tax / VAT
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxAmount}
                  onChange={e => handleNumberFieldChange('taxAmount', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Shipping / Surcharge
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shippingAmount}
                  onChange={e => handleNumberFieldChange('shippingAmount', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-900 font-bold mb-1">
                  Grand Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={e => handleNumberFieldChange('totalAmount', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border-2 border-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-extrabold text-slate-950 bg-white"
                />
              </div>
            </div>

            {/* Auditor notes */}
            <div className="mt-3">
              <label className="block text-slate-600 font-semibold mb-1 text-xs">
                Auditor / Accounting Notes (Optional)
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={e => handleFieldChange('notes', e.target.value)}
                placeholder="e.g. Approved with discount variance per supplier agreement"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
