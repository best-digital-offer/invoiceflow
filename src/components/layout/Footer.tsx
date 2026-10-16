import React from 'react';
import { FileSpreadsheet, Shield, ArrowUpRight, Github } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Invoice<span className="text-blue-500">Flow</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm text-xs sm:text-sm leading-relaxed">
              Deterministic invoice extraction, mathematical verification, and spreadsheet reconciliation software for accounting and finance teams. Built for zero-cost operation without compulsory paid AI models.
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-400 pt-2">
              <span className="inline-flex items-center text-slate-300">
                <Shield className="w-4 h-4 mr-1 text-emerald-400" />
                Deterministic Verification
              </span>
              <span>&bull;</span>
              <span>Zero-AI Dependency Core</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('reconciliation')} className="hover:text-white transition-colors">
                  Spreadsheet Matching
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">
                  Pricing Plans
                </button>
              </li>
            </ul>
          </div>

          {/* Integration & Engine */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Open Engine
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a 
                  href="https://github.com/best-digital-offer/open-invoice-engine" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center"
                >
                  open-invoice-engine <ArrowUpRight className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate('api_contract')} className="hover:text-white transition-colors">
                  REST API Contract
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors">
                  FAQ & Validation Rules
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} InvoiceFlow Inc. All rights reserved. Designed for reliable US & international accounting workflows.
          </p>
          <div className="mt-4 sm:mt-0 flex space-x-6">
            <span>Deterministic Math Check</span>
            <span>UTF-8 CSV & Excel Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
