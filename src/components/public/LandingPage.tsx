import React from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  FileCheck, 
  GitCompare, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Eye, 
  Cpu,
  Calculator,
  SlidersHorizontal,
  Table
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreDemo,
  onNavigate,
}) => {
  return (
    <div className="bg-white text-slate-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Tag */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Zero Compulsory AI API &bull; Deterministic Accounting Verification</span>
            </div>

            {/* Headline (Requirement #3) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Turn Invoices Into <span className="text-blue-600">Spreadsheet-Ready</span> Data.
            </h1>

            {/* Supporting text (Requirement #3) */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Extract key fields from text-based PDF invoices, verify invoice arithmetic, and reconcile records against your accounting spreadsheets.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
              >
                <span>Try It Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Explore Interactive Demo</span>
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center space-x-6 text-xs text-slate-500">
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                In-browser & open-source engine
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                Excel & CSV compatible
              </span>
            </div>

          </div>

          {/* Interactive Workspace Mockup Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-xl border border-slate-200 shadow-xl overflow-hidden bg-slate-900">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">InvoiceFlow Dual-Pane Review Workspace</span>
              </div>
              <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded font-mono text-[10px]">
                Deterministic Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 text-xs bg-slate-950 text-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* Document side */}
              <div className="md:col-span-5 p-5 bg-slate-900/70 space-y-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Original PDF Document Stream
                </div>
                <div className="bg-white text-slate-900 p-4 rounded shadow font-sans space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <div>
                      <div className="font-bold text-sm">Acme Cloud Technologies Inc.</div>
                      <div className="text-[10px] text-slate-500">550 Mission St, San Francisco, CA</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-blue-900 text-xs uppercase">INVOICE</div>
                      <div className="font-mono text-[10px] font-semibold">#INV-2024-8842</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Kubernetes Dedicated Node</span>
                      <span className="font-mono">$2,200.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>50TB SSD Storage Cluster</span>
                      <span className="font-mono">$1,100.00</span>
                    </div>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-bold text-slate-900">
                    <span>Total Due:</span>
                    <span className="font-mono">$4,023.75</span>
                  </div>
                </div>
              </div>

              {/* Extraction & Math Validation side */}
              <div className="md:col-span-7 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Extracted Fields & Mathematical Verification
                  </div>
                  <span className="inline-flex items-center text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Passed (Balance: $0.00 Diff)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">Vendor:</div>
                    <div className="text-white font-semibold">Acme Cloud Technologies Inc.</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">Invoice #:</div>
                    <div className="text-white font-semibold">INV-2024-8842</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">Subtotal - Disc + Tax:</div>
                    <div className="text-white font-semibold">$3,850 - $150 + $323.75</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-sans">Reported Grand Total:</div>
                    <div className="text-emerald-400 font-bold">$4,023.75 (Exact)</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Reconciliation Match: 100% against ERP Ledger</span>
                  <button
                    onClick={onExploreDemo}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs transition-colors"
                  >
                    Open Live Demo &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3-Step Workflow Section (Requirement #3) */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Streamlined Three-Step Workflow
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From Raw PDF to Clean Accounting Records
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Eliminate manual copy-pasting into spreadsheets while retaining complete human review and verification control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1: Upload */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Upload Invoices
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload text-based PDF invoices individually or in batches. InvoiceFlow extracts selectable text and applies deterministic field rules; scanned-PDF OCR is not enabled yet.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 flex items-center">
                <span>Multi-file batch queue</span>
              </div>
            </div>

            {/* Step 2: Review */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Review & Verify
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare the original PDF preview on one side against extracted fields on the other. Deterministic math rules check line items, tax rates, and subtotal balancing to catch supplier discrepancies.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 flex items-center">
                <span>Side-by-side verification</span>
              </div>
            </div>

            {/* Step 3: Export */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Export & Reconcile
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export clean, UTF-8 formatted CSV files directly for Excel, QuickBooks, or Xero. Or upload your existing accounting ledger to automatically reconcile payments with confidence scoring.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 flex items-center">
                <span>Spreadsheet reconciliation</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Review & Correct Feature Showcase (Requirement #3) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Human-in-the-Loop Verification
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Review and Correct Every Value Before Exporting
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated extraction should never be a black box. InvoiceFlow gives your finance team total edit control with full audit history before records enter your general ledger.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Live Mathematical Consistency Engine:</span>
                    <span className="text-slate-600 ml-1">
                      Instantly alerts you if subtotal minus discount plus tax does not balance to the printed total.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Editable Itemized Line-Items:</span>
                    <span className="text-slate-600 ml-1">
                      Add, delete, or modify descriptions, quantities, unit prices, and tax rates with auto-calculating rows.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">No Silent Field Invention:</span>
                    <span className="text-slate-600 ml-1">
                      If a PO number, Tax ID, or payment term is absent from the invoice, it remains blank rather than hallucinated.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onExploreDemo}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors inline-flex items-center space-x-1.5"
                >
                  <span>Test Review Workspace in Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Callout */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Validation Inspector
                </span>
                <span className="text-xs font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Total Mismatch Detected
                </span>
              </div>

              <div className="bg-white p-3.5 rounded border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-semibold text-slate-800">$1,250.00</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Discount:</span>
                  <span className="text-emerald-700">-$50.00</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Tax + Shipping:</span>
                  <span className="font-semibold text-slate-800">+$141.00</span>
                </div>
                <div className="flex justify-between font-mono pt-1.5 border-t border-slate-200 font-bold">
                  <span className="text-slate-900">Calculated Expected Total:</span>
                  <span className="text-blue-700">$1,341.00</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-rose-700">
                  <span>Supplier Printed Total:</span>
                  <span>$1,395.00 (+$54.00 Discrepancy)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                InvoiceFlow catches vendor billing overages and formula mistakes before your company pays them.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Grid (Requirement #3) */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Capabilities Built for Finance & Accounting
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise AP Features Without LLM Token Costs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">PDF Invoice Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts supplier name, address, tax IDs, invoice number, issue date, due date, PO number, currency, and line items.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Selectable PDF Text Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts embedded text from digital PDFs. Image-only and scanned documents need OCR, which is not enabled yet.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Deterministic Total Validation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates subtotal balance, checks for negative charges, validates date sequences, and flags potential duplicate invoices.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Batch Processing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload multiple invoices in one batch. Individual parse errors are isolated without interrupting the rest of the batch.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Spreadsheet CSV & Excel Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate clean, UTF-8 formatted CSV files with BOM header for direct import into Microsoft Excel, Google Sheets, or ERP tools.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Spreadsheet Reconciliation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Map columns from your existing ledger, identify exact and probable matches, flag amount variances, and export audit reports.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Call to action bar */}
      <section className="py-14 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to streamline your invoice extraction workflow?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Get started immediately with our free tier or explore the live CPA sandbox with pre-loaded realistic international invoice samples.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              View Pricing ($10/month)
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
