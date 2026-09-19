import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import type { WeeklyActivity, ActivityPriority } from '@/types/database.types';

export interface CreateActivityPayload {
  activity_date: string; // 'YYYY-MM-DD'
  title: string;
  description?: string | null;
  time_slot?: string | null;
  manual_id?: string | null;
  priority?: ActivityPriority;
  is_completed?: boolean;
  completion_notes?: string | null;
  completed_at?: string | null;
}

const LOCAL_STORAGE_KEY = 'ademanual_weekly_activities_cache';

function getLocalActivities(): WeeklyActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalActivities(activities: WeeklyActivity[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activities));
  } catch {}
}

/**
 * Fetch activities for a given date range (e.g. Monday to Friday)
 */
export async function getWeeklyActivities(
  startDateStr: string,
  endDateStr: string
): Promise<WeeklyActivity[]> {
  try {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return getLocalActivities().filter(
        (a) => a.activity_date >= startDateStr && a.activity_date <= endDateStr
      );
    }

    const { data, error } = await supabase
      .from('weekly_activities')
      .select('*, manuals(title)')
      .gte('activity_date', startDateStr)
      .lte('activity_date', endDateStr)
      .order('activity_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      // Fallback to local storage if table is not yet migrated in Supabase
      const local = getLocalActivities().filter(
        (a) => a.activity_date >= startDateStr && a.activity_date <= endDateStr
      );
      return local;
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      manual_id: item.manual_id,
      manual_title: item.manuals?.title || null,
      activity_date: item.activity_date,
      title: item.title,
      description: item.description,
      time_slot: item.time_slot,
      priority: item.priority || 'standard',
      is_completed: Boolean(item.is_completed),
      completion_notes: item.completion_notes || null,
      completed_at: item.completed_at || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return mapped;
  } catch (err) {
    console.warn('Using local fallback for weekly activities:', err);
    return getLocalActivities().filter(
      (a) => a.activity_date >= startDateStr && a.activity_date <= endDateStr
    );
  }
}

