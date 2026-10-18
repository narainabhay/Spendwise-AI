import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Pause,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Info,
} from 'lucide-react';
import { RecurringTransaction } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { CATEGORIES } from '../../lib/constants';
import { CategoryIcon } from '../common/CategoryIcon';
import { RecurringFormModal } from './RecurringFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const RecurringView: React.FC = () => {
  const { user } = useAuth();
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processDueRecurring,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessDue = async () => {
    setIsProcessing(true);
    try {
      await processDueRecurring();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">Recurring Schedules & Subscriptions</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Manage scheduled commitments like salary, rent, and software subscriptions. Use the explicit review workflow below to process due records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleProcessDue}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isProcessing ? 'Processing...' : 'Process Due Items Now'}</span>
          </button>

          <button
            onClick={() => {
              setEditingRule(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Manual Processing Safeguard:</strong> In adherence to strict financial accuracy principles, recurring items are reviewed and generated via the "Process Due Items" button to ensure duplicate debits are never silently posted without your audit.
        </p>
      </div>

      {/* List of Recurring Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {recurringTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No recurring rules defined
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Set up your regular salary, rent, utilities, and memberships to keep track of upcoming commitments.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recurringTransactions.map((rule) => {
              const isIncome = rule.type === 'income';
              const categoryMeta = CATEGORIES.find((c) => c.name === rule.category);

              return (
                <div
                  key={rule.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`p-3 rounded-xl border shrink-0 ${
                        categoryMeta?.bgColor || 'bg-slate-100'
                      } ${categoryMeta?.borderColor || 'border-slate-200'}`}
                      style={{ color: categoryMeta?.color }}
                    >
                      <CategoryIcon category={rule.category} className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {rule.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {rule.frequency}
                        </span>
                        {!rule.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{rule.category}</span>
                        <span>•</span>
                        <span>{rule.payment_method}</span>
                        <span>•</span>
                        <span>Starts: {formatDate(rule.start_date, user?.date_format)}</span>
                        {rule.last_processed_date && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Last posted: {formatDate(rule.last_processed_date, user?.date_format)}
                            </span>
                          </>
                        )}
                      </div>

                      {rule.notes && (
                        <p className="text-xs text-slate-400 italic mt-1">"{rule.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right font-mono font-bold">
                      <p
                        className={`text-base ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(rule.amount, user?.currency)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-sans">
                        billed {rule.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateRecurringTransaction(rule.id, { is_active: !rule.is_active })
                        }
                        title={rule.is_active ? 'Pause Schedule' : 'Resume Schedule'}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsFormOpen(true);
                        }}
                        title="Edit schedule"
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingId(rule.id)}
                        title="Delete schedule"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <RecurringFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRule(null);
        }}
        initialData={editingRule}
        onSubmit={async (data) => {
          if (editingRule) {
            await updateRecurringTransaction(editingRule.id, data);
          } else {
            await addRecurringTransaction(data);
          }
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteRecurringTransaction(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Recurring Schedule"
        message="Are you sure you want to delete this recurring rule? Existing transactions previously posted will remain intact."
        confirmText="Delete Schedule"
        isDestructive={true}
      />
    </div>
  );
};
