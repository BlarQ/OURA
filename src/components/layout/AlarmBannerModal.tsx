'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, X, Volume2, RotateCcw } from 'lucide-react';
import { startContinuousAlarmRingtone, stopContinuousAlarmRingtone } from '@/lib/utils/audio';

export interface ActiveAlarm {
  id: string;
  title: string;
  description?: string;
  due_time?: string;
  type: 'TASK' | 'BILL';
}

export function AlarmBannerModal() {
  const [currentAlarm, setCurrentAlarm] = useState<ActiveAlarm | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAlarmTrigger = (e: CustomEvent<ActiveAlarm>) => {
      setCurrentAlarm(e.detail);
      startContinuousAlarmRingtone();
    };

    window.addEventListener('oura_alarm_triggered', handleAlarmTrigger as EventListener);

    return () => {
      window.removeEventListener('oura_alarm_triggered', handleAlarmTrigger as EventListener);
    };
  }, []);

  const handleDismiss = () => {
    stopContinuousAlarmRingtone();
    setCurrentAlarm(null);
  };

  const handleSnooze = (minutes: number) => {
    stopContinuousAlarmRingtone();
    setCurrentAlarm(null);

    // Re-trigger alarm after snooze minutes
    setTimeout(() => {
      if (currentAlarm) {
        window.dispatchEvent(new CustomEvent('oura_alarm_triggered', { detail: currentAlarm }));
      }
    }, minutes * 60 * 1000);
  };

  if (!currentAlarm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-linear-to-b from-indigo-900 to-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-indigo-500 space-y-6 text-center animate-bounce-subtle">
        
        {/* Pulsing Alarm Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <Volume2 className="w-9 h-9 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-[0.25em] text-indigo-300 uppercase px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 inline-block">
            🔔 ALARM RINGING
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            {currentAlarm.title}
          </h2>
          {currentAlarm.description && (
            <p className="text-xs text-indigo-200/80 line-clamp-2">
              {currentAlarm.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSnooze(5)}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-extrabold border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Snooze 5m</span>
            </button>
            <button
              onClick={() => handleSnooze(15)}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-extrabold border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Snooze 15m</span>
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Skip / Dismiss Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
