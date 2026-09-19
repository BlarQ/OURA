'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  BookOpen,
  AlertCircle,
  Copy,
  Repeat,
  X,
  FileText,
  FileSpreadsheet,
  Download,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import type { ManualListItem } from '@/lib/services/manuals';
import type { WeeklyActivity } from '@/types/database.types';
import type { CreateActivityPayload } from '@/lib/services/activities';
import {
  getWeeklyActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  toggleActivityCompleted,
  saveActivityCompletionNotes,
  copyWeekActivities,
  duplicateSingleActivity,
} from '@/lib/services/activities';
import {
  exportScheduleToExcel,
  exportScheduleToWord,
} from '@/lib/utils/exportSchedule';
import AddActivityModal from '@/components/planner/AddActivityModal';
import CopyWeekModal from '@/components/planner/CopyWeekModal';
import DuplicateActivityModal from '@/components/planner/DuplicateActivityModal';
import TaskDetailsModal from '@/components/planner/TaskDetailsModal';

interface WeeklyPlannerProps {
  manuals: ManualListItem[];
}

export interface WeekdayInfo {
  dateObj: Date;
  dateStr: string; // 'YYYY-MM-DD'
  dayName: string; // 'Monday'
  shortDay: string; // 'Mon'
  formattedDate: string; // 'Sep 15'
  isToday: boolean;
}

