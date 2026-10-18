import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Transaction } from '../../types';
import { CATEGORIES, PAYMENT_METHODS } from '../../lib/constants';
import { useFinance, DateRangeOption } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatRelativeDate, exportToCSV } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { TransactionFormModal } from './TransactionFormModal';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TransactionsView: React.FC = () => {
  const { user } = useAuth();
  const {
    filteredTransactions,
    dateRange,
    setDateRange,
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
  } = useFinance();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Summary of filtered transactions
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netFlow = filteredIncome - filteredExpense;

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Title',
      'Type',
      'Category',
      'Amount',
      'Currency',
      'Date',
      'Payment Method',
      'Notes',
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.title,
      tx.type,
      tx.category,
      tx.amount,
      user?.currency || 'INR',
      tx.date,
      tx.payment_method,
      tx.notes || '',
    ]);

    exportToCSV(`SpendWise_Transactions_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleResetFilters = () => {
    setDateRange('this-month');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedPaymentMethod('all');
    setSearchQuery('');
    setSortBy('date-desc');
  };

  const isFiltered =
    dateRange !== 'this-month' ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedPaymentMethod !== 'all' ||
    searchQuery !== '' ||
    sortBy !== 'date-desc';

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction title, note, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons: Export CSV & Add Transaction */}
          <div className="flex items-center gap-2.5">
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV ({filteredTransactions.length})</span>
            </button>

            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
              className="w-full text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-30-days">Past 30 Days</option>
              <option value="last-90-days">Past 90 Days</option>
              <option value="this-year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Payment Method
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs font-medium py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="amount-desc">Amount (Highest first)</option>
              <option value="amount-asc">Amount (Lowest first)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Period Income</p>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(filteredIncome, user?.currency)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Period Expenses</p>
            <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              -{formatCurrency(filteredExpense, user?.currency)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Net Flow</p>
            <p
              className={`text-lg font-bold font-mono ${
                netFlow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netFlow >= 0 ? '+' : ''}
              {formatCurrency(netFlow, user?.currency)}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
            {filteredTransactions.length} items
          </span>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No transactions found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No records match your active search and filter criteria. Try adjusting your filters or record a new transaction.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Transaction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Transaction</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Payment</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const categoryMeta = CATEGORIES.find((c) => c.name === tx.category);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setViewingTransaction(tx)}
                    >
                      {/* Title & Icon */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl border shrink-0 ${
                              categoryMeta?.bgColor || 'bg-slate-100 dark:bg-slate-800'
                            } ${categoryMeta?.borderColor || 'border-slate-200'}`}
                            style={{ color: categoryMeta?.color }}
                          >
                            <CategoryIcon category={tx.category} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                              {tx.title}
                            </p>
                            {tx.notes && (
                              <p className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            categoryMeta?.bgColor || 'bg-slate-100'
                          } ${categoryMeta?.borderColor || 'border-slate-200'}`}
                          style={{ color: categoryMeta?.color }}
                        >
                          {tx.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {formatRelativeDate(tx.date)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDate(tx.date, user?.date_format)}
                        </p>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap hidden md:table-cell text-xs text-slate-600 dark:text-slate-300">
                        {tx.payment_method}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold">
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
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingTransaction(tx)}
                            title="View details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsFormOpen(true);
                            }}
                            title="Edit transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            title="Delete transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        initialData={editingTransaction}
        onSubmit={async (data) => {
          if (editingTransaction) {
            await updateTransaction(editingTransaction.id, data);
          } else {
            await addTransaction(data);
          }
        }}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={!!viewingTransaction}
        transaction={viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onEdit={(tx) => {
          setEditingTransaction(tx);
          setIsFormOpen(true);
        }}
        onDelete={(id) => setDeletingId(id)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteTransaction(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction? This action cannot be undone and will recalculate your balances."
        confirmText="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
};
