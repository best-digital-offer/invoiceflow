import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Building2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { storageService } from '../../services/storage';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot_password';
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [plan, setPlan] = useState<'free_trial' | 'monthly' | 'annual'>('free_trial');
  
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (mode === 'login') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        // Login or create session
        const user = storageService.signUp(name || email.split('@')[0], email, companyName || 'Accounting Dept', 'monthly');
        onSuccess(user);
        onClose();
      }, 500);
    } else if (mode === 'signup') {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const user = storageService.signUp(name, email, companyName, plan);
        onSuccess(user);
        onClose();
      }, 500);
    } else if (mode === 'forgot_password') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setNotice(`A password reset link with verification instructions has been sent to ${email}. Check your inbox.`);
      }, 600);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = storageService.loginAsDemoUser();
      onSuccess(demoUser);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {mode === 'login' && 'Log In to InvoiceFlow'}
              {mode === 'signup' && 'Create Your Free Account'}
              {mode === 'forgot_password' && 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Access your isolated invoices and reconciliation data'}
              {mode === 'signup' && 'Start extracting and verifying invoices without paid AI'}
              {mode === 'forgot_password' && 'Enter your email to receive a password reset link'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo User Fast-Track Button */}
        <div className="p-6 pb-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-900">
                Instant Auditor Sandbox
              </p>
              <p className="text-[11px] text-blue-700">
                Sign in as Sarah Jenkins, CPA with 5 pre-loaded sample invoices
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative px-6 py-2">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan, Accounts Payable"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {mode !== 'forgot_password' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot_password')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Organization (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Logistics LLC"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Selection
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPlan('free_trial')}
                  className={`py-2 px-2 rounded border text-center font-medium ${
                    plan === 'free_trial' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Free Trial</div>
                  <div className="text-[10px] text-slate-500">No card req.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={`py-2 px-2 rounded border text-center font-medium ${
                    plan === 'monthly' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Monthly</div>
                  <div className="text-[10px] text-slate-500">$10/month</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlan('annual')}
                  className={`py-2 px-2 rounded border text-center font-medium ${
                    plan === 'annual' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Annual</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">$75/yr (Save)</div>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {isLoading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
            )}
          </button>

          {/* Toggle modes */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); setNotice(null); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign up free
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setNotice(null); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Log in
                </button>
              </p>
            )}

            {mode === 'forgot_password' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setNotice(null); }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Back to log in
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
