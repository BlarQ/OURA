'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle } from 'lucide-react';
import { PlanItem } from '@/types';
import { formatCurrency } from '@/lib/calculations/money';

interface PurchasedModalProps {
  item: PlanItem;
  onClose: () => void;
  onConfirmPurchase: (actualAmount: number) => void;
}

export function PurchasedModal({ item, onClose, onConfirmPurchase }: PurchasedModalProps) {
  const [actualInput, setActualInput] = useState<string>(item.estimated_amount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(actualInput);
    if (isNaN(amt) || amt <= 0) return;

    onConfirmPurchase(amt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Mark as Purchased
              </h2>
              <p className="text-xs text-slate-500">
                {item.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
          <span className="font-bold text-amber-900 dark:text-amber-300 block">Automated Ledger Action:</span>
          <p className="text-amber-800 dark:text-amber-400">
            Marking this plan item as purchased will automatically log an Expense record and a DEBIT transaction to your financial ledger!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Estimated Price: {formatCurrency(item.estimated_amount)}
            </label>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Actual Amount Paid (₦) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={actualInput}
              onChange={(e) => setActualInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Purchase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
