'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { Users, PiggyBank, Plus, X, Target, Calendar } from 'lucide-react';

export const OurFinances: React.FC = () => {
  const {
    savingsGoals,
    addSavingsGoal,
    addSavingsContribution,
    currentRole,
    activeProfile,
    partnerProfile
  } = useOura();

  const [contributionAmount, setContributionAmount] = useState<Record<string, string>>({});
  const [showGoalModal, setShowGoalModal] = useState(false);

  // New Goal Form State
  const [titleInput, setTitleInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');

  const handleContribute = (goalId: string) => {
    const amt = parseFloat(contributionAmount[goalId] || '0');
    if (!amt || isNaN(amt)) return;
    addSavingsContribution(goalId, amt, currentRole);
    setContributionAmount((prev) => ({ ...prev, [goalId]: '' }));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetInput);
    if (!titleInput || !target || isNaN(target) || !deadlineInput) return;

    addSavingsGoal({
      title: titleInput,
      targetAmount: target,
      deadline: deadlineInput,
      monthlyContribution: 0,
      category: 'dream_home',
      isShared: true
    });

    setTitleInput('');
    setTargetInput('');
    setDeadlineInput('');
    setShowGoalModal(false);
  };

  const isConnected = activeProfile.coupleId !== 'UNLINKED' && activeProfile.coupleId !== 'OURA-LIVE';

  return (
    <div className="space-y-6">
      {/* Top Header - Our Finances (Concise Single Line Header Text) */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">OUR FINANCES</h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {isConnected
                ? `Shared spending & goals for ${activeProfile.name} & ${partnerProfile.name}`
                : `Shared spending & goals for ${activeProfile.name}`}
            </p>
          </div>
        </div>

        <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap shrink-0">
          {isConnected ? 'Linked' : 'Standalone'}
        </span>
      </div>

      {/* Joint Savings Goals Section Header with + Create Button */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-600" /> JOINT SAVINGS GOALS
          </h3>

          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-1.5 bg-[#695be8] hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>

        {/* Savings Goals List or Empty State */}
        {savingsGoals.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 space-y-3">
            <PiggyBank className="w-10 h-10 text-indigo-400 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-800">No Joint Savings Goals Created Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tap the button below to create your first goal (e.g. Dream Home, Vacation, or Emergency Fund)!
            </p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#695be8] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create First Savings Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingsGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

              const myContrib = currentRole === 'husband' ? (goal.husbandContribution || 0) : (goal.wifeContribution || 0);
              const partnerContrib = currentRole === 'husband' ? (goal.wifeContribution || 0) : (goal.husbandContribution || 0);

              return (
                <div key={goal.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                      <span className="uppercase tracking-wider text-[10px] text-indigo-600 font-extrabold">
                        {goal.category.replace('_', ' ')}
                      </span>
                      <span>Deadline: {goal.deadline}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900">{goal.title}</h4>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Saved: ₦{goal.currentAmount.toLocaleString()}</span>
                        <span className="text-indigo-600">Target: ₦{goal.targetAmount.toLocaleString()}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold text-right">{pct}% Completed</p>
                    </div>

                    {/* Dynamic Contributions breakdown */}
                    <div className="mt-3 p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>{activeProfile.name}:</span>
                        <strong className="text-indigo-900">₦{myContrib.toLocaleString()}</strong>
                      </div>
                      {isConnected && (
                        <div className="flex justify-between text-slate-600">
                          <span>{partnerProfile.name}:</span>
                          <strong className="text-indigo-900">₦{partnerContrib.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Contribution Form */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <input
                      type="number"
                      placeholder="Add amount..."
                      value={contributionAmount[goal.id] || ''}
                      onChange={(e) => setContributionAmount({ ...contributionAmount, [goal.id]: e.target.value })}
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-600"
                    />
                    <button
                      onClick={() => handleContribute(goal.id)}
                      className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating Custom Savings Goal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-fadeInScale border border-slate-100">
            <button
              onClick={() => setShowGoalModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-[#695be8] rounded-xl">
                <PiggyBank className="w-5 h-5" />
              </span>
              <h3 className="text-base font-extrabold text-slate-900">Create Joint Savings Goal</h3>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Our Dream Home Fund or Vacation"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Amount (₦)</label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      placeholder="e.g. 20000000"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deadline Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={deadlineInput}
                      onChange={(e) => setDeadlineInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#695be8] text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow active:scale-95"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
