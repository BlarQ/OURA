'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon, Plus, Clock, Tag, Award, CheckCircle2,
  Calendar, Edit2, Trash2, Sparkles
} from 'lucide-react';
import { Activity } from '@/types';
import { activityService } from '@/lib/services/activities';
import { showConfirmModal, showToast } from '@/components/layout/ConfirmModal';

export function ActivitiesView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Work');
  const [accomplishment, setAccomplishment] = useState<string>('');
  const [activityDate, setActivityDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [status, setStatus] = useState<'Completed' | 'In Progress'>('Completed');

  const loadActivities = async () => {
    const list = await activityService.getActivities();
    setActivities(list);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingActivity) {
      await activityService.updateActivity(editingActivity.id, {
        title: title.trim(),
        description,
        category,
        accomplishment,
        activity_date: activityDate,
        start_time: startTime,
        status,
      });
      showToast('Activity updated successfully!', 'success');
    } else {
      await activityService.createActivity({
        title: title.trim(),
        description,
        category,
        accomplishment,
        activity_date: activityDate,
        start_time: startTime,
        duration_minutes: 30, // Default 30 mins
        status,
      });
      showToast('Activity logged successfully!', 'success');
    }

    resetForm();
    setIsModalOpen(false);
    await loadActivities();
  };

  const handleEditClick = (act: Activity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDescription(act.description || '');
    setCategory(act.category || 'Work');
    setAccomplishment(act.accomplishment || '');
    setActivityDate(act.activity_date || new Date().toISOString().split('T')[0]);
    setStartTime(act.start_time || '09:00');
    setStatus((act.status as any) || 'Completed');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    showConfirmModal({
      title: 'Delete Activity Log?',
      message: 'Are you sure you want to remove this logged activity entry?',
      isDanger: true,
      confirmText: 'Delete Activity',
      onConfirm: async () => {
        await activityService.deleteActivity(id);
        await loadActivities();
        showToast('Activity removed.', 'info');
      },
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Work');
    setAccomplishment('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setStatus('Completed');
    setEditingActivity(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = activities.filter((a) => a.activity_date === todayStr && a.status === 'Completed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Activity & Accomplishment Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log and track what you accomplish daily across work, personal, and health
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Total Activities</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{activities.length} Logged</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Completed Today</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedTodayCount} Done</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Active Categories</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {new Set(activities.map((a) => a.category)).size} Categories
            </span>
          </div>
        </div>
      </div>

      {/* Activity Cards List */}
      {activities.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No activities logged yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log your daily accomplishments, client meetings, workouts, or learning sessions. Click 'Log Activity' to start!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Activity Log Feed
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {act.category || 'Work'}
                      </span>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                        act.status === 'Completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {act.status || 'Completed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(act)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(act.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {act.title}
                    </h3>
                    {act.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>

                  {act.accomplishment && (
                    <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs space-y-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Accomplishment:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{act.accomplishment}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {act.activity_date}
                  </span>
                  {act.start_time && (
                    <span className="font-semibold text-slate-500">{act.start_time}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log / Edit Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingActivity ? 'Edit Activity Log' : 'Log New Activity'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OURA Development, Gym Session, Client Call"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Key Accomplishment / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="What was completed or achieved during this activity?"
                  value={accomplishment}
                  onChange={(e) => setAccomplishment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Learning">Learning</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20"
                >
                  {editingActivity ? 'Save Changes' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
