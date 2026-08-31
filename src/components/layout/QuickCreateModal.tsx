'use client';

import React, { useState } from 'react';
import {
  X, CheckSquare, Activity, DollarSign, TrendingUp, Compass, Bell, FileText
} from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: 'TASK' | 'ACTIVITY' | 'EXPENSE' | 'INCOME' | 'PLAN' | 'REMINDER' | 'NOTE') => void;
}

export function QuickCreateModal({ isOpen, onClose, onSelectOption }: QuickCreateModalProps) {
  if (!isOpen) return null;

  const options = [
    {
      type: 'TASK' as const,
      title: 'Task',
      description: 'Schedule a task or action item',
      icon: CheckSquare,
      color: 'bg-indigo-500 text-white',
    },
    {
      type: 'ACTIVITY' as const,
      title: 'Activity',
      description: 'Log time spent on work or study',
      icon: Activity,
      color: 'bg-blue-500 text-white',
    },
    {
      type: 'EXPENSE' as const,
      title: 'Expense',
      description: 'Record spent money & log debit',
      icon: DollarSign,
      color: 'bg-rose-500 text-white',
    },
    {
      type: 'INCOME' as const,
      title: 'Income',
      description: 'Record incoming funds & salary',
      icon: TrendingUp,
      color: 'bg-emerald-500 text-white',
    },
    {
      type: 'PLAN' as const,
      title: 'Plan',
      description: 'Create a new project or move plan',
      icon: Compass,
      color: 'bg-amber-500 text-white',
    },
    {
      type: 'REMINDER' as const,
      title: 'Reminder',
      description: 'Set a bill or task reminder',
      icon: Bell,
      color: 'bg-purple-500 text-white',
    },
    {
      type: 'NOTE' as const,
      title: 'Note',
      description: 'Write quick notes or thoughts',
      icon: FileText,
      color: 'bg-slate-700 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              What would you like to add?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Quickly create items across your personal OS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => {
                  onSelectOption(opt.type);
                  onClose();
                }}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-left transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <div className={`p-2.5 rounded-xl ${opt.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug truncate">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
