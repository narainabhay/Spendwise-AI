import React from 'react';
import { Modal } from '../common/Modal';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { CATEGORIES } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CreditCard, FileText, Clock, Edit2, Trash2 } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const categoryMeta = CATEGORIES.find((c) => c.name === transaction.category);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" maxWidth="sm">
      <div className="space-y-5">
        {/* Header Amount Banner */}
        <div
          className={`p-5 rounded-2xl text-center border ${
            isIncome
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="inline-flex p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm mb-2">
            <CategoryIcon category={transaction.category} className="w-6 h-6 text-indigo-500" />
          </div>
          <h4 className="text-xl font-bold">{transaction.title}</h4>
          <p
            className={`mt-1 text-2xl font-black font-mono tracking-tight ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, user?.currency)}
          </p>
          <span
            className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
              isIncome
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            {transaction.type}
          </span>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              <Calendar className="w-4 h-4" /> Date
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatDate(transaction.date, user?.date_format)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              <CreditCard className="w-4 h-4" /> Payment Method
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {transaction.payment_method}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              Category
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg font-medium text-xs border ${
                categoryMeta?.bgColor || 'bg-slate-100 dark:bg-slate-800'
              } ${categoryMeta?.borderColor || 'border-slate-200'}`}
              style={{ color: categoryMeta?.color }}
            >
              {transaction.category}
            </span>
          </div>

          {transaction.notes && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-1">
                <FileText className="w-4 h-4" /> Notes
              </span>
              <p className="text-slate-700 dark:text-slate-300 italic">{transaction.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Recorded
            </span>
            <span>{new Date(transaction.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={() => {
              onDelete(transaction.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
