import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  FinancialSummary,
  Category,
  TransactionType,
  PaymentMethod,
} from '../types';
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_SAVINGS_GOALS,
  DEMO_RECURRING,
  CATEGORIES,
} from '../lib/constants';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export type DateRangeOption =
  | 'this-month'
  | 'last-month'
  | 'last-30-days'
  | 'last-90-days'
  | 'this-year'
  | 'all';

interface FinanceContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];
  summary: FinancialSummary;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  isLoading: boolean;

  // Filter & Search Controls
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  selectedCategory: string; // 'all' or Category
  setSelectedCategory: (cat: string) => void;
  selectedType: string; // 'all' | 'income' | 'expense'
  setSelectedType: (type: string) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (pm: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  setSortBy: (sort: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc') => void;

  // Transaction Operations
  addTransaction: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget Operations
  saveBudget: (category: Category | 'all', limitAmount: number, alertThreshold?: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Savings Goal Operations
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;

  // Recurring Operations
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  processDueRecurring: () => Promise<number>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Storage keys for demo data
const DEMO_TX_KEY = 'spendwise_demo_transactions';
const DEMO_BUDGET_KEY = 'spendwise_demo_budgets';
const DEMO_GOAL_KEY = 'spendwise_demo_goals';
const DEMO_REC_KEY = 'spendwise_demo_recurring';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangeOption>('this-month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (isDemoMode) {
        // Load from LocalStorage or fall back to constants
        const savedTx = localStorage.getItem(DEMO_TX_KEY);
        const savedBudgets = localStorage.getItem(DEMO_BUDGET_KEY);
        const savedGoals = localStorage.getItem(DEMO_GOAL_KEY);
        const savedRec = localStorage.getItem(DEMO_REC_KEY);

        setTransactions(savedTx ? JSON.parse(savedTx) : DEMO_TRANSACTIONS);
        setBudgets(savedBudgets ? JSON.parse(savedBudgets) : DEMO_BUDGETS);
        setSavingsGoals(savedGoals ? JSON.parse(savedGoals) : DEMO_SAVINGS_GOALS);
        setRecurringTransactions(savedRec ? JSON.parse(savedRec) : DEMO_RECURRING);
      } else {
        const supabase = getSupabaseClient();
        if (supabase && user) {
          try {
            const [txRes, bRes, gRes, rRes] = await Promise.all([
              supabase.from('transactions').select('*').order('date', { ascending: false }),
              supabase.from('budgets').select('*'),
              supabase.from('savings_goals').select('*'),
              supabase.from('recurring_transactions').select('*'),
            ]);

            if (txRes.data) setTransactions(txRes.data);
            if (bRes.data) setBudgets(bRes.data);
            if (gRes.data) setSavingsGoals(gRes.data);
            if (rRes.data) setRecurringTransactions(rRes.data);
          } catch (err) {
            console.error('Error fetching Supabase data:', err);
            addToast('error', 'Sync Error', 'Could not sync with Supabase PostgreSQL.');
          }
        }
      }
      setIsLoading(false);
    }

    loadData();
  }, [isDemoMode, user, addToast]);

  // Save to Demo LocalStorage on changes
  useEffect(() => {
    if (isDemoMode && !isLoading) {
      localStorage.setItem(DEMO_TX_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isDemoMode, isLoading]);

  useEffect(() => {
    if (isDemoMode && !isLoading) {
      localStorage.setItem(DEMO_BUDGET_KEY, JSON.stringify(budgets));
    }
  }, [budgets, isDemoMode, isLoading]);

  useEffect(() => {
    if (isDemoMode && !isLoading) {
      localStorage.setItem(DEMO_GOAL_KEY, JSON.stringify(savingsGoals));
    }
  }, [savingsGoals, isDemoMode, isLoading]);

  useEffect(() => {
    if (isDemoMode && !isLoading) {
      localStorage.setItem(DEMO_REC_KEY, JSON.stringify(recurringTransactions));
    }
  }, [recurringTransactions, isDemoMode, isLoading]);

  // Date Range Filtering Logic
  const isDateInRange = useCallback(
    (dateStr: string, range: DateRangeOption): boolean => {
      if (range === 'all') return true;

      const date = new Date(dateStr);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (range) {
        case 'this-month':
          return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        case 'last-month': {
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
        }
        case 'last-30-days': {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return date >= thirtyDaysAgo && date <= now;
        }
        case 'last-90-days': {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(now.getDate() - 90);
          return date >= ninetyDaysAgo && date <= now;
        }
        case 'this-year':
          return date.getFullYear() === currentYear;
        default:
          return true;
      }
    },
    []
  );

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Range filter
        if (!isDateInRange(tx.date, dateRange)) return false;

        // Custom dates if specified
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;

        // Type filter
        if (selectedType !== 'all' && tx.type !== selectedType) return false;

        // Category filter
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

        // Payment Method filter
        if (selectedPaymentMethod !== 'all' && tx.payment_method !== selectedPaymentMethod) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = tx.title.toLowerCase().includes(q);
          const matchCategory = tx.category.toLowerCase().includes(q);
          const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchCategory && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [
    transactions,
    dateRange,
    customStartDate,
    customEndDate,
    selectedType,
    selectedCategory,
    selectedPaymentMethod,
    searchQuery,
    sortBy,
    isDateInRange,
  ]);

  // Dynamic Financial Summary Calculation
  const summary: FinancialSummary = useMemo(() => {
    const openingBalance = user?.opening_balance || 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // All-time totals for exact Net Balance
    let totalIncome = 0;
    let totalExpense = 0;

    // Current month totals
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // Previous month totals for comparison
    let prevMonthExpense = 0;
    let prevMonthIncome = 0;

    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    // Category aggregation for current month
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    CATEGORIES.forEach((c) => {
      categoryTotals[c.name] = { amount: 0, count: 0 };
    });

    // Monthly Trend dictionary for past 6 months
    const trendMap: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      trendMap[key] = { income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      // All-time calculation
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }

      // Current Month
      if (txYear === currentYear && txMonth === currentMonth) {
        if (tx.type === 'income') {
          monthlyIncome += tx.amount;
        } else {
          monthlyExpense += tx.amount;
          if (categoryTotals[tx.category]) {
            categoryTotals[tx.category].amount += tx.amount;
            categoryTotals[tx.category].count += 1;
          }
        }
      }

      // Previous Month
      if (txYear === lastMonthYear && txMonth === lastMonth) {
        if (tx.type === 'income') {
          prevMonthIncome += tx.amount;
        } else {
          prevMonthExpense += tx.amount;
        }
      }

      // Trend mapping
      const monthKey = txDate.toLocaleString('en-US', { month: 'short' });
      if (trendMap[monthKey]) {
        if (tx.type === 'income') {
          trendMap[monthKey].income += tx.amount;
        } else {
          trendMap[monthKey].expense += tx.amount;
        }
      }
    });

    // Total calculated balance: openingBalance + all income - all expenses
    const totalBalance = openingBalance + totalIncome - totalExpense;
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;

    // Average daily expense this month
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = Math.min(now.getDate(), daysInCurrentMonth);
    const averageDailyExpense = currentDay > 0 ? monthlyExpense / currentDay : 0;

    // Category breakdown sorted by amount
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([cat, val]) => ({
        category: cat as Category,
        amount: val.amount,
        percentage: monthlyExpense > 0 ? (val.amount / monthlyExpense) * 100 : 0,
        count: val.count,
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Monthly trend array
    const monthlyTrend = Object.entries(trendMap).map(([month, val]) => ({
      month,
      income: val.income,
      expense: val.expense,
      savings: Math.max(0, val.income - val.expense),
    }));

    // Top recent expenses
    const topExpenses = [...transactions]
      .filter((t) => t.type === 'expense' && isDateInRange(t.date, 'this-month'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Budget performance
    const budgetPerformance = budgets.map((b) => {
      let spent = 0;
      if (b.category === 'all') {
        spent = monthlyExpense;
      } else {
        spent = categoryTotals[b.category]?.amount || 0;
      }
      const remaining = Math.max(0, b.limit_amount - spent);
      const percentage = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      return {
        category: b.category,
        limit: b.limit_amount,
        spent,
        remaining,
        percentage,
        isOverBudget: percentage >= 100,
        isNearLimit: percentage >= (b.alert_threshold || 80) && percentage < 100,
      };
    });

    // Savings goals summary
    let totalTarget = 0;
    let totalSaved = 0;
    let activeCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    savingsGoals.forEach((g) => {
      totalTarget += g.target_amount;
      totalSaved += g.current_amount;
      const isCompleted = g.current_amount >= g.target_amount;
      const isPast = new Date(g.target_date) < now;

      if (isCompleted) {
        completedCount++;
      } else if (isPast) {
        overdueCount++;
      } else {
        activeCount++;
      }
    });

    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    // Month-over-month calculation
    const expenseChangePercent =
      prevMonthExpense > 0 ? ((monthlyExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0;
    const incomeChangePercent =
      prevMonthIncome > 0 ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;

    return {
      openingBalance,
      totalIncome,
      totalExpense,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRate,
      averageDailyExpense,
      categoryBreakdown,
      monthlyTrend,
      recentTransactions: transactions.slice(0, 8),
      topExpenses,
      budgetPerformance,
      savingsGoalsSummary: {
        totalTarget,
        totalSaved,
        overallProgress,
        activeCount,
        completedCount,
        overdueCount,
      },
      monthOverMonth: {
        incomeChangePercent,
        expenseChangePercent,
        previousMonthExpense: prevMonthExpense,
        currentMonthExpense: monthlyExpense,
      },
    };
  }, [user, transactions, budgets, savingsGoals, isDateInRange]);

  // Transaction Operations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: user?.id || 'demo-user-101',
      created_at: new Date().toISOString(),
    };

    if (isDemoMode) {
      setTransactions((prev) => [newTx, ...prev]);
      addToast('success', 'Transaction Recorded', `${newTx.title} of ${newTx.amount} added.`);
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('transactions').insert(newTx);
        if (error) {
          addToast('error', 'Failed to save', error.message);
          throw error;
        }
        setTransactions((prev) => [newTx, ...prev]);
        addToast('success', 'Saved to Database', `${newTx.title} recorded successfully.`);
      }
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (isDemoMode) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
      );
      addToast('success', 'Updated', 'Transaction updated successfully.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('transactions').update(data).eq('id', id);
        if (error) {
          addToast('error', 'Update Failed', error.message);
          throw error;
        }
        setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        addToast('success', 'Cloud Updated', 'Transaction saved in database.');
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isDemoMode) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      addToast('info', 'Deleted', 'Transaction removed.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
          addToast('error', 'Delete Failed', error.message);
          throw error;
        }
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        addToast('info', 'Deleted from Database', 'Record permanently removed.');
      }
    }
  };

  // Budget Operations
  const saveBudget = async (category: Category | 'all', limitAmount: number, alertThreshold: number = 80) => {
    const existing = budgets.find((b) => b.category === category);
    if (existing) {
      const updated: Budget = { ...existing, limit_amount: limitAmount, alert_threshold: alertThreshold };
      if (isDemoMode) {
        setBudgets((prev) => prev.map((b) => (b.id === existing.id ? updated : b)));
        addToast('success', 'Budget Updated', `Set ${category} spending limit.`);
      } else {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('budgets').update(updated).eq('id', existing.id);
          setBudgets((prev) => prev.map((b) => (b.id === existing.id ? updated : b)));
        }
      }
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        user_id: user?.id || 'demo-user-101',
        category,
        limit_amount: limitAmount,
        period: 'monthly',
        alert_threshold: alertThreshold,
        created_at: new Date().toISOString(),
      };
      if (isDemoMode) {
        setBudgets((prev) => [...prev, newBudget]);
        addToast('success', 'Budget Created', `Allocated ${limitAmount} for ${category}.`);
      } else {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('budgets').insert(newBudget);
          setBudgets((prev) => [...prev, newBudget]);
        }
      }
    }
  };

  const deleteBudget = async (id: string) => {
    if (isDemoMode) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      addToast('info', 'Budget Removed', 'Budget category removed.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('budgets').delete().eq('id', id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
    }
  };

  // Savings Goal Operations
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      user_id: user?.id || 'demo-user-101',
      created_at: new Date().toISOString(),
    };
    if (isDemoMode) {
      setSavingsGoals((prev) => [...prev, newGoal]);
      addToast('success', 'Goal Created', `Target of ${newGoal.target_amount} set.`);
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('savings_goals').insert(newGoal);
        setSavingsGoals((prev) => [...prev, newGoal]);
      }
    }
  };

  const updateSavingsGoal = async (id: string, goal: Partial<SavingsGoal>) => {
    if (isDemoMode) {
      setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goal } : g)));
      addToast('success', 'Goal Updated', 'Goal details modified.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('savings_goals').update(goal).eq('id', id);
        setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goal } : g)));
      }
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    if (isDemoMode) {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      addToast('info', 'Goal Removed', 'Savings goal deleted.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('savings_goals').delete().eq('id', id);
        setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      }
    }
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const target = savingsGoals.find((g) => g.id === id);
    if (!target) return;

    const newAmount = target.current_amount + amount;
    const isNowComplete = newAmount >= target.target_amount && target.current_amount < target.target_amount;

    await updateSavingsGoal(id, { current_amount: newAmount });

    if (isNowComplete) {
      addToast('success', 'Goal Achieved! 🎉', `Congratulations! You reached your goal "${target.name}"!`);
    } else {
      addToast('success', 'Contribution Added', `Added ${amount} to "${target.name}".`);
    }
  };

  // Recurring Operations
  const addRecurringTransaction = async (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at'>) => {
    const newRec: RecurringTransaction = {
      ...data,
      id: `rec-${Date.now()}`,
      user_id: user?.id || 'demo-user-101',
      created_at: new Date().toISOString(),
    };
    if (isDemoMode) {
      setRecurringTransactions((prev) => [...prev, newRec]);
      addToast('success', 'Recurring Rule Created', `Schedule set for ${newRec.title}.`);
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('recurring_transactions').insert(newRec);
        setRecurringTransactions((prev) => [...prev, newRec]);
      }
    }
  };

  const updateRecurringTransaction = async (id: string, data: Partial<RecurringTransaction>) => {
    if (isDemoMode) {
      setRecurringTransactions((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      addToast('success', 'Rule Updated', 'Recurring schedule updated.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('recurring_transactions').update(data).eq('id', id);
        setRecurringTransactions((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      }
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (isDemoMode) {
      setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
      addToast('info', 'Schedule Removed', 'Recurring rule deleted.');
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('recurring_transactions').delete().eq('id', id);
        setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
      }
    }
  };

  // Manual generation/processing workflow for recurring transactions
  const processDueRecurring = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];
    let createdCount = 0;

    const activeRules = recurringTransactions.filter((r) => r.is_active);
    for (const rule of activeRules) {
      // Check if not processed today
      if (rule.last_processed_date !== today) {
        await addTransaction({
          title: `[Auto] ${rule.title}`,
          amount: rule.amount,
          type: rule.type,
          category: rule.category,
          date: today,
          payment_method: rule.payment_method,
          notes: `Generated from recurring rule (${rule.frequency})`,
        });

        await updateRecurringTransaction(rule.id, { last_processed_date: today });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      addToast('success', 'Recurring Items Processed', `Generated ${createdCount} transaction(s) for today.`);
    } else {
      addToast('info', 'All Caught Up', 'No pending recurring transactions due for processing.');
    }

    return createdCount;
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        filteredTransactions,
        budgets,
        savingsGoals,
        recurringTransactions,
        summary,
        toasts,
        addToast,
        removeToast,
        isLoading,

        dateRange,
        setDateRange,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        selectedCategory,
        setSelectedCategory,
        selectedType,
        setSelectedType,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        saveBudget,
        deleteBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        contributeToGoal,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        processDueRecurring,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
