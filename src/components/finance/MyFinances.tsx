'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import {
  Wallet,
  Info,
  Calculator,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const MyFinances: React.FC = () => {
  const {
    activeProfile,
    activeSalary,
    transactions,
    reverseTransaction,
    currentRole
  } = useOura();

  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [affordabilityItemPrice, setAffordabilityItemPrice] = useState('');
  const [affordabilityResult, setAffordabilityResult] = useState<string | null>(null);

  // 100% Live Calculations from user transactions & active salary
  const userTx = transactions.filter((t) => t.userId === activeProfile.id || t.paidBy === currentRole);
  const credits = userTx.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const debits = userTx.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = Math.max(0, activeSalary.netSalary + credits - debits);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTx = userTx.filter((t) => t.date === todayStr);
  const todayReceived = todayTx.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const todaySpent = todayTx.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayReceived - todaySpent;

  // Payday calculation
  const today = new Date();
  const currentDay = today.getDate();
  const payday = activeSalary.salaryDate || 25;
  const daysLeft = payday >= currentDay ? payday - currentDay : 30 - currentDay + payday;

  const handleAffordabilityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(affordabilityItemPrice);
    if (!price || isNaN(price)) return;

    const remainingAfter = availableBalance - price;
    if (remainingAfter < 0) {
      setAffordabilityResult(
        `⚠️ Warning: Purchasing this ₦${price.toLocaleString()} item will exceed your current available balance by ₦${Math.abs(remainingAfter).toLocaleString()}.`
      );
    } else {
      setAffordabilityResult(
        `✅ Affordability OK: After this ₦${price.toLocaleString()} purchase, your estimated available balance will be ₦${remainingAfter.toLocaleString()}.`
      );
    }
  };

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Top Banner - My Finances */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
              <Wallet className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">MY FINANCES</h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Private ledger for {activeProfile.name}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFormulaModal(true)}
          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3.5 py-2 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all shrink-0 whitespace-nowrap"
        >
          <Info className="w-4 h-4" /> How balance is calculated
        </button>
      </div>

      {/* Main Financial Overview Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Available Balance</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 truncate">
              {activeProfile.isDiscreetMode ? '••••••••' : `₦${availableBalance.toLocaleString()} NGN`}
            </h3>
          </div>
          <span className="bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] px-3 py-1.5 rounded-full border border-white/20 shrink-0 whitespace-nowrap">
            {activeSalary.netSalary > 0 ? `Payday in ${daysLeft} Days` : 'Payday Unconfigured'}
          </span>
        </div>

        {/* Micro Cash-Flow Trend Curve SVG Representation */}
        <div className="my-3 h-14 w-full flex items-end">
          <svg className="w-full h-full text-indigo-200" viewBox="0 0 300 60" fill="none" preserveAspectRatio="none">
            <path
              d="M0 45 C 50 50, 100 20, 150 35 C 200 50, 250 10, 300 25 L 300 60 L 0 60 Z"
              fill="currentColor"
              fillOpacity="0.15"
            />
            <path
              d="M0 45 C 50 50, 100 20, 150 35 C 200 50, 250 10, 300 25"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Stats Grid inside card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-white/15">
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm min-w-0">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold">Net Salary</span>
            <strong className="text-xs sm:text-sm font-bold truncate block">₦{activeSalary.netSalary.toLocaleString()}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm min-w-0">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold">Total Income</span>
            <strong className="text-xs sm:text-sm font-bold text-emerald-300 truncate block">₦{credits.toLocaleString()}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm min-w-0">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold">Total Expenses</span>
            <strong className="text-xs sm:text-sm font-bold text-rose-300 truncate block">₦{debits.toLocaleString()}</strong>
          </div>
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm min-w-0">
            <span className="text-indigo-200 block text-[10px] uppercase font-bold">Reserved</span>
            <strong className="text-xs sm:text-sm font-bold text-amber-300 truncate block">₦0</strong>
          </div>
        </div>
      </div>

      {/* Daily Balance & Affordability Check Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Balance Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TODAY'S LEDGER SUMMARY</h4>
            <span className="text-xs text-slate-400 font-semibold">{todayStr}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block font-bold">Received</span>
              <strong className="text-xs font-extrabold text-emerald-700">₦{todayReceived.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-[10px] text-rose-700 block font-bold">Spent</span>
              <strong className="text-xs font-extrabold text-rose-700">₦{todaySpent.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-[10px] text-indigo-700 block font-bold">Net Flow</span>
              <strong className={`text-xs font-extrabold ${todayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {todayNet >= 0 ? `+₦${todayNet.toLocaleString()}` : `-₦${Math.abs(todayNet).toLocaleString()}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Purchase Affordability Calculator */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-indigo-600" /> AFFORDABILITY CHECKER
          </h4>
          <form onSubmit={handleAffordabilityCheck} className="space-y-2 text-xs">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter item price (e.g. 500000)"
                value={affordabilityItemPrice}
                onChange={(e) => setAffordabilityItemPrice(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-indigo-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shrink-0 whitespace-nowrap"
              >
                Check
              </button>
            </div>
            {affordabilityResult && (
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium mt-2">
                {affordabilityResult}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Transactions History Ledger */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">RECENT TRANSACTIONS</h3>
          <span className="text-xs text-slate-500 font-medium">{userTx.length} records</span>
        </div>

        {userTx.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No transactions logged yet for this account. Tap the yellow + button to log your first transaction!
          </div>
        ) : (
          <div className="space-y-2.5">
            {userTx.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 ${
                      tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {tx.type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-semibold px-2 py-0.5 bg-white rounded-full border border-slate-200">
                        {tx.category}
                      </span>
                      <span>{tx.date}</span>
                      {tx.isShared && <span className="text-indigo-600 font-bold">• Shared (Us)</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-black block ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'credit' ? `+₦${tx.amount.toLocaleString()}` : `-₦${tx.amount.toLocaleString()}`}
                  </span>
                  {tx.status !== 'refunded' && (
                    <button
                      onClick={() => reverseTransaction(tx.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5 ml-auto mt-0.5 font-semibold"
                      title="Reverse transaction / Record refund"
                    >
                      <RefreshCw className="w-3 h-3" /> Revert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Balance Calculation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" /> Transparent Balance Calculation
            </h3>

            <div className="space-y-3 text-xs text-slate-700 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 font-mono">
              <div className="flex justify-between">
                <span>Net Salary:</span>
                <strong className="text-indigo-900">₦{activeSalary.netSalary.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>+ Income / Deposits:</span>
                <strong>+₦{credits.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>− Expenses:</span>
                <strong>−₦{debits.toLocaleString()}</strong>
              </div>
              <div className="border-t border-indigo-200 pt-2 flex justify-between font-black text-indigo-700 text-sm">
                <span>= Available Balance:</span>
                <span>₦{availableBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
