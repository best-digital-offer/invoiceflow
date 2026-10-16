import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Building2, 
  Mail, 
  ShieldCheck, 
  CreditCard, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { User, UserPreferences, Currency, TaxSystem } from '../../types';
import { DEFAULT_USER_PREFERENCES, supabaseData, isSupabaseUserId } from '../../services/supabaseData';
import { storageService, DEMO_USER } from '../../services/storage';
import { supabaseAuth } from '../../services/supabaseAuth';

interface AccountSettingsViewProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onBackToApp: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  currentUser,
  onUpdateUser,
  onBackToApp,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [companyName, setCompanyName] = useState(currentUser.companyName);
  const [notice, setNotice] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [savingPreferences, setSavingPreferences] = useState(false);

  React.useEffect(() => {
    let active = true;
    const localKey = 'invoiceflow_preferences_' + currentUser.id;
    try {
      const cached = localStorage.getItem(localKey);
      if (cached && active) setPreferences({ ...DEFAULT_USER_PREFERENCES, ...JSON.parse(cached) });
    } catch { /* use defaults */ }
    if (isSupabaseUserId(currentUser.id)) {
      void supabaseData.fetchUserPreferences(currentUser.id).then(remote => {
        if (!active || !remote) return;
        setPreferences(remote);
        localStorage.setItem(localKey, JSON.stringify(remote));
      }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [currentUser.id]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(previous => ({ ...previous, [key]: value }));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    try {
      const normalized = {
        ...preferences,
        taxLabel: preferences.taxSystem === 'vat' ? 'VAT'
          : preferences.taxSystem === 'gst' ? 'GST'
          : preferences.taxSystem === 'sales_tax' ? 'Sales Tax'
          : preferences.taxSystem === 'none' ? 'No Tax' : preferences.taxLabel.trim() || 'Tax',
        defaultTaxRate: Math.max(0, Math.min(100, Number(preferences.defaultTaxRate) || 0)),
      };
      setPreferences(normalized);
      localStorage.setItem('invoiceflow_preferences_' + currentUser.id, JSON.stringify(normalized));
      if (isSupabaseUserId(currentUser.id)) {
        await supabaseData.saveUserPreferences(currentUser.id, normalized);
      }
      setNotice('Currency and tax preferences saved.');
    } catch (error) {
      setNotice(error instanceof Error ? 'Saved locally; cloud sync failed: ' + error.message : 'Saved locally, but cloud sync failed.');
    } finally {
      setSavingPreferences(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateUserProfile({ name, companyName });
    onUpdateUser({ ...currentUser, name, companyName });
    setNotice('Profile updated successfully.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleVerifyEmail = async () => {
    try {
      await supabaseAuth.resendConfirmationEmail(currentUser.email);
      setNotice('A new confirmation email was requested. Check your inbox and spam folder.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not request a confirmation email. Please try again.');
    }
    setTimeout(() => setNotice(null), 5000);
  };

  const handleResetData = () => {
    if (confirm('Reset your invoice records to the standard 5 demo test invoices? Custom invoices will be cleared.')) {
      storageService.resetToDemoSeed(currentUser.id);
      setNotice('Database reset to standard seed test invoices.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 text-xs text-slate-700">
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Account & Organization Settings
          </h1>
          <p className="text-slate-500 mt-0.5">
            Manage your profile, email verification, and account preferences.
          </p>
        </div>
        <button
          onClick={onBackToApp}
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Dashboard
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Verification notice if not verified */}
      {!currentUser.isEmailVerified && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-start space-x-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Email Verification Pending</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Request a new confirmation link for {currentUser.email} to complete email verification.
              </p>
            </div>
          </div>
          <button
            onClick={handleVerifyEmail}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors shrink-0 ml-3"
          >
            Resend Confirmation
          </button>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
          Personal & Organization Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Team</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs shadow-xs transition-colors"
          >
            Save Profile Changes
          </button>
        </div>
      </form>


      {/* International currency and tax preferences */}
      <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-900">Currency & Tax Preferences</h3>
          <p className="text-slate-500 mt-1">Set organization defaults. An invoice's detected currency and stated tax remain unchanged unless you edit that invoice.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default currency</label>
            <select value={preferences.defaultCurrency} onChange={e => updatePreference('defaultCurrency', e.target.value as Currency)} className="w-full rounded border border-slate-300 px-3 py-2 bg-white">
              <option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option><option value="JPY">JPY — Japanese Yen</option><option value="CHF">CHF — Swiss Franc</option><option value="INR">INR — Indian Rupee</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Used as your default when currency is unclear; it does not convert invoice amounts.</p>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax country / jurisdiction</label>
            <select value={preferences.taxCountry} onChange={e => {
              const country = e.target.value;
              const presets: Record<string, { system: TaxSystem; label: string; rate: number }> = {
                US: { system: 'sales_tax', label: 'Sales Tax', rate: 0 },
                GB: { system: 'vat', label: 'VAT', rate: 20 },
                IN: { system: 'gst', label: 'GST', rate: 18 },
                AU: { system: 'gst', label: 'GST', rate: 10 },
                NZ: { system: 'gst', label: 'GST', rate: 15 },
                CA: { system: 'gst', label: 'GST/HST', rate: 5 },
                DE: { system: 'vat', label: 'VAT', rate: 19 },
                FR: { system: 'vat', label: 'VAT', rate: 20 },
                JP: { system: 'vat', label: 'Consumption Tax', rate: 10 },
                SG: { system: 'gst', label: 'GST', rate: 9 },
                AE: { system: 'vat', label: 'VAT', rate: 5 },
                CH: { system: 'vat', label: 'VAT', rate: 8.1 },
                OTHER: { system: 'custom', label: 'Tax', rate: 0 },
              };
              const selected = presets[country] || presets.OTHER;
              setPreferences(previous => ({ ...previous, taxCountry: country, taxSystem: selected.system, taxLabel: selected.label, defaultTaxRate: selected.rate }));
            }} className="w-full rounded border border-slate-300 px-3 py-2 bg-white">
              <option value="US">United States</option><option value="GB">United Kingdom</option><option value="IN">India</option><option value="AU">Australia</option><option value="NZ">New Zealand</option><option value="CA">Canada</option><option value="DE">Germany</option><option value="FR">France</option><option value="JP">Japan</option><option value="SG">Singapore</option><option value="AE">United Arab Emirates</option><option value="CH">Switzerland</option><option value="OTHER">Other / custom jurisdiction</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax system</label>
            <select value={preferences.taxSystem} onChange={e => {
              const system = e.target.value as TaxSystem;
              updatePreference('taxSystem', system);
              if (system !== 'custom') updatePreference('taxLabel', system === 'vat' ? 'VAT' : system === 'gst' ? 'GST' : system === 'sales_tax' ? 'Sales Tax' : 'No Tax');
            }} className="w-full rounded border border-slate-300 px-3 py-2 bg-white">
              <option value="sales_tax">Sales Tax</option><option value="vat">VAT</option><option value="gst">GST / HST</option><option value="none">No tax</option><option value="custom">Custom tax label</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={preferences.defaultTaxRate} onChange={e => updatePreference('defaultTaxRate', Number(e.target.value))} className="w-full rounded border border-slate-300 px-3 py-2" />
            <p className="text-[10px] text-slate-500 mt-1">Rates can vary by state, province, region, product, exemptions, and transaction type.</p>
          </div>
          {preferences.taxSystem === 'custom' && <div>
            <label className="block font-semibold text-slate-700 mb-1">Custom tax label</label>
            <input value={preferences.taxLabel} onChange={e => updatePreference('taxLabel', e.target.value)} placeholder="e.g. Local levy" className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">State / province / region (optional)</label>
            <input value={preferences.taxRegion} onChange={e => updatePreference('taxRegion', e.target.value)} placeholder="e.g. California, Ontario, Maharashtra" className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
          Country presets are editable starting points, not a live tax calculator or a guarantee of legal compliance. Confirm local rules and invoice-specific rates before accounting or filing.
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingPreferences} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded font-semibold text-xs">
            {savingPreferences ? 'Saving…' : 'Save Currency & Tax Settings'}
          </button>
        </div>
      </form>

      {/* Subscription Tier Info */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Current Plan</span>
          <span className="capitalize px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {currentUser.plan.replace('_', ' ')}
          </span>
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-800">
              {currentUser.plan === 'free_trial' ? 'Free Trial' : 'Paid plan status requires verified checkout'}
            </p>
            <p className="text-slate-500 mt-0.5">
              Selectable-text PDF extraction, invoice validation, and CSV reconciliation.
            </p>
          </div>
        </div>
      </div>

      {currentUser.id === DEMO_USER.id && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
          <h3 className="font-bold text-sm text-slate-900">
            Sandbox Data Management
          </h3>
          <p className="text-slate-500 text-xs">
            Reset the demo workspace to its standard 5 test invoices, including deliberate math discrepancies for validation testing.
          </p>
          <button
            type="button"
            onClick={handleResetData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition-colors flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Invoices</span>
          </button>
        </div>
      )}

    </div>
  );
};
