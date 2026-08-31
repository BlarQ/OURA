import { Plan, PlanItem, ExpenseRecord, Transaction } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';
import { moneyService } from './money';

export const planService = {
  async getPlans(): Promise<Plan[]> {
    let dbPlans: Plan[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*, items:plan_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbPlans = data.map((plan) => this.enrichPlan(plan as any));
        }
      } catch (e) {}
    }

    const dbPlanIds = new Set(dbPlans.map((p) => p.id));
    const localOnlyPlans = localStore.plans
      .filter((p) => !dbPlanIds.has(p.id))
      .map((p) => this.enrichPlan(p));

    return [...dbPlans, ...localOnlyPlans];
  },

  async getPlanById(id: string): Promise<Plan | null> {
    const plans = await this.getPlans();
    return plans.find((p) => p.id === id) || null;
  },

  enrichPlan(plan: Plan): Plan {
    const items = plan.items || [];
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_amount * (item.quantity || 1)), 0);
    const totalActual = items
      .filter((item) => item.status === 'Purchased' || item.status === 'Completed')
      .reduce((sum, item) => sum + ((item.actual_amount || item.estimated_amount) * (item.quantity || 1)), 0);

    const purchasedCount = items.filter((i) => i.status === 'Purchased' || i.status === 'Completed').length;
    const progress = items.length > 0 ? Math.round((purchasedCount / items.length) * 100) : 0;

    return {
      ...plan,
      items,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      progress,
    };
  },

  async createPlan(data: Omit<Plan, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    const today = new Date().toISOString().split('T')[0];
    const { items: initialItems, ...cleanPlanData } = data as any;

    const newPlan: Plan = {
      ...cleanPlanData,
      id: `plan_${Date.now()}`,
      user_id: localStore.profile.id,
      progress: 0,
      items: initialItems || [],
      created_at: today,
      updated_at: today,
    };

    localStore.plans.unshift(newPlan);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data: planData, error } = await supabase
          .from('plans')
          .insert([{ ...cleanPlanData, user_id: userId, progress: 0 }])
          .select('*')
          .single();

        if (!error && planData) {
          const index = localStore.plans.findIndex((p) => p.id === newPlan.id);
          if (index !== -1) {
            localStore.plans[index] = { ...newPlan, ...planData };
            saveLocalStore();
          }
          return this.enrichPlan({ ...newPlan, ...planData });
        }
      } catch (e) {}
    }

    return this.enrichPlan(newPlan);
  },

  async addPlanItem(planId: string, itemData: Omit<PlanItem, 'id' | 'plan_id' | 'created_at' | 'updated_at'>): Promise<PlanItem | null> {
    const today = new Date().toISOString().split('T')[0];
    const newItem: PlanItem = {
      ...itemData,
      id: `pi_${Date.now()}`,
      plan_id: planId,
      created_at: today,
      updated_at: today,
    };

    const plan = localStore.plans.find((p) => p.id === planId);
    if (plan) {
      if (!plan.items) plan.items = [];
      plan.items.push(newItem);
      plan.updated_at = today;
      saveLocalStore();
    }

    if (supabase && !planId.startsWith('plan_')) {
      try {
        const { data, error } = await supabase
          .from('plan_items')
          .insert([{ ...itemData, plan_id: planId }])
          .select('*')
          .single();
        if (!error && data) return data as any;
      } catch (e) {}
    }

    return newItem;
  },

  async markItemPurchased(planId: string, itemId: string, actualAmount: number): Promise<PlanItem | null> {
    const today = new Date().toISOString().split('T')[0];
    const plan = await this.getPlanById(planId);
    if (!plan || !plan.items) return null;

    const item = plan.items.find((i) => i.id === itemId);
    if (!item) return null;

    const expense = await moneyService.addExpense({
      category: (item.category as any) || 'Housing',
      amount: actualAmount,
      description: `Purchased: ${item.name} (${plan.name})`,
      date: today,
      payment_method: 'Bank Transfer',
      plan_item_id: item.id,
    });

    if (supabase && !itemId.startsWith('pi_')) {
      try {
        await supabase
          .from('plan_items')
          .update({
            status: 'Purchased',
            actual_amount: actualAmount,
            purchased_date: today,
            expense_id: expense.id,
          })
          .eq('id', itemId);
      } catch (e) {}
    }

    item.status = 'Purchased';
    item.actual_amount = actualAmount;
    item.purchased_date = today;
    item.expense_id = expense.id;
    saveLocalStore();

    return item;
  },

  async deletePlan(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('plan_')) {
      try {
        await supabase.from('plans').delete().eq('id', id);
      } catch (e) {}
    }
    localStore.plans = localStore.plans.filter((p) => p.id !== id);
    saveLocalStore();
    return true;
  },
};
