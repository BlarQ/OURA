'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { Home, Sparkles, Target, Compass, Layers, Plus } from 'lucide-react';

export const DreamHome: React.FC = () => {
  const { savingsGoals, setActiveTab } = useOura();
  const dreamGoal = savingsGoals?.find((g) => g.category === 'dream_home') || (savingsGoals && savingsGoals.length > 0 ? savingsGoals[0] : null);

  const currentAmount = dreamGoal ? dreamGoal.currentAmount : 0;
  const targetAmount = dreamGoal ? dreamGoal.targetAmount : 0;
  const pct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;

  // Custom User Inputs for Dream Home Pillars
  const [locationInput, setLocationInput] = useState('');
  const [landBudgetInput, setLandBudgetInput] = useState('');
  const [architecturalStyle, setArchitecturalStyle] = useState('');
  const [powerSetup, setPowerSetup] = useState('');

  const pillars = [
    {
      title: 'Desired Location',
      status: locationInput || 'Not configured yet (e.g. Lekki / Chevron)',
      icon: Compass,
      inputPlaceholder: 'e.g. Chevron, Lekki Phase 1',
      value: locationInput,
      setter: setLocationInput
    },
    {
      title: 'Land Acquisition Target',
      status: landBudgetInput ? `₦${parseFloat(landBudgetInput).toLocaleString()} NGN` : 'Not configured yet',
      icon: Target,
      inputPlaceholder: 'e.g. 20000000',
      value: landBudgetInput,
      setter: setLandBudgetInput
    },
    {
      title: 'Architectural Style',
      status: architecturalStyle || 'Not configured yet (e.g. 4-Bedroom Duplex)',
      icon: Home,
      inputPlaceholder: 'e.g. Modern 4-Bedroom Semi-Detached',
      value: architecturalStyle,
      setter: setArchitecturalStyle
    },
    {
      title: 'Solar & Power Infrastructure',
      status: powerSetup || 'Not configured yet (e.g. 5kVA Inverter)',
      icon: Layers,
      inputPlaceholder: 'e.g. 5kVA Hybrid Solar Inverter',
      value: powerSetup,
      setter: setPowerSetup
    }
  ];

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Hero Dream Home Banner - Compact Mobile Typography */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-indigo-800 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> OUR DREAM HOME VISION
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 leading-snug">THE FOREVER RESIDENCE</h2>
          </div>
          <span className="bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] px-3 py-1 rounded-full border border-white/20 shrink-0 whitespace-nowrap">
            {pct}% Funded
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs font-bold text-indigo-200">
            <span>Saved: ₦{currentAmount.toLocaleString()} NGN</span>
            <span>Target: ₦{targetAmount.toLocaleString()} NGN</span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${pct}%` }}
            />
          </div>
          {!dreamGoal && (
            <div className="pt-1.5 flex justify-end">
              <button
                onClick={() => setActiveTab('finances')}
                className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Create Dream Home Savings Goal in Finances
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pillars Grid with Custom User Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">{p.title}</h4>
                  <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">{p.status}</p>
                </div>
              </div>

              <input
                type="text"
                placeholder={p.inputPlaceholder}
                value={p.value}
                onChange={(e) => p.setter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-[#695be8]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
