import React from 'react';
import { Check, HelpCircle, Shield, Info, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  onSelectPlan: (plan: 'free_trial' | 'monthly' | 'annual') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan }) => {

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Fair Pricing for Teams of All Sizes
          </h1>
          <p className="text-sm text-slate-600">
            Initial proposed commercial plans designed for low operational overhead with zero paid AI API dependencies.
          </p>

        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Card 1: Free Trial */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Free Trial</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluate extraction and validation on sample invoices.
                </p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">$0</span>
                <span className="text-xs text-slate-500 ml-1">/ forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Try sample and uploaded invoices (limits not enforced yet)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Deterministic validation engine</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Dual-pane review workspace</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Standard CSV data export</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Spreadsheet reconciliation (CSV)</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectPlan('free_trial')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Card 2: Monthly ($10/month) */}
          <div className="bg-white rounded-xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-md relative">
            <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Monthly Plan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For bookkeepers, accountants, and growing AP teams.
                </p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">$10</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center font-medium text-slate-900">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Text-based PDF extraction (up to 4 MB per PDF)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Batch multi-file upload queue</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Selectable-text PDF extraction</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Spreadsheet ledger reconciliation</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Detailed line-item CSV exports</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Built-in Vercel extraction API</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectPlan('monthly')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
              >
                Choose Monthly ($10/mo)
              </button>
            </div>
          </div>

          {/* Card 3: Annual ($75/year) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Annual Plan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Same core features as monthly, billed annually.
                </p>
              </div>

              <div className="py-2">
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">$75</span>
                  <span className="text-xs text-slate-500 ml-1">/ year</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 font-mono">
                  Equivalent to $6.25 / month
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>All Monthly Plan features included</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>37% discount over month-to-month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Same core extraction features as the monthly plan</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Reconciliation audit report exports</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                  <span>Annual billing option (checkout not active yet)</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectPlan('annual')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Choose Annual ($75/yr)
              </button>
            </div>
          </div>

        </div>

        {/* Commercial Disclaimer Notice (Requirement #13) */}
        <div className="max-w-3xl mx-auto p-4 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Commercial Disclosure & Gateway Integration
            </p>
            <p className="leading-relaxed text-[11px]">
              These are proposed prices. Paid checkout, automatic plan limits, and paid-plan entitlements are not active yet. Choosing a paid plan will not charge you or activate paid features until secure checkout is connected.
            </p>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="max-w-3xl mx-auto space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-base font-bold text-slate-900 text-center">
            Frequently Asked Pricing Questions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <h4 className="font-bold text-slate-800">Are there per-page or LLM token fees?</h4>
              <p className="text-slate-600 leading-relaxed">
                No. The current extraction path reads selectable PDF text and applies deterministic parsing and validation rules. OCR for scanned PDFs is not enabled yet, and the current path does not require a paid AI model.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
              <h4 className="font-bold text-slate-800">Can I export my data at any time?</h4>
              <p className="text-slate-600 leading-relaxed">
                CSV exports are available for invoice and reconciliation data. JSON export is not currently supported.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
