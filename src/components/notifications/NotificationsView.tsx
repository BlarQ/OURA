'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Check } from 'lucide-react';
import { Notification, NotificationPreferences } from '@/types';
import { notificationService } from '@/lib/services/notifications';

export function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    user_id: 'usr_01',
    task_reminders: true,
    overdue_reminders: true,
    bill_reminders: true,
    budget_warnings: true,
    low_balance_warnings: true,
    goal_reminders: true,
    plan_reminders: true,
    daily_review: true,
    weekly_review: true,
    monthly_review: true,
  });

  useEffect(() => {
    async function loadNotifs() {
      const list = await notificationService.getNotifications();
      setNotifications(list);
      const p = await notificationService.getPreferences();
      setPrefs(p);
    }
    loadNotifs();
  }, []);

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = await notificationService.updatePreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Notification Center & Preferences</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage task alerts, bill reminders, and alert notification preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notifications Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Alerts</h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">{notif.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Toggle Column */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Notification Controls</h2>

          <div className="space-y-3 text-xs">
            {[
              { key: 'task_reminders', label: 'Task Due Reminders' },
              { key: 'bill_reminders', label: 'Upcoming Bill Due Alerts' },
              { key: 'budget_warnings', label: 'Budget 80% Threshold Warnings' },
              { key: 'low_balance_warnings', label: 'Minimum Safe Balance Warnings' },
              { key: 'daily_review', label: 'Daily Work Journal Prompts' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(prefs[key as keyof NotificationPreferences])}
                  onChange={() => handleTogglePref(key as keyof NotificationPreferences)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
