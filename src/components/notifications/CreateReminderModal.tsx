'use client';

import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckSquare,
  CalendarDays,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { taskService } from '@/lib/services/tasks';
import { moneyService } from '@/lib/services/money';
import { showToast } from '@/components/layout/ConfirmModal';
import { playAlarmSound } from '@/lib/utils/audio';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReminderModal({ isOpen, onClose, onSuccess }: CreateReminderModalProps) {
  const [reminderType, setReminderType] = useState<'TASK' | 'BILL' | 'CUSTOM'>('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('12:00');
  const [reminderTiming, setReminderTiming] = useState('15 minutes before');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a reminder title', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (reminderType === 'BILL') {
        const parsedAmount = parseFloat(amount) || 0;
        await moneyService.createBill({
          name: title,
          amount: parsedAmount,
          category: 'Subscriptions',
          due_date: dueDate,
          frequency: 'Monthly',
          reminder_enabled: true,
        });
        showToast(`Bill reminder for "${title}" scheduled! 🔔`, 'success');
      } else {
        await taskService.createTask({
          title: title,
          description: description || (reminderType === 'CUSTOM' ? 'Custom scheduled reminder alert' : ''),
          status: 'Not Started',
          priority: priority,
          due_date: dueDate,
          due_time: dueTime,
          category: reminderType === 'CUSTOM' ? 'Personal' : 'General',
          recurrence: 'None',
          notification_enabled: true,
          reminder_time: reminderTiming,
        });
        showToast(`Reminder "${title}" scheduled with audio alarm! 🔔`, 'success');
      }

      // Dispatch event to refresh lists & triggers
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('oura_reminder_created'));
      }

      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setTitle('');
      setDescription('');
      setAmount('');
    } catch (err) {
      console.error(err);
      showToast('Failed to save reminder', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 animate-scaleUp max-h-[96vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Set a Reminder
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Schedule audio alarms & push alerts for tasks and bills
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reminder Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setReminderType('TASK')}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              reminderType === 'TASK'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setReminderType('BILL')}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              reminderType === 'BILL'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Bill Due</span>
          </button>

          <button
            type="button"
            onClick={() => setReminderType('CUSTOM')}
            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              reminderType === 'CUSTOM'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alert</span>
          </button>
        </div>

        {/* Reminder Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
              {reminderType === 'BILL' ? 'Bill Name *' : 'Reminder Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                reminderType === 'BILL'
                  ? 'e.g. Electricity, Netflix, Rent'
                  : 'e.g. Call Client, Submit Weekly Report'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {reminderType === 'BILL' ? (
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Bill Amount (₦) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Details / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Additional notes for this alarm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="min-w-0">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                Alarm Time *
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reminder Timing & Ringtone Audio Box */}
          <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <label className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 block mb-0.5">
                  Reminder Timing
                </label>
                <select
                  value={reminderTiming}
                  onChange={(e) => setReminderTiming(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:outline-none truncate"
                >
                  <option value="At time of event">At time of event</option>
                  <option value="5 minutes before">5 mins before</option>
                  <option value="15 minutes before">15 mins before</option>
                  <option value="30 minutes before">30 mins before</option>
                  <option value="1 hour before">1 hr before</option>
                </select>
              </div>

              <div className="flex items-end min-w-0">
                <button
                  type="button"
                  onClick={() => playAlarmSound()}
                  className="w-full px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1 active:scale-95 shrink-0"
                >
                  <Volume2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">Test Ringtone</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Setting...' : 'Set Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
