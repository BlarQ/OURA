'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, ArrowUpRight, Trash2 } from 'lucide-react';
import { IncomeRecord, IncomeCategory, PaymentMethod } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';
import { showToast, showConfirmModal } from '@/components/layout/ConfirmModal';

export function IncomeView() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Freelance');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadIncome = async () => {
    const list = await moneyService.getIncomeRecords();
    setIncomes(list);
  };

  useEffect(() => {
    loadIncome();
    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', loadIncome);
      return () => window.removeEventListener('oura_balance_updated', loadIncome);
    }
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!source || isNaN(amt) || amt <= 0) return;

    await moneyService.addIncome({
      source,
      amount: amt,
      category,
      date,
      payment_method: 'Bank Transfer',
    });

    setSource('');
    setAmount('');
    setIsModalOpen(false);
    showToast(`Income of ${formatCurrency(amt)} added!`, 'success');
    await loadIncome();
  };

  const handleDeleteIncome = (id: string, sourceName: string) => {
    showConfirmModal({
      title: 'Delete Income Record?',
      message: `Are you sure you want to delete this income entry ("${sourceName}")? This will update your available balance and transactions ledger.`,
      isDanger: true,
      confirmText: 'Delete Income',
      onConfirm: async () => {
        const deleted = await moneyService.deleteIncomeRecord(id);
        if (deleted) {
          showToast(`Income entry deleted.`, 'success');
          await loadIncome();
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Income Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record all incoming revenues and automatically generate credit transactions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shrink-0 whitespace-nowrap active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      <div className="space-y-3">
        {incomes.map((inc) => (
          <div
            key={inc.id}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                  {inc.source}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {inc.category} • {inc.date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="shrink-0 whitespace-nowrap text-right">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(inc.amount)}
                </span>
              </div>

              <button
                onClick={() => handleDeleteIncome(inc.id, inc.source)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                title="Delete Income Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Record Income</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Source / Payer *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freelance Client, Gift"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Business">Business</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Gift">Gift</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-md"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
