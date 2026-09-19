'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, Loader2 } from 'lucide-react';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  manualTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  isOpen,
  manualTitle,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  if (!isOpen || !mounted) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      console.error('Delete manual error:', err);
      setError(err?.message || 'Failed to delete manual. Please try again.');
      setIsDeleting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-99999 w-screen h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
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
          disabled={isDeleting}
          className="absolute top-3.5 right-3.5 p-1.5 text-pewter hover:text-ink-black rounded-md hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-md bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-extrabold text-ink-black tracking-tight">
              Delete Procedure Manual?
            </h3>
            <p className="text-[11px] text-pewter">
              This action is permanent and cannot be reversed.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="p-3 rounded-md bg-slate-50 border border-ash-gray text-xs text-ink-black space-y-1.5">
          <p>
            Are you sure you want to delete <strong className="font-extrabold">&quot;{manualTitle}&quot;</strong>?
          </p>
          <p className="text-[11px] text-pewter">
            All associated steps, code syntax, and media will be removed from your database.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-ash-gray">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="btn-sprout-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 active:scale-95 text-paper-white font-bold rounded-md px-3.5 py-1.5 text-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
