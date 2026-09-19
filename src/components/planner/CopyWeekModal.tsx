'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  Repeat,
  Calendar,
} from 'lucide-react';
import type { WeeklyActivity } from '@/types/database.types';
import { getWeeklyActivities } from '@/lib/services/activities';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface WeekOption {
  offset: number;
  mondayStr: string;
  fridayStr: string;
  label: string;
  shortLabel: string;
}

interface CopyWeekModalProps {
  isOpen: boolean;
  currentOffset: number;
  onClose: () => void;
  onCopySuccess: (targetOffset: number, count: number, message: string) => void;
  onExecuteCopy: (
    sourceMonday: string,
    targetMonday: string,
    resetCompleted: boolean
  ) => Promise<number>;
}

export default function CopyWeekModal({
  isOpen,
  currentOffset,
  onClose,
  onCopySuccess,
  onExecuteCopy,
}: CopyWeekModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  // Generate selectable week options (-4 to +8 weeks)
  const weekOptions: WeekOption[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() + distanceToMonday);

    const options: WeekOption[] = [];

    for (let offset = -4; offset <= 8; offset++) {
      const mon = new Date(baseMonday);
      mon.setDate(baseMonday.getDate() + offset * 7);

      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);

      const formatD = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const yyyyM = mon.getFullYear();
      const mmM = String(mon.getMonth() + 1).padStart(2, '0');
      const ddM = String(mon.getDate()).padStart(2, '0');
      const mondayStr = `${yyyyM}-${mmM}-${ddM}`;

      const yyyyF = fri.getFullYear();
      const mmF = String(fri.getMonth() + 1).padStart(2, '0');
      const ddF = String(fri.getDate()).padStart(2, '0');
      const fridayStr = `${yyyyF}-${mmF}-${ddF}`;

      let tag = '';
      if (offset === 0) tag = ' (Current Week)';
      else if (offset === -1) tag = ' (Last Week)';
      else if (offset === 1) tag = ' (Next Week)';

      options.push({
        offset,
        mondayStr,
        fridayStr,
        label: `${formatD(mon)} – ${formatD(fri)}, ${mon.getFullYear()}${tag}`,
        shortLabel: `${formatD(mon)} – ${formatD(fri)}`,
      });
    }

    return options;
  }, []);

  const [sourceOffset, setSourceOffset] = useState<number>(currentOffset);
  const [targetOffset, setTargetOffset] = useState<number>(currentOffset + 1);
  const [resetCompleted, setResetCompleted] = useState<boolean>(true);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live preview of source week activities
  const [sourceActivities, setSourceActivities] = useState<WeeklyActivity[]>([]);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  // Sync offsets whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSourceOffset(currentOffset);
      setTargetOffset(currentOffset + 1);
      setError(null);
      setIsCopying(false);
    }
  }, [isOpen, currentOffset]);

  const sourceOption = weekOptions.find((w) => w.offset === sourceOffset) || weekOptions[4];
  const targetOption = weekOptions.find((w) => w.offset === targetOffset) || weekOptions[5];

  // Fetch preview of source activities
  const fetchSourcePreview = useCallback(async () => {
    if (!sourceOption) return;
    setLoadingPreview(true);
    try {
      const acts = await getWeeklyActivities(sourceOption.mondayStr, sourceOption.fridayStr);
      setSourceActivities(acts);
    } catch {
      setSourceActivities([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [sourceOption]);

  useEffect(() => {
    if (isOpen) {
      fetchSourcePreview();
    }
  }, [isOpen, fetchSourcePreview]);

  if (!isOpen || !mounted) return null;

  const handleInitiateCopy = async () => {
    if (sourceOffset === targetOffset) {
      setError(
        'Source week and target week cannot be the same. Please select a different target week.'
      );
      return;
    }

    setIsCopying(true);
    setError(null);

    try {
      const count = await onExecuteCopy(
        sourceOption.mondayStr,
        targetOption.mondayStr,
        resetCompleted
      );

      if (count === 0) {
        setError(
          `No activities found in the source week (${sourceOption.label.split('(')[0]}). Please select a week that contains scheduled activities.`
        );
        setIsCopying(false);
        return;
      }

      onCopySuccess(
        targetOffset,
        count,
        `Successfully copied ${count} ${
          count === 1 ? 'activity' : 'activities'
        } to ${targetOption.label.split('(')[0].trim()}!`
      );
      onClose();
    } catch (err: any) {
      console.error('Copy execution failed:', err);
      setError(err?.message || 'Failed to copy activities. Please try again.');
      setIsCopying(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCopying) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md my-auto bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-5 sm:p-6 space-y-4 text-[#040404] max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar animate-modal-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isCopying}
          className="absolute top-3.5 right-3.5 p-1.5 text-[#6e797a] hover:text-[#040404] rounded-[6px] hover:bg-[#f4f4f4] transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-6">
          <div className="badge-sprout-green text-[10px] sm:text-xs py-0.5 px-2">
            <Repeat className="h-3 w-3" />
            <span>Weekly Schedule Duplication</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#040404] tracking-tight">
            Copy Activities to Another Week
          </h2>
          <p className="text-[11px] text-[#6e797a]">
            Duplicate recurring weekday tasks without re-typing.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Week Selectors Form */}
        <div className="space-y-3">
          {/* 1. Source Week */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#040404] flex items-center justify-between">
              <span>1. Copy FROM (Source Week)</span>
              <span className="text-[10px] text-[#6e797a] font-normal">Source schedule</span>
            </label>
            <select
              value={sourceOffset}
              onChange={(e) => {
                setSourceOffset(Number(e.target.value));
                if (error) setError(null);
              }}
              className="input-sprout w-full font-bold text-xs py-2 px-2.5"
            >
              {weekOptions.map((opt) => (
                <option key={opt.offset} value={opt.offset}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Activities Preview Box */}
          <div className="p-2.5 rounded-[8px] bg-[#f8fafc] border border-[#d9d9d9] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-[#040404] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#040404]" />
                <span>Source Preview</span>
              </span>
              {loadingPreview ? (
                <span className="text-[10px] text-[#6e797a] flex items-center gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> Checking...
                </span>
              ) : (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[24px] ${
                    sourceActivities.length > 0
                      ? 'bg-[#98e58e] text-[#040404]'
                      : 'bg-[#e2e8f0] text-[#64748b]'
                  }`}
                >
                  {sourceActivities.length}{' '}
                  {sourceActivities.length === 1 ? 'task' : 'tasks'}
                </span>
              )}
            </div>

            {!loadingPreview && sourceActivities.length > 0 && (
              <div className="max-h-20 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {sourceActivities.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="text-[10px] font-semibold text-[#040404] bg-white px-2 py-0.5 rounded-[4px] border border-[#e2e8f0] truncate"
                  >
                    • {act.title}
                  </div>
                ))}
                {sourceActivities.length > 3 && (
                  <p className="text-[9px] text-[#6e797a] font-bold pl-1">
                    + {sourceActivities.length - 3} more
                  </p>
                )}
              </div>
            )}

            {!loadingPreview && sourceActivities.length === 0 && (
              <p className="text-[10px] text-[#6e797a]">
                ⚠️ No activities in this source week.
              </p>
            )}
          </div>

          {/* Arrow Indicator */}
          <div className="flex items-center justify-center py-0.5">
            <div className="h-6 w-6 rounded-full bg-[#f4f4f4] border border-[#d9d9d9] flex items-center justify-center text-[#040404]">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* 2. Target Week */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#040404] flex items-center justify-between">
              <span>2. Copy TO (Target Week)</span>
              <span className="text-[10px] text-[#6e797a] font-normal">Destination schedule</span>
            </label>
            <select
              value={targetOffset}
              onChange={(e) => {
                setTargetOffset(Number(e.target.value));
                if (error) setError(null);
              }}
              className="input-sprout w-full font-bold text-xs py-2 px-2.5"
            >
              {weekOptions.map((opt) => (
                <option key={opt.offset} value={opt.offset}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Option: Reset Completion Checkboxes */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-[#040404] font-bold p-2.5 rounded-[6px] bg-[#f4f4f4] border border-[#d9d9d9] hover:border-[#040404] transition">
              <input
                type="checkbox"
                checked={resetCompleted}
                onChange={(e) => setResetCompleted(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded accent-[#040404]"
              />
              <div>
                <span className="block">Reset completion checkboxes</span>
                <span className="text-[10px] text-[#6e797a] font-normal block">
                  All copied activities will start as pending for the new week.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2.5 border-t border-[#d9d9d9] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCopying}
            className="btn-sprout-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleInitiateCopy}
            disabled={isCopying || loadingPreview}
            className="btn-sprout-primary text-xs py-1.5 px-4 cursor-pointer active:scale-95"
          >
            {isCopying ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Copying...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5 mr-0.5" />
                <span>Initiate Copy</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
