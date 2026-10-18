import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Coins,
  Calendar,
  Sun,
  Moon,
  Database,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES } from '../../lib/constants';
import { formatCurrency, exportToCSV } from '../../lib/formatters';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';
import { Modal } from '../common/Modal';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
}) => {
  const { user, updateProfile, isDemoMode, resetDemoData, logout, switchToLiveMode } = useAuth();
  const { transactions, summary, addToast } = useFinance();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [openingBalance, setOpeningBalance] = useState(user?.opening_balance?.toString() || '0');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [dateFormat, setDateFormat] = useState(user?.date_format || 'YYYY-MM-DD');

  // Supabase Config state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setOpeningBalance(user.opening_balance.toString());
      setSelectedCurrency(user.currency);
      setDateFormat(user.date_format);
    }
    const saved = getSavedSupabaseConfig();
    setSupabaseUrl(saved.url || '');
    setSupabaseAnonKey(saved.anonKey || '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(openingBalance) || 0;
    await updateProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      opening_balance: balanceNum,
      currency: selectedCurrency,
      date_format: dateFormat as any,
    });
    addToast('success', 'Profile Updated', 'Your settings and preferences have been saved.');
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
      setTestResult(res);
      if (res.success) {
        saveSupabaseConfig({ url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() });
        addToast('success', 'Supabase Connected', 'Database configuration verified and saved.');
      } else {
        addToast('error', 'Connection Test Failed', res.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult(null);
    addToast('info', 'Credentials Cleared', 'Reverted to local/demo configuration.');
  };

  const handleExportJson = () => {
    const data = {
      user,
      transactions,
      exportedAt: new Date().toISOString(),
      app: 'SpendWise AI',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpendWise_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Backup Exported', 'Full JSON financial backup downloaded.');
  };

  const fullSqlSchema = `-- SpendWise AI – Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor:
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  currency text default 'INR',
  opening_balance numeric(12, 2) default 0.00,
  theme text default 'dark',
  date_format text default 'YYYY-MM-DD',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date date not null default current_date,
  payment_method text not null default 'UPI / Net Banking',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  period text not null default 'monthly',
  alert_threshold integer default 80,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, category, period)
);

create table if not exists public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0.00,
  target_date date not null,
  category text default 'General',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.recurring_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  payment_method text not null default 'UPI / Net Banking',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  start_date date not null default current_date,
  end_date date,
  last_processed_date date,
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_transactions enable row level security;

-- Policies
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users manage own budgets" on public.budgets for all using (auth.uid() = user_id);
create policy "Users manage own savings goals" on public.savings_goals for all using (auth.uid() = user_id);
create policy "Users manage own recurring" on public.recurring_transactions for all using (auth.uid() = user_id);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Application & Financial Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize currency, opening balance, themes, and Supabase cloud PostgreSQL.
            </p>
          </div>
        </div>
      </div>

      {/* Profile & Financial Preferences Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          <span>Profile & Account</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Currency & Date Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Active Currency (Default: INR ₹)
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Preview format: {formatCurrency(125000, selectedCurrency)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-18)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (18/10/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/18/2026)</option>
            </select>
          </div>
        </div>

        {/* Opening Balance with Detailed Explanation */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Opening Account Balance ({selectedCurrency})
            </label>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Live Net: {formatCurrency(summary.totalBalance, selectedCurrency)}
            </span>
          </div>
          <input
            type="number"
            step="any"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">How Total Balance Works:</strong>{' '}
            SpendWise dynamically calculates your balance from raw transaction logs:
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              Total Balance = Opening Balance + Total Inflow - Total Outflow
            </code>
            . Adjust this opening balance to match your physical bank opening amount when starting with SpendWise.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Supabase PostgreSQL Integration Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Supabase PostgreSQL Cloud Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Row-Level Security (RLS) enabled relational database synchronization
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>View SQL Schema</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Current Mode:{' '}
              {isDemoMode ? (
                <strong className="text-indigo-600 dark:text-indigo-400">
                  Demo Sandbox (IndexedDB / LocalStorage)
                </strong>
              ) : (
                <strong className="text-emerald-600 dark:text-emerald-400">
                  Live Supabase Cloud Connected
                </strong>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Connect your own Supabase PostgreSQL project by providing your project URL and anon public key. Your credentials remain safe and never leave your client session.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClearSupabase}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear Saved Credentials
              </button>

              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-all shadow-sm"
              >
                {isTesting ? 'Verifying...' : 'Save & Test Connection'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Demo Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Data Export & Sandbox Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Full JSON Backup</span>
          </button>

          <button
            onClick={resetDemoData}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Transactions & Budgets</span>
          </button>
        </div>
      </div>

      {/* SQL Schema Viewer Modal */}
      <Modal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        title="Supabase PostgreSQL Schema"
        subtitle="Copy and paste this schema into your Supabase project's SQL Editor"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Includes Profiles, Transactions, Budgets, Savings Goals, Recurring schedules, RLS policies, and triggers.
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shrink-0"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono max-h-96 overflow-y-auto border border-slate-800 leading-relaxed select-all">
            {fullSqlSchema}
          </pre>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsSqlModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
