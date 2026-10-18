import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Category, Budget } from '../../types';
import { CATEGORIES } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Category | 'all', limitAmount: number, alertThreshold: number) => Promise<void>;
  initialBudget?: Budget | null;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBudget,
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [limitAmount, setLimitAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialBudget) {
      setCategory(initialBudget.category);
      setLimitAmount(initialBudget.limit_amount.toString());
      setAlertThreshold(initialBudget.alert_threshold || 80);
    } else {
      setCategory('all');
      setLimitAmount('');
      setAlertThreshold(80);
    }
    setError('');
  }, [initialBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid monthly spending limit greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(category, amount, alertThreshold);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialBudget ? 'Update Budget Limit' : 'Set Monthly Budget'}
      subtitle="Define spending guardrails with automatic 80% and 100% threshold alerts"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Budget Scope / Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            disabled={!!initialBudget}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="all">Total Monthly Spending (Overall Cap)</option>
            {CATEGORIES.filter((c) => c.type !== 'income').map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} Category
              </option>
            ))}
          </select>
        </div>

        {/* Limit Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Monthly Spending Limit ({user?.currency || 'INR'}) *
          </label>
          <input
            type="number"
            step="any"
            min="1"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="e.g. 25000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Alert Threshold Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Warning Alert Trigger</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {alertThreshold}% of budget
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            SpendWise will display a yellow warning when you hit {alertThreshold}% and a red alert if exceeded.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? 'Saving...' : initialBudget ? 'Update Budget' : 'Set Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
