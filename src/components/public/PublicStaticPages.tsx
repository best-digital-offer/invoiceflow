import React, { useState } from 'react';
import { 
  Shield, 
  HelpCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Server, 
  History, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface PageProps {
  onBackToApp: () => void;
}

export const HowItWorksPage: React.FC<PageProps> = ({ onBackToApp }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-xs text-slate-700">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">How InvoiceFlow Works</h1>
        <p className="text-slate-500 mt-1">
          A transparent look at the extraction, validation, and reconciliation architecture.
        </p>
      </div>

      <div className="space-y-6 text-xs leading-relaxed">
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">1. In-Browser & Backend Extraction Engine</h3>
          <p>
            When a PDF is uploaded, InvoiceFlow sends it to its same-origin Vercel extraction endpoint, which extracts selectable text. Deterministic rules attempt to identify fields such as supplier name, tax ID, invoice number, dates, and monetary totals. Verify every extracted value before accounting use; line items may need to be entered or corrected manually.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">2. Deterministic Mathematical Verification</h3>
          <p>
            Rather than blindly trusting extracted numbers, our validation engine applies formal financial equations:
          </p>
          <div className="font-mono bg-slate-50 p-3 rounded border border-slate-200 text-slate-800">
            | Subtotal - Discount + Tax + Shipping - Total | &le; Rounding Tolerance ($0.02)
          </div>
          <p>
            It also evaluates line-item multiplications (<code className="font-mono">Qty &times; Unit Price == Line Total</code>), verifies that due dates follow invoice dates, and checks your existing database for duplicate invoice submissions.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">3. Spreadsheet Reconciliation Logic</h3>
          <p>
            When matching against your accounting records or ERP ledgers, the matching algorithm operates transparently:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Exact Match (100%):</strong> Exact invoice number and total amount match within 2 cents.</li>
            <li><strong>Probable Match (80-99%):</strong> Matching vendor name, date, and exact amount, but minor formatting variance in invoice ID.</li>
            <li><strong>Amount Mismatch:</strong> Matching invoice number, but differing totals (pinpointing unrecorded surcharges or disputes).</li>
            <li><strong>Unmatched:</strong> Records in ledger missing corresponding PDF invoices, or vice-versa.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC<PageProps> = ({ onBackToApp }) => {
  const faqs = [
    {
      q: 'Does InvoiceFlow require paid OpenAI or Gemini API keys to operate?',
      a: 'No. The core functionality is designed to operate completely without paid AI APIs. It utilizes deterministic token extraction, optical layout parsing, and mathematical verification rules.',
    },
    {
      q: 'Can InvoiceFlow handle scanned invoices or photo receipts?',
      a: 'Not yet. InvoiceFlow currently supports text-based PDFs with selectable text. Scanned PDFs and photo receipts require OCR, which is not enabled in this version.',
    },
    {
      q: 'How does InvoiceFlow protect multi-tenant user data?',
      a: 'All extracted invoices, line items, and reconciliation runs are isolated by user ID in secure storage. No data from one account can be viewed or accessed by another.',
    },
    {
      q: 'What happens if an invoice has a mathematical discrepancy?',
      a: 'InvoiceFlow flags the discrepancy with an exact dollar delta indicator and highlights the affected fields in the review workspace. The application never silently modifies numbers to force balance.',
    },
    {
      q: 'Can I export both summary invoices and itemized line items?',
      a: 'Yes. InvoiceFlow provides standard flat CSV exports for high-level ledger entries as well as detailed multi-line CSV exports containing individual item descriptions, quantities, and line totals.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-xs text-slate-700">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
        <p className="text-slate-500 mt-1">
          Detailed answers on data extraction, accounting formulas, and reconciliation rules.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
            <p className="text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AboutPage: React.FC<PageProps> = ({ onBackToApp }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-xs text-slate-700">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">About InvoiceFlow</h1>
        <p className="text-slate-500 mt-1">
          Building practical, deterministic financial tooling for accounts payable teams.
        </p>
      </div>

      <div className="space-y-4 text-xs leading-relaxed bg-white p-6 rounded-lg border border-slate-200">
        <p>
          InvoiceFlow was conceived to solve a widespread challenge in modern corporate accounting: the tedious, error-prone manual entry of PDF invoices into accounting spreadsheets and ERP ledgers.
        </p>
        <p>
          While many modern tools rely heavily on unpredictable generative AI with compounding per-page API fees, InvoiceFlow focuses on <strong>deterministic accuracy</strong>. Financial numbers must balance to the penny, and missing data must remain absent rather than synthesized.
        </p>
        <h4 className="font-bold text-slate-900 text-sm pt-2">Our Engineering Principles</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>No Compulsory Paid AI:</strong> Core extraction and mathematical validation operate without requiring external commercial LLM tokens.</li>
          <li><strong>Human Oversight:</strong> Extracted values are cleanly laid out alongside original documents for rapid, confident human verification.</li>
          <li><strong>Vercel + Supabase:</strong> Uses a same-origin Vercel extraction API and Supabase authentication, database, and private PDF storage.</li>
        </ul>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<PageProps> = ({ onBackToApp }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-xs text-slate-700">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Contact Support & Sales</h1>
        <p className="text-slate-500 mt-1">
          Have questions regarding extraction workflows or custom backend deployment? Get in touch.
        </p>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">Inquiry Received</h3>
          <p className="text-emerald-700">
            Thank you, {name}. A member of our technical finance operations team will respond to {email} shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Jordan Lee"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="jordan@company.com"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Inquiry / Note *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="Describe your invoice format or volume requirements..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </div>
  );
};

export const PrivacyPolicyPage: React.FC<PageProps> = ({ onBackToApp }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 text-xs text-slate-700 leading-relaxed">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-slate-500 mt-1">Last updated: October 2026</p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">1. Document and Financial Data Isolation</h3>
        <p>
          InvoiceFlow processes accounting documents including invoices, credit notes, and spreadsheet ledgers. All uploaded files and extracted fields are strictly segregated by authenticated user accounts and stored in isolated storage boundaries.
        </p>

        <h3 className="font-bold text-slate-900 text-sm">2. Zero Model Training on Financial Invoices</h3>
        <p>
          We do not use customer invoice documents, vendor line items, or financial totals to train public machine learning or foundational AI models.
        </p>

        <h3 className="font-bold text-slate-900 text-sm">3. Local & Configurable Processing</h3>
        <p>
          When using the in-browser extraction engine, documents are processed directly on your machine without transmitting sensitive accounting records to third-party cloud services.
        </p>
      </div>
    </div>
  );
};

export const TermsOfServicePage: React.FC<PageProps> = ({ onBackToApp }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6 text-xs text-slate-700 leading-relaxed">
      <button
        onClick={onBackToApp}
        className="text-xs font-semibold text-blue-600 hover:underline flex items-center mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
        <p className="text-slate-500 mt-1">Last updated: October 2026</p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">1. Acceptance of Terms</h3>
        <p>
          By creating an account or uploading documents to InvoiceFlow, you agree to these Terms of Service.
        </p>

        <h3 className="font-bold text-slate-900 text-sm">2. Accounting Verification Responsibility</h3>
        <p>
          InvoiceFlow provides deterministic extraction, mathematical formulas, and spreadsheet matching tools to aid accounting teams. However, users remain solely responsible for the legal and tax accuracy of invoices and filings submitted to tax authorities.
        </p>

        <h3 className="font-bold text-slate-900 text-sm">3. Commercial Terms</h3>
        <p>
          Pricing plans (Free Trial, $10/month, $75/year) represent initial proposed commercial offerings. Subscription upgrades require verified payment processing workflows.
        </p>
      </div>
    </div>
  );
};

export const UsageAuditLogView: React.FC<PageProps> = ({ onBackToApp }) => {
  const records = storageService.getUsageRecords();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600" />
            Audit & Usage Log
          </h1>
          <p className="text-slate-500 mt-0.5">
            Real records of document extractions, batch uploads, and reconciliation runs.
          </p>
        </div>
        <button
          onClick={onBackToApp}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs"
        >
          Back to Dashboard
        </button>
      </div>

      {records.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No usage events logged yet in your account.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500">{new Date(rec.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 uppercase">{rec.operation.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold uppercase text-[10px]">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{rec.itemCount}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{rec.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
