'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import {
  Moon,
  Heart,
  ChevronDown,
  ArrowRight,
  Wallet,
  CreditCard,
  PiggyBank,
  ShoppingBag,
  Layers,
  Plus
} from 'lucide-react';

export const AttentionCenter: React.FC = () => {
  const {
    activeProfile,
    activeSalary,
    transactions,
    householdItems,
    savingsGoals,
    dutyDays,
    cyclePrediction,
    setActiveTab,
    setQuickActionOpen
  } = useOura();

  const tomorrowDuty = dutyDays && dutyDays.length > 1 ? dutyDays[1] : null;

  // Dynamic Finance Metrics (100% computed from live user state)
  const userTx = transactions.filter((t) => t.userId === activeProfile.id || t.paidBy === activeProfile.role);
  const credits = userTx.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const debits = userTx.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = credits - debits;

  const householdTotal = householdItems.reduce((sum, item) => sum + item.currentPrice, 0);
  const workplaceTotal = householdItems
    .filter((i) => i.isWorkplaceApartment || i.category === 'Workplace Apartment')
    .reduce((sum, item) => sum + item.currentPrice, 0);

  const dreamHomeGoal = savingsGoals.find((g) => g.category === 'dream_home');
  const savingsAmount = dreamHomeGoal?.currentAmount || 0;
  const savingsPct = dreamHomeGoal ? Math.round((savingsAmount / dreamHomeGoal.targetAmount) * 100) : 0;

  const salaryDisplay = activeProfile.isDiscreetMode
    ? '••••••••'
    : activeSalary.netSalary > 0
    ? `₦${activeSalary.netSalary.toLocaleString()}`
    : '₦0';

  const householdDisplay = activeProfile.isDiscreetMode
    ? '••••••••'
    : householdTotal > 0
    ? `₦${householdTotal.toLocaleString()}`
    : '₦0';

  const balanceDisplay = activeProfile.isDiscreetMode
    ? '••••••••'
    : netBalance !== 0
    ? `₦${netBalance.toLocaleString()}`
    : '₦0';

  const savingsDisplay = activeProfile.isDiscreetMode
    ? '••••••••'
    : savingsAmount > 0
    ? `₦${savingsAmount.toLocaleString()}`
    : '₦0';

  const workplaceDisplay = activeProfile.isDiscreetMode
    ? '••••••••'
    : workplaceTotal > 0
    ? `₦${workplaceTotal.toLocaleString()}`
    : '₦0';

  const financialItems = [
    {
      title: 'Salary & Income',
      amount: salaryDisplay,
      icon: Wallet,
      iconBg: 'bg-blue-100/80 text-blue-600',
      desc: activeSalary.employer ? activeSalary.employer : 'Tap profile to set salary & payday'
    },
    {
      title: 'Household Purchases',
      amount: householdDisplay,
      icon: ShoppingBag,
      iconBg: 'bg-purple-100/80 text-purple-600',
      desc: householdItems.length > 0 ? `${householdItems.length} item(s) logged` : 'No purchases logged yet'
    },
    {
      title: 'Net Cash Balance',
      amount: balanceDisplay,
      icon: CreditCard,
      iconBg: 'bg-emerald-100/80 text-emerald-600',
      desc: 'Available net balance'
    },
    {
      title: 'Dream Home Savings',
      amount: savingsDisplay,
      icon: PiggyBank,
      iconBg: 'bg-amber-100/80 text-amber-600',
      desc: `${savingsPct}% of target saved`
    },
    {
      title: 'Workplace Apartment',
      amount: workplaceDisplay,
      icon: Layers,
      iconBg: 'bg-pink-100/80 text-pink-600',
      desc: workplaceTotal > 0 ? 'Equipment items logged' : 'Setup not started'
    }
  ];

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-800">Financial & Household Summary</h3>
        <span
          className="text-xs text-[#695be8] font-bold cursor-pointer hover:underline"
          onClick={() => setActiveTab('finances')}
        >
          View All
        </span>
      </div>

      {/* Stacked Accounts List Card - 100% Live Computed Data */}
      <div className="bg-white rounded-[2rem] p-5 shadow-ios space-y-3 border border-slate-100">
        {financialItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab('finances')}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer interactive-card"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">{item.amount}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          );
        })}

        {/* Quick Log Action Prompt if empty */}
        {householdItems.length === 0 && userTx.length === 0 && (
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              onClick={() => setQuickActionOpen(true)}
              className="text-xs font-extrabold text-[#695be8] hover:underline flex items-center justify-center gap-1 mx-auto py-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log your first transaction or household item
            </button>
          </div>
        )}
      </div>

      {/* Spotlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Duty Rotation */}
        <div className="bg-white p-5 rounded-[2rem] shadow-ios border border-slate-100 flex flex-col justify-between interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#695be8] uppercase tracking-wider">Duty Rotation</span>
            <Moon className="w-4 h-4 text-[#695be8]" />
          </div>
          <div className="my-3">
            {tomorrowDuty ? (
              <>
                <p className="text-xs text-slate-400">Tomorrow ({tomorrowDuty.date})</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  Duty Status: <span className="text-[#695be8] font-black">{tomorrowDuty.dutyType} Duty</span>
                </p>
                {tomorrowDuty.isHomeWeekend && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-1.5 shadow-sm">
                    🌟 HOME WEEKEND
                  </span>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Duty Rotation Status</p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                  Unconfigured
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Set 2-day baseline in Duty tab
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveTab('duty')}
            className="text-xs font-bold text-[#695be8] hover:text-indigo-800 flex items-center gap-1 self-start active:scale-95 transition-all"
          >
            Duty Calendar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Period Prediction */}
        <div className="bg-white p-5 rounded-[2rem] shadow-ios border border-slate-100 flex flex-col justify-between interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Health Preview</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-3">
            <p className="text-xs text-slate-400">Estimated Next Period</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {activeProfile.isDiscreetMode ? 'Health Log Private' : cyclePrediction.predictionWindowText}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('health')}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 self-start active:scale-95 transition-all"
          >
            Cycle Tracker <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
