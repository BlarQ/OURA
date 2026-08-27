'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { CheckSquare, CheckCircle2, Circle, Clock } from 'lucide-react';

export const CoupleTasks: React.FC = () => {
  const { tasks, toggleTaskStatus } = useOura();

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Compact Header Banner - Couple Tasks */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
            <CheckSquare className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              OUR SHARED TASKS
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Action items assigned to couple collaboration
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1.5 rounded-full border border-slate-200/80 shrink-0 whitespace-nowrap">
          {completedCount} / {tasks.length} Done
        </span>
      </div>

      {/* Task List Items */}
      {tasks.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Tasks Created Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Tap the yellow + button to create shared action items for you and your partner!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                task.status === 'completed'
                  ? 'bg-slate-50/80 border-slate-200/80 opacity-70'
                  : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-0.5 text-[#695be8] hover:scale-110 active:scale-95 transition-all shrink-0"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 hover:text-[#695be8]" />
                  )}
                </button>

                <div className="min-w-0">
                  <h4
                    className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                      task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-2.5">
                    <span className="bg-indigo-50 text-[#695be8] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider whitespace-nowrap">
                      Assigned: {task.assignedTo}
                    </span>
                    <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-slate-400" /> Due: {task.dueDate}
                    </span>
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
