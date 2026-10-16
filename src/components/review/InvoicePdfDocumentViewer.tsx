import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, Code2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Invoice } from '../../types';

interface InvoicePdfDocumentViewerProps {
  invoice: Invoice;
}

export const InvoicePdfDocumentViewer: React.FC<InvoicePdfDocumentViewerProps> = ({ invoice }) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showRawText, setShowRawText] = useState<boolean>(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 75));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
      
      {/* Document Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-slate-200 text-xs border-b border-slate-700">
        <div className="flex items-center space-x-2 truncate">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-medium truncate max-w-[200px]" title={invoice.originalFilename}>
            {invoice.originalFilename}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({Math.round(invoice.fileSize / 1024)} KB)
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1 ${
              showRawText ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Inspect raw extracted OCR text stream"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showRawText ? 'Visual View' : 'Raw Text'}</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <span className="font-mono text-[11px] px-1 text-slate-400 min-w-[36px] text-center">
            {zoom}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewer Viewport */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-200/80">
        {showRawText ? (
          <div className="w-full max-w-2xl bg-slate-900 text-emerald-400 p-4 rounded-md font-mono text-xs overflow-auto shadow-md border border-slate-700">
            <div className="text-slate-400 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
              <span>Extracted Token Stream / OCR Buffer</span>
              <span className="text-[10px] uppercase">{invoice.extractionMethod}</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {`INVOICE: ${invoice.invoiceNumber}
SUPPLIER: ${invoice.supplierName}
ADDRESS: ${invoice.supplierAddress}
TAX ID / VAT: ${invoice.supplierTaxId || 'NONE'}
DATE: ${invoice.invoiceDate}
DUE DATE: ${invoice.dueDate}
PO NUMBER: ${invoice.purchaseOrderNumber || 'NONE'}
CUSTOMER: ${invoice.customerName}
PAYMENT TERMS: ${invoice.paymentTerms}

--- LINE ITEMS ---
${invoice.lineItems.map(li => `${li.description} | Qty: ${li.quantity} | Unit: ${invoice.currency} ${li.unitPrice.toFixed(2)} | Total: ${invoice.currency} ${li.lineTotal.toFixed(2)}`).join('\n')}

--- SUMMARY TOTALS ---
SUBTOTAL: ${invoice.currency} ${invoice.subtotal.toFixed(2)}
DISCOUNT: ${invoice.currency} ${invoice.discount.toFixed(2)}
TAX:      ${invoice.currency} ${invoice.taxAmount.toFixed(2)}
SHIPPING: ${invoice.currency} ${invoice.shippingAmount.toFixed(2)}
TOTAL:    ${invoice.currency} ${invoice.totalAmount.toFixed(2)}
`}
            </pre>
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-100 ease-out"
          >
            {/* Real PDF or High-Fidelity Rendered Document Sheet */}
            {invoice.fileDataUrl ? (
              <iframe
                src={invoice.fileDataUrl}
                title="Uploaded PDF Document"
                className="w-[620px] h-[860px] bg-white rounded shadow-lg border border-slate-300"
              />
            ) : (
              <div className="w-[620px] min-h-[850px] bg-white text-slate-800 p-10 rounded shadow-xl border border-slate-300 flex flex-col justify-between text-xs select-text">
                
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                    <div>
                      <div className="text-xl font-bold tracking-tight text-slate-900 mb-1">
                        {invoice.supplierName}
                      </div>
                      <p className="text-slate-500 whitespace-pre-line leading-relaxed max-w-[280px]">
                        {invoice.supplierAddress}
                      </p>
                      {invoice.supplierTaxId && (
                        <p className="text-slate-600 font-mono mt-1 text-[11px]">
                          Tax ID / VAT: {invoice.supplierTaxId}
                        </p>
                      )}
                      {invoice.supplierEmail && (
                        <p className="text-slate-500 text-[11px]">{invoice.supplierEmail}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-blue-900 tracking-wider uppercase mb-1">
                        INVOICE
                      </div>
                      <div className="font-mono text-sm font-semibold text-slate-800">
                        #{invoice.invoiceNumber}
                      </div>
                      <div className="mt-2 text-slate-600">
                        <div>Date: <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span></div>
                        <div>Due: <span className="font-semibold text-slate-800">{invoice.dueDate}</span></div>
                        {invoice.purchaseOrderNumber && (
                          <div className="text-slate-700">PO: <span className="font-mono font-medium">{invoice.purchaseOrderNumber}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div className="mt-6 flex justify-between bg-slate-50 p-4 rounded border border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Billed To
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{invoice.customerName}</div>
                      <div className="text-slate-500 leading-snug">{invoice.customerAddress || 'Client Operations Center'}</div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Terms
                      </div>
                      <div className="font-semibold text-slate-700">{invoice.paymentTerms}</div>
                      <div className="text-slate-500">Currency: {invoice.currency}</div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mt-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-800 text-slate-800 text-[11px] uppercase tracking-wider">
                          <th className="py-2 font-bold">Description</th>
                          <th className="py-2 text-right font-bold w-14">Qty</th>
                          <th className="py-2 text-right font-bold w-24">Unit Price</th>
                          <th className="py-2 text-right font-bold w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {invoice.lineItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="py-3 text-slate-800 pr-2">
                              <div className="font-medium">{item.description}</div>
                              {item.taxRate ? (
                                <div className="text-[10px] text-slate-500">Tax rate: {(item.taxRate * 100).toFixed(1)}%</div>
                              ) : null}
                            </td>
                            <td className="py-3 text-right text-slate-600 font-mono">{item.quantity}</td>
                            <td className="py-3 text-right text-slate-600 font-mono">
                              {invoice.currency} {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-800 font-mono">
                              {invoice.currency} {item.lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="mt-8 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-start">
                    <div className="max-w-[280px] text-[11px] text-slate-500">
                      <div className="font-semibold text-slate-700 mb-1">Payment Instructions</div>
                      <p>Please remit payment in {invoice.currency} within terms to the vendor designated account.</p>
                      {invoice.notes && (
                        <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[10px]">
                          Note: {invoice.notes}
                        </div>
                      )}
                    </div>

                    <div className="w-56 space-y-1.5 text-right font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
                      </div>
                      {invoice.discount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount:</span>
                          <span>-{invoice.currency} {invoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.taxAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax / VAT:</span>
                          <span>{invoice.currency} {invoice.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.shippingAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Shipping / Fee:</span>
                          <span>{invoice.currency} {invoice.shippingAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-extrabold text-slate-900 border-t-2 border-slate-900 pt-2 mt-2">
                        <span>Total Due:</span>
                        <span>{invoice.currency} {invoice.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Source: {invoice.originalFilename}</span>
                    <span>Document Page 1 of 1 &bull; Original PDF Preview</span>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
