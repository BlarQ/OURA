import { Activity } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const activityService = {
  async getActivities(): Promise<Activity[]> {
    let dbActivities: Activity[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .order('activity_date', { ascending: false });
        if (!error && data) dbActivities = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbActivities.map((a) => a.id));
    const localOnly = localStore.activities.filter((a) => !dbIds.has(a.id));
    const combined = [...dbActivities, ...localOnly];

    // De-duplicate items matching same title, date & start_time
    const seenKeys = new Set<string>();
    const deduplicated: Activity[] = [];

    for (const act of combined) {
      const key = `${act.title.trim()}_${act.activity_date}_${act.start_time || ''}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicated.push(act);
      }
    }

    return deduplicated;
  },

  async getTodayActivities(): Promise<Activity[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getActivities();
    return all.filter((a) => a.activity_date === today);
  },

  async createActivity(newActivity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const today = new Date().toISOString().split('T')[0];
    const created: Activity = {
      ...newActivity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
    };

    localStore.activities.unshift(created);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data, error } = await supabase
          .from('activities')
          .insert([{ ...newActivity, user_id: userId }])
          .select('*')
          .single();

        if (!error && data) {
          const idx = localStore.activities.findIndex((a) => a.id === created.id);
          if (idx !== -1) {
            localStore.activities[idx] = { ...created, ...data };
            saveLocalStore();
          }
          return { ...created, ...data };
        }
      } catch (e) {}
    }

    return created;
  },

  async bulkCreateActivities(items: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<Activity[]> {
    const today = new Date().toISOString().split('T')[0];
    const createdList: Activity[] = items.map((item, index) => ({
      ...item,
      id: `act_${Date.now()}_${index}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
    }));

    // Filter out duplicates from localStore before inserting
    const existingKeys = new Set(localStore.activities.map((a) => `${a.title.trim()}_${a.activity_date}_${a.start_time || ''}`));
    const uniqueNew = createdList.filter((a) => !existingKeys.has(`${a.title.trim()}_${a.activity_date}_${a.start_time || ''}`));

    localStore.activities.unshift(...uniqueNew);
    saveLocalStore();

    // Async batch insert into Supabase DB
    if (supabase && uniqueNew.length > 0) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const dbPayload = uniqueNew.map((item) => ({
          title: item.title,
          description: item.description,
          activity_date: item.activity_date,
          start_time: item.start_time,
          duration_minutes: item.duration_minutes,
          category: item.category,
          status: item.status,
          user_id: userId,
        }));
        await supabase.from('activities').insert(dbPayload);
      } catch (e) {}
    }

    return uniqueNew;
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
    if (supabase && !id.startsWith('act_')) {
      try {
        await supabase
          .from('activities')
          .update(updates)
          .eq('id', id);
      } catch (e) {}
    }

    const index = localStore.activities.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = {
      ...localStore.activities[index],
      ...updates,
      updated_at: new Date().toISOString().split('T')[0],
    };

    localStore.activities[index] = updated;
    saveLocalStore();
    return updated;
  },

  async deleteActivity(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('act_')) {
      try {
        await supabase.from('activities').delete().eq('id', id);
      } catch (e) {}
    }

    localStore.activities = localStore.activities.filter((a) => a.id !== id);
    saveLocalStore();
    return true;
  },

  async bulkDeleteActivities(ids: string[]): Promise<boolean> {
    const idSet = new Set(ids);
    localStore.activities = localStore.activities.filter((a) => !idSet.has(a.id));
    saveLocalStore();

    if (supabase) {
      const dbIds = ids.filter((id) => !id.startsWith('act_'));
      if (dbIds.length > 0) {
        try {
          await supabase.from('activities').delete().in('id', dbIds);
        } catch (e) {}
      }
    }

    return true;
  },
};
