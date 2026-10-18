import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  BarChart3,
  CalendarClock,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Database,
  X,
  CreditCard,
} from 'lucide-react';
import { ViewTab } from '../../types';
import { APP_NAME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose,
}) => {
  const { user, isDemoMode, logout } = useAuth();

  const navItems: { tab: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      tab: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      tab: 'transactions',
      label: 'Transactions',
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      tab: 'budgets',
      label: 'Smart Budgets',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      tab: 'savings',
      label: 'Savings Goals',
      icon: <Target className="w-5 h-5" />,
    },
    {
      tab: 'reports',
      label: 'Analytics & Reports',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      tab: 'recurring',
      label: 'Recurring Payments',
      icon: <CalendarClock className="w-5 h-5" />,
    },
    {
      tab: 'ai-assistant',
      label: 'AI Advisor',
      icon: <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />,
      badge: 'Gemini',
    },
    {
      tab: 'settings',
      label: 'Settings & Cloud DB',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-[#090D1A] border-r border-slate-800/80 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/60 bg-[#090D1A]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 text-white">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">SpendWise</span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Intelligent Wealth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Status Pill */}
        <div className="px-5 pt-4 pb-2">
          {isDemoMode ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="font-semibold text-indigo-300">Demo Sandbox</span>
              </div>
              <button
                onClick={() => setCurrentTab('settings')}
                className="text-[11px] text-indigo-400 hover:text-indigo-200 underline"
              >
                Connect DB
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300 font-semibold">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase PostgreSQL Live</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  setCurrentTab(item.tab);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-slate-800/70 bg-[#070A14]">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-200">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || 'SpendWise User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@spendwise.ai'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title={isDemoMode ? 'Reset / Logout' : 'Sign Out'}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2 text-center text-[10px] text-slate-500 border-t border-slate-800/40">
            "Understand Your Money. Improve Your Future."
          </div>
        </div>
      </aside>
    </>
  );
};
