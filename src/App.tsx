import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { ApiConfigModal } from './components/settings/ApiConfigModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { InvoiceUploader } from './components/upload/InvoiceUploader';
import { InvoiceReviewWorkspace } from './components/review/InvoiceReviewWorkspace';
import { ReconciliationWorkspace } from './components/reconciliation/ReconciliationWorkspace';
import { LandingPage } from './components/public/LandingPage';
import { PricingPage } from './components/public/PricingPage';
import { AccountSettingsView } from './components/settings/AccountSettingsView';
import { 
  HowItWorksPage, 
  FAQPage, 
  AboutPage, 
  ContactPage, 
  PrivacyPolicyPage, 
  TermsOfServicePage, 
  UsageAuditLogView 
} from './components/public/PublicStaticPages';
import { storageService, DEMO_USER } from './services/storage';
import { supabaseAuth } from './services/supabaseAuth';
import { BackendConfig, Invoice, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(storageService.getBackendConfig());
  const [invoices, setInvoices] = useState<Invoice[]>(storageService.getInvoices());
  
  // Navigation & Views
  const [currentView, setCurrentView] = useState<string>(() => {
    return storageService.getCurrentUser() ? 'dashboard' : 'landing';
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [initialInvoiceFilter, setInitialInvoiceFilter] = useState<string>('all');
  
  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [isApiConfigOpen, setIsApiConfigOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Restore real Supabase sessions and keep local UI state in sync with storage.
  useEffect(() => {
    let mounted = true;
    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setBackendConfig(storageService.getBackendConfig());
      setInvoices(storageService.getInvoices());
    });

    const isRecovery = supabaseAuth.consumePasswordRecoveryRedirect();
    if (isRecovery) {
      setAuthModalMode('update_password');
      setIsAuthModalOpen(true);
    }

    void supabaseAuth.restoreSession().then(user => {
      if (!mounted) return;
      if (user) {
        storageService.setCurrentUser(user);
      } else {
        const storedUser = storageService.getCurrentUser();
        if (storedUser && storedUser.id !== DEMO_USER.id) {
          storageService.setCurrentUser(null);
          setCurrentView('landing');
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Handle route switching
  const handleNavigate = (viewStr: string) => {
    // Parse query params if any e.g. invoices?filter=error
    if (viewStr.includes('?')) {
      const [view, query] = viewStr.split('?');
      const params = new URLSearchParams(query);
      const filter = params.get('filter');
      if (filter) setInitialInvoiceFilter(filter);
      setCurrentView(view);
    } else {
      setInitialInvoiceFilter('all');
      setCurrentView(viewStr);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    void supabaseAuth.signOut();
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleSelectInvoiceForReview = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentView('review');
  };

  const handleSaveInvoice = (updated: Invoice) => {
    storageService.saveInvoice(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    storageService.deleteInvoice(id);
    if (selectedInvoiceId === id) {
      setSelectedInvoiceId(null);
      setCurrentView('invoices');
    }
  };

  const handleUploadComplete = (newInvoices: Invoice[]) => {
    if (newInvoices.length === 1) {
      handleSelectInvoiceForReview(newInvoices[0].id);
    } else {
      setCurrentView('invoices');
    }
  };

  const currentReviewInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        backendConfig={backendConfig}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenApiConfig={() => setIsApiConfigOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Render Sidebar only when authenticated and not on full-width public views */}
        {currentUser && (
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            invoices={invoices}
            onOpenApiConfig={() => setIsApiConfigOpen(true)}
            isOpenMobile={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
        )}

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto">
          
          {/* Public Views */}
          {currentView === 'landing' && (
            <LandingPage
              onGetStarted={() => currentUser ? setCurrentView('dashboard') : handleOpenAuth('signup')}
              onExploreDemo={() => {
                const demo = storageService.loginAsDemoUser();
                setCurrentUser(demo);
                setCurrentView('dashboard');
              }}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'pricing' && (
            <PricingPage
              onSelectPlan={(plan) => {
                if (currentUser) {
                  storageService.updateUserProfile({ plan });
                  alert(`Plan changed to: ${plan.replace('_', ' ').toUpperCase()}`);
                } else {
                  handleOpenAuth('signup');
                }
              }}
            />
          )}

          {currentView === 'how_it_works' && (
            <HowItWorksPage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {currentView === 'faq' && (
            <FAQPage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {currentView === 'about' && (
            <AboutPage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {currentView === 'contact' && (
            <ContactPage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {currentView === 'privacy' && (
            <PrivacyPolicyPage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {currentView === 'terms' && (
            <TermsOfServicePage onBackToApp={() => setCurrentView(currentUser ? 'dashboard' : 'landing')} />
          )}

          {/* Authenticated Application Views */}
          {currentView === 'dashboard' && (
            <DashboardOverview
              invoices={invoices}
              onNavigate={handleNavigate}
              onSelectInvoice={handleSelectInvoiceForReview}
            />
          )}

          {currentView === 'invoices' && (
            <InvoiceListView
              invoices={invoices}
              onSelectInvoice={handleSelectInvoiceForReview}
              onDeleteInvoice={handleDeleteInvoice}
              onNavigateToUpload={() => setCurrentView('upload')}
              initialFilter={initialInvoiceFilter}
            />
          )}

          {currentView === 'upload' && (
            <InvoiceUploader
              backendConfig={backendConfig}
              onUploadComplete={handleUploadComplete}
              onNavigateToInvoice={handleSelectInvoiceForReview}
              onOpenApiConfig={() => setIsApiConfigOpen(true)}
            />
          )}

          {currentView === 'review' && currentReviewInvoice && (
            <InvoiceReviewWorkspace
              currentInvoice={currentReviewInvoice}
              allInvoices={invoices}
              onSave={handleSaveInvoice}
              onSelectInvoice={setSelectedInvoiceId}
              onBackToList={() => setCurrentView('invoices')}
              roundingTolerance={backendConfig.roundingTolerance}
            />
          )}

          {currentView === 'reconciliation' && (
            <ReconciliationWorkspace
              invoices={invoices}
              onNavigateToInvoice={handleSelectInvoiceForReview}
            />
          )}

          {currentView === 'usage_audit' && (
            <UsageAuditLogView onBackToApp={() => setCurrentView('dashboard')} />
          )}

          {currentView === 'settings' && currentUser && (
            <AccountSettingsView
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              onBackToApp={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'api_contract' && (
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                &larr; Back to Dashboard
              </button>
              <h2 className="text-xl font-bold text-slate-900">InvoiceFlow Extraction API Specifications</h2>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-3">
                  Click below to open the interactive configuration modal with the live contract schema and connection tester:
                </p>
                <button
                  onClick={() => setIsApiConfigOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                >
                  Open Extraction API Settings
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Public Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('dashboard');
        }}
      />

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        onSave={(updated) => setBackendConfig(updated)}
      />

    </div>
  );
}
