'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { CheckCircle2, ChevronRight, Calendar, ChevronDown, Check, Eye, EyeOff, Sparkles } from 'lucide-react';

export const TodaySummary: React.FC = () => {
  const { activeProfile, activeSalary, toggleDiscreetMode, transactions, setActiveTab } = useOura();

  const [selectedMonth, setSelectedMonth] = useState('Aug 2026');
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Past and Current Months up to August 2026
  const availableMonths = [
    'Aug 2026',
    'Jul 2026',
    'Jun 2026',
    'May 2026',
    'Apr 2026',
    'Mar 2026',
    'Feb 2026',
    'Jan 2026'
  ];

  const userTx = transactions.filter((t) => t.userId === activeProfile.id || t.paidBy === activeProfile.role);
  const credits = userTx.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const debits = userTx.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  // 100% Live Computed Balance (No hardcoded 100k or -180k offsets!)
  const availableBalance = Math.max(0, activeSalary.netSalary + credits - debits);

  // 100% Live Weekly Breakdown (Returns 0 if no transactions exist)
  const currentWeeks = [
    { week: 'Week 1', label: `${selectedMonth.slice(0, 3)} 1-7`, amount: 0 },
    { week: 'Week 2', label: `${selectedMonth.slice(0, 3)} 8-14`, amount: 0 },
    { week: 'Week 3', label: `${selectedMonth.slice(0, 3)} 15-21`, amount: 0 },
    { week: 'Week 4', label: `${selectedMonth.slice(0, 3)} 22-28`, amount: 0 },
    { week: 'Week 5', label: `${selectedMonth.slice(0, 3)} 29-31`, amount: 0 }
  ];

  // If user has debit transactions, distribute them dynamically
  userTx.forEach((tx) => {
    const d = new Date(tx.date).getDate();
    if (d <= 7) currentWeeks[0].amount += tx.amount;
    else if (d <= 14) currentWeeks[1].amount += tx.amount;
    else if (d <= 21) currentWeeks[2].amount += tx.amount;
    else if (d <= 28) currentWeeks[3].amount += tx.amount;
    else currentWeeks[4].amount += tx.amount;
  });

  const activeWeek = currentWeeks[selectedWeekIdx] || currentWeeks[0];

  // Compute SVG Points based on weekly amounts
  const maxAmount = Math.max(...currentWeeks.map((w) => w.amount), 50000);
  const widthStep = 300 / (currentWeeks.length - 1);
  const points = currentWeeks.map((w, idx) => {
    const x = idx * widthStep;
    const y = 60 - (w.amount / maxAmount) * 45;
    return { x, y, amount: w.amount };
  });

  // SVG Path Construction
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L 300 80 L 0 80 Z`;

  // Compute Payday Remaining Days dynamically
  const today = new Date();
  const currentDay = today.getDate();
  const payday = activeSalary.salaryDate || 25;
  const daysLeft = payday >= currentDay ? payday - currentDay : 30 - currentDay + payday;

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Hero Floating White Card */}
      <div className="bg-white rounded-[2.25rem] p-5 sm:p-6 shadow-ios-xl border border-slate-100/90 relative overflow-hidden interactive-card">
        {/* Card Header Row with Custom Animated Month Dropdown */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="relative shrink-0">
            {/* Custom Dropdown Trigger Pill Button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-indigo-50/90 hover:bg-indigo-100 text-[#695be8] text-[11px] font-extrabold px-3 py-1.5 rounded-2xl border border-indigo-100 shadow-sm transition-all active:scale-95 shrink-0"
              title="Select Month for Weekly Spend Analysis"
            >
              <Calendar className="w-3.5 h-3.5 text-[#695be8] shrink-0" />
              <span>{selectedMonth}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#695be8] transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Backdrop click listener */}
            {isDropdownOpen && (
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
            )}

            {/* Custom Animated Floating Dropdown Menu Card */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2.5 w-44 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-1.5 z-40 animate-fadeInScale max-h-52 overflow-y-auto">
                <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Select Month
                </div>
                {availableMonths.map((m) => {
                  const isSelected = m === selectedMonth;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        setSelectedWeekIdx(0);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50 text-[#695be8] font-black'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{m}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#695be8]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#695be8] bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 shrink-0 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 fill-[#695be8] text-white shrink-0" />
            {debits > 0 ? 'Live Spend Tracked' : 'Live Account Ready'}
          </span>
        </div>

        {/* Amount Metric with Discreet Privacy Eye Button */}
        <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {selectedMonth} TOTAL SPEND
              </span>
              <button
                onClick={toggleDiscreetMode}
                className={`p-1 rounded-lg border transition-all active:scale-95 ${
                  activeProfile.isDiscreetMode
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-200'
                }`}
                title={activeProfile.isDiscreetMode ? 'Show Figures' : 'Hide Figures (Discreet Privacy)'}
              >
                {activeProfile.isDiscreetMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight truncate mt-0.5">
              {activeProfile.isDiscreetMode ? '••••••••' : `₦${debits.toLocaleString()}`}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold shrink-0 whitespace-nowrap">
            Available: {activeProfile.isDiscreetMode ? '••••••••' : `₦${availableBalance.toLocaleString()}`}
          </span>
        </div>

        {/* Weekly Spline Graph */}
        <div className="mt-4 w-full relative pt-4 pb-2">
          <div className="h-24 w-full relative">
            <svg className="w-full h-full text-[#695be8]" viewBox="0 0 300 80" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#695be8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#695be8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#weeklyGradient)" />
              <path d={pathD} stroke="#695be8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Render Week Dots */}
              {points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer" onClick={() => setSelectedWeekIdx(idx)}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#695be8" />
                  {idx === selectedWeekIdx && (
                    <circle cx={pt.x} cy={pt.y} r="7" stroke="#695be8" strokeWidth="2.5" fill="white" className="animate-ping" />
                  )}
                </g>
              ))}
            </svg>

            {/* Dynamic Floating Tooltip Pill */}
            <div
              className="absolute top-0 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 z-10"
              style={{ left: `${(selectedWeekIdx / (currentWeeks.length - 1)) * 100}%` }}
            >
              <span className="text-amber-400 font-mono">{activeWeek.week} ({activeWeek.label}):</span>
              <span>{activeProfile.isDiscreetMode ? '••••••••' : `₦${activeWeek.amount.toLocaleString()}`}</span>
            </div>
          </div>

          {/* Week Selector Pills */}
          <div className="flex justify-between items-center text-[11px] font-bold mt-4 pt-1 px-1 border-t border-slate-100">
            {currentWeeks.map((w, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWeekIdx(idx)}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  idx === selectedWeekIdx
                    ? 'bg-[#695be8] text-white shadow-sm font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {w.week}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Hero Banner Card - Dynamic Payday Computation */}
      <div
        onClick={() => setActiveTab('finances')}
        className="bg-white rounded-2xl p-3.5 shadow-ios border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50 transition-all cursor-pointer interactive-card"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shrink-0">
            💳
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {activeSalary.netSalary > 0 ? `Payday in ${daysLeft} Days` : 'Payday & Salary Setup'}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {activeSalary.netSalary > 0
                ? `Expected salary deposit on ${payday}th of month`
                : 'Tap to configure net salary and monthly payday in profile'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
    </div>
  );
};
