'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { Sparkles, ThumbsUp } from 'lucide-react';

export const CoupleDecisions: React.FC = () => {
  const { decisions, voteDecision, currentRole, activeProfile } = useOura();

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Compact Header Banner - Decision Workspace */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              DECISION WORKSPACE
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Option comparison and voting system requiring dual approval
            </p>
          </div>
        </div>

        <span className="bg-purple-50 text-purple-800 text-[11px] font-extrabold px-3 py-1.5 rounded-full border border-purple-100 shrink-0 whitespace-nowrap">
          Dual Approval
        </span>
      </div>

      {/* Decision Cards List */}
      {decisions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Decision Proposals Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Propose purchasing options or apartment decisions for dual partner voting!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((dec) => (
            <div key={dec.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {dec.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1 truncate">{dec.title}</h3>
                </div>

                <span
                  className={`text-[11px] font-black px-3 py-1 rounded-full shrink-0 whitespace-nowrap ${
                    dec.status === 'both_agreed'
                      ? 'bg-emerald-500 text-white shadow-md animate-pulseSubtle'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {dec.status === 'both_agreed' ? '✨ BOTH AGREED' : `Status: ${dec.status.replace('_', ' ')}`}
                </span>
              </div>

              {/* Options Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dec.options.map((opt) => {
                  const isSelected = dec.selectedOptionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        isSelected ? 'bg-indigo-50/80 border-[#695be8] shadow-sm' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <h4 className="text-xs font-extrabold text-slate-900">{opt.title}</h4>
                      <p className="text-sm font-black text-[#695be8] mt-0.5">₦{opt.price.toLocaleString()} NGN</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>

                      <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-slate-200/60">
                        <button
                          onClick={() => voteDecision(dec.id, opt.id, currentRole, 'approved')}
                          className="w-full py-2 bg-[#695be8] text-white font-bold text-xs rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve as {activeProfile.name}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
