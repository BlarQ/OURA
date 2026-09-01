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
          dbPlans = data.map((plan: any) => {
            const localPlan = localStore.plans.find((lp) => lp.id === plan.id);
            const dbItems = plan.items || [];
            const dbItemIds = new Set(dbItems.map((i: any) => i.id));
            const localOnlyItems = (localPlan?.items || []).filter((i: any) => !dbItemIds.has(i.id));
            const allItems = [...dbItems, ...localOnlyItems];
            return this.enrichPlan({
              ...plan,
              items: allItems,
            });
          });
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
    const totalEstimated = items.reduce((sum, item) => sum + ((Number(item.estimated_amount) || 0) * (item.quantity || 1)), 0);
    const totalActual = items
      .filter((item) => item.status === 'Purchased' || item.status === 'Completed')
      .reduce((sum, item) => sum + (((Number(item.actual_amount) || Number(item.estimated_amount)) || 0) * (item.quantity || 1)), 0);

    const budget = Number(plan.budget) || 0;
    const purchasedCount = items.filter((i) => i.status === 'Purchased' || i.status === 'Completed').length;

    let progress = 0;
    if (budget > 0) {
      progress = Math.min(100, Math.round((totalActual / budget) * 100));
    } else if (totalEstimated > 0) {
      progress = Math.min(100, Math.round((totalActual / totalEstimated) * 100));
    } else if (items.length > 0) {
      progress = Math.round((purchasedCount / items.length) * 100);
    }

    return {
      ...plan,
      items,
      budget,
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
            localStore.plans[index] = { ...newPlan, ...planData, items: newPlan.items };
            saveLocalStore();
          }
          return this.enrichPlan({ ...newPlan, ...planData, items: newPlan.items });
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

    let plan = localStore.plans.find((p) => p.id === planId);
    if (!plan) {
      const allPlans = await this.getPlans();
      const matched = allPlans.find((p) => p.id === planId);
      if (matched) {
        plan = { ...matched, items: [...(matched.items || [])] };
        localStore.plans.push(plan);
      }
    }

    if (plan) {
      if (!plan.items) plan.items = [];
      plan.items.unshift(newItem);
      plan.updated_at = today;
      saveLocalStore();
    }

    if (supabase && !planId.startsWith('plan_')) {
      try {
        const { data, error } = await supabase
          .from('plan_items')
          .insert([{
            plan_id: planId,
            name: itemData.name,
            estimated_amount: itemData.estimated_amount || 0,
            actual_amount: itemData.actual_amount || 0,
            quantity: itemData.quantity || 1,
            priority: itemData.priority || 'Medium',
            status: itemData.status || 'Planned',
            category: itemData.category || 'General',
          }])
          .select('*')
          .single();

        if (!error && data) {
          if (plan && plan.items) {
            const idx = plan.items.findIndex((i) => i.id === newItem.id);
            if (idx !== -1) {
              plan.items[idx] = data as any;
              saveLocalStore();
            }
          }
          return data as any;
        } else if (error) {
          console.warn('Supabase plan_items insert error:', error);
        }
      } catch (e) {
        console.warn('Supabase plan_items exception:', e);
      }
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
