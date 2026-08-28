'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import {
  LayoutDashboard,
  Wallet,
  Home,
  CheckSquare,
  Bot
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, pendingConfirmationItem } = useOura();

  // Streamlined 5 Primary Navigation Items for bottom bar
  const navItems = [
    { id: 'dashboard', label: 'Dash', fullLabel: 'Dashboard', icon: LayoutDashboard, badge: pendingConfirmationItem ? '!' : null },
    { id: 'finances', label: 'Finances', fullLabel: 'Finances', icon: Wallet },
    { id: 'household', label: 'Home', fullLabel: 'Home', icon: Home },
    { id: 'productivity', label: 'Tasks', fullLabel: 'Tasks', icon: CheckSquare },
    { id: 'ai', label: 'AI', fullLabel: 'AI Companion', icon: Bot }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl py-1.5 px-2 sm:px-6">
      <div className="max-w-xl mx-auto grid grid-cols-5 gap-1 items-center text-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 relative active:scale-95 w-full ${
                isActive
                  ? 'text-[#695be8] font-extrabold'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-2xl transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 shadow-sm border border-indigo-100 scale-105' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isActive ? 'text-[#695be8]' : 'text-slate-400'}`} />
              </div>

              {/* Label */}
              <span className="text-[9px] xs:text-[10px] tracking-tight leading-none mt-1 truncate w-full text-center font-semibold">
                <span className="sm:hidden">{item.label}</span>
                <span className="hidden sm:inline">{item.fullLabel}</span>
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#695be8] absolute top-0.5 animate-pulse" />
              )}

              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
