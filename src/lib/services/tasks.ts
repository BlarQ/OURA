import { Task, Subtask } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const taskService = {
  async getTasks(): Promise<Task[]> {
    let dbTasks: Task[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, subtasks:task_subtasks(*)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbTasks = data as any;
        }
      } catch (e) {}
    }

    const dbTaskIds = new Set(dbTasks.map((t) => t.id));
    const localOnlyTasks = localStore.tasks.filter((t) => !dbTaskIds.has(t.id));
    return [...dbTasks, ...localOnlyTasks];
  },

  async getTaskById(id: string): Promise<Task | null> {
    const allTasks = await this.getTasks();
    return allTasks.find((t) => t.id === id) || null;
  },

  async getTodayTasks(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const allTasks = await this.getTasks();
    return allTasks.filter((t) => t.due_date === today);
  },

  async createTask(newTaskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const today = new Date().toISOString().split('T')[0];
    const { subtasks: initialSubtasks, ...cleanTaskFields } = newTaskData as any;

    const createdTask: Task = {
      ...cleanTaskFields,
      id: `task_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
      subtasks: initialSubtasks || [],
    };

    localStore.tasks.unshift(createdTask);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;

        const dbPayload = {
          user_id: userId,
          title: cleanTaskFields.title,
          description: cleanTaskFields.description || '',
          status: cleanTaskFields.status || 'Not Started',
          priority: cleanTaskFields.priority || 'Medium',
          due_date: cleanTaskFields.due_date || today,
          due_time: cleanTaskFields.due_time || '12:00',
          category: cleanTaskFields.category || 'General',
          recurrence: cleanTaskFields.recurrence || 'None',
          notification_enabled: cleanTaskFields.notification_enabled ?? true,
          reminder_time: cleanTaskFields.reminder_time || '15 minutes before',
        };

        const { data, error } = await supabase
          .from('tasks')
          .insert([dbPayload])
          .select('*')
          .single();

        if (!error && data) {
          const index = localStore.tasks.findIndex((t) => t.id === createdTask.id);
          if (index !== -1) {
            localStore.tasks[index] = { ...createdTask, ...data };
            saveLocalStore();
          }
          return { ...createdTask, ...data };
        }
      } catch (e) {}
    }

    return createdTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const { subtasks, ...cleanUpdates } = updates as any;

    if (supabase && !id.startsWith('task_')) {
      try {
        await supabase
          .from('tasks')
          .update(cleanUpdates)
          .eq('id', id);
      } catch (e) {}
    }

    const index = localStore.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      const updated = {
        ...localStore.tasks[index],
        ...updates,
        updated_at: new Date().toISOString().split('T')[0],
      };
      localStore.tasks[index] = updated;
      saveLocalStore();
      return updated;
    }

    return null;
  },

  async toggleTaskStatus(id: string): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) return null;

    const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
    return this.updateTask(id, { status: newStatus });
  },

  async deleteTask(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('task_')) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (e) {}
    }

    localStore.tasks = localStore.tasks.filter((t) => t.id !== id);
    saveLocalStore();
    return true;
  },

  async addSubtask(taskId: string, title: string): Promise<Subtask | null> {
    const newSubtask: Subtask = {
      id: `sub_${Date.now()}`,
      task_id: taskId,
      title,
      is_completed: false,
      created_at: new Date().toISOString().split('T')[0],
    };

    if (supabase && !taskId.startsWith('task_')) {
      try {
        const { data, error } = await supabase
          .from('task_subtasks')
          .insert([{ task_id: taskId, title, is_completed: false }])
          .select('*')
          .single();
        if (!error && data) {
          return data as any;
        }
      } catch (e) {}
    }

    const task = await this.getTaskById(taskId);
    if (task) {
      const subtasks = [...(task.subtasks || []), newSubtask];
      await this.updateTask(taskId, { subtasks });
    }

    return newSubtask;
  },

  async toggleSubtask(taskId: string, subtaskId: string): Promise<boolean> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.subtasks) return false;

    const targetSubtask = task.subtasks.find((st) => st.id === subtaskId);
    if (supabase && !subtaskId.startsWith('sub_')) {
      try {
        await supabase
          .from('task_subtasks')
          .update({ is_completed: !targetSubtask?.is_completed })
          .eq('id', subtaskId);
      } catch (e) {}
    }

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
    );

    await this.updateTask(taskId, { subtasks: updatedSubtasks });
    return true;
  },
};
