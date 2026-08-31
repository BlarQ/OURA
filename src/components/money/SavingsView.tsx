'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { SavingsGoal } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';

export function SavingsView() {
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);

  // New Goal Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('');

  const loadSavings = async () => {
    const list = await moneyService.getSavingsGoals();
    setSavings(list);
  };

  useEffect(() => {
    loadSavings();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount);
    if (!name.trim() || isNaN(tAmt) || tAmt <= 0) return;

    await moneyService.createSavingsGoal({
      name: name.trim(),
      target_amount: tAmt,
      current_amount: 0,
      status: 'In Progress',
    });

    setName('');
    setTargetAmount('');
    setIsCreateModalOpen(false);
    await loadSavings();
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    await moneyService.contributeToSavings(depositGoal.id, amt);
    setDepositAmount('');
    setDepositGoal(null);
    await loadSavings();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Savings Goals & Emergency Reserve
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build liquid cash reserves and track goal progress
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Grid or Empty State */}
      {savings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No savings goals created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Build liquid emergency reserves or save towards big purchases. Click 'New Savings Goal' to start!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savings.map((sav) => {
            const pct = Math.min(100, Math.round((sav.current_amount / sav.target_amount) * 100));
            return (
              <div
                key={sav.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{sav.name}</h3>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {pct}% Reached
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">Saved: {formatCurrency(sav.current_amount)}</span>
                    <span className="text-slate-900 dark:text-white">Target: {formatCurrency(sav.target_amount)}</span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDepositGoal(sav);
                    setDepositAmount('');
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Deposit / Contribute Funds</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* New Savings Goal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">New Savings Goal</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Reserve, Car, Vacation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="500000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Contribution Popup Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                Deposit Funds
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                Contribute to {depositGoal.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Current: {formatCurrency(depositGoal.current_amount)} / Target: {formatCurrency(depositGoal.target_amount)}
              </p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {/* Preset Quick Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[5000, 10000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositAmount(String(preset))}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    +₦{(preset / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Deposit Amount (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter amount to contribute"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20"
                >
                  Deposit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
