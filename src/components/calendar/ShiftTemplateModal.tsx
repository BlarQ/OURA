'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, Layers, Check, X, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { activityService } from '@/lib/services/activities';
import { showConfirmModal, showToast } from '@/components/layout/ConfirmModal';
import { Activity } from '@/types';

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = Jan)
  onRosterGenerated: () => void;
}

export function ShiftTemplateModal({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  onRosterGenerated,
}: ShiftTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'SAPPHIRE' | 'FLEXI_REMOTE' | 'CUSTOM'>('SAPPHIRE');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sapphire State (2 Morning, 2 Night, 2 Off)
  const defaultStartDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
  const [sapphireStartDate, setSapphireStartDate] = useState<string>(defaultStartDate);

  // Flexi-Remote State
  const [remoteDays, setRemoteDays] = useState<number[]>([3, 5]); // Wed, Fri
  const [offDays, setOffDays] = useState<number[]>([0, 6]); // Sun, Sat
  const [flexiStartTime, setFlexiStartTime] = useState<string>('09:00');

  // Custom Builder State
  const [customShiftName, setCustomShiftName] = useState<string>('Custom Shift');
  const [customWorkDays, setCustomWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customCategory, setCustomCategory] = useState<string>('Work');

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  if (!isOpen) return null;

  // Helper to toggle day selections
  const toggleDaySelection = (list: number[], day: number, setList: React.Dispatch<React.SetStateAction<number[]>>) => {
    if (list.includes(day)) {
      setList(list.filter((d) => d !== day));
    } else {
      setList([...list, day]);
    }
  };

  // Internal helper to clear existing roster entries for date range
  const clearExistingRosterEntries = async (startDateStr: string) => {
    const list = await activityService.getActivities();
    const rosterActivities = list.filter((a) => {
      const isRosterTitle =
        a.title.includes('Morning Shift') ||
        a.title.includes('Night Shift') ||
        a.title.includes('Rest / Off Day') ||
        a.title.includes('Work Shift') ||
        a.title.includes(customShiftName);
      return isRosterTitle && a.activity_date >= startDateStr;
    });

    if (rosterActivities.length > 0) {
      await activityService.bulkDeleteActivities(rosterActivities.map((a) => a.id));
    }
  };

  // Reset / Clear existing roster for rest of year
  const handleResetRoster = () => {
    showConfirmModal({
      title: 'Reset & Clear Work Roster?',
      message: 'Are you sure you want to reset all generated work shifts for the rest of the year? This will allow you to apply a fresh template.',
      isDanger: true,
      confirmText: 'Reset Roster',
      onConfirm: async () => {
        setIsGenerating(true);
        const startStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
        await clearExistingRosterEntries(startStr);
        setIsGenerating(false);

        showToast('Work roster schedule reset successfully!', 'info');
        onRosterGenerated();
      },
    });
  };

  // 1. Generate Sapphire Schedule for the Rest of the Year (INSTANT BATCH)
  const handleGenerateSapphire = async () => {
    setIsGenerating(true);
    await clearExistingRosterEntries(sapphireStartDate);

    const start = new Date(sapphireStartDate);
    const endOfYear = new Date(currentYear, 11, 31); // Dec 31 of currentYear

    const shiftsToCreate: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [];
    const curr = new Date(start);

    while (curr <= endOfYear) {
      const dateStr = curr.toISOString().split('T')[0];

      // Calculate offset days relative to start date
      const diffTime = curr.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

      // 6-day cycle: 0,1 = Morning | 2,3 = Night | 4,5 = Off
      const cycleIndex = ((diffDays % 6) + 6) % 6;

      let shiftTitle = '';
      let startTime = '08:00';
      let durationMins = 480;

      if (cycleIndex === 0 || cycleIndex === 1) {
        shiftTitle = 'Morning Shift (08:00 - 16:00)';
        startTime = '08:00';
      } else if (cycleIndex === 2 || cycleIndex === 3) {
        shiftTitle = 'Night Shift (20:00 - 04:00)';
        startTime = '20:00';
      } else {
        shiftTitle = 'Rest / Off Day';
        startTime = '00:00';
        durationMins = 0;
      }

      shiftsToCreate.push({
        title: shiftTitle,
        activity_date: dateStr,
        start_time: startTime,
        duration_minutes: durationMins,
        category: 'Work',
        status: cycleIndex === 4 || cycleIndex === 5 ? 'Scheduled' : 'Completed',
      });

      curr.setDate(curr.getDate() + 1);
    }

    // Single batch insert execution
    await activityService.bulkCreateActivities(shiftsToCreate);
    setIsGenerating(false);

    showToast(`Sapphire Schedule generated for rest of ${currentYear}! (${shiftsToCreate.length} shifts)`, 'success');
    onRosterGenerated();
    onClose();
  };

  // 2. Generate Flexi-Remote Hybrid Schedule for the Rest of the Year (INSTANT BATCH)
  const handleGenerateFlexiRemote = async () => {
    setIsGenerating(true);
    const startStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
    await clearExistingRosterEntries(startStr);

    const start = new Date(currentYear, currentMonth, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const shiftsToCreate: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [];
    const curr = new Date(start);

    while (curr <= endOfYear) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayOfWeek = curr.getDay();

      let shiftTitle = '';
      if (offDays.includes(dayOfWeek)) {
        shiftTitle = 'Off / Rest Day';
      } else if (remoteDays.includes(dayOfWeek)) {
        shiftTitle = `Remote Work Shift (${flexiStartTime})`;
      } else {
        shiftTitle = `Office Work Shift (${flexiStartTime})`;
      }

      shiftsToCreate.push({
        title: shiftTitle,
        activity_date: dateStr,
        start_time: flexiStartTime,
        duration_minutes: offDays.includes(dayOfWeek) ? 0 : 480,
        category: 'Work',
        status: offDays.includes(dayOfWeek) ? 'Scheduled' : 'Completed',
      });

      curr.setDate(curr.getDate() + 1);
    }

    await activityService.bulkCreateActivities(shiftsToCreate);
    setIsGenerating(false);

    showToast(`Flexi-Remote Roster generated for rest of ${currentYear}! (${shiftsToCreate.length} days)`, 'success');
    onRosterGenerated();
    onClose();
  };

  // 3. Generate Custom Schedule for the Rest of the Year (INSTANT BATCH)
  const handleGenerateCustom = async () => {
    setIsGenerating(true);
    const startStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`;
    await clearExistingRosterEntries(startStr);

    const start = new Date(currentYear, currentMonth, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const shiftsToCreate: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [];
    const curr = new Date(start);

    while (curr <= endOfYear) {
      const dateStr = curr.toISOString().split('T')[0];
      const dayOfWeek = curr.getDay();

      if (customWorkDays.includes(dayOfWeek)) {
        shiftsToCreate.push({
          title: customShiftName || 'Custom Shift',
          activity_date: dateStr,
          start_time: customStartTime,
          duration_minutes: 480,
          category: customCategory,
          status: 'Completed',
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    await activityService.bulkCreateActivities(shiftsToCreate);
    setIsGenerating(false);

    showToast(`Custom Roster applied! Created ${shiftsToCreate.length} work shifts through Dec ${currentYear}.`, 'success');
    onRosterGenerated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Work Shift Roster Planner ({currentYear})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Tabs & Reset Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-1">
            <button
              onClick={() => setActiveTab('SAPPHIRE')}
              className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all truncate ${
                activeTab === 'SAPPHIRE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              💎 Sapphire Schedule
            </button>

            <button
              onClick={() => setActiveTab('FLEXI_REMOTE')}
              className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all truncate ${
                activeTab === 'FLEXI_REMOTE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              💻 Flexi-Remote
            </button>

            <button
              onClick={() => setActiveTab('CUSTOM')}
              className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all truncate ${
                activeTab === 'CUSTOM'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ⚙️ Custom Builder
            </button>
          </div>

          <button
            onClick={handleResetRoster}
            disabled={isGenerating}
            className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Reset & Clear Roster"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Roster</span>
          </button>
        </div>

        {/* 1. SAPPHIRE SCHEDULE (2 Morning, 2 Night, 2 Off) */}
        {activeTab === 'SAPPHIRE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-2">
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 block">
                Pattern: 2 Morning Shifts → 2 Night Shifts → 2 Off Days (Full Year)
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Select the start date for your first 2 Morning Shifts. The system automatically populates your 6-day repeating rotation for the rest of {currentYear}!
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                First Morning Shift Start Date *
              </label>
              <input
                type="date"
                required
                value={sapphireStartDate}
                onChange={(e) => setSapphireStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateSapphire}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Roster Seamlessly...</span>
                </>
              ) : (
                <span>Generate Sapphire Roster for Rest of {currentYear}</span>
              )}
            </button>
          </div>
        )}

        {/* 2. FLEXI-REMOTE HYBRID SCHEDULE */}
        {activeTab === 'FLEXI_REMOTE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1">
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 block">
                Hybrid Remote / Office Work Roster (Full Year)
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Select your Remote Days and Off Days. The system calculates Office vs Remote shifts through Dec {currentYear}!
              </p>
            </div>

            {/* Select Remote Days */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select Remote Work Days (💻)
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {daysOfWeek.map((d) => (
                  <button
                    key={`remote_${d.value}`}
                    type="button"
                    onClick={() => toggleDaySelection(remoteDays, d.value, setRemoteDays)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      remoteDays.includes(d.value)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Off Days */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select Off / Rest Days (🏖️)
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {daysOfWeek.map((d) => (
                  <button
                    key={`off_${d.value}`}
                    type="button"
                    onClick={() => toggleDaySelection(offDays, d.value, setOffDays)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      offDays.includes(d.value)
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateFlexiRemote}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Roster Seamlessly...</span>
                </>
              ) : (
                <span>Generate Flexi-Remote Roster for Rest of {currentYear}</span>
              )}
            </button>
          </div>
        )}

        {/* 3. CUSTOM SCHEDULE BUILDER */}
        {activeTab === 'CUSTOM' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Shift Name *
              </label>
              <input
                type="text"
                required
                value={customShiftName}
                onChange={(e) => setCustomShiftName(e.target.value)}
                placeholder="e.g. Standard Work Shift"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Work Days Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select Working Days
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {daysOfWeek.map((d) => (
                  <button
                    key={`custom_${d.value}`}
                    type="button"
                    onClick={() => toggleDaySelection(customWorkDays, d.value, setCustomWorkDays)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      customWorkDays.includes(d.value)
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Work">Work</option>
                  <option value="Learning">Learning</option>
                  <option value="Health">Health</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateCustom}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Roster Seamlessly...</span>
                </>
              ) : (
                <span>Apply Custom Roster to Rest of {currentYear}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
