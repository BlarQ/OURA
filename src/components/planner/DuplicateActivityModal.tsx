'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  Calendar,
  Clock,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import type { WeeklyActivity } from '@/types/database.types';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface DuplicateActivityModalProps {
  isOpen: boolean;
  activity: WeeklyActivity | null;
  onClose: () => void;
  onDuplicate: (
    activity: WeeklyActivity,
    targetDateStr: string,
    resetCompleted: boolean
  ) => Promise<void>;
}

export default function DuplicateActivityModal({
  isOpen,
  activity,
  onClose,
  onDuplicate,
}: DuplicateActivityModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  // Quick target suggestions
  const suggestions = useMemo(() => {
    if (!activity) return [];

    const actDate = new Date(activity.activity_date + 'T00:00:00');

    // Tomorrow (if weekday)
    const tomorrow = new Date(actDate);
    tomorrow.setDate(actDate.getDate() + 1);

    // Next week same weekday (+7 days)
    const nextWeek = new Date(actDate);
    nextWeek.setDate(actDate.getDate() + 7);

    const formatISO = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const formatLabel = (d: Date) =>
      d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

    return [
      {
        label: `Next Week (${formatLabel(nextWeek)})`,
        dateStr: formatISO(nextWeek),
      },
      {
        label: `Tomorrow (${formatLabel(tomorrow)})`,
        dateStr: formatISO(tomorrow),
      },
    ];
  }, [activity]);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [resetCompleted, setResetCompleted] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activity || !mounted) return null;

  const handleCopy = async () => {
    const target = selectedDate || suggestions[0]?.dateStr;
    if (!target) {
      setError('Please select a target date to duplicate this activity.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onDuplicate(activity, target, resetCompleted);
      onClose();
    } catch (err: any) {
      console.error('Failed to duplicate activity:', err);
      setError(err?.message || 'Failed to duplicate activity. Please try again.');
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-99999 w-screen h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm my-auto bg-paper-white border border-ash-gray rounded-2xl p-5 sm:p-6 space-y-4 text-ink-black max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar animate-modal-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3.5 right-3.5 p-1.5 text-pewter hover:text-ink-black rounded-md hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-6">
          <div className="badge-sprout-green text-[11px] py-0.5 px-2">
            <Repeat className="h-3 w-3" />
            <span>Duplicate Activity</span>
          </div>
          <h2 className="text-xl font-extrabold text-ink-black tracking-tight">
            Copy to Another Day/Week
          </h2>
          <p className="text-[11px] text-pewter">
            Clone this activity into another date without re-typing.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Activity Summary Card */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-ash-gray space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-pewter font-bold">
            <span>Date: {activity.activity_date}</span>
            {activity.time_slot && <span>• {activity.time_slot}</span>}
          </div>
          <p className="text-xs font-extrabold text-ink-black leading-snug line-clamp-2">
            {activity.title}
          </p>
        </div>

        {/* Target Date Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-ink-black block">
            Select Destination Date
          </label>

          {/* Quick preset buttons */}
          <div className="space-y-1">
            {suggestions.map((sug) => (
              <button
                key={sug.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(sug.dateStr);
                  setError(null);
                }}
                className={`w-full p-2 rounded-md text-xs font-bold text-left border transition cursor-pointer flex items-center justify-between ${
                  (selectedDate || suggestions[0]?.dateStr) === sug.dateStr
                    ? 'bg-ink-black text-paper-white border-ink-black'
                    : 'bg-paper-white text-ink-black border-ash-gray hover:border-ink-black'
                }`}
              >
                <span>{sug.label}</span>
                <span className="text-[10px] opacity-75 font-mono">{sug.dateStr}</span>
              </button>
            ))}
          </div>

          {/* Custom Date Picker */}
          <div className="space-y-1 pt-0.5">
            <label className="text-[10px] font-bold text-pewter block">
              Or pick specific date:
            </label>
            <input
              type="date"
              value={selectedDate || suggestions[0]?.dateStr || ''}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError(null);
              }}
              className="input-sprout w-full font-bold text-xs py-1.5 px-2.5"
            />
          </div>

          {/* Option: Reset Checkbox */}
          <div className="pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-ink-black font-bold">
              <input
                type="checkbox"
                checked={resetCompleted}
                onChange={(e) => setResetCompleted(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-ink-black"
              />
              <span>Reset completion checkbox</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2.5 border-t border-ash-gray flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-sprout-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={isSubmitting}
            className="btn-sprout-primary text-xs py-1.5 px-4 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Duplicating...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5 mr-0.5" />
                <span>Duplicate</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
