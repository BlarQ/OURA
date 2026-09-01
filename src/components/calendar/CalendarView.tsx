'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare,
  Activity, DollarSign, Briefcase, Clock, Plus, CheckCircle2,
  AlertCircle, Sparkles, Filter, X, Sun, Moon, Coffee, Laptop
} from 'lucide-react';
import { Task, Activity as ActivityType, Bill, Project } from '@/types';
import { taskService } from '@/lib/services/tasks';
import { projectService } from '@/lib/services/projects';
import { activityService } from '@/lib/services/activities';
import { moneyService } from '@/lib/services/money';
import { showToast } from '@/components/layout/ConfirmModal';
import { ShiftTemplateModal } from './ShiftTemplateModal';

// Helper for distinct shift icons and badge styles
const getShiftBadge = (title: string) => {
  const lower = title.toLowerCase();

  if (lower.includes('night shift')) {
    return {
      icon: '🌙',
      LucideIcon: Moon,
      label: title,
      badgeClass: 'bg-indigo-900 text-indigo-100 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-700/80 font-extrabold',
      iconClass: 'text-indigo-300 fill-current',
      cardClass: 'bg-indigo-950/60 border-indigo-800 text-indigo-200',
    };
  }

  if (lower.includes('morning shift') || lower.includes('office work')) {
    return {
      icon: '☀️',
      LucideIcon: Sun,
      label: title,
      badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 font-extrabold',
      iconClass: 'text-amber-500 fill-current',
      cardClass: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
    };
  }

  if (lower.includes('rest') || lower.includes('off day')) {
    return {
      icon: '🏖️',
      LucideIcon: Coffee,
      label: title,
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 font-extrabold',
      iconClass: 'text-emerald-500',
      cardClass: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200',
    };
  }

  if (lower.includes('remote')) {
    return {
      icon: '💻',
      LucideIcon: Laptop,
      label: title,
      badgeClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-800 font-extrabold',
      iconClass: 'text-sky-500',
      cardClass: 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200',
    };
  }

  return {
    icon: '⚡',
    LucideIcon: Activity,
    label: title,
    badgeClass: 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold',
    iconClass: 'text-blue-500',
    cardClass: 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-200',
  };
};

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');

  // Selected Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isDayInspectorOpen, setIsDayInspectorOpen] = useState<boolean>(false);

  // Schedule Planner Form Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isShiftTemplateOpen, setIsShiftTemplateOpen] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<'TASK' | 'ACTIVITY'>('TASK');
  const [scheduleTitle, setScheduleTitle] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [scheduleCategory, setScheduleCategory] = useState<string>('Work');

  const loadCalendarEvents = async () => {
    const t = await taskService.getTasks();
    setTasks(t);
    const p = await projectService.getProjects();
    setProjects(p);
    const a = await activityService.getActivities();
    setActivities(a);
    const b = await moneyService.getBills();
    setBills(b);
  };

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  // Date helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayStr(now.toISOString().split('T')[0]);
  };

  // Month view calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthDays: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    monthDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthDays.push(new Date(year, month, day));
  }

  // Week view calculations
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Sunday start
    const sunday = new Date(start.setDate(diff));
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  // Filter events for a given YYYY-MM-DD date string
  const getEventsForDate = (dateStr: string) => {
    const dayTasks = tasks.filter((t) => t.due_date === dateStr);
    const dayProjects = projects.filter(
      (p) => p.start_date === dateStr || p.created_at?.startsWith(dateStr) || p.end_date === dateStr
    );
    const dayActivities = activities.filter((a) => a.activity_date === dateStr);
    const dayBills = bills.filter((b) => b.due_date === dateStr);
    return { dayTasks, dayProjects, dayActivities, dayBills };
  };

  const handleDayCellClick = (dateStr: string) => {
    setSelectedDayStr(dateStr);
    setIsDayInspectorOpen(true);
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
    await taskService.updateTask(task.id, { status: newStatus as any });
    await loadCalendarEvents();
    showToast(`Task marked as ${newStatus}`, 'success');
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;

    if (scheduleType === 'TASK') {
      await taskService.createTask({
        title: scheduleTitle.trim(),
        due_date: selectedDayStr,
        due_time: scheduleTime,
        status: 'Not Started',
        priority: 'Medium',
        category: scheduleCategory as any,
        recurrence: 'None',
        notification_enabled: true,
      });
      showToast(`Task scheduled for ${selectedDayStr}!`, 'success');
    } else {
      await activityService.createActivity({
        title: scheduleTitle.trim(),
        activity_date: selectedDayStr,
        start_time: scheduleTime,
        category: scheduleCategory,
        status: 'Completed',
        duration_minutes: 60,
      });
      showToast(`Activity logged for ${selectedDayStr}!`, 'success');
    }

    setScheduleTitle('');
    setIsScheduleModalOpen(false);
    await loadCalendarEvents();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDateStr = currentDate.toISOString().split('T')[0];

  // Monthly stats calculations
  const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const monthTasks = tasks.filter((t) => t.due_date && t.due_date.startsWith(monthPrefix));
  const monthActivities = activities.filter((a) => a.activity_date && a.activity_date.startsWith(monthPrefix));
  const monthCompletedTasks = monthTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Calendar & Monthly Schedule Planner</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click any date to inspect scheduled tasks, activities, and manage your work plan
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsShiftTemplateOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Roster Templates</span>
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Work / Task</span>
          </button>

          <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto">
            {['Day', 'Week', 'Month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Schedule Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Scheduled Tasks</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {monthCompletedTasks} / {monthTasks.length} Completed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Logged Activities & Shifts</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {monthActivities.length} Sessions Logged
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Active Projects</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {projects.length} Active Goals
            </span>
          </div>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          {viewMode === 'Month' && currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          {viewMode === 'Week' && `Week of ${weekDays[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          {viewMode === 'Day' && currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'Month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((dateObj, idx) => {
              if (!dateObj) {
                return <div key={`empty_${idx}`} className="h-11 sm:h-32 rounded-xl sm:rounded-2xl bg-slate-50/40 dark:bg-slate-950/20" />;
              }

              const dateStr = dateObj.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDayStr;
              const { dayTasks, dayProjects, dayActivities, dayBills } = getEventsForDate(dateStr);
              const totalEvents = dayTasks.length + dayProjects.length + dayActivities.length + dayBills.length;

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayCellClick(dateStr)}
                  className={`h-11 sm:h-32 p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/40'
                      : isToday
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg ${
                      isToday
                        ? 'bg-indigo-600 text-white font-black'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {dateObj.getDate()}
                    </span>

                    {totalEvents > 0 && (
                      <span className="hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {totalEvents}
                      </span>
                    )}
                  </div>

                  {/* MOBILE ONLY: COLORED SHIFT DOTS */}
                  {totalEvents > 0 && (
                    <div className="flex sm:hidden items-center justify-center gap-1 mt-auto pb-0.5">
                      {dayActivities.slice(0, 3).map((a) => {
                        const lower = a.title.toLowerCase();
                        let dotBg = 'bg-indigo-400';
                        if (lower.includes('night shift')) dotBg = 'bg-indigo-400';
                        else if (lower.includes('morning shift') || lower.includes('office work')) dotBg = 'bg-amber-400';
                        else if (lower.includes('rest') || lower.includes('off day')) dotBg = 'bg-emerald-400';
                        else if (lower.includes('remote')) dotBg = 'bg-sky-400';

                        return (
                          <span key={dotBg + a.id} className={`w-2 h-2 rounded-full ${dotBg} shadow-2xs`} title={a.title} />
                        );
                      })}

                      {dayTasks.length > 0 && dayActivities.length === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      )}
                    </div>
                  )}

                  {/* DESKTOP ONLY: FULL SHIFT & EVENT BADGES */}
                  <div className="hidden sm:block space-y-1 overflow-hidden my-1">
                    {dayActivities.slice(0, 1).map((a) => {
                      const shift = getShiftBadge(a.title);
                      return (
                        <div
                          key={a.id}
                          className={`text-[10px] truncate px-1.5 py-0.5 rounded font-semibold ${shift.badgeClass}`}
                        >
                          {shift.icon} {a.title}
                        </div>
                      );
                    })}

                    {dayTasks.slice(0, 1).map((t) => {
                      const isCompleted = t.status === 'Completed';
                      return (
                        <div
                          key={t.id}
                          className={`text-[10px] font-bold truncate px-1.5 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 line-through opacity-80'
                              : 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {isCompleted ? '✓' : '⏳'} {t.title}
                        </div>
                      );
                    })}

                    {dayBills.slice(0, 1).map((b) => (
                      <div key={b.id} className="text-[10px] font-bold truncate px-1.5 py-0.5 rounded bg-rose-100/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                        💳 ₦{b.amount.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW GRID */}
      {viewMode === 'Week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((dateObj) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const { dayTasks, dayProjects, dayActivities, dayBills } = getEventsForDate(dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => handleDayCellClick(dateStr)}
                className={`p-4 rounded-3xl border space-y-3 cursor-pointer transition-all hover:shadow-md ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    {dateObj.toLocaleDateString('default', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-black mt-0.5 inline-block px-2.5 py-0.5 rounded-xl ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                    {dateObj.getDate()}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskStatus(t);
                      }}
                      className={`p-2.5 rounded-2xl border space-y-1 transition-all ${
                        t.status === 'Completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <CheckSquare className={`w-3.5 h-3.5 ${t.status === 'Completed' ? 'text-emerald-600' : 'text-indigo-600'}`} />
                        <span className={`truncate ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {t.title}
                        </span>
                      </div>
                    </div>
                  ))}

                  {dayActivities.map((a) => {
                    const shift = getShiftBadge(a.title);
                    const ShiftIcon = shift.LucideIcon;
                    return (
                      <div key={a.id} className={`p-2.5 rounded-2xl border space-y-1 ${shift.cardClass}`}>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <ShiftIcon className={`w-3.5 h-3.5 ${shift.iconClass}`} />
                          <span className="truncate">{a.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW HOURLY SCHEDULE */}
      {viewMode === 'Day' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Schedule for {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            {(() => {
              const { dayTasks, dayProjects, dayActivities, dayBills } = getEventsForDate(currentDateStr);

              if (dayProjects.length === 0 && dayTasks.length === 0 && dayActivities.length === 0 && dayBills.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p>No tasks or activities scheduled for this day.</p>
                  </div>
                );
              }

              return (
                <>
                  {dayTasks.map((task) => (
                    <div key={task.id} className="pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleTaskStatus(task)}>
                          {task.status === 'Completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <CheckSquare className="w-5 h-5 text-indigo-500" />
                          )}
                        </button>
                        <div>
                          <h4 className={`text-xs font-bold ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                          </h4>
                          <span className="text-[11px] text-slate-500">Task • Priority: {task.priority}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                        {task.due_time || 'All Day'}
                      </span>
                    </div>
                  ))}

                  {dayActivities.map((act) => {
                    const shift = getShiftBadge(act.title);
                    const ShiftIcon = shift.LucideIcon;
                    return (
                      <div key={act.id} className="pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${shift.badgeClass}`}>
                            <ShiftIcon className={`w-4 h-4 ${shift.iconClass}`} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{shift.icon}</span> {act.title}
                            </h4>
                            <span className="text-[11px] text-slate-500">Work Shift • {act.category}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-xl ${shift.badgeClass}`}>
                          {act.start_time || 'Logged'}
                        </span>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* DAY INSPECTOR MODAL */}
      {isDayInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Schedule & Tasks for {selectedDayStr}
                </h3>
              </div>

              <button
                onClick={() => setIsDayInspectorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Day Events */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const { dayTasks, dayProjects, dayActivities, dayBills } = getEventsForDate(selectedDayStr);
                const total = dayTasks.length + dayProjects.length + dayActivities.length + dayBills.length;

                if (total === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p>No tasks, activities, or projects scheduled for this date.</p>
                    </div>
                  );
                }

                return (
                  <>
                    {dayProjects.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{p.name}</span>
                            <span className="text-[11px] text-purple-600 dark:text-purple-400">Active Project Goal</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{p.progress}% Done</span>
                      </div>
                    ))}

                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                          t.status === 'Completed'
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleToggleTaskStatus(t)}>
                            {t.status === 'Completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <CheckSquare className="w-5 h-5 text-indigo-500" />
                            )}
                          </button>
                          <div>
                            <span className={`text-xs font-bold block ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {t.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Task • {t.status} {t.project_name ? `• Project: ${t.project_name}` : ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t.due_time || 'All Day'}</span>
                      </div>
                    ))}

                    {dayActivities.map((a) => {
                      const shift = getShiftBadge(a.title);
                      const ShiftIcon = shift.LucideIcon;
                      return (
                        <div key={a.id} className={`p-3.5 rounded-2xl border flex items-center justify-between ${shift.cardClass}`}>
                          <div className="flex items-center gap-3">
                            <ShiftIcon className={`w-4 h-4 ${shift.iconClass}`} />
                            <div>
                              <span className="text-xs font-extrabold block">{a.title}</span>
                              <span className="text-[11px] opacity-80">Work Shift • {a.category}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-xl ${shift.badgeClass}`}>
                            {a.start_time || 'Logged'}
                          </span>
                        </div>
                      );
                    })}

                    {dayBills.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{b.name}</span>
                            <span className="text-[11px] text-rose-600 dark:text-rose-400">Bill Due Payment</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">₦{b.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsDayInspectorOpen(false);
                  setIsScheduleModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Task/Activity for {selectedDayStr}</span>
              </button>

              <button
                onClick={() => setIsDayInspectorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SCHEDULE FORM MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Schedule Work / Task ({selectedDayStr})
            </h2>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleType('TASK')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      scheduleType === 'TASK'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Task / Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('ACTIVITY')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      scheduleType === 'ACTIVITY'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Work Activity / Shift
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder={scheduleType === 'TASK' ? 'e.g. Finish Monthly Audit' : 'e.g. Office Work Shift'}
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={scheduleCategory}
                    onChange={(e) => setScheduleCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Learning">Learning</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20"
                >
                  Schedule Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIFT ROSTER TEMPLATE GENERATOR MODAL */}
      <ShiftTemplateModal
        isOpen={isShiftTemplateOpen}
        onClose={() => setIsShiftTemplateOpen(false)}
        currentYear={year}
        currentMonth={month}
        onRosterGenerated={loadCalendarEvents}
      />
    </div>
  );
}
