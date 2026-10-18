import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Percent,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Info,
  Calendar,
  Plus,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { useFinance, DateRangeOption } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage, formatDate } from '../../lib/formatters';
import { CATEGORIES } from '../../lib/constants';
import { CategoryIcon } from '../common/CategoryIcon';
import { ViewTab } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: ViewTab) => void;
  onOpenQuickAdd: () => void;
  onOpenAiChat: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenQuickAdd,
  onOpenAiChat,
}) => {
  const { user } = useAuth();
  const { summary, dateRange, setDateRange } = useFinance();
  const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);

  // Colors for donut chart
  const DONUT_COLORS = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#3B82F6', // Blue
  ];

  return (
    <div className="space-y-6">
      {/* Date Range quick selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:px-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Active Period Filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'this-month', label: 'This Month' },
              { id: 'last-month', label: 'Last Month' },
              { id: 'last-30-days', label: 'Last 30 Days' },
              { id: 'this-year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRange(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards: Total Balance, Monthly Income, Monthly Expense, Net Savings, Savings Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Balance Card */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#0E1529] to-[#141E38] border border-indigo-500/20 text-white shadow-lg shadow-indigo-950/20 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
              Total Balance
            </span>
            <div className="relative">
              <button
                onMouseEnter={() => setShowBalanceTooltip(true)}
                onMouseLeave={() => setShowBalanceTooltip(false)}
                onClick={() => setShowBalanceTooltip(!showBalanceTooltip)}
                className="p-1 rounded-full text-indigo-400 hover:text-white"
              >
                <Info className="w-4 h-4" />
              </button>
              {showBalanceTooltip && (
                <div className="absolute right-0 top-6 z-20 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-slate-300 shadow-xl leading-relaxed">
                  <p className="font-bold text-white mb-1">Balance Calculation:</p>
                  <p>Opening Balance: {formatCurrency(summary.openingBalance, user?.currency)}</p>
                  <p className="text-emerald-400">+ Lifetime Income: {formatCurrency(summary.totalIncome, user?.currency)}</p>
                  <p className="text-rose-400">- Lifetime Expense: {formatCurrency(summary.totalExpense, user?.currency)}</p>
                  <p className="mt-1 pt-1 border-t border-slate-800 font-semibold text-indigo-300">
                    = Net Calculated Balance
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
            {formatCurrency(summary.totalBalance, user?.currency)}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">
              Base: {formatCurrency(summary.openingBalance, user?.currency)}
            </span>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Monthly Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.monthlyIncome, user?.currency)}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {summary.monthOverMonth.incomeChangePercent >= 0 ? '+' : ''}
              {summary.monthOverMonth.incomeChangePercent.toFixed(1)}% vs last mo
            </span>
          </div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Monthly Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            -{formatCurrency(summary.monthlyExpense, user?.currency)}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Daily: {formatCurrency(summary.averageDailyExpense, user?.currency)}</span>
          </div>
        </div>

        {/* Monthly Savings Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Total Savings
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono tracking-tight ${
              summary.netSavings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'
            }`}
          >
            {summary.netSavings >= 0 ? '+' : ''}
            {formatCurrency(summary.netSavings, user?.currency)}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Income - Expenses</span>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Savings Rate
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-400">
            {formatPercentage(summary.savingsRate)}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`font-semibold ${
                summary.savingsRate >= 20 ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {summary.savingsRate >= 20 ? 'Healthy (>=20%)' : 'Aim for 20%+ target'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Financial Insight Banner / Quick Widget */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  SpendWise AI Intelligence
                </span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] font-bold text-indigo-200">
                  Real Data Grounded
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1">
                {summary.categoryBreakdown.length > 0 ? (
                  <>
                    Your highest expense category is{' '}
                    <span className="font-bold text-white">
                      {summary.categoryBreakdown[0].category}
                    </span>{' '}
                    at {formatCurrency(summary.categoryBreakdown[0].amount, user?.currency)} (
                    {summary.categoryBreakdown[0].percentage.toFixed(0)}% of expenses).
                    {summary.savingsRate >= 20
                      ? ' Outstanding job maintaining a healthy savings margin!'
                      : ' Let’s optimize discretionary categories to boost your savings rate.'}
                  </>
                ) : (
                  'Ask SpendWise AI for customized budget optimizations, category audits, and savings plans.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
          >
            <span>Ask AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Grid: Income vs Expense & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Income vs Expenses Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly cash inflow vs outflow comparison
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) =>
                    formatCurrency(val, user?.currency, { compact: true })
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                          <p className="font-bold text-slate-300">{label}</p>
                          <p className="text-emerald-400">
                            Income: {formatCurrency(Number(payload[0]?.value || 0), user?.currency)}
                          </p>
                          <p className="text-rose-400">
                            Expense: {formatCurrency(Number(payload[1]?.value || 0), user?.currency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Donut Chart (1 column on lg) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expense distribution this period
            </p>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-slate-400">No expenses recorded for this period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {summary.categoryBreakdown.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrency(Number(val), user?.currency),
                        'Spent',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Category List */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {summary.categoryBreakdown.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.amount, user?.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget & Savings Snapshot Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Utilization Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Budget Guardrails
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly spending limit progress
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {summary.budgetPerformance.slice(0, 3).map((bp) => {
              const isOver = bp.isOverBudget;
              const isNear = bp.isNearLimit;
              return (
                <div
                  key={bp.category}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bp.category === 'all' ? 'Total Monthly Budget' : bp.category}
                      </span>
                      {isOver && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exceeded!
                        </span>
                      )}
                      {!isOver && isNear && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          80%+ Warning
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {formatCurrency(bp.spent, user?.currency)} / {formatCurrency(bp.limit, user?.currency)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, bp.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{bp.percentage.toFixed(0)}% utilized</span>
                    <span>
                      {bp.remaining > 0
                        ? `${formatCurrency(bp.remaining, user?.currency)} left`
                        : 'No budget remaining'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goals Snapshot */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Savings Goals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your financial milestones
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('savings')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Goals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {summary.savingsGoalsSummary.totalTarget > 0 ? (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                    Overall Goals Progress
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(summary.savingsGoalsSummary.totalSaved, user?.currency)} of{' '}
                    {formatCurrency(summary.savingsGoalsSummary.totalTarget, user?.currency)}
                  </span>
                </div>
                <div className="w-full bg-indigo-200/50 dark:bg-indigo-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    style={{ width: `${Math.min(100, summary.savingsGoalsSummary.overallProgress)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{summary.savingsGoalsSummary.overallProgress.toFixed(1)}% achieved</span>
                  <span>{summary.savingsGoalsSummary.activeCount} active goals</span>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Active</p>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {summary.savingsGoalsSummary.activeCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Completed</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.savingsGoalsSummary.completedCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">Overdue</p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {summary.savingsGoalsSummary.overdueCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest financial activity
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Records</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {summary.recentTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const categoryMeta = CATEGORIES.find((c) => c.name === tx.category);
            return (
              <div
                key={tx.id}
                onClick={() => onNavigateTab('transactions')}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      categoryMeta?.bgColor || 'bg-slate-100'
                    } ${categoryMeta?.borderColor || 'border-slate-200'}`}
                    style={{ color: categoryMeta?.color }}
                  >
                    <CategoryIcon category={tx.category} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tx.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatDate(tx.date, user?.date_format)}</span>
                      <span>•</span>
                      <span>{tx.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-sm">
                  <span
                    className={
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, user?.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
