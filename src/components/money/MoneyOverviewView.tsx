'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownRight, ShieldCheck, Plus, Calculator, ChevronRight } from 'lucide-react';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';
import { AffordabilityCalculator } from '@/components/money/AffordabilityCalculator';

export function MoneyOverviewView() {
  const [overview, setOverview] = useState({
    availableBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    monthIncome: 0,
    monthExpenses: 0,
    minimumSafeBalance: 100000,
  });
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await moneyService.getFinancialOverview();
      setOverview(data);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Financial Overview & Money Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized ledger, salary calculations, transactions, and safe balance tracking
          </p>
        </div>

        <button
          onClick={() => setIsAffordabilityOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all"
        >
          <Calculator className="w-4 h-4" />
          <span>Can I Afford This?</span>
        </button>
      </div>

      {/* Main Balance Card */}
      <div className="bg-linear-to-br from-emerald-900 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/60 relative overflow-hidden space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Available Net Balance</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            {formatCurrency(overview.availableBalance)}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-800/60 text-xs">
          <div>
            <span className="text-emerald-300/80 block">Total Lifetime Credits</span>
            <span className="text-lg font-extrabold text-white">{formatCurrency(overview.totalCredits)}</span>
          </div>
          <div>
            <span className="text-emerald-300/80 block">Total Lifetime Debits</span>
            <span className="text-lg font-extrabold text-rose-300">{formatCurrency(overview.totalDebits)}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-emerald-300/80 block">Minimum Safe Balance</span>
            <span className="text-lg font-extrabold text-amber-300">{formatCurrency(overview.minimumSafeBalance)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/money/salary" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-2 group">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 w-fit group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Salary</h3>
          <p className="text-[11px] text-slate-500">Gross/Net Payouts</p>
        </Link>

        <Link href="/money/income" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-2 group">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 w-fit group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Income</h3>
          <p className="text-[11px] text-slate-500">Freelance & Gifts</p>
        </Link>

        <Link href="/money/expenses" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-2 group">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 w-fit group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Expenses</h3>
          <p className="text-[11px] text-slate-500">Categorized Debits</p>
        </Link>

        <Link href="/money/transactions" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all space-y-2 group">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 w-fit group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Transactions</h3>
          <p className="text-[11px] text-slate-500">Running Ledger</p>
        </Link>
      </div>

      {/* Affordability Calculator Modal */}
      {isAffordabilityOpen && (
        <AffordabilityCalculator onClose={() => setIsAffordabilityOpen(false)} />
      )}
    </div>
  );
}