export async function createActivity(
  payload: CreateActivityPayload
): Promise<WeeklyActivity | null> {
  const localId = `act_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const newActivity: WeeklyActivity = {
    id: localId,
    user_id: 'current_user',
    manual_id: payload.manual_id || null,
    manual_title: null,
    activity_date: payload.activity_date,
    title: payload.title.trim(),
    description: payload.description ? payload.description.trim() : null,
    time_slot: payload.time_slot ? payload.time_slot.trim() : null,
    priority: payload.priority || 'standard',
    is_completed: Boolean(payload.is_completed),
    completion_notes: payload.completion_notes || null,
    completed_at: payload.is_completed
      ? payload.completed_at || new Date().toISOString()
      : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      newActivity.user_id = user.id;
      const { data, error } = await supabase
        .from('weekly_activities')
        .insert({
          user_id: user.id,
          manual_id: payload.manual_id || null,
          activity_date: payload.activity_date,
          title: payload.title.trim(),
          description: payload.description ? payload.description.trim() : null,
          time_slot: payload.time_slot ? payload.time_slot.trim() : null,
          priority: payload.priority || 'standard',
          is_completed: Boolean(payload.is_completed),
          completion_notes: payload.completion_notes || null,
          completed_at: payload.is_completed
            ? payload.completed_at || new Date().toISOString()
            : null,
        })
        .select('*, manuals(title)')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          user_id: data.user_id,
          manual_id: data.manual_id,
          manual_title: (data as any).manuals?.title || null,
          activity_date: data.activity_date,
          title: data.title,
          description: data.description,
          time_slot: data.time_slot,
          priority: data.priority,
          is_completed: data.is_completed,
          completion_notes: data.completion_notes || null,
          completed_at: data.completed_at || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    }
  } catch (err) {
    console.warn('Saved activity locally due to db error:', err);
  }

  // Backup to local storage
  const current = getLocalActivities();
  saveLocalActivities([...current, newActivity]);
  return newActivity;
}

export async function updateActivity(
  id: string,
  payload: Partial<CreateActivityPayload>
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from('weekly_activities')
      .update({
        ...(payload.title !== undefined && { title: payload.title.trim() }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.time_slot !== undefined && { time_slot: payload.time_slot }),
        ...(payload.manual_id !== undefined && { manual_id: payload.manual_id }),
        ...(payload.priority !== undefined && { priority: payload.priority }),
        ...(payload.is_completed !== undefined && { is_completed: payload.is_completed }),
        ...(payload.completion_notes !== undefined && {
          completion_notes: payload.completion_notes,
        }),
        ...(payload.completed_at !== undefined && {
          completed_at: payload.completed_at,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) return true;
  } catch {}

  // Update local storage
  const current = getLocalActivities();
  const updated = current.map((item) =>
    item.id === id
      ? {
          ...item,
          ...payload,
          updated_at: new Date().toISOString(),
        }
      : item
  );
  saveLocalActivities(updated);
  return true;
}

export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from('weekly_activities').delete().eq('id', id);
    if (!error) return true;
  } catch {}

  const current = getLocalActivities();
  saveLocalActivities(current.filter((item) => item.id !== id));
  return true;
}

export async function toggleActivityCompleted(
  id: string,
  isCompleted: boolean,
  completionNotes?: string | null
): Promise<boolean> {
  return updateActivity(id, {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    ...(completionNotes !== undefined && { completion_notes: completionNotes }),
  });
}

export async function saveActivityCompletionNotes(
  id: string,
  completionNotes: string,
  isCompleted: boolean = true
): Promise<boolean> {
  return updateActivity(id, {
    completion_notes: completionNotes.trim() || null,
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  });
}

/**
 * Copies all activities from a source week (Mon-Fri) to a target week (Mon-Fri)
 */
export async function copyWeekActivities(
  sourceMondayStr: string,
  targetMondayStr: string,
  resetCompleted: boolean = true
): Promise<{ success: boolean; copiedCount: number }> {
  try {
    const srcMon = new Date(sourceMondayStr + 'T00:00:00');
    const srcFri = new Date(srcMon);
    srcFri.setDate(srcMon.getDate() + 4);

    const srcFriStr = `${srcFri.getFullYear()}-${String(srcFri.getMonth() + 1).padStart(2, '0')}-${String(srcFri.getDate()).padStart(2, '0')}`;

    const sourceActivities = await getWeeklyActivities(sourceMondayStr, srcFriStr);
    if (sourceActivities.length === 0) {
      return { success: true, copiedCount: 0 };
    }

    const tgtMon = new Date(targetMondayStr + 'T00:00:00');

    const targetPayloads: CreateActivityPayload[] = sourceActivities.map((act) => {
      const actDate = new Date(act.activity_date + 'T00:00:00');
      const dayDiff = Math.round((actDate.getTime() - srcMon.getTime()) / (1000 * 60 * 60 * 24));

      const newDate = new Date(tgtMon);
      newDate.setDate(tgtMon.getDate() + Math.max(0, Math.min(dayDiff, 4)));

      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      const targetDateStr = `${yyyy}-${mm}-${dd}`;

      return {
        activity_date: targetDateStr,
        title: act.title,
        description: act.description,
        time_slot: act.time_slot,
        manual_id: act.manual_id,
        priority: act.priority,
        is_completed: resetCompleted ? false : act.is_completed,
        completion_notes: resetCompleted ? null : act.completion_notes,
        completed_at: resetCompleted ? null : act.completed_at,
      };
    });

    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const rowsToInsert = targetPayloads.map((p) => ({
        user_id: user.id,
        manual_id: p.manual_id || null,
        activity_date: p.activity_date,
        title: p.title.trim(),
        description: p.description,
        time_slot: p.time_slot,
        priority: p.priority || 'standard',
        is_completed: p.is_completed || false,
        completion_notes: p.completion_notes || null,
        completed_at: p.completed_at || null,
      }));

      const { error } = await supabase.from('weekly_activities').insert(rowsToInsert);
      if (!error) {
        return { success: true, copiedCount: rowsToInsert.length };
      }
    }

    const currentLocal = getLocalActivities();
    const newLocalActivities: WeeklyActivity[] = targetPayloads.map((p) => ({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'current_user',
      manual_id: p.manual_id || null,
      manual_title: null,
      activity_date: p.activity_date,
      title: p.title,
      description: p.description || null,
      time_slot: p.time_slot || null,
      priority: p.priority || 'standard',
      is_completed: Boolean(p.is_completed),
      completion_notes: p.completion_notes || null,
      completed_at: p.completed_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    saveLocalActivities([...currentLocal, ...newLocalActivities]);
    return { success: true, copiedCount: newLocalActivities.length };
  } catch (err) {
    console.error('Failed to copy weekly activities:', err);
    return { success: false, copiedCount: 0 };
  }
}

/**
 * Duplicates a single activity to a specified target date
 */
export async function duplicateSingleActivity(
  activity: WeeklyActivity,
  targetDateStr: string,
  resetCompleted: boolean = true
): Promise<WeeklyActivity | null> {
  const payload: CreateActivityPayload = {
    activity_date: targetDateStr,
    title: activity.title,
    description: activity.description,
    time_slot: activity.time_slot,
    manual_id: activity.manual_id,
    priority: activity.priority,
    is_completed: resetCompleted ? false : activity.is_completed,
    completion_notes: resetCompleted ? null : activity.completion_notes,
    completed_at: resetCompleted ? null : activity.completed_at,
  };

  return createActivity(payload);
}
