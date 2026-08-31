'use client';

import React, { useState, useEffect } from 'react';
import { Layers, FileText } from 'lucide-react';
import { Transaction } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';
import { generateTransactionsPDF } from '@/lib/utils/pdfExport';

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTx() {
      const list = await moneyService.getTransactions();
      setTransactions(list);
    }
    loadTx();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Financial Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete credit and debit running ledger
          </p>
        </div>

        <button
          onClick={() => generateTransactionsPDF()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Export PDF Statement</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-slate-500">{tx.transaction_date}</td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{tx.description}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {tx.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                    {tx.type === 'DEBIT' ? `-${formatCurrency(tx.amount)}` : '—'}
                  </td>
                  <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    {tx.type === 'CREDIT' ? `+${formatCurrency(tx.amount)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
