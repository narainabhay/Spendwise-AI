export type TransactionType = 'income' | 'expense';

export type Category =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Education'
  | 'Healthcare'
  | 'Bills'
  | 'Entertainment'
  | 'Rent'
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Other';

export type PaymentMethod =
  | 'UPI / Net Banking'
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Bank Transfer'
  | 'Other';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: Category | 'all';
  limit_amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  alert_threshold: number; // e.g. 80 (%)
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  category?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  payment_method: PaymentMethod;
  frequency: RecurringFrequency;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  last_processed_date?: string; // YYYY-MM-DD
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  currency: string; // 'INR', 'USD', 'EUR', 'GBP', etc.
  opening_balance: number;
  theme: 'dark' | 'light' | 'system';
  date_format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  created_at: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface FinancialSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number; // openingBalance + totalIncome - totalExpense
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number; // monthlyIncome - monthlyExpense
  savingsRate: number; // (netSavings / monthlyIncome) * 100
  averageDailyExpense: number;
  categoryBreakdown: {
    category: Category;
    amount: number;
    percentage: number;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
    savings: number;
  }[];
  recentTransactions: Transaction[];
  topExpenses: Transaction[];
  budgetPerformance: {
    category: Category | 'all';
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    isNearLimit: boolean; // >= 80%
  }[];
  savingsGoalsSummary: {
    totalTarget: number;
    totalSaved: number;
    overallProgress: number;
    activeCount: number;
    completedCount: number;
    overdueCount: number;
  };
  monthOverMonth: {
    incomeChangePercent: number;
    expenseChangePercent: number;
    previousMonthExpense: number;
    currentMonthExpense: number;
  };
}

export type ViewTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'savings'
  | 'reports'
  | 'recurring'
  | 'ai-assistant'
  | 'settings';
