'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Plus, Edit2, Trash2, Calendar, Target } from 'lucide-react';
import { Goal, GoalCategory } from '@/types';
import { goalService } from '@/lib/services/goals';
import { showConfirmModal } from '@/components/layout/ConfirmModal';

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Financial');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [progress, setProgress] = useState<number>(0);

  const loadGoals = async () => {
    const list = await goalService.getGoals();
    setGoals(list);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      await goalService.updateGoal(editingGoal.id, {
        title,
        description,
        category,
        target_date: targetDate,
        progress,
        status: progress >= 100 ? 'Achieved' : 'In Progress',
      });
      setEditingGoal(null);
    } else {
      await goalService.createGoal({
        title,
        description,
        category,
        target_date: targetDate,
        status: progress >= 100 ? 'Achieved' : 'In Progress',
        progress,
      });
    }

    resetForm();
    setIsModalOpen(false);
    await loadGoals();
  };

  const handleEditClick = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setCategory(g.category);
    setTargetDate(g.target_date || new Date().toISOString().split('T')[0]);
    setProgress(g.progress || 0);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    showConfirmModal({
      title: 'Delete General Goal?',
      message: 'Are you sure you want to delete this goal target? Target milestones and progress history will be removed.',
      isDanger: true,
      confirmText: 'Delete Goal',
      onConfirm: async () => {
        await goalService.deleteGoal(id);
        await loadGoals();
      },
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Financial');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setProgress(0);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>General Life Goals & Targets</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your financial, career, personal, and travel targets
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
          <span>New Goal</span>
        </button>
      </div>

      {/* Grid or Empty State */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No goals created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set long-term targets for your career, finances, and personal life. Click 'New Goal' to start!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g) => (
            <div
              key={g.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {g.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {g.progress}% Achieved
                    </span>
                    <button
                      onClick={() => handleEditClick(g)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{g.title}</h3>
                  {g.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{g.description}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {g.target_date && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Date: {g.target_date}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Save $10,000 or Learn Rust"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Goal milestones and details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Financial">Financial</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                    <option value="Travel">Travel</option>
                    <option value="Health">Health</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <label className="text-slate-700 dark:text-slate-300">Progress (% Achieved)</label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
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
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
