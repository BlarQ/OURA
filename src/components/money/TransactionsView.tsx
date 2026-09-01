'use client';

import React, { useState, useEffect } from 'react';
import { Layers, FileText, Trash2 } from 'lucide-react';
import { Transaction } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';
import { generateTransactionsPDF } from '@/lib/utils/pdfExport';
import { showToast, showConfirmModal } from '@/components/layout/ConfirmModal';

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTx = async () => {
    const list = await moneyService.getTransactions();
    setTransactions(list);
  };

  useEffect(() => {
    loadTx();
    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', loadTx);
      return () => window.removeEventListener('oura_balance_updated', loadTx);
    }
  }, []);

  const handleDeleteTransaction = (id: string, description: string, type: 'CREDIT' | 'DEBIT') => {
    const isCredit = type === 'CREDIT';
    showConfirmModal({
      title: `Delete ${isCredit ? 'Credit' : 'Debit'} Transaction?`,
      message: `Are you sure you want to delete this transaction ("${description}")? Deleting a ${isCredit ? 'credit entry will reduce' : 'debit entry will reverse and increase'} your available balance.`,
      isDanger: true,
      confirmText: 'Delete Transaction',
      onConfirm: async () => {
        const deleted = await moneyService.deleteTransaction(id);
        if (deleted) {
          showToast(`Transaction deleted. Balance updated!`, 'success');
          await loadTx();
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Financial Transaction Ledger</span>
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
                <th className="p-4 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-semibold text-slate-500 whitespace-nowrap">{tx.transaction_date}</td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{tx.description}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {tx.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {tx.type === 'DEBIT' ? `-${formatCurrency(tx.amount)}` : '—'}
                  </td>
                  <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {tx.type === 'CREDIT' ? `+${formatCurrency(tx.amount)}` : '—'}
                  </td>
                  <td className="p-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteTransaction(tx.id, tx.description, tx.type)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
