import { Goal, GoalDeposit } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const goalService = {
  enrichGoal(goal: Goal): Goal {
    const deposits = goal.deposits || [];
    const totalDeposited = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const currentAmount = deposits.length > 0 ? totalDeposited : (Number(goal.current_amount) || 0);
    const targetAmount = Number(goal.target_amount) || 0;

    let progress = goal.progress || 0;
    if (targetAmount > 0) {
      progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
    }

    const status = progress >= 100 ? 'Achieved' : (progress > 0 ? 'In Progress' : goal.status || 'In Progress');

    return {
      ...goal,
      deposits,
      current_amount: currentAmount,
      target_amount: targetAmount,
      progress,
      status,
    };
  },

  async getGoals(): Promise<Goal[]> {
    let dbGoals: Goal[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbGoals = data.map((g: any) => {
            const local = localStore.goals.find((lg) => lg.id === g.id);
            return this.enrichGoal({
              ...g,
              deposits: local?.deposits || g.deposits || [],
              target_amount: local?.target_amount ?? g.target_amount,
              current_amount: local?.current_amount ?? g.current_amount,
              saving_frequency: local?.saving_frequency ?? g.saving_frequency,
              duration_months: local?.duration_months ?? g.duration_months,
            });
          });
        }
      } catch (e) {}
    }

    const dbIds = new Set(dbGoals.map((g) => g.id));
    const localOnly = localStore.goals
      .filter((g) => !dbIds.has(g.id))
      .map((g) => this.enrichGoal(g));

    return [...dbGoals, ...localOnly];
  },

  async getGoalById(id: string): Promise<Goal | null> {
    const goals = await this.getGoals();
    return goals.find((g) => g.id === id) || null;
  },

  async createGoal(data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const today = new Date().toISOString().split('T')[0];
    const initialDeposits = data.deposits || [];
    const initialCurrent = initialDeposits.length > 0
      ? initialDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      : (Number(data.current_amount) || 0);

    const targetAmount = Number(data.target_amount) || 0;
    const progress = targetAmount > 0
      ? Math.min(100, Math.round((initialCurrent / targetAmount) * 100))
      : (data.progress || 0);

    const newGoal: Goal = {
      ...data,
      id: `goal_${Date.now()}`,
      user_id: localStore.profile.id,
      deposits: initialDeposits,
      target_amount: targetAmount,
      current_amount: initialCurrent,
      progress,
      status: progress >= 100 ? 'Achieved' : (progress > 0 ? 'In Progress' : data.status || 'In Progress'),
      created_at: today,
      updated_at: today,
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
          category: data.category || 'Financial',
          target_date: data.target_date || today,
          status: newGoal.status,
          progress: newGoal.progress,
        };

        const { data: gData, error } = await supabase
          .from('goals')
          .insert([dbPayload])
          .select('*')
          .single();

        if (!error && gData) {
          const idx = localStore.goals.findIndex((g) => g.id === newGoal.id);
          if (idx !== -1) {
            localStore.goals[idx] = { ...newGoal, ...gData, deposits: newGoal.deposits };
            saveLocalStore();
          }
          return this.enrichGoal({ ...newGoal, ...gData });
        }
      } catch (e) {}
    }

    return this.enrichGoal(newGoal);
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    if (supabase && !id.startsWith('goal_')) {
      try {
        await supabase
          .from('goals')
          .update({
            title: updates.title,
            description: updates.description,
            category: updates.category,
            target_date: updates.target_date,
            status: updates.status,
            progress: updates.progress,
          })
          .eq('id', id);
      } catch (e) {}
    }

    let goal = localStore.goals.find((g) => g.id === id);
    if (!goal) {
      const all = await this.getGoals();
      const matched = all.find((g) => g.id === id);
      if (matched) {
        goal = { ...matched };
        localStore.goals.push(goal);
      }
    }

    if (!goal) return null;

    const today = new Date().toISOString().split('T')[0];
    const updated = this.enrichGoal({
      ...goal,
      ...updates,
      updated_at: today,
    });

    const index = localStore.goals.findIndex((g) => g.id === id);
    if (index !== -1) {
      localStore.goals[index] = updated;
    } else {
      localStore.goals.unshift(updated);
    }
    saveLocalStore();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('oura_goal_updated'));
    }

    return updated;
  },

  async contributeToGoal(goalId: string, amount: number, note?: string, date?: string): Promise<Goal | null> {
    const today = new Date().toISOString().split('T')[0];
    let goal = localStore.goals.find((g) => g.id === goalId);
    if (!goal) {
      const all = await this.getGoals();
      const matched = all.find((g) => g.id === goalId);
      if (matched) {
        goal = { ...matched, deposits: [...(matched.deposits || [])] };
        localStore.goals.push(goal);
      }
    }

    if (!goal) return null;

    const newDeposit: GoalDeposit = {
      id: `dep_${Date.now()}`,
      goal_id: goalId,
      amount: Number(amount) || 0,
      date: date || today,
      note: note || 'Savings Contribution',
      created_at: today,
    };

    if (!goal.deposits) goal.deposits = [];
    goal.deposits.unshift(newDeposit);

    const enriched = this.enrichGoal(goal);
    const index = localStore.goals.findIndex((g) => g.id === goalId);
    if (index !== -1) {
      localStore.goals[index] = enriched;
    }
    saveLocalStore();

    if (supabase && !goalId.startsWith('goal_')) {
      try {
        await supabase
          .from('goals')
          .update({
            progress: enriched.progress,
            status: enriched.status,
          })
          .eq('id', goalId);
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('oura_goal_updated'));
      window.dispatchEvent(new Event('oura_balance_updated'));
    }

    return enriched;
  },

  async deleteDeposit(goalId: string, depositId: string): Promise<Goal | null> {
    const goal = localStore.goals.find((g) => g.id === goalId);
    if (!goal || !goal.deposits) return null;

    goal.deposits = goal.deposits.filter((d) => d.id !== depositId);
    const enriched = this.enrichGoal(goal);
    const index = localStore.goals.findIndex((g) => g.id === goalId);
    if (index !== -1) {
      localStore.goals[index] = enriched;
    }
    saveLocalStore();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('oura_goal_updated'));
    }

    return enriched;
  },

  async deleteGoal(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('goal_')) {
      try {
        await supabase.from('goals').delete().eq('id', id);
      } catch (e) {}
    }

    localStore.goals = localStore.goals.filter((g) => g.id !== id);
    saveLocalStore();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('oura_goal_updated'));
    }

    return true;
  },
};
