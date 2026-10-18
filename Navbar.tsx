import React from 'react';
import {
  Menu,
  Plus,
  Sun,
  Moon,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ViewTab } from '../../types';
import { CURRENCIES } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface NavbarProps {
  currentTab: ViewTab;
  onOpenSidebar: () => void;
  onOpenQuickAdd: () => void;
  onOpenAiAdvisor: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenSidebar,
  onOpenQuickAdd,
  onOpenAiAdvisor,
  theme,
  onToggleTheme,
}) => {
  const { user, updateProfile, isDemoMode } = useAuth();
  const { searchQuery, setSearchQuery } = useFinance();

  const tabTitles: Record<ViewTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Financial Dashboard',
      subtitle: 'Real-time overview of your cash flow, net balance, and smart metrics',
    },
    transactions: {
      title: 'Transaction Management',
      subtitle: 'Record, filter, search, and audit all income and expense items',
    },
    budgets: {
      title: 'Smart Budget Planner',
      subtitle: 'Set spending guardrails with 80% warning and 100% exceeded alerts',
    },
    savings: {
      title: 'Savings Goals',
      subtitle: 'Set targets, track progress milestones, and project completion dates',
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Comprehensive financial breakdowns, trends, and CSV data export',
    },
    recurring: {
      title: 'Recurring Payments',
      subtitle: 'Schedule predictable income and expenses with manual review workflow',
    },
    'ai-assistant': {
      title: 'AI Financial Assistant',
      subtitle: 'Grounded intelligence powered by Google Gemini API',
    },
    settings: {
      title: 'Settings & Database',
      subtitle: 'Configure currency, opening balance, themes, and Supabase PostgreSQL',
    },
  };

  const currentInfo = tabTitles[currentTab] || { title: 'SpendWise AI', subtitle: '' };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({ currency: e.target.value });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search on larger screens */}
        {currentTab === 'transactions' && (
          <div className="hidden md:flex items-center relative w-60">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, notes..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </div>
        )}

        {/* Currency Switcher */}
        <div className="relative flex items-center">
          <select
            value={user?.currency || 'INR'}
            onChange={handleCurrencyChange}
            className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            title="Choose active currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* AI Quick Chat Pill */}
        <button
          onClick={onOpenAiAdvisor}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Ask SpendWise AI</span>
        </button>

        {/* "+ Add Transaction" Primary Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>
    </header>
  );
};
