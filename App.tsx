/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewTab } from './types';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { SavingsGoalsView } from './components/savings/SavingsGoalsView';
import { ReportsView } from './components/reports/ReportsView';
import { RecurringView } from './components/recurring/RecurringView';
import { AiAssistantView } from './components/ai/AiAssistantView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { addTransaction } = useFinance();

  useEffect(() => {
    const savedTheme = localStorage.getItem('spendwise_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default dark fintech theme
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('spendwise_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on lg screens) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenAiAdvisor={() => setCurrentTab('ai-assistant')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Tab View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onOpenAiChat={() => setCurrentTab('ai-assistant')}
            />
          )}

          {currentTab === 'transactions' && <TransactionsView />}

          {currentTab === 'budgets' && <BudgetsView />}

          {currentTab === 'savings' && <SavingsGoalsView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'recurring' && <RecurringView />}

          {currentTab === 'ai-assistant' && <AiAssistantView />}

          {currentTab === 'settings' && (
            <SettingsView theme={theme} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      {/* Quick Add Transaction Modal */}
      <TransactionFormModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={async (data) => {
          await addTransaction(data);
        }}
      />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainLayout />
      </FinanceProvider>
    </AuthProvider>
  );
}
