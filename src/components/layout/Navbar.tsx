import React from 'react';
import { 
  FileSpreadsheet, 
  Settings2, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Sliders, 
  Menu, 
  X,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { BackendConfig, User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  backendConfig: BackendConfig;
  onOpenAuth: (initialMode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenApiConfig: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  backendConfig,
  onOpenAuth,
  onLogout,
  onOpenApiConfig,
  onNavigate,
  currentView,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
              className="flex items-center space-x-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
                  Invoice<span className="text-blue-600">Flow</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 uppercase tracking-wider ml-1 px-1.5 py-0.5 bg-slate-100 rounded">
                  AP SaaS
                </span>
              </div>
            </button>
          </div>

          {/* Engine Status Badge (Requirement #6: clearly labeled demo mode vs live backend) */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onOpenApiConfig}
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                backendConfig.useLiveBackend
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title="Click to configure open-invoice-engine backend"
            >
              <span className={`w-2 h-2 rounded-full mr-1.5 ${backendConfig.useLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {backendConfig.useLiveBackend ? 'Live Backend API' : 'In-Browser / Demo Engine'}
              <Sliders className="w-3 h-3 ml-1.5 text-slate-400" />
            </button>

            {currentUser && !currentUser.isEmailVerified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-blue-50 text-blue-700 border border-blue-200">
                <AlertTriangle className="w-3 h-3 mr-1 text-blue-500" />
                Unverified Email
              </span>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {!currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'pricing' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => onNavigate('how_it_works')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'how_it_works' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  How It Works
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Try It Free
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentUser.companyName} &bull; <span className="capitalize">{currentUser.plan.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
