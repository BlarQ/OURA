'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { Bell, CheckCircle2, Circle } from 'lucide-react';

export const RemindersList: React.FC = () => {
  const { reminders, toggleReminder } = useOura();

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Compact Header Banner - Reminders */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
            <Bell className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              REMINDERS
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Scheduled alerts for bills, duties, health & household
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
          {reminders.filter((r) => !r.isCompleted).length} Active Reminders
        </span>
      </div>

      {reminders.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Reminders Logged Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Tap the yellow + button to set up automated reminders for bills, shift alerts, or health checkups!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                rem.isCompleted ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => toggleReminder(rem.id)}
                  className="mt-0.5 text-indigo-600 hover:text-indigo-800 transition-all shrink-0"
                >
                  {rem.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <h4 className={`text-xs sm:text-sm font-extrabold ${rem.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {rem.title}
                  </h4>
                  {rem.description && <p className="text-xs text-slate-500 mt-0.5">{rem.description}</p>}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-2">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      {rem.category}
                    </span>
                    <span className="whitespace-nowrap">Due: {rem.dueDate} at {rem.dueTime}</span>
                    {rem.recurring !== 'none' && <span className="text-purple-600 font-bold whitespace-nowrap">• Repeats {rem.recurring}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
