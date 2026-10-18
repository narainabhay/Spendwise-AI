import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, Sparkles, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, signup, switchToDemoMode } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'reset'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSupabase = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (tab === 'signup' && !fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to login');
        }
      } else if (tab === 'signup') {
        const res = await signup(email, password, fullName);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to sign up');
        }
      } else if (tab === 'reset') {
        setSuccessMsg('If an account exists for this email, password reset instructions have been sent.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    switchToDemoMode();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        tab === 'login'
          ? 'Sign in to SpendWise AI'
          : tab === 'signup'
          ? 'Create SpendWise Account'
          : 'Reset Account Password'
      }
      subtitle={
        tab === 'login'
          ? 'Access your private encrypted financial dashboard'
          : tab === 'signup'
          ? 'Start tracking expenses, budgets, and savings goals'
          : 'Enter your email to receive recovery instructions'
      }
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Supabase status notice if not yet configured */}
        {!hasSupabase && (
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Demo Mode Available Instantly</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              You can explore all features using realistic sample data in Demo Mode right now. Or connect your Supabase database in Settings.
            </p>
            <button
              onClick={handleDemoLogin}
              className="mt-2 w-full py-1.5 px-3 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors"
            >
              Enter Demo Mode Now →
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        {tab !== 'reset' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError('');
              }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@spendwise.ai"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('reset');
                      setError('');
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
          >
            {isSubmitting
              ? 'Authenticating...'
              : tab === 'login'
              ? 'Sign In to SpendWise'
              : tab === 'signup'
              ? 'Complete Registration'
              : 'Send Password Reset Email'}
          </button>
        </form>

        {tab === 'reset' && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setTab('login');
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