export default function WeeklyPlanner({ manuals }: WeeklyPlannerProps) {
  // Current week offset in weeks from today (0 = current week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);
  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Activity Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetDay, setTargetDay] = useState<WeekdayInfo | null>(null);
  const [editingActivity, setEditingActivity] = useState<WeeklyActivity | null>(null);

  // Task Details & Execution Log Modal State
  const [selectedTask, setSelectedTask] = useState<{
    activity: WeeklyActivity;
    day: WeekdayInfo;
  } | null>(null);

  // Bulk Week Copy Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Single Activity Duplication Modal State
  const [duplicatingActivity, setDuplicatingActivity] = useState<WeeklyActivity | null>(null);

  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    targetOffset?: number;
  } | null>(null);

  // Mobile Active Day selection (0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri)
  const [selectedMobileDayIdx, setSelectedMobileDayIdx] = useState<number>(0);
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'all'>('single');

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate Monday to Friday of the selected week
  const weekDays: WeekdayInfo[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() + distanceToMonday + weekOffset * 7);

    const days: WeekdayInfo[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      days.push({
        dateObj: d,
        dateStr,
        dayName: dayNames[i],
        shortDay: shortNames[i],
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
      });
    }

    return days;
  }, [weekOffset]);

  // Sync mobile active day to today if in current week
  useEffect(() => {
    const todayIdx = weekDays.findIndex((d) => d.isToday);
    if (todayIdx !== -1) {
      setSelectedMobileDayIdx(todayIdx);
    } else {
      setSelectedMobileDayIdx(0);
    }
  }, [weekOffset, weekDays]);

  const startDateStr = weekDays[0]?.dateStr || '';
  const endDateStr = weekDays[4]?.dateStr || '';

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!startDateStr || !endDateStr) return;
    setLoading(true);
    try {
      const data = await getWeeklyActivities(startDateStr, endDateStr);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load weekly activities:', err);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const map: { [dateStr: string]: WeeklyActivity[] } = {};
    weekDays.forEach((d) => {
      map[d.dateStr] = [];
    });
    activities.forEach((act) => {
      if (map[act.activity_date]) {
        map[act.activity_date].push(act);
      }
    });
    return map;
  }, [weekDays, activities]);

  // Statistics
  const totalCount = activities.length;
  const completedCount = activities.filter((a) => a.is_completed).length;
  const criticalCount = activities.filter(
    (a) => a.priority === 'critical' && !a.is_completed
  ).length;

  // Handlers
  const handleOpenAddModal = (day: WeekdayInfo) => {
    setTargetDay(day);
    setEditingActivity(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (day: WeekdayInfo, activity: WeeklyActivity) => {
    setTargetDay(day);
    setEditingActivity(activity);
    setIsAddModalOpen(true);
  };

  const handleOpenTaskDetails = (day: WeekdayInfo, activity: WeeklyActivity) => {
    setSelectedTask({ activity, day });
  };

  const handleSaveActivity = async (payload: CreateActivityPayload) => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, payload);
    } else {
      await createActivity(payload);
    }
    await fetchActivities();
  };

  const handleToggleComplete = async (activity: WeeklyActivity) => {
    const nextState = !activity.is_completed;
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id
          ? {
              ...a,
              is_completed: nextState,
              completed_at: nextState ? new Date().toISOString() : null,
            }
          : a
      )
    );
    await toggleActivityCompleted(activity.id, nextState);
  };

  const handleSaveTaskCompletion = async (
    activityId: string,
    isCompleted: boolean,
    completionNotes: string
  ) => {
    await saveActivityCompletionNotes(activityId, completionNotes, isCompleted);
    await fetchActivities();
    setToastMessage({ text: 'Execution notes updated successfully.' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteActivity = async (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
    await deleteActivity(activityId);
  };

  // Duplicate Single Activity Handler
  const handleDuplicateSingleActivity = async (
    activity: WeeklyActivity,
    targetDateStr: string,
    resetCompleted: boolean
  ) => {
    await duplicateSingleActivity(activity, targetDateStr, resetCompleted);
    await fetchActivities();
    setToastMessage({
      text: `Duplicated "${activity.title}" to ${targetDateStr}!`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Bulk Week Copy Execution
  const handleExecuteCopyWeek = async (
    sourceMonday: string,
    targetMonday: string,
    resetCompleted: boolean
  ): Promise<number> => {
    const res = await copyWeekActivities(sourceMonday, targetMonday, resetCompleted);
    if (!res.success) {
      throw new Error('Database error while copying weekly activities.');
    }
    return res.copiedCount;
  };

  const handleCopyWeekSuccess = (
    targetOffset: number,
    count: number,
    message: string
  ) => {
    setToastMessage({ text: message, targetOffset });
    if (targetOffset === weekOffset) {
      fetchActivities();
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const weekRangeTitle = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0].formattedDate;
    const end = weekDays[4].formattedDate;
    const year = weekDays[0].dateObj.getFullYear();
    return `${start} – ${end}, ${year}`;
  }, [weekDays]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Activity Add/Edit Modal (Compact & Animated) */}
      {targetDay && (
        <AddActivityModal
          isOpen={isAddModalOpen}
          targetDate={targetDay.dateStr}
          dayName={targetDay.dayName}
          formattedDateStr={targetDay.formattedDate}
          manuals={manuals}
          editingActivity={editingActivity}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSaveActivity}
        />
      )}

      {/* Task Details & Daily Execution Log Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={!!selectedTask}
          activity={selectedTask.activity}
          dayName={selectedTask.day.dayName}
          formattedDateStr={selectedTask.day.formattedDate}
          onClose={() => setSelectedTask(null)}
          onSaveCompletion={handleSaveTaskCompletion}
          onEdit={(act) => handleOpenEditModal(selectedTask.day, act)}
          onDuplicate={(act) => setDuplicatingActivity(act)}
          onDelete={(id) => handleDeleteActivity(id)}
        />
      )}

      {/* Copy Week Activities Pop-up Modal (Compact & Animated) */}
      <CopyWeekModal
        isOpen={isCopyModalOpen}
        currentOffset={weekOffset}
        onClose={() => setIsCopyModalOpen(false)}
        onCopySuccess={handleCopyWeekSuccess}
        onExecuteCopy={handleExecuteCopyWeek}
      />

      {/* Duplicate Single Activity Pop-up Modal (Compact & Animated) */}
      <DuplicateActivityModal
        isOpen={!!duplicatingActivity}
        activity={duplicatingActivity}
        onClose={() => setDuplicatingActivity(null)}
        onDuplicate={handleDuplicateSingleActivity}
      />

      {/* Animated Toast Notification */}
      {toastMessage && (
        <div className="p-3 sm:p-3.5 rounded-lg bg-sprout-green/25 border border-sprout-green flex items-center justify-between gap-3 text-xs font-bold text-ink-black animate-modal-in shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-ink-black shrink-0" />
            <span className="truncate">{toastMessage.text}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toastMessage.targetOffset !== undefined &&
              toastMessage.targetOffset !== weekOffset && (
                <button
                  type="button"
                  onClick={() => {
                    if (toastMessage.targetOffset !== undefined) {
                      setWeekOffset(toastMessage.targetOffset);
                    }
                    setToastMessage(null);
                  }}
                  className="btn-sprout-dark text-[11px] py-1 px-2 sm:px-2.5 cursor-pointer active:scale-95"
                >
                  Jump to Week →
                </button>
              )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 text-ink-black hover:opacity-75 cursor-pointer active:scale-90 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Week Navigator & Action Toolbar (Fits completely on all screens without horizontal scrolling) */}
      <div className="card-sprout p-3 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-ash-gray shrink-0">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 sm:p-1.5 text-pewter hover:text-ink-black hover:bg-white rounded-md transition cursor-pointer active:scale-90"
              title="Previous Week"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all cursor-pointer active:scale-95 ${
                weekOffset === 0
                  ? 'bg-ink-black text-white shadow-xs'
                  : 'text-pewter hover:text-ink-black hover:bg-white'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 sm:p-1.5 text-pewter hover:text-ink-black hover:bg-white rounded-md transition cursor-pointer active:scale-90"
              title="Next Week"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          <div className="pl-1 sm:pl-2 min-w-0">
            <span className="text-xs sm:text-base font-extrabold text-ink-black block tracking-tight truncate">
              {weekRangeTitle}
            </span>
            <span className="text-[10px] text-pewter font-bold block truncate">
              Weekdays (Mon – Fri)
            </span>
          </div>
        </div>

        {/* Action Controls: Guaranteed to fit at once in a single row with ZERO horizontal scrolling */}
        <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 w-full md:w-auto pt-1 sm:pt-0 border-t md:border-t-0 border-slate-100">
          {/* Prominent Copy Week Activities Pop-up Trigger */}
          <button
            type="button"
            onClick={() => setIsCopyModalOpen(true)}
            className="btn-sprout-ghost text-[11px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1 border-ink-black hover:bg-sprout-green/20 active:scale-95 transition-transform whitespace-nowrap shrink-0"
            title="Copy and duplicate activities to another week"
          >
            <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ink-black shrink-0" />
            <span className="font-extrabold text-ink-black sm:hidden">Copy</span>
            <span className="font-extrabold text-ink-black hidden sm:inline">Copy Activities</span>
          </button>

          {/* Export Schedule Dropdown */}
          <div className="relative shrink-0" ref={exportRef}>
            <button
              type="button"
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="btn-sprout-ghost text-[11px] sm:text-xs py-1 sm:py-1.5 px-1.5 sm:px-2.5 flex items-center gap-1 border-ash-gray hover:border-ink-black active:scale-95 transition-transform cursor-pointer whitespace-nowrap shrink-0"
              title="Export weekly schedule to Word or Excel"
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ink-black shrink-0" />
              <span className="font-bold text-ink-black hidden sm:inline">Export</span>
              <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pewter" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-ash-gray rounded-lg shadow-xl z-40 p-1.5 space-y-1 animate-modal-in">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    exportScheduleToWord(weekRangeTitle, weekDays, activitiesByDate);
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-slate-100 transition cursor-pointer flex items-center gap-2 text-xs font-bold text-ink-black"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="block">Export to Word (.doc)</span>
                    <span className="text-[10px] text-pewter font-normal block">
                      Full report with notes
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    exportScheduleToExcel(weekRangeTitle, weekDays, activitiesByDate);
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-slate-100 transition cursor-pointer flex items-center gap-2 text-xs font-bold text-ink-black"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <div>
                    <span className="block">Export to Excel (.csv)</span>
                    <span className="text-[10px] text-pewter font-normal block">
                      Tabular spreadsheet
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats Chips */}
          <span className="badge-sprout-neutral text-[10px] sm:text-xs py-0.5 sm:py-1 px-1.5 sm:px-2.5 whitespace-nowrap shrink-0">
            <span className="sm:hidden">{totalCount} Tot</span>
            <span className="hidden sm:inline">{totalCount} Total</span>
          </span>
          <span className="badge-sprout-green text-[10px] sm:text-xs py-0.5 sm:py-1 px-1.5 sm:px-2.5 whitespace-nowrap shrink-0">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span>{completedCount} Done</span>
          </span>
          {criticalCount > 0 && (
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-3xl bg-red-100 border border-red-300 text-red-700 text-[10px] sm:text-xs font-bold flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
              <AlertCircle className="h-3 w-3 text-red-600 shrink-0" />
              <span className="sm:hidden">{criticalCount} Crit</span>
              <span className="hidden sm:inline">{criticalCount} Critical</span>
            </span>
          )}
        </div>
      </div>


      {/* =========================================================================
          MOBILE VIEW (< 768px): Responsive Day Switcher Tabs + Active Day Panel
          ========================================================================= */}
      <div key={`mobile-week-${startDateStr}`} className="block md:hidden space-y-3.5 animate-tab-content">
        {/* Day Selector Pill Bar */}
        <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-ash-gray">
          {weekDays.map((day, idx) => {
            const dayActs = activitiesByDate[day.dateStr] || [];
            const isSelected = selectedMobileDayIdx === idx;
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setSelectedMobileDayIdx(idx);
                  setMobileViewMode('single');
                }}
                className={`flex-1 py-1.5 px-0.5 rounded-lg text-center transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-ink-black text-white shadow-xs'
                    : 'text-ink-black hover:bg-white/60'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-extrabold block">{day.shortDay}</span>
                <span className="text-[9px] sm:text-[10px] opacity-75 block">{day.dateObj.getDate()}</span>
                {dayActs.length > 0 && (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-sprout-green' : 'bg-ink-black'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* View mode toggle: Single day vs Full week feed */}
        <div className="flex justify-between items-center px-1">
          <button
            type="button"
            onClick={() => setIsCopyModalOpen(true)}
            className="text-xs font-bold text-ink-black flex items-center gap-1 link-sprout"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy this week</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileViewMode((prev) => (prev === 'single' ? 'all' : 'single'))
            }
            className="text-xs font-bold text-pewter hover:text-ink-black link-sprout"
          >
            {mobileViewMode === 'single'
              ? 'View all 5 weekdays'
              : 'View active day only'}
          </button>
        </div>

        {/* Mobile Single Day Card */}
        {mobileViewMode === 'single' && (
          <div className="card-sprout p-3.5 sm:p-4 space-y-3 animate-tab-content">
            {(() => {
              const day = weekDays[selectedMobileDayIdx];
              if (!day) return null;
              const dayActs = activitiesByDate[day.dateStr] || [];

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-ash-gray pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-ink-black">
                          {day.dayName}
                        </h3>
                        {day.isToday && (
                          <span className="badge-sprout-green text-[9px] px-1.5 py-0.2 animate-pulse">
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-pewter font-bold">
                        {day.formattedDate} • {dayActs.length}{' '}
                        {dayActs.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(day)}
                      className="btn-sprout-primary text-xs py-1.5 px-3 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Add Activity</span>
                    </button>
                  </div>

                  {/* Activity List */}
                  {dayActs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-pewter space-y-1.5">
                      <p>No operations planned for {day.dayName}.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(day)}
                        className="link-sprout text-ink-black text-xs font-bold"
                      >
                        + Plan first activity
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayActs.map((act, idx) => (
                        <ActivityCard
                           key={act.id}
                           activity={act}
                           animDelay={idx * 0.04}
                           onOpenDetails={() => handleOpenTaskDetails(day, act)}
                           onToggleComplete={() => handleToggleComplete(act)}
                           onEdit={() => handleOpenEditModal(day, act)}
                           onDuplicate={() => setDuplicatingActivity(act)}
                           onDelete={() => handleDeleteActivity(act.id)}
                         />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Mobile All Days Feed */}
        {mobileViewMode === 'all' && (
          <div className="space-y-3 animate-tab-content">
            {weekDays.map((day) => {
              const dayActs = activitiesByDate[day.dateStr] || [];
              return (
                <div key={day.dateStr} className="card-sprout p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-ash-gray pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-ink-black">
                        {day.dayName}
                      </span>
                      <span className="text-[11px] text-pewter font-bold">
                        ({day.formattedDate})
                      </span>
                      {day.isToday && (
                        <span className="badge-sprout-green text-[9px] px-1.5 py-0.2 animate-pulse">
                          TODAY
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(day)}
                      className="text-xs font-bold text-ink-black hover:text-ink-black p-1 rounded-md hover:bg-slate-100 border border-ash-gray active:scale-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {dayActs.length === 0 ? (
                    <p className="text-xs text-pewter py-1">No activities scheduled.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayActs.map((act, idx) => (
                        <ActivityCard
                          key={act.id}
                          activity={act}
                          animDelay={idx * 0.04}
                          onOpenDetails={() => handleOpenTaskDetails(day, act)}
                          onToggleComplete={() => handleToggleComplete(act)}
                          onEdit={() => handleOpenEditModal(day, act)}
                          onDuplicate={() => setDuplicatingActivity(act)}
                          onDelete={() => handleDeleteActivity(act.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP & TABLET VIEW (>= 768px): 5-Column Weekday Grid (Mon - Fri)
          ========================================================================= */}
      <div
        key={`desktop-week-${startDateStr}`}
        className="hidden md:grid md:grid-cols-5 gap-2.5 lg:gap-3.5 items-start animate-column-stagger"
      >
        {weekDays.map((day, colIdx) => {
          const dayActs = activitiesByDate[day.dateStr] || [];

          return (
            <div
              key={day.dateStr}
              style={{ animationDelay: `${colIdx * 0.05}s` }}
              className={`card-sprout p-3 sm:p-3.5 flex flex-col justify-between min-h-110 transition-all duration-200 hover:shadow-sm ${
                day.isToday
                  ? 'border-ink-black bg-paper-white ring-1 ring-ink-black'
                  : 'bg-paper-white hover:border-smoke-gray'
              }`}
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Day Header Column */}
                <div className="border-b border-ash-gray pb-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-ink-black uppercase tracking-wider">
                      {day.shortDay}
                    </span>
                    {day.isToday ? (
                      <span className="badge-sprout-green text-[9px] px-1.5 py-0.5 animate-pulse">
                        TODAY
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-pewter">
                        {day.formattedDate}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-pewter font-bold">
                    <span>{day.dayName}</span>
                    <span>
                      {dayActs.length} {dayActs.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </div>

                {/* Day Activities List */}
                <div className="space-y-2">
                  {dayActs.length === 0 ? (
                    <div className="py-7 text-center text-xs text-pewter">
                      <span>No activities</span>
                    </div>
                  ) : (
                    dayActs.map((act, idx) => (
                      <ActivityCard
                        key={act.id}
                        activity={act}
                        animDelay={idx * 0.03}
                        onOpenDetails={() => handleOpenTaskDetails(day, act)}
                        onToggleComplete={() => handleToggleComplete(act)}
                        onEdit={() => handleOpenEditModal(day, act)}
                        onDuplicate={() => setDuplicatingActivity(act)}
                        onDelete={() => handleDeleteActivity(act.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Bottom "+ Add Activity" Action */}
              <div className="pt-2 mt-2 border-t border-ash-gray">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(day)}
                  className="w-full py-1.5 px-2 text-xs font-bold text-ink-black bg-paper-white hover:bg-slate-100 border border-dashed border-smoke-gray hover:border-ink-black rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Activity</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Activity Item Card with clickable details, execution log pill, and micro-animations
 */
interface ActivityCardProps {
  activity: WeeklyActivity;
  animDelay?: number;
  onOpenDetails: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ActivityCard({
  activity,
  animDelay = 0,
  onOpenDetails,
  onToggleComplete,
  onEdit,
  onDuplicate,
  onDelete,
}: ActivityCardProps) {
  const isCritical = activity.priority === 'critical';
  const hasNotes = Boolean(activity.completion_notes && activity.completion_notes.trim());

  return (
    <div
      style={{ animationDelay: `${animDelay}s` }}
      className={`p-2.5 rounded-lg border transition-all duration-200 text-left space-y-1.5 hover:-translate-y-0.5 hover:shadow-xs animate-tab-content cursor-pointer group ${
        activity.is_completed
          ? 'bg-slate-50 border-ash-gray opacity-80'
          : isCritical
          ? 'bg-red-50/40 border-red-200 hover:border-red-400'
          : 'bg-paper-white border-ash-gray hover:border-ink-black'
      }`}
      onClick={onOpenDetails}
    >
      {/* Top Meta: Time & Priority & Checkbox */}
      <div className="flex items-start justify-between gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className="p-0.5 text-ink-black hover:opacity-75 transition-transform active:scale-125 cursor-pointer mt-0.5 shrink-0"
          title={activity.is_completed ? 'Mark pending' : 'Mark completed'}
        >
          {activity.is_completed ? (
            <CheckCircle2 className="h-4 w-4 text-ink-black fill-sprout-green" />
          ) : (
            <Circle className="h-4 w-4 text-pewter hover:text-ink-black" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            {activity.time_slot && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-pewter bg-slate-100 px-1.5 py-0.5 rounded-sm border border-ash-gray">
                <Clock className="h-2.5 w-2.5" />
                <span className="truncate">{activity.time_slot}</span>
              </span>
            )}

            {isCritical && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 border border-red-200 animate-pulse">
                Critical
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions: Duplicate, Edit, Delete */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-pewter hover:text-ink-black rounded-sm hover:bg-slate-100 transition cursor-pointer active:scale-90"
            title="Duplicate activity"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-pewter hover:text-ink-black rounded-sm hover:bg-slate-100 transition cursor-pointer active:scale-90"
            title="Edit activity"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-pewter hover:text-red-600 rounded-sm hover:bg-red-50 transition cursor-pointer active:scale-90"
            title="Delete activity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Activity Title */}
      <h4
        className={`text-xs font-bold leading-snug wrap-break-word transition-all duration-200 group-hover:text-ink-black ${
          activity.is_completed ? 'line-through text-pewter' : 'text-ink-black'
        }`}
      >
        {activity.title}
      </h4>

      {/* Execution Log Snippet / Notes Indicator */}
      {hasNotes && (
        <div className="p-1.5 rounded-sm bg-[#f0fdf4] border border-[#bbf7d0] text-[10px] text-[#166534] flex items-start gap-1">
          <FileCheck className="h-3 w-3 text-[#16a34a] shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-tight font-medium italic">
            &quot;{activity.completion_notes}&quot;
          </span>
        </div>
      )}

      {/* Description / Notes if any and no completion notes */}
      {!hasNotes && activity.description && (
        <p className="text-[10px] text-pewter line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
      )}

      {/* Linked Procedure Playbook Shortcut Link */}
      {activity.manual_id && (
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/manuals/${activity.manual_id}`}
            className="inline-flex items-center gap-1 text-[9px] font-extrabold text-ink-black bg-sprout-green/30 hover:bg-sprout-green border border-sprout-green px-1.5 py-0.5 rounded-sm transition-all cursor-pointer truncate max-w-full hover:scale-102 active:scale-95"
            title="Open linked procedure manual"
          >
            <BookOpen className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">Run: {activity.manual_title || 'Procedure'}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
