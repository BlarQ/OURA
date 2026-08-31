'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  type?: 'confirm' | 'alert' | 'success';
  onConfirm?: () => void | Promise<void>;
}

export function showConfirmModal(config: ConfirmConfig) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oura_show_confirm', { detail: config }));
  }
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oura_show_toast', { detail: { message, type } }));
  }
}

export function ConfirmModal() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const handleConfirmEvent = (e: any) => {
      setConfig(e.detail);
    };

    const handleToastEvent = (e: any) => {
      setToast(e.detail);
      setTimeout(() => {
        setToast(null);
      }, 3500);
    };

    window.addEventListener('oura_show_confirm', handleConfirmEvent);
    window.addEventListener('oura_show_toast', handleToastEvent);

    return () => {
      window.removeEventListener('oura_show_confirm', handleConfirmEvent);
      window.removeEventListener('oura_show_toast', handleToastEvent);
    };
  }, []);

  if (!config && !toast) return null;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slideDown">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Popup Modal */}
      {config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    config.isDanger
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {config.isDanger ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{config.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setConfig(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">{config.message}</p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {config.type !== 'alert' && (
                <button
                  type="button"
                  onClick={() => setConfig(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {config.cancelText || 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (config.onConfirm) {
                    await config.onConfirm();
                  }
                  setConfig(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all ${
                  config.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {config.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
