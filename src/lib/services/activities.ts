import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import type { WeeklyActivity, ActivityPriority, Database } from '@/types/database.types';

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
 * Helper to decode metadata stored in the legacy 'activities' table's notes column
 */
function parseLegacyNotes(notesStr?: string | null): {
  time_slot?: string | null;
  priority?: ActivityPriority;
  manual_id?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  actual_notes?: string | null;
} {
  if (!notesStr) return {};
  try {
    if (notesStr.startsWith('{') && notesStr.endsWith('}')) {
      const parsed = JSON.parse(notesStr);
      return {
        time_slot: parsed.time_slot || null,
        priority: parsed.priority || 'standard',
        manual_id: parsed.manual_id || null,
        completion_notes: parsed.completion_notes || parsed.notes || null,
        completed_at: parsed.completed_at || null,
        actual_notes: parsed.completion_notes || null,
      };
    }
  } catch {}
  return { completion_notes: notesStr, actual_notes: notesStr };
}

/**
 * Helper to encode metadata into the legacy 'activities' table's notes column
 */
function encodeLegacyNotes(payload: {
  time_slot?: string | null;
  priority?: ActivityPriority;
  manual_id?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
}): string {
  return JSON.stringify({
    time_slot: payload.time_slot || null,
    priority: payload.priority || 'standard',
    manual_id: payload.manual_id || null,
    completion_notes: payload.completion_notes || null,
    completed_at: payload.completed_at || null,
  });
}

/**
 * Sync un-synced local activities to Supabase once user is authenticated
 */
