'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  X,
  Loader2,
  Tag,
  Check,
} from 'lucide-react';
import type { ManualListItem } from '@/lib/services/manuals';
import type { CreateActivityPayload } from '@/lib/services/activities';
import type { ActivityPriority, WeeklyActivity } from '@/types/database.types';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface AddActivityModalProps {
  isOpen: boolean;
  targetDate: string; // 'YYYY-MM-DD'
  dayName: string; // e.g. 'Monday'
  formattedDateStr: string; // e.g. 'Sep 15, 2026'
  manuals: ManualListItem[];
  editingActivity?: WeeklyActivity | null;
  onClose: () => void;
  onSubmit: (payload: CreateActivityPayload) => Promise<void>;
}

const COMMON_TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  'Morning Window',
  'Afternoon',
  'Night Maintenance',
];

export default function AddActivityModal({
  isOpen,
  targetDate,
  dayName,
  formattedDateStr,
  manuals,
  editingActivity,
  onClose,
  onSubmit,
}: AddActivityModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  const [manualId, setManualId] = useState<string>('');
  const [priority, setPriority] = useState<ActivityPriority>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      if (editingActivity) {
        setTitle(editingActivity.title);
        setDescription(editingActivity.description || '');
        setTimeSlot(editingActivity.time_slot || '09:00 AM');
        setManualId(editingActivity.manual_id || '');
        setPriority(editingActivity.priority || 'standard');
      } else {
        setTitle('');
        setDescription('');
        setTimeSlot('09:00 AM');
        setManualId('');
        setPriority('standard');
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, editingActivity]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an activity title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        activity_date: targetDate,
        title: title.trim(),
        description: description.trim() || null,
        time_slot: timeSlot.trim() || null,
        manual_id: manualId || null,
        priority,
        is_completed: editingActivity ? editingActivity.is_completed : false,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save activity:', err);
      setError(err?.message || 'Failed to save activity. Please try again.');
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
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
          disabled={isSubmitting}
          className="absolute top-3.5 right-3.5 p-1.5 text-[#6e797a] hover:text-[#040404] rounded-[6px] hover:bg-[#f4f4f4] transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header (Compact) */}
        <div className="space-y-1 pr-6">
          <div className="badge-sprout-green text-[11px] py-0.5 px-2">
            <Calendar className="h-3 w-3" />
            <span>{dayName}, {formattedDateStr}</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#040404] tracking-tight">
            {editingActivity ? 'Edit Activity' : 'Plan Activity'}
          </h2>
          <p className="text-[11px] text-[#6e797a]">
            Schedule tasks, maintenance, or link a procedure playbook.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Activity Title */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#040404] block">
              Activity Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify DB Backup & WAL Sync"
              className="input-sprout w-full font-bold text-xs py-2 px-3"
            />
          </div>

          {/* Time Slot & Priority Level Side-by-Side (Space efficient) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time Slot */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[#040404] block">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="input-sprout w-full text-xs py-2 px-2.5 font-semibold"
              >
                {COMMON_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Level */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[#040404] block">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setPriority('routine')}
                  className={`py-1.5 px-1 rounded-[6px] text-[11px] font-bold border transition cursor-pointer text-center ${
                    priority === 'routine'
                      ? 'bg-[#f4f4f4] text-[#040404] border-[#040404]'
                      : 'bg-[#ffffff] text-[#6e797a] border-[#d9d9d9] hover:border-[#040404]'
                  }`}
                >
                  Routine
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('standard')}
                  className={`py-1.5 px-1 rounded-[6px] text-[11px] font-bold border transition cursor-pointer text-center ${
                    priority === 'standard'
                      ? 'bg-[#040404] text-[#ffffff] border-[#040404]'
                      : 'bg-[#ffffff] text-[#6e797a] border-[#d9d9d9] hover:border-[#040404]'
                  }`}
                >
                  Std
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('critical')}
                  className={`py-1.5 px-1 rounded-[6px] text-[11px] font-bold border transition cursor-pointer text-center ${
                    priority === 'critical'
                      ? 'bg-red-600 text-[#ffffff] border-red-600'
                      : 'bg-[#ffffff] text-[#6e797a] border-[#d9d9d9] hover:border-red-500'
                  }`}
                >
                  Critical
                </button>
              </div>
            </div>
          </div>

          {/* Link Procedure Manual (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#040404] flex items-center justify-between">
              <span>Link Procedure Playbook</span>
              <span className="text-[10px] text-[#6e797a] font-normal">Optional</span>
            </label>
            <select
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="input-sprout w-full text-xs py-2 px-2.5 font-semibold truncate"
            >
              <option value="">-- None --</option>
              {manuals.map((m) => (
                <option key={m.id} value={m.id}>
                  📖 {m.title} ({m.steps_count} steps)
                </option>
              ))}
            </select>
          </div>

          {/* Execution Notes */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-[#040404] block">
              Execution Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, target servers, or required approvals..."
              className="input-sprout w-full text-xs py-2 px-3 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#d9d9d9] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-sprout-ghost text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-sprout-primary text-xs py-1.5 px-4 active:scale-95"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>{editingActivity ? 'Update Activity' : 'Save Activity'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
