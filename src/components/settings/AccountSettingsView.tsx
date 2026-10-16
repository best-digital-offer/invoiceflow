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
import { User } from '../../types';
import { storageService } from '../../services/storage';

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateUserProfile({ name, companyName });
    onUpdateUser({ ...currentUser, name, companyName });
    setNotice('Profile updated successfully.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleVerifyEmail = () => {
    storageService.verifyCurrentUserEmail();
    onUpdateUser({ ...currentUser, isEmailVerified: true });
    setNotice('Email address marked as verified.');
    setTimeout(() => setNotice(null), 3000);
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
            Manage your credentials, subscription tier, and data isolation preferences.
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
                We sent a confirmation link to {currentUser.email}. Confirm to enable automated reconciliation webhooks.
              </p>
            </div>
          </div>
          <button
            onClick={handleVerifyEmail}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors shrink-0 ml-3"
          >
            Verify Now
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

      {/* Subscription Tier Info */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Active Subscription Plan</span>
          <span className="capitalize px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {currentUser.plan.replace('_', ' ')}
          </span>
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-800">
              {currentUser.plan === 'monthly' ? '$10/month Billing' : currentUser.plan === 'annual' ? '$75/year Billing' : 'Free Trial Tier'}
            </p>
            <p className="text-slate-500 mt-0.5">
              Deterministic invoice extraction, line item parser, and spreadsheet reconciliation included.
            </p>
          </div>
        </div>
      </div>

      {/* Database Reset Action */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900">
          Sandbox Data Management
        </h3>
        <p className="text-slate-500 text-xs">
          Reset your user account database to the standard 5 test invoices (including foreign currencies and deliberate math discrepancies for auditing).
        </p>
        <button
          type="button"
          onClick={handleResetData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition-colors flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Standard 5 Test Invoices</span>
        </button>
      </div>

    </div>
  );
};