async function syncLocalToSupabase(userId: string) {
  try {
    const local = getLocalActivities();
    const unsynced = local.filter(
      (a) => a.id.startsWith('act_') || a.user_id === 'current_user'
    );
    if (unsynced.length === 0) return;

    for (const item of unsynced) {
      await createActivity({
        activity_date: item.activity_date,
        title: item.title,
        description: item.description,
        time_slot: item.time_slot,
        manual_id: item.manual_id,
        priority: item.priority,
        is_completed: item.is_completed,
        completion_notes: item.completion_notes,
        completed_at: item.completed_at,
      });
    }

    // Clear migrated local temporary items
    const remaining = local.filter(
      (a) => !a.id.startsWith('act_') && a.user_id !== 'current_user'
    );
    saveLocalActivities(remaining);
  } catch (syncErr) {
    console.warn('Sync local to Supabase notice:', syncErr);
  }
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

    // Try background sync of any previously saved local activities
    syncLocalToSupabase(user.id);

    // 1. Primary: Try querying 'weekly_activities' table
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_activities')
      .select('*, manuals(title)')
      .gte('activity_date', startDateStr)
      .lte('activity_date', endDateStr)
      .order('activity_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (!weeklyError && weeklyData) {
      const mapped = (weeklyData as any[]).map((item: any) => ({
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
    }

    // 2. Secondary: Fallback to Supabase 'activities' table if weekly_activities is not yet created
    const { data: actData, error: actError } = await supabase
      .from('activities')
      .select('*')
      .gte('activity_date', startDateStr)
      .lte('activity_date', endDateStr)
      .order('activity_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (!actError && actData) {
      const mapped = (actData as any[]).map((item: any) => {
        const meta = parseLegacyNotes(item.notes);
        return {
          id: item.id,
          user_id: item.user_id,
          manual_id: meta.manual_id || null,
          manual_title: null,
          activity_date: item.activity_date,
          title: item.title,
          description: item.description,
          time_slot: meta.time_slot || null,
          priority: meta.priority || 'standard',
          is_completed: item.status === 'completed' || Boolean(item.is_completed),
          completion_notes: meta.completion_notes || null,
          completed_at: meta.completed_at || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });
      return mapped;
    }

    // 3. Fallback to local storage if network or DB connection is completely offline
    return getLocalActivities().filter(
      (a) => a.activity_date >= startDateStr && a.activity_date <= endDateStr
    );
  } catch (err) {
    console.warn('Falling back to local storage for weekly activities:', err);
    return getLocalActivities().filter(
      (a) => a.activity_date >= startDateStr && a.activity_date <= endDateStr
    );
  }
}

/**
 * Create a new activity in Supabase with automatic dual-table support
 */
export async function createActivity(
  payload: CreateActivityPayload
): Promise<WeeklyActivity | null> {
  const localId = `act_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fallbackActivity: WeeklyActivity = {
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
      // 1. Try 'weekly_activities' table first
      const { data: weeklyData, error: weeklyError } = await supabase
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

      if (!weeklyError && weeklyData) {
        const item = weeklyData as any;
        return {
          id: item.id,
          user_id: item.user_id,
          manual_id: item.manual_id,
          manual_title: item.manuals?.title || null,
          activity_date: item.activity_date,
          title: item.title,
          description: item.description,
          time_slot: item.time_slot,
          priority: item.priority,
          is_completed: item.is_completed,
          completion_notes: item.completion_notes || null,
          completed_at: item.completed_at || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }

      // 2. Fallback: Save to 'activities' table in Supabase
      const legacyNotes = encodeLegacyNotes({
        time_slot: payload.time_slot,
        priority: payload.priority,
        manual_id: payload.manual_id,
        completion_notes: payload.completion_notes,
        completed_at: payload.completed_at,
      });

      const { data: actData, error: actError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_date: payload.activity_date,
          title: payload.title.trim(),
          description: payload.description ? payload.description.trim() : null,
          status: payload.is_completed ? 'completed' : 'pending',
          notes: legacyNotes,
        })
        .select('*')
        .single();

      if (!actError && actData) {
        const item = actData as any;
        return {
          id: item.id,
          user_id: item.user_id,
          manual_id: payload.manual_id || null,
          manual_title: null,
          activity_date: item.activity_date,
          title: item.title,
          description: item.description,
          time_slot: payload.time_slot || null,
          priority: payload.priority || 'standard',
          is_completed: Boolean(payload.is_completed),
          completion_notes: payload.completion_notes || null,
          completed_at: payload.completed_at || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }
    }
  } catch (err) {
    console.warn('Saving activity locally due to db error:', err);
  }

  // Backup to local storage
  const current = getLocalActivities();
  saveLocalActivities([...current, fallbackActivity]);
  return fallbackActivity;
}

/**
 * Update an existing activity in Supabase
 */
export async function updateActivity(
  id: string,
  payload: Partial<CreateActivityPayload>
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();

    // 1. Try 'weekly_activities'
    const { error: weeklyError } = await supabase
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

    if (!weeklyError) return true;

    // 2. Try 'activities' table
    const updateObj: Database['public']['Tables']['activities']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (payload.title !== undefined) updateObj.title = payload.title.trim();
    if (payload.description !== undefined) updateObj.description = payload.description;
    if (payload.is_completed !== undefined) {
      updateObj.status = payload.is_completed ? 'completed' : 'pending';
    }

    if (
      payload.time_slot !== undefined ||
      payload.priority !== undefined ||
      payload.manual_id !== undefined ||
      payload.completion_notes !== undefined ||
      payload.completed_at !== undefined
    ) {
      updateObj.notes = encodeLegacyNotes({
        time_slot: payload.time_slot,
        priority: payload.priority,
        manual_id: payload.manual_id,
        completion_notes: payload.completion_notes,
        completed_at: payload.completed_at,
      });
    }

    const { error: actError } = await supabase
      .from('activities')
      .update(updateObj)
      .eq('id', id);

    if (!actError) return true;
  } catch {}

  // Update local storage fallback
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

/**
 * Delete an activity from Supabase
 */
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();
    await supabase.from('weekly_activities').delete().eq('id', id);
    await supabase.from('activities').delete().eq('id', id);
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

    let count = 0;
    for (const act of sourceActivities) {
      const actDate = new Date(act.activity_date + 'T00:00:00');
      const dayDiff = Math.round((actDate.getTime() - srcMon.getTime()) / (1000 * 60 * 60 * 24));

      const newDate = new Date(tgtMon);
      newDate.setDate(tgtMon.getDate() + Math.max(0, Math.min(dayDiff, 4)));

      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      const targetDateStr = `${yyyy}-${mm}-${dd}`;

      await createActivity({
        activity_date: targetDateStr,
        title: act.title,
        description: act.description,
        time_slot: act.time_slot,
        manual_id: act.manual_id,
        priority: act.priority,
        is_completed: resetCompleted ? false : act.is_completed,
        completion_notes: resetCompleted ? null : act.completion_notes,
        completed_at: resetCompleted ? null : act.completed_at,
      });
      count++;
    }

    return { success: true, copiedCount: count };
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
