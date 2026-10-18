import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage, exportToCSV } from '../../lib/formatters';
import { CATEGORIES } from '../../lib/constants';

type ReportInterval = 'weekly' | 'monthly' | 'yearly';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { summary, transactions, filteredTransactions } = useFinance();
  const [interval, setInterval] = useState<ReportInterval>('monthly');

  const DONUT_COLORS = [
    '#6366F1',
    '#EC4899',
    '#F97316',
    '#06B6D4',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#3B82F6',
  ];

  const handleExportReportCSV = () => {
    const headers = [
      'Category',
      'Total Spent',
      'Currency',
      'Expense Share %',
      'Transaction Count',
    ];

    const rows = summary.categoryBreakdown.map((item) => [
      item.category,
      item.amount,
      user?.currency || 'INR',
      item.percentage.toFixed(1) + '%',
      item.count,
    ]);

    // Also append summary metrics
    rows.push(['---', '---', '---', '---', '---']);
    rows.push(['Total Monthly Income', summary.monthlyIncome, user?.currency || 'INR', '', '']);
    rows.push(['Total Monthly Expense', summary.monthlyExpense, user?.currency || 'INR', '', '']);
    rows.push(['Net Monthly Savings', summary.netSavings, user?.currency || 'INR', '', '']);
    rows.push(['Savings Rate', summary.savingsRate.toFixed(1) + '%', '', '', '']);

    exportToCSV(`SpendWise_Financial_Report_${interval}_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Intervals */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Reports & Financial Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep dive into historical cash flows, category allocations, and budget metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(
              [
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'yearly', label: 'Yearly' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setInterval(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  interval === item.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Cash Inflow</p>
          <p className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.monthlyIncome, user?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <span>vs Prev: </span>
            <span
              className={`font-semibold ${
                summary.monthOverMonth.incomeChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {summary.monthOverMonth.incomeChangePercent >= 0 ? '+' : ''}
              {summary.monthOverMonth.incomeChangePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Cash Outflow</p>
          <p className="mt-1 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            -{formatCurrency(summary.monthlyExpense, user?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <span>vs Prev: </span>
            <span
              className={`font-semibold ${
                summary.monthOverMonth.expenseChangePercent <= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {summary.monthOverMonth.expenseChangePercent >= 0 ? '+' : ''}
              {summary.monthOverMonth.expenseChangePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Daily Spend</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(summary.averageDailyExpense, user?.currency)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">Per day burn rate</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Savings Rate</p>
          <p className="mt-1 text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {formatPercentage(summary.savingsRate)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            {summary.savingsRate >= 20 ? 'Optimal (>= 20%)' : 'Sub-optimal (< 20%)'}
          </p>
        </div>
      </div>

      {/* Main Charts: Spending Trend Area Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Historical Spending & Savings Area Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inflow vs Outflow dynamics across recent months
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                  formatter={(val: any) => [
                    formatCurrency(Number(val), user?.currency),
                    '',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Spending Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Highest Spending Categories
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by total outflow this period
            </p>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {summary.categoryBreakdown.map((cat, idx) => (
              <div
                key={cat.category}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{cat.category}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount, user?.currency)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{cat.count} transactions</span>
                  <span>{cat.percentage.toFixed(1)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month over Month Diagnostic Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
          Month-over-Month Variance Report
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Comparing current month financial figures with the previous cycle
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Previous Month Outflow</span>
            <p className="text-lg font-bold font-mono mt-1 text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.monthOverMonth.previousMonthExpense, user?.currency)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Current Month Outflow</span>
            <p className="text-lg font-bold font-mono mt-1 text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.monthOverMonth.currentMonthExpense, user?.currency)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Net Expense Delta</span>
            <p
              className={`text-lg font-bold font-mono mt-1 ${
                summary.monthOverMonth.expenseChangePercent <= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {summary.monthOverMonth.expenseChangePercent >= 0 ? '+' : ''}
              {summary.monthOverMonth.expenseChangePercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.monthOverMonth.expenseChangePercent <= 0
                ? 'Great discipline: expenses dropped'
                : 'Caution: expenses climbed vs last month'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
