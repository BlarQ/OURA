import { Goal } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const goalService = {
  async getGoals(): Promise<Goal[]> {
    let dbGoals: Goal[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbGoals = data as any;
        }
      } catch (e) {}
    }

    const dbIds = new Set(dbGoals.map((g) => g.id));
    const localOnly = localStore.goals.filter((g) => !dbIds.has(g.id));
    return [...dbGoals, ...localOnly];
  },

  async createGoal(data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const today = new Date().toISOString().split('T')[0];
    const newGoal: Goal = {
      ...data,
      id: `goal_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
      progress: data.progress || 0,
    };

    localStore.goals.unshift(newGoal);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;

        const dbPayload = {
          user_id: userId,
          title: data.title,
          description: data.description || '',
          category: data.category || 'General',
          target_date: data.target_date || today,
          status: data.status || 'In Progress',
          progress: data.progress || 0,
        };

        const { data: gData, error } = await supabase
          .from('goals')
          .insert([dbPayload])
          .select('*')
          .single();

        if (!error && gData) {
          const idx = localStore.goals.findIndex((g) => g.id === newGoal.id);
          if (idx !== -1) {
            localStore.goals[idx] = { ...newGoal, ...gData };
            saveLocalStore();
          }
          return { ...newGoal, ...gData };
        }
      } catch (e) {}
    }

    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    if (supabase && !id.startsWith('goal_')) {
      try {
        await supabase
          .from('goals')
          .update(updates)
          .eq('id', id);
      } catch (e) {}
    }

    const index = localStore.goals.findIndex((g) => g.id === id);
    if (index === -1) return null;

    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...localStore.goals[index],
      ...updates,
      updated_at: today,
    };
    localStore.goals[index] = updated;
    saveLocalStore();
    return updated;
  },

  async deleteGoal(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('goal_')) {
      try {
        await supabase.from('goals').delete().eq('id', id);
      } catch (e) {}
    }

    localStore.goals = localStore.goals.filter((g) => g.id !== id);
    saveLocalStore();
    return true;
  },
};
