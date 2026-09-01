'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Plus, Search, Filter, Clock, AlertCircle, ChevronDown,
  Trash2, Bell, RefreshCw
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { taskService } from '@/lib/services/tasks';
import { projectService } from '@/lib/services/projects';

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newSubtaskInput, setNewSubtaskInput] = useState<{ [taskId: string]: string }>({});

  // Form State for New Task
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    due_date: new Date().toISOString().split('T')[0],
    due_time: '12:00',
    project_id: '',
    project_name: '',
    category: 'General',
    recurrence: 'None' as any,
    notification_enabled: true,
    reminder_time: '15 minutes before',
  });

  const loadTasks = async () => {
    const list = await taskService.getTasks();
    setTasks(list);
    const projList = await projectService.getProjects();
    setProjects(projList);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleTask = async (id: string) => {
    await taskService.toggleTaskStatus(id);
    await loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await taskService.deleteTask(id);
    await loadTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await taskService.createTask({
      ...formData,
      subtasks: [],
    });

    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      due_date: new Date().toISOString().split('T')[0],
      due_time: '12:00',
      project_id: '',
      project_name: '',
      category: 'General',
      recurrence: 'None',
      notification_enabled: true,
      reminder_time: '15 minutes before',
    });
    await loadTasks();
  };

  const handleAddSubtask = async (taskId: string) => {
    const title = newSubtaskInput[taskId];
    if (!title || !title.trim()) return;

    await taskService.addSubtask(taskId, title.trim());
    setNewSubtaskInput({ ...newSubtaskInput, [taskId]: '' });
    await loadTasks();
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    await taskService.toggleSubtask(taskId, subtaskId);
    await loadTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'Pending' && t.status === 'Completed') return false;
    if (filterStatus === 'Completed' && t.status !== 'Completed') return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Task Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize daily tasks, priorities, subtasks, and reminders
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['All', 'Pending', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You're all caught up! Create a new task to stay on top of your daily goals.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-3xl border transition-all ${
                task.status === 'Completed'
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-6 h-6 mt-0.5 rounded-xl border flex items-center justify-center transition-colors ${
                      task.status === 'Completed'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {task.status === 'Completed' && <CheckSquare className="w-4 h-4 stroke-3" />}
                  </button>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-base font-bold ${
                          task.status === 'Completed'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : task.priority === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        Due: {task.due_date} {task.due_time && `at ${task.due_time}`}
                      </span>

                      {task.notification_enabled && (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <Bell className="w-3.5 h-3.5" />
                          Reminder ({task.reminder_time})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtasks Section */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 pl-9">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Subtasks Checklist
                </span>

                {task.subtasks && task.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      checked={st.is_completed}
                      onChange={() => handleToggleSubtask(task.id, st.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={st.is_completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                      {st.title}
                    </span>
                  </div>
                ))}

                {/* Add Subtask input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add subtask..."
                    value={newSubtaskInput[task.id] || ''}
                    onChange={(e) => setNewSubtaskInput({ ...newSubtaskInput, [task.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-transparent focus:border-indigo-500 focus:outline-none flex-1 max-w-sm"
                  />
                  <button
                    onClick={() => handleAddSubtask(task.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Create New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task details"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Assign to Project (Optional)</label>
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => {
                    const selectedProj = projects.find((p) => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      project_id: e.target.value,
                      project_name: selectedProj ? selectedProj.name : '',
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">None (Standalone Task)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>📁 {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Alarm Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.due_time}
                    onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Notification & Audio Alarm Settings */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">Enable Push &amp; Ringtone Alarm</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400">Desktop popup notification &amp; ringtone sound chime</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notification_enabled}
                    onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {formData.notification_enabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block mb-1">Reminder Timing</label>
                      <select
                        value={formData.reminder_time}
                        onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="At time of event">At time of event</option>
                        <option value="5 minutes before">5 minutes before</option>
                        <option value="15 minutes before">15 minutes before</option>
                        <option value="30 minutes before">30 minutes before</option>
                        <option value="1 hour before">1 hour before</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={async () => {
                          const { playAlarmSound } = await import('@/lib/utils/audio');
                          playAlarmSound();
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Test Ringtone</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
