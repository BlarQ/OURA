'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  X,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Tag,
  Sparkles,
} from 'lucide-react';
import type { WeeklyActivity } from '@/types/database.types';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface TaskDetailsModalProps {
  isOpen: boolean;
  activity: WeeklyActivity | null;
  dayName: string;
  formattedDateStr: string;
  onClose: () => void;
  onSaveCompletion: (
    activityId: string,
    isCompleted: boolean,
    completionNotes: string
  ) => Promise<void>;
  onEdit: (activity: WeeklyActivity) => void;
  onDuplicate: (activity: WeeklyActivity) => void;
  onDelete: (activityId: string) => void;
}

export default function TaskDetailsModal({
  isOpen,
  activity,
  dayName,
  formattedDateStr,
  onClose,
  onSaveCompletion,
  onEdit,
  onDuplicate,
  onDelete,
}: TaskDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  useEffect(() => {
    if (isOpen && activity) {
      setIsCompleted(activity.is_completed);
      setCompletionNotes(activity.completion_notes || '');
      setIsSaving(false);
      setSaveSuccess(false);
      setError(null);
    }
  }, [isOpen, activity]);

  if (!isOpen || !activity || !mounted) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onSaveCompletion(activity.id, isCompleted, completionNotes);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to save completion log:', err);
      setError(err?.message || 'Failed to save notes. Please try again.');
      setIsSaving(false);
    }
  };

  const isCritical = activity.priority === 'critical';

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg my-auto bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-5 sm:p-6 space-y-4 text-[#040404] max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar animate-modal-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-3.5 right-3.5 p-1.5 text-[#6e797a] hover:text-[#040404] rounded-[6px] hover:bg-[#f4f4f4] transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Header Badge & Day */}
        <div className="space-y-1 pr-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="badge-sprout-green text-[11px] py-0.5 px-2">
              <Calendar className="h-3 w-3" />
              <span>{dayName}, {formattedDateStr}</span>
            </div>

            {activity.time_slot && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6e797a] bg-[#f4f4f4] px-2 py-0.5 rounded-[24px] border border-[#d9d9d9]">
                <Clock className="h-3 w-3" />
                <span>{activity.time_slot}</span>
              </span>
            )}

            {isCritical ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[24px] bg-red-100 text-red-700 border border-red-200">
                Critical Priority
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[24px] bg-[#f4f4f4] text-[#6e797a] border border-[#d9d9d9] uppercase">
                {activity.priority}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#040404] tracking-tight leading-snug pt-1">
            {activity.title}
          </h2>
        </div>

        {error && (
          <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Planned Description (if provided) */}
        {activity.description && (
          <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#d9d9d9] text-xs text-[#040404] space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[#6e797a] tracking-wider block">
              Planned Scope & Target:
            </span>
            <p className="leading-relaxed whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        {/* Linked Procedure Playbook Shortcut */}
        {activity.manual_id && (
          <div className="p-3 rounded-[8px] bg-[#98e58e]/20 border border-[#98e58e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-[#040404] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-extrabold text-[#040404] tracking-wider block">
                  Linked IT Procedure:
                </span>
                <span className="text-xs font-bold text-[#040404] truncate block">
                  {activity.manual_title || 'Procedure Playbook'}
                </span>
              </div>
            </div>

            <Link
              href={`/manuals/${activity.manual_id}`}
              className="btn-sprout-dark text-[11px] py-1.5 px-3 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Run Playbook</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* DAILY EXECUTION LOG & COMPLETION NOTES SECTION */}
        <div className="p-3.5 sm:p-4 rounded-[12px] bg-[#f8fafc] border-2 border-[#040404] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-[#040404]" />
              <span className="text-xs font-extrabold text-[#040404] uppercase tracking-wider">
                Daily Execution Log & Notes
              </span>
            </div>

            {/* Completed status pill */}
            <button
              type="button"
              onClick={() => setIsCompleted((prev) => !prev)}
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-[24px] border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isCompleted
                  ? 'bg-[#98e58e] text-[#040404] border-[#98e58e]'
                  : 'bg-[#ffffff] text-[#6e797a] border-[#d9d9d9] hover:border-[#040404]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 fill-[#040404] text-[#98e58e]" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="h-3.5 w-3.5 text-[#6e797a]" />
                  <span>Mark Completed</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-[#6e797a]">
            Document what you accomplished, results, errors encountered, and steps taken for end-of-day review.
          </p>

          <textarea
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="e.g. Completed WAL replica sync at 10:45 AM. Resolved disk threshold alert on node-02. All procedures verified."
            className="input-sprout w-full text-xs py-2 px-3 resize-y bg-white"
          />

          {activity.completed_at && (
            <p className="text-[10px] text-[#6e797a] font-medium">
              Completed on: {new Date(activity.completed_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-[#d9d9d9] flex flex-wrap items-center justify-between gap-2">
          {/* Secondary Actions: Edit, Duplicate, Delete */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(activity);
              }}
              className="p-1.5 text-[#6e797a] hover:text-[#040404] hover:bg-[#f4f4f4] rounded-[6px] border border-[#d9d9d9] transition cursor-pointer active:scale-90 text-xs font-bold flex items-center gap-1"
              title="Edit Activity"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(activity);
              }}
              className="p-1.5 text-[#6e797a] hover:text-[#040404] hover:bg-[#f4f4f4] rounded-[6px] border border-[#d9d9d9] transition cursor-pointer active:scale-90 text-xs font-bold flex items-center gap-1"
              title="Duplicate Activity"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(activity.id);
              }}
              className="p-1.5 text-[#6e797a] hover:text-red-600 hover:bg-red-50 rounded-[6px] border border-[#d9d9d9] transition cursor-pointer active:scale-90 text-xs font-bold flex items-center gap-1"
              title="Delete Activity"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          {/* Primary Save Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-sprout-ghost text-xs py-1.5 px-3"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-sprout-primary text-xs py-1.5 px-4 cursor-pointer"
            >
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Log...</span>
                </span>
              ) : saveSuccess ? (
                <span className="flex items-center gap-1 text-[#040404]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </span>
              ) : (
                <span>Save Execution Log</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
