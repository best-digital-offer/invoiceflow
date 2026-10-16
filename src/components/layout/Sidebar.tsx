import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  GitCompare, 
  Server, 
  CreditCard, 
  History, 
  Settings, 
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Invoice } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  invoices: Invoice[];
  onOpenApiConfig: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  invoices,
  onOpenApiConfig,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Real database metrics for badge counters
  const awaitingReviewCount = invoices.filter(i => i.reviewStatus === 'awaiting_review').length;
  const errorCount = invoices.filter(i => i.validationResult.status === 'error').length;

  const handleNav = (view: string) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'All Invoices',
      icon: FileText,
      badge: invoices.length > 0 ? invoices.length : null,
    },
    {
      id: 'upload',
      label: 'Upload & Extract',
      icon: UploadCloud,
      highlight: true,
      badge: null,
    },
    {
      id: 'reconciliation',
      label: 'Spreadsheet Matching',
      icon: GitCompare,
      badge: 'Pro',
    },
  ];

  const secondaryNav = [
    {
      id: 'backend_api',
      label: 'Engine API Settings',
      icon: Server,
      onClick: onOpenApiConfig,
    },
    {
      id: 'pricing',
      label: 'Plans & Pricing',
      icon: CreditCard,
    },
    {
      id: 'usage_audit',
      label: 'Audit & Usage Log',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: Settings,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold tracking-tight text-base leading-tight">
              InvoiceFlow
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              AP Extraction Engine
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : item.highlight
                  ? 'text-blue-300 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : item.badge === 'Pro'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Review Filter Shortcuts */}
        <div className="pt-5 pb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Invoice Statuses
        </div>

        <button
          onClick={() => handleNav('invoices?filter=awaiting_review')}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Awaiting Review</span>
          </div>
          {awaitingReviewCount > 0 && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {awaitingReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNav('invoices?filter=error')}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Discrepancies / Errors</span>
          </div>
          {errorCount > 0 && (
            <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {errorCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNav('invoices?filter=reviewed')}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reviewed & Ready</span>
          </div>
        </button>

        {/* System & Configuration */}
        <div className="pt-6 pb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Configuration & Tools
        </div>

        {secondaryNav.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.onClick ? item.onClick() : handleNav(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className="w-4 h-4 text-slate-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Engine Status Card */}
      <div className="p-3 m-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            Deterministic Engine
          </span>
          <span className="text-[10px] text-slate-500 font-mono">v1.2</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zero-cost parsing & math validation active. No paid AI API required.
        </p>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
