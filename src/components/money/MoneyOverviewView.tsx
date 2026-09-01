import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownRight, ShieldCheck, Plus, Calculator, ChevronRight, Sparkles, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';
import { AffordabilityCalculator } from '@/components/money/AffordabilityCalculator';
import { showToast } from '@/components/layout/ConfirmModal';
import { IncomeCategory, PaymentMethod } from '@/types';

export function MoneyOverviewView() {
  const [overview, setOverview] = useState({
    availableBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    monthIncome: 0,
    monthExpenses: 0,
    minimumSafeBalance: 100000,
  });
  const [payWindowStatus, setPayWindowStatus] = useState<any>(null);
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState(false);
  const [isExtraFundingOpen, setIsExtraFundingOpen] = useState(false);
  const [extraFunding, setExtraFunding] = useState({
    source: 'Side Income / Bonus',
    category: 'Bonus' as IncomeCategory,
    amount: 100000,
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer' as PaymentMethod,
    description: 'Extra funding added to balance',
  });

  const loadData = async () => {
    const data = await moneyService.getFinancialOverview();
    setOverview(data);
    const status = moneyService.getPayWindowStatus();
    setPayWindowStatus(status);
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', loadData);
      return () => window.removeEventListener('oura_balance_updated', loadData);
    }
  }, []);

  const handleClaimSalary = async () => {
    const record = await moneyService.claimMonthlySalary();
    if (record) {
      showToast(`Salary payout of ${formatCurrency(record.net_salary)} confirmed and credited to balance! 🎉`, 'success');
      await loadData();
    }
  };

  const handleExtraFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFunding.amount || extraFunding.amount <= 0) return;
    await moneyService.addExtraFunding(extraFunding);
    setIsExtraFundingOpen(false);
    showToast(`Extra funding of ${formatCurrency(extraFunding.amount)} added to balance! 💰`, 'success');
    await loadData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Financial Overview & Money Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized ledger, salary calculations, transactions, and safe balance tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsExtraFundingOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add Extra Funding</span>
          </button>

          <button
            onClick={() => setIsAffordabilityOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all"
          >
            <Calculator className="w-4 h-4" />
            <span>Can I Afford This?</span>
          </button>
        </div>
      </div>

      {/* Salary Payout Active Alert Banner */}
      {payWindowStatus && payWindowStatus.isActive && !payWindowStatus.isClaimed && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-indigo-900 to-slate-900 border border-indigo-500/40 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-amber-300 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Monthly Pay Window Open ({payWindowStatus.cycleMonth})</h3>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Monthly net salary of <span className="font-bold text-emerald-400">{formatCurrency(payWindowStatus.netSalary)}</span> is ready to be credited.
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimSalary}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <DollarSign className="w-4 h-4 stroke-3" />
            <span>Confirm Salary Received</span>
          </button>
        </div>
      )}

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

      {/* Extra Funding Modal */}
      {isExtraFundingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Extra Funding</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add side income, bonus, gift, or refund to balance</p>
              </div>
            </div>

            <form onSubmit={handleExtraFundingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Funding Title / Source *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freelance Project Bonus, Gift, Tax Refund"
                  value={extraFunding.source}
                  onChange={(e) => setExtraFunding({ ...extraFunding, source: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={extraFunding.amount}
                    onChange={(e) => setExtraFunding({ ...extraFunding, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={extraFunding.category}
                    onChange={(e) => setExtraFunding({ ...extraFunding, category: e.target.value as IncomeCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Bonus">Bonus</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Business">Business</option>
                    <option value="Gift">Gift</option>
                    <option value="Commission">Commission</option>
                    <option value="Investment">Investment</option>
                    <option value="Refund">Refund</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={extraFunding.date}
                  onChange={(e) => setExtraFunding({ ...extraFunding, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtraFundingOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-md"
                >
                  Add to Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
