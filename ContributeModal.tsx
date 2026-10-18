import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SavingsGoal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/formatters';
import { PlusCircle } from 'lucide-react';

interface ContributeModalProps {
  goal: SavingsGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onContribute: (goalId: string, amount: number) => Promise<void>;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  goal,
  isOpen,
  onClose,
  onContribute,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!goal) return null;

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a positive contribution amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onContribute(goal.id, num);
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [1000, 2500, 5000, 10000];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Contribution to "${goal.name}"`}
      subtitle="Celebrate each milestone toward financial freedom"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Current Progress:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(goal.current_amount, user?.currency)} of{' '}
              {formatCurrency(goal.target_amount, user?.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Remaining to Target:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(remaining, user?.currency)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Deposit Amount ({user?.currency || 'INR'}) *
          </label>
          <input
            type="number"
            step="any"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-base bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Quick Amount Chips */}
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(q.toString())}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +{formatCurrency(q, user?.currency, { compact: true })}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording...' : 'Add Contribution'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
