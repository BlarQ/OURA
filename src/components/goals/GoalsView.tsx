'use client';

import React, { useState, useEffect } from 'react';
import {
  Flag, Plus, Edit2, Trash2, Calendar, Target, TrendingUp,
  DollarSign, Clock, ShieldCheck, ChevronDown, ChevronUp, History,
  Sparkles, X, CheckCircle, ArrowRight
} from 'lucide-react';
import { Goal, GoalCategory, GoalDeposit } from '@/types';
import { goalService } from '@/lib/services/goals';
import { formatCurrency } from '@/lib/calculations/money';
import { showConfirmModal, showToast } from '@/components/layout/ConfirmModal';

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Financial');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingFrequency, setSavingFrequency] = useState<'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly'>('Monthly');
  const [progress, setProgress] = useState<number>(0);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositNote, setDepositNote] = useState('');

  const loadGoals = async () => {
    const list = await goalService.getGoals();
    setGoals(list);
  };

  useEffect(() => {
    loadGoals();

    const handleGoalUpdated = () => {
      loadGoals();
    };

    window.addEventListener('oura_goal_updated', handleGoalUpdated);
    return () => window.removeEventListener('oura_goal_updated', handleGoalUpdated);
  }, []);

  // Aggregated Summary Statistics
  const financialGoals = goals.filter((g) => (g.target_amount || 0) > 0 || g.category === 'Financial');
  const totalTargetSavings = financialGoals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
  const totalSavedSoFar = financialGoals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);
  const totalRemainingToSave = Math.max(0, totalTargetSavings - totalSavedSoFar);
  const overallSavingsRate = totalTargetSavings > 0
    ? Math.min(100, Math.round((totalSavedSoFar / totalTargetSavings) * 100))
    : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a goal title', 'error');
      return;
    }

    const tAmt = parseFloat(targetAmount) || 0;
    const initAmt = parseFloat(initialAmount) || 0;

    if (editingGoal) {
      await goalService.updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        target_amount: tAmt,
        current_amount: tAmt > 0 ? (editingGoal.current_amount || initAmt) : 0,
        target_date: targetDate,
        saving_frequency: savingFrequency,
        progress: tAmt > 0
          ? Math.min(100, Math.round(((editingGoal.current_amount || initAmt) / tAmt) * 100))
          : progress,
        status: (tAmt > 0 && (editingGoal.current_amount || initAmt) >= tAmt) ? 'Achieved' : 'In Progress',
      });
      showToast('Goal updated successfully!', 'success');
      setEditingGoal(null);
    } else {
      const initialDeposits: GoalDeposit[] = initAmt > 0 ? [{
        id: `dep_${Date.now()}`,
        goal_id: '',
        amount: initAmt,
        date: new Date().toISOString().split('T')[0],
        note: 'Initial Savings Deposit',
        created_at: new Date().toISOString().split('T')[0],
      }] : [];

      await goalService.createGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        target_amount: tAmt,
        current_amount: initAmt,
        target_date: targetDate,
        saving_frequency: savingFrequency,
        deposits: initialDeposits,
        status: (tAmt > 0 && initAmt >= tAmt) ? 'Achieved' : 'In Progress',
        progress: tAmt > 0 ? Math.min(100, Math.round((initAmt / tAmt) * 100)) : progress,
      });
      showToast(`Created "${title.trim()}" savings goal!`, 'success');
    }

    resetForm();
    setIsModalOpen(false);
    await loadGoals();
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }

    await goalService.contributeToGoal(
      depositGoal.id,
      amt,
      depositNote.trim() || 'Savings Contribution',
      depositDate
    );

    showToast(`Logged +₦${amt.toLocaleString()} to ${depositGoal.title}! 💰`, 'success');
    setDepositAmount('');
    setDepositNote('');
    setDepositGoal(null);
    await loadGoals();
  };

  const handleDeleteDeposit = async (goalId: string, depositId: string) => {
    showConfirmModal({
      title: 'Remove Deposit Entry?',
      message: 'Are you sure you want to remove this savings deposit entry? Total savings will be updated.',
      isDanger: true,
      confirmText: 'Remove Deposit',
      onConfirm: async () => {
        await goalService.deleteDeposit(goalId, depositId);
        showToast('Deposit entry removed', 'info');
        await loadGoals();
      },
    });
  };

  const handleEditClick = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setCategory(g.category);
    setTargetAmount(g.target_amount ? String(g.target_amount) : '');
    setInitialAmount(g.current_amount ? String(g.current_amount) : '');
    setTargetDate(g.target_date || new Date().toISOString().split('T')[0]);
    setSavingFrequency(g.saving_frequency || 'Monthly');
    setProgress(g.progress || 0);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    showConfirmModal({
      title: 'Delete Savings Goal?',
      message: 'Are you sure you want to delete this goal and its savings history?',
      isDanger: true,
      confirmText: 'Delete Goal',
      onConfirm: async () => {
        await goalService.deleteGoal(id);
        showToast('Goal deleted', 'info');
        await loadGoals();
      },
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Financial');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setSavingFrequency('Monthly');
    setProgress(0);
    setEditingGoal(null);
  };

  const calculatePace = (goal: Goal) => {
    const tAmt = Number(goal.target_amount) || 0;
    if (tAmt <= 0) return null;

    const current = Number(goal.current_amount) || 0;
    const left = Math.max(0, tAmt - current);
    if (left <= 0) {
      return {
        completed: true,
        left: 0,
        text: 'Goal fully achieved! 🎉',
        monthlyAmount: 0,
        weeklyAmount: 0,
        dailyAmount: 0,
      };
    }

    if (!goal.target_date) {
      return {
        completed: false,
        left,
        text: `₦${left.toLocaleString()} remaining`,
        monthlyAmount: left,
        weeklyAmount: Math.ceil(left / 4),
        dailyAmount: Math.ceil(left / 30),
      };
    }

    const targetTime = new Date(goal.target_date).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.max(1, Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
    const diffMonths = Math.max(1, Math.ceil(diffDays / 30.4));
    const diffWeeks = Math.max(1, Math.ceil(diffDays / 7));

    const monthlyAmount = Math.ceil(left / diffMonths);
    const weeklyAmount = Math.ceil(left / diffWeeks);
    const dailyAmount = Math.ceil(left / diffDays);

    const freq = goal.saving_frequency || 'Monthly';
    const paceText = freq === 'Weekly'
      ? `Save ₦${weeklyAmount.toLocaleString()} / week`
      : freq === 'Daily'
      ? `Save ₦${dailyAmount.toLocaleString()} / day`
      : `Save ₦${monthlyAmount.toLocaleString()} / month`;

    return {
      completed: false,
      left,
      diffDays,
      diffMonths,
      diffWeeks,
      monthlyAmount,
      weeklyAmount,
      dailyAmount,
      frequency: freq,
      paceText,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Savings Goals & Target Plans</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create structured savings plans, log deposits, and track amount left to complete targets
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Plan</span>
        </button>
      </div>

      {/* Top Financial Savings Overview Cards */}
      {financialGoals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-500 block">Total Target Savings</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(totalTargetSavings)}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">Total Saved So Far</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSavedSoFar)}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">Amount Left to Complete</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(totalRemainingToSave)}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">Overall Completion</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {overallSavingsRate}% Achieved
            </span>
          </div>
        </div>
      )}

      {/* Grid or Empty State */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No savings goals created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a savings plan for rent, emergency fund, investments, or travel, and log each saved amount!
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {goals.map((g) => {
            const isFinancial = (g.target_amount || 0) > 0 || g.category === 'Financial';
            const pace = calculatePace(g);
            const isExpanded = expandedPlanId === g.id;
            const depositsCount = g.deposits?.length || 0;

            return (
              <div
                key={g.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between transition-all"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {g.category}
                      </span>
                      {g.status === 'Achieved' && (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Achieved</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {g.progress}% Achieved
                      </span>
                      <button
                        onClick={() => handleEditClick(g)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(g.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{g.title}</h3>
                    {g.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {g.description}
                      </p>
                    )}
                  </div>

                  {/* Financial Goal Numbers & Progress */}
                  {isFinancial && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-left">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">Total Saved</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(g.current_amount || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">Target Amount</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(g.target_amount || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">Amount Left</span>
                          <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(Math.max(0, (g.target_amount || 0) - (g.current_amount || 0)))}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>

                      {/* Structured Saving Pace Banner */}
                      {pace && !pace.completed && (
                        <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>Structured Plan:</span>
                          </span>
                          <span className="font-extrabold bg-indigo-100/80 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                            {pace.paceText}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isFinancial && (
                    <div className="space-y-1.5">
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Target Date */}
                  {g.target_date && (
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Target Date: {g.target_date}</span>
                      </span>
                      {pace && !pace.completed && pace.diffDays && (
                        <span className="text-[11px] font-bold text-slate-400">
                          {pace.diffDays} days left
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setDepositGoal(g);
                        setDepositAmount('');
                        setDepositNote('');
                        setDepositDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Log Savings</span>
                    </button>

                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : g.id)}
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>History ({depositsCount})</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expanded Savings Log History */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        <span>Savings Deposits Log</span>
                        <span>{depositsCount} entries</span>
                      </div>

                      {depositsCount === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-2">
                          No savings deposited yet. Click 'Log Savings' above to start!
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {g.deposits?.map((dep) => (
                            <div
                              key={dep.id}
                              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-xs">
                                  +₦{dep.amount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {dep.date} • {dep.note || 'Savings Deposit'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteDeposit(g.id, dep.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Savings Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp max-h-[96vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Savings Plan' : 'Create Savings Plan & Target'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Plan / Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Save for Rent, Emergency Fund, Car Loan Payoff"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Amount (₦) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Saved (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Financial">Financial / Savings</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                    <option value="Travel">Travel</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Saving Frequency
                  </label>
                  <select
                    value={savingFrequency}
                    onChange={(e) => setSavingFrequency(e.target.value as any)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Date (Duration Deadline) *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description &amp; Strategy (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Save from monthly salary payout into high-yield account"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  {editingGoal ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Savings Deposit Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  Log Savings Deposit
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">
                  Deposit to {depositGoal.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saved so far: {formatCurrency(depositGoal.current_amount || 0)} / Target: {formatCurrency(depositGoal.target_amount || 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepositGoal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5">
              {/* Preset Quick Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Quick Select Amount</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(String(preset))}
                      className="py-1 px-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-slate-200/80 dark:border-slate-700 transition-colors truncate"
                    >
                      +₦{preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount to Deposit (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-black border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Deposit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Note / Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salary savings"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Deposit Impact Preview */}
              {parseFloat(depositAmount) > 0 && depositGoal.target_amount && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 space-y-0.5">
                  <span className="font-bold block">Deposit Preview:</span>
                  <span>
                    New total: <strong>{formatCurrency((depositGoal.current_amount || 0) + parseFloat(depositAmount))}</strong> (
                    {Math.min(100, Math.round((((depositGoal.current_amount || 0) + parseFloat(depositAmount)) / depositGoal.target_amount) * 100))}%).
                    Remaining: {formatCurrency(Math.max(0, depositGoal.target_amount - ((depositGoal.current_amount || 0) + parseFloat(depositAmount))))} left.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Save Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
