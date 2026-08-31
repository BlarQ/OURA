'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, CheckSquare, Plus, DollarSign, Calendar, Menu, FileText } from 'lucide-react';

interface MobileNavProps {
  onOpenQuickCreate: () => void;
  onOpenMoreMenu: () => void;
}

export function MobileNav({ onOpenQuickCreate, onOpenMoreMenu }: MobileNavProps) {
  const pathname = usePathname();

  const leftNav = [
    { label: 'Today', href: '/today', icon: Sun },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
  ];

  const rightNav = [
    { label: 'Money', href: '/money/overview', icon: DollarSign },
    { label: 'Notes', href: '/notes', icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-2 pb-safe select-none">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Left Nav items */}
        {leftNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Central Prominent Quick Action Button (+) */}
        <div className="relative -top-5 flex items-center justify-center">
          <button
            onClick={onOpenQuickCreate}
            aria-label="Quick Create"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 active:scale-95 transition-transform duration-150 border-4 border-slate-50 dark:border-slate-950"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Right Nav items */}
        {rightNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/money/overview' && pathname?.startsWith('/money'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
