import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';
import { SavingsGoal } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatPercentage } from '../../lib/formatters';
import { GoalFormModal } from './GoalFormModal';
import { ContributeModal } from './ContributeModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SavingsGoalsView: React.FC = () => {
  const { user } = useAuth();
  const {
    savingsGoals,
    summary,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
  } = useFinance();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();

  // Filter goals
  const filteredGoals = savingsGoals.filter((goal) => {
    const isCompleted = goal.current_amount >= goal.target_amount;
    const isPast = new Date(goal.target_date) < now;

    if (filterStatus === 'completed') return isCompleted;
    if (filterStatus === 'overdue') return !isCompleted && isPast;
    if (filterStatus === 'active') return !isCompleted && !isPast;
    return true;
  });

  // Calculate suggested monthly contribution for a goal
  const calculateSuggestedMonthly = (goal: SavingsGoal): number => {
    if (goal.current_amount >= goal.target_amount) return 0;
    const targetDate = new Date(goal.target_date);
    const monthsRemaining =
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth());

    const needed = Math.max(0, goal.target_amount - goal.current_amount);
    if (monthsRemaining <= 0) return needed; // Due this month or overdue
    return Math.ceil(needed / monthsRemaining);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Target className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">Savings Goals & Milestones</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Build wealth deliberately. Set targets, make incremental deposits, and monitor projected completion timelines.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Goals Target</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(summary.savingsGoalsSummary.totalTarget, user?.currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Accumulated</p>
          <p className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.savingsGoalsSummary.totalSaved, user?.currency)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Progress</p>
          <p className="mt-1 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatPercentage(summary.savingsGoalsSummary.overallProgress)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active / Completed</p>
          <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.savingsGoalsSummary.activeCount} Active •{' '}
            <span className="text-emerald-500">{summary.savingsGoalsSummary.completedCount} Done</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        {(
          [
            { id: 'all', label: 'All Goals' },
            { id: 'active', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'overdue', label: 'Overdue' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No goals found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any {filterStatus !== 'all' ? filterStatus : ''} goals right now.
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              setIsFormOpen(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.current_amount >= goal.target_amount;
            const isPast = new Date(goal.target_date) < now;
            const progress =
              goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
            const suggestedMonthly = calculateSuggestedMonthly(goal);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {goal.category || 'General'}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                        {goal.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target Achieved! Ready to spend or reinvest.</span>
                    </div>
                  ) : isPast ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Target Date Passed (Overdue)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Target: {formatDate(goal.target_date, user?.date_format)}</span>
                    </div>
                  )}

                  {/* Progress Bar & Amounts */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(goal.current_amount, user?.currency)}
                      </span>
                      <span className="font-mono text-slate-400">
                        Target: {formatCurrency(goal.target_amount, user?.currency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>{progress.toFixed(1)}% funded</span>
                      <span>
                        {remaining > 0
                          ? `${formatCurrency(remaining, user?.currency)} remaining`
                          : '100% Complete'}
                      </span>
                    </div>
                  </div>

                  {/* Suggested Monthly Contribution & Projected Date */}
                  {!isCompleted && suggestedMonthly > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Suggested Monthly:
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(suggestedMonthly, user?.currency)}/mo
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        * Projected completion dates are estimates based on regular monthly contributions.
                      </p>
                    </div>
                  )}

                  {goal.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      "{goal.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action: "+ Add Contribution" */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Record Contribution</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        initialGoal={editingGoal}
        onSubmit={async (data) => {
          if (editingGoal) {
            await updateSavingsGoal(editingGoal.id, data);
          } else {
            await addSavingsGoal(data);
          }
        }}
      />

      {/* Contribution Modal */}
      <ContributeModal
        isOpen={!!contributingGoal}
        goal={contributingGoal}
        onClose={() => setContributingGoal(null)}
        onContribute={async (goalId, amount) => {
          await contributeToGoal(goalId, amount);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await deleteSavingsGoal(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? Any past transaction records will remain unaffected."
        confirmText="Delete Goal"
        isDestructive={true}
      />
    </div>
  );
};
