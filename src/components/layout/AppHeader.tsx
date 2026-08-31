'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, Bell, Wallet, Sun, Moon, CheckCheck, Clock, ShieldAlert, ArrowRight, LogOut, ChevronDown } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { moneyService } from '@/lib/services/money';
import { notificationService } from '@/lib/services/notifications';
import { formatCurrency } from '@/lib/calculations/money';
import { localStore } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Notification } from '@/types';

interface AppHeaderProps {
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
}

export function AppHeader({ onOpenSearch, onOpenQuickCreate }: AppHeaderProps) {
  const [balance, setBalance] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const loadHeaderData = async () => {
    const overview = await moneyService.getFinancialOverview();
    setBalance(overview.availableBalance);
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => n.status !== 'Read').length);
  };

  useEffect(() => {
    loadHeaderData();

    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', loadHeaderData);
      window.addEventListener('focus', loadHeaderData);
      const interval = setInterval(loadHeaderData, 2000);

      setIsDarkMode(document.documentElement.classList.contains('dark'));

      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsNotifOpen(false);
        }
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('oura_balance_updated', loadHeaderData);
        window.removeEventListener('focus', loadHeaderData);
        clearInterval(interval);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.toggle('dark');
      setIsDarkMode(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    await loadHeaderData();
  };

  return (
    <header className="sticky top-0 z-30 w-full max-w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between select-none">
      {/* Mobile Brand Logo & Search Trigger */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-2">
        <Link href="/today" className="md:hidden flex items-center gap-2 shrink-0">
          <img src="/logo.svg" alt="OURA" className="w-7 h-7 object-contain" />
          <span className="font-[family-name:var(--font-syne)] font-bold text-sm text-slate-900 dark:text-white tracking-wider">
            OURA
          </span>
        </Link>

        {/* Global Search Bar Button (Desktop & Tablet) */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs w-full max-w-md transition-all border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800 group shadow-2xs"
        >
          <Search className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          <span className="truncate text-left flex-1 font-medium">Search tasks, plans, money, notes...</span>
          <kbd className="text-[10px] font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* Mobile Animated Search Trigger Icon (Mobile Screens) */}
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="sm:hidden flex items-center justify-center p-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 active:scale-90 transition-transform duration-200 shadow-sm"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* DESKTOP RIGHT CONTROLS (sm:flex) */}
      <div className="hidden sm:flex items-center gap-2.5">
        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>

        {/* Financial Balance Pill */}
        <Link
          href="/money/overview"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900 text-xs font-bold hover:bg-emerald-100/70 transition-colors"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{formatCurrency(balance)}</span>
        </Link>

        {/* User Initials Avatar Badge */}
        <Link href="/settings" className="hover:opacity-90 transition-opacity">
          <UserAvatar fullName={localStore.profile.full_name} size="sm" />
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => authService.signOut()}
          aria-label="Sign out"
          title="Sign out of OURA"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Notification Bell Badge + Dropdown Modal */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Popup */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-scaleUp">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Notifications & Missed Alerts
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No notifications yet</div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        notif.status === 'Read'
                          ? 'bg-transparent opacity-75'
                          : 'bg-indigo-50/40 dark:bg-indigo-950/30'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                          {notif.created_at}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE CONTROLS: COLLAPSED USER MENU DROPDOWN (sm:hidden) */}
      <div className="sm:hidden relative shrink-0" ref={mobileMenuRef}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
        >
          <UserAvatar fullName={localStore.profile.full_name} size="sm" />
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Mobile Animated User Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-scaleUp">
            {/* User Profile Header */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <UserAvatar fullName={localStore.profile.full_name} size="md" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {localStore.profile.full_name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  {localStore.profile.email}
                </p>
              </div>
            </div>

            {/* Financial Balance Link */}
            <Link
              href="/money/overview"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold">Available Balance</span>
              </div>
              <span className="text-xs font-extrabold">{formatCurrency(balance)}</span>
            </Link>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenQuickCreate();
                }}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsNotifOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all relative"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts ({unreadCount})</span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  <span>{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </div>
              </button>

              {/* Sign Out Action */}
              <button
                onClick={() => authService.signOut()}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of OURA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
