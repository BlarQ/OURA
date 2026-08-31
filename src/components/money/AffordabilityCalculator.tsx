'use client';

import React, { useState } from 'react';
import { X, Calculator, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { AffordabilityCalculation } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';

interface AffordabilityCalculatorProps {
  onClose: () => void;
}

export function AffordabilityCalculator({ onClose }: AffordabilityCalculatorProps) {
  const [itemName, setItemName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [result, setResult] = useState<AffordabilityCalculation | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0 || !itemName.trim()) return;

    const calc = await moneyService.testAffordability(itemName.trim(), amt);
    setResult(calc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Can I Afford This?
              </h2>
              <p className="text-xs text-slate-500">
                Test planned purchases against safe balance thresholds
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCalculate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Planned Purchase Item *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. New Laptop, Refrigerator"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Estimated Cost (₦) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="80000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all"
          >
            Calculate Affordability
          </button>
        </form>

        {/* Result View */}
        {result && (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fadeIn">
            <div className="flex items-center gap-3">
              {result.status === 'Affordable' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : result.status === 'Caution' ? (
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
              )}
              <div>
                <span
                  className={`text-xs font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                    result.status === 'Affordable'
                      ? 'bg-emerald-100 text-emerald-800'
                      : result.status === 'Caution'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {result.status}
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                  {result.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 block">Current Balance</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(result.current_balance)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Projected Balance</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(result.projected_balance)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
