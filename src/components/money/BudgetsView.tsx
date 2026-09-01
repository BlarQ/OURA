'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Budget, ExpenseCategory } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency, getBudgetStatus } from '@/lib/calculations/money';
import { showConfirmModal } from '@/components/layout/ConfirmModal';

export function BudgetsView() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Transport');
  const [amount, setAmount] = useState('');
  const currentMonth = new Date().toISOString().substring(0, 7);

  const loadBudgets = async () => {
    const list = await moneyService.getBudgets(currentMonth);
    setBudgets(list);
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const bAmt = parseFloat(amount);
    if (isNaN(bAmt) || bAmt <= 0) return;

    await moneyService.createOrUpdateBudget({
      month: currentMonth,
      category,
      budgeted_amount: bAmt,
    });

    setAmount('');
    setIsModalOpen(false);
    await loadBudgets();
  };

  const handleDelete = (id: string) => {
    showConfirmModal({
      title: 'Delete Category Budget?',
      message: 'Are you sure you want to delete this category budget limit? Threshold alerts for this category will be disabled.',
      isDanger: true,
      confirmText: 'Delete Budget',
      onConfirm: async () => {
        await moneyService.deleteBudget(id);
        await loadBudgets();
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Category Budgets & Thresholds</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Category thresholds calculated dynamically from your logged expense transactions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No monthly budgets set yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set budget thresholds for Transport, Food, Housing, etc. to get threshold warning notifications!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const { percentage, status, color } = getBudgetStatus(b.spent_amount, b.budgeted_amount);
            return (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{b.category}</h3>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${color}`}>
                      {status} ({percentage}%)
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Spent: {formatCurrency(b.spent_amount)}</span>
                  <span className="text-slate-900 dark:text-white font-bold">Limit: {formatCurrency(b.budgeted_amount)}</span>
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage >= 100 ? 'bg-rose-600' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Set Category Budget</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Transport">Transport</option>
                  <option value="Food">Food</option>
                  <option value="Internet">Internet</option>
                  <option value="Housing">Housing</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Health">Health</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Monthly Budgeted Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
