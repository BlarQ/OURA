'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun, CheckSquare, Activity, Briefcase, Calendar, DollarSign,
  Compass, Flag, PieChart, Bell, Settings, Layers, Wallet,
  CreditCard, TrendingUp, CalendarDays, ShieldCheck, FileText
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

export function Sidebar() {
  const pathname = usePathname();

  const primaryNav: NavItem[] = [
    { label: 'Today', href: '/today', icon: Sun },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Activities', href: '/activities', icon: Activity },
    { label: 'Projects', href: '/projects', icon: Briefcase },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    {
      label: 'Money',
      href: '/money/overview',
      icon: DollarSign,
      children: [
        { label: 'Overview', href: '/money/overview', icon: Wallet },
        { label: 'Salary', href: '/money/salary', icon: CreditCard },
        { label: 'Income', href: '/money/income', icon: TrendingUp },
        { label: 'Expenses', href: '/money/expenses', icon: DollarSign },
        { label: 'Transactions', href: '/money/transactions', icon: Layers },
        { label: 'Budgets', href: '/money/budgets', icon: PieChart },
        { label: 'Bills', href: '/money/bills', icon: CalendarDays },
        { label: 'Savings', href: '/money/savings', icon: ShieldCheck },
      ],
    },
    { label: 'Plans', href: '/plans', icon: Compass },
    { label: 'Notepad', href: '/notes', icon: FileText },
    { label: 'Goals', href: '/goals', icon: Flag },
    { label: 'Insights', href: '/insights', icon: PieChart },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isChildActive = (children?: { href: string }[]) => {
    if (!children) return false;
    return children.some((child) => pathname?.startsWith(child.href));
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/today" className="flex items-center gap-3 group">
          <img
            src="/logo.svg"
            alt="OURA Logo"
            className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <div>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-lg tracking-[0.12em] bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-100 dark:to-indigo-300 bg-clip-text text-transparent leading-none">
              OURA
            </h1>
            <p className="text-[9px] font-bold text-indigo-600/80 dark:text-indigo-300/80 tracking-[0.16em] uppercase mt-0.5">
              Life Workspace
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/today' && pathname?.startsWith(item.href)) || isChildActive(item.children);

          return (
            <div key={item.label} className="space-y-1">
              <Link
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </Link>

              {/* Sub-navigation for Money section */}
              {item.children && isActive && (
                <div className="pl-9 pr-2 py-1 space-y-1 border-l-2 border-indigo-100 dark:border-indigo-900 ml-5 my-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildCurrent = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isChildCurrent
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ChildIcon className="w-3.5 h-3.5" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Tagline */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
          Plan your life. Manage your day. Control your money.
        </p>
      </div>
    </aside>
  );
}
