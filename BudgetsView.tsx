import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sliders,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Budget, Category } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { CATEGORIES } from '../../lib/constants';
import { CategoryIcon } from '../common/CategoryIcon';
import { BudgetFormModal } from './BudgetFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';

export const BudgetsView: React.FC = () => {
  const { user } = useAuth();
  const {
    budgets,
    summary,
    saveBudget,
    deleteBudget,
    addToast,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Suggestion State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleRequestAiBudget = async () => {
    setIsAiLoading(true);
    try {
      const categorySpending = summary.categoryBreakdown.reduce((acc, curr) => {
        acc[curr.category] = curr.amount;
        return acc;
      }, {} as Record<string, number>);

      const res = await fetch('/api/ai/suggest-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: summary.monthlyIncome,
          categorySpending,
          currencySymbol: user?.currency === 'INR' ? '₹' : '$',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate budget suggestions');
      }

      setAiSuggestions(data);
      setIsAiModalOpen(true);
    } catch (err: any) {
      addToast(
        'error',
        'AI Budget Suggestion Notice',
        err?.message || 'Could not connect to Gemini AI. Check your server settings.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiBudget = async (category: string, amount: number) => {
    await saveBudget(category as any, amount, 80);
    addToast('success', 'Budget Applied', `Updated ${category} budget to ${formatCurrency(amount, user?.currency)}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with AI Budget Suggester */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">Smart Budget Planner & Guardrails</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Set proactive monthly spending limits. Automatic alerts trigger at 80% warning and 100% budget breach based on actual transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestAiBudget}
            disabled={isAiLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>{isAiLoading ? 'Analyzing Spending...' : 'AI Suggest Budgets'}</span>
          </button>

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {summary.budgetPerformance.map((bp) => {
          const isOver = bp.isOverBudget;
          const isNear = bp.isNearLimit;
          const isAll = bp.category === 'all';
          const originalBudget = budgets.find((b) => b.category === bp.category);
          const categoryMeta = isAll ? null : CATEGORIES.find((c) => c.name === bp.category);

          return (
            <div
              key={bp.category}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
                isOver
                  ? 'border-rose-500/60 ring-1 ring-rose-500/30 bg-rose-500/5'
                  : isNear
                  ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-500/5'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isAll
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                        : categoryMeta?.bgColor || 'bg-slate-100'
                    }`}
                    style={!isAll && categoryMeta ? { color: categoryMeta.color } : {}}
                  >
                    {isAll ? <Sliders className="w-5 h-5" /> : <CategoryIcon category={bp.category} className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAll ? 'Total Monthly Limit' : bp.category}
                    </h3>
                    <p className="text-[11px] text-slate-400">Monthly budget cap</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {originalBudget && (
                    <>
                      <button
                        onClick={() => {
                          setEditingBudget(originalBudget);
                          setIsFormOpen(true);
                        }}
                        title="Edit limit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(originalBudget.id)}
                        title="Delete budget"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status Pill Alert */}
              <div className="mt-3">
                {isOver ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Budget Exceeded by {formatCurrency(bp.spent - bp.limit, user?.currency)}!</span>
                  </div>
                ) : isNear ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Warning: 80%+ limit reached</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>On Track ({formatCurrency(bp.remaining, user?.currency)} remaining)</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(bp.spent, user?.currency)}
                  </span>
                  <span className="text-slate-400 font-mono">
                    of {formatCurrency(bp.limit, user?.currency)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, bp.percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{bp.percentage.toFixed(0)}% utilized</span>
                  <span>Cap: {formatCurrency(bp.limit, user?.currency)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Budget Recommendation Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI-Suggested Monthly Budgets"
        subtitle="Calculated by Gemini AI based on your actual income and historical spending"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {aiSuggestions?.generalAdvice && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              <p className="font-bold mb-1">Financial Advisor Insight:</p>
              <p>{aiSuggestions.generalAdvice}</p>
            </div>
          )}

          <div className="space-y-2.5">
            {aiSuggestions?.categoryBudgets?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.category}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{item.reasoning}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(item.recommendedLimit, user?.currency)}
                  </span>
                  <button
                    onClick={() => handleApplyAiBudget(item.category, item.recommendedLimit)}
                    className="px-2.5 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Budget Set / Edit Form Modal */}
      <BudgetFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
        initialBudget={editingBudget}
        onSubmit={async (cat, limit, threshold) => {
          await saveBudget(cat, limit, threshold);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteBudget(deletingId);
            setDeletingId(null);
          }
        }}
        title="Remove Budget"
        message="Are you sure you want to remove this budget guardrail? You can re-create it at any time."
        confirmText="Remove"
        isDestructive={true}
      />
    </div>
  );
};
