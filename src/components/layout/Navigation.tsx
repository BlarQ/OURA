'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import {
  LayoutDashboard,
  Wallet,
  Home,
  CalendarDays,
  HeartPulse,
  UtensilsCrossed,
  CheckSquare,
  Bot
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, pendingConfirmationItem } = useOura();

  const navItems = [
    { id: 'dashboard', label: 'Dash', fullLabel: 'Dashboard', icon: LayoutDashboard, badge: pendingConfirmationItem ? '!' : null },
    { id: 'finances', label: 'Finances', fullLabel: 'Finances', icon: Wallet },
    { id: 'household', label: 'Home', fullLabel: 'Home', icon: Home },
    { id: 'duty', label: 'Duty', fullLabel: 'Duty', icon: CalendarDays },
    { id: 'health', label: 'Health', fullLabel: 'Health', icon: HeartPulse },
    { id: 'meals', label: 'Meals', fullLabel: 'Meals', icon: UtensilsCrossed },
    { id: 'productivity', label: 'Tasks', fullLabel: 'Tasks', icon: CheckSquare },
    { id: 'ai', label: 'AI', fullLabel: 'AI Companion', icon: Bot }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl py-1 sm:py-1.5 px-0.5 sm:px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-8 gap-0.5 items-center text-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 relative active:scale-95 w-full ${
                isActive
                  ? 'text-[#695be8] font-bold'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 shadow-sm border border-indigo-100' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-[#695be8]' : 'text-slate-400'}`} />
              </div>

              {/* Responsive Label - Fits 100% on any screen size */}
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] tracking-tighter leading-none mt-0.5 truncate w-full text-center">
                <span className="sm:hidden">{item.label}</span>
                <span className="hidden sm:inline">{item.fullLabel}</span>
              </span>

              {isActive && (
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#695be8] absolute top-0 animate-pulse" />
              )}

              {item.badge && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
