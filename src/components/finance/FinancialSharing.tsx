'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { Shield, CheckCircle2, History } from 'lucide-react';

export const FinancialSharing: React.FC = () => {
  const {
    activeProfile,
    partnerProfile,
    setSalarySharingLevel,
    toggleSalarySharing,
    auditLogs
  } = useOura();

  const sharingLevels = [
    { level: 0, title: 'Private (Sharing OFF)', desc: 'Partner sees no financial details.' },
    { level: 1, title: 'Level 1 — Salary Only', desc: 'Partner sees monthly net salary amount and salary date.' },
    { level: 2, title: 'Level 2 — Salary + Summary', desc: 'Partner sees salary, total expenses, savings, and remaining balance.' },
    { level: 3, title: 'Level 3 — Full Overview', desc: 'Partner sees income sources, expense categories, transactions, and savings.' },
    { level: 4, title: 'Level 4 — Full Shared Access', desc: 'Complete shared financial collaboration access.' }
  ];

  const partnerDisplayName =
    partnerProfile.name && partnerProfile.name !== 'User' && partnerProfile.name !== 'Not Connected'
      ? partnerProfile.name.toUpperCase()
      : 'PARTNER';

  const isSharingActive = activeProfile.isSalaryShared && activeProfile.salarySharingLevel > 0;

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Compact Privacy Banner */}
      <div className="bg-amber-50 rounded-2xl p-3.5 sm:p-4 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 shadow-sm">
        <Shield className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="min-w-0">
          <h4 className="font-extrabold text-xs text-amber-950">Financial Privacy Principle</h4>
          <p className="mt-0.5 text-[11px] text-amber-900 leading-tight">
            Sharing your salary is entirely voluntary and customizable. You retain 100% individual ownership of your financial records and can change or revoke sharing permissions at any instant.
          </p>
        </div>
      </div>

      {/* Main Control Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              SALARY SHARING WITH {partnerDisplayName}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Current Status:{' '}
              {isSharingActive
                ? `Level ${activeProfile.salarySharingLevel} Active`
                : 'Private (Sharing OFF)'}
            </p>
          </div>

          {/* Revoke All Access Button - Strictly 100% Single Line */}
          <button
            onClick={toggleSalarySharing}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95 ${
              isSharingActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSharingActive ? 'Revoke All Access' : 'Enable Salary Sharing'}
          </button>
        </div>

        {/* Level Selectors */}
        <div className="space-y-2 pt-1">
          {sharingLevels.map((lvl) => {
            const isSelected = activeProfile.salarySharingLevel === lvl.level;

            return (
              <button
                key={lvl.level}
                onClick={() => setSalarySharingLevel(lvl.level)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{lvl.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Permission Audit Log */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" /> PERMISSION AUDIT TRAIL
        </h3>

        {auditLogs.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No permission changes recorded yet.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action}: </span>
                  <span className="text-slate-600">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-2">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
