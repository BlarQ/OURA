import { createClient as createServerSupabase } from '@/lib/supabase/server';
import type { Manual, Step } from '@/types/database.types';
import type { ManualListItem, ManualWithSteps } from '@/lib/services/manuals';

/**
 * Server-only fetcher for manuals list. Used inside Server Components.
 */
export async function getManualsServer(): Promise<ManualListItem[]> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: manuals, error } = await supabase
      .from('manuals')
      .select('*, steps(id, title, description, step_order)')
      .order('updated_at', { ascending: false });

    if (error || !manuals) {
      return [];
    }

    return manuals.map((m: any, idx: number) => ({
      id: m.id,
      user_id: m.user_id,
      title: m.title,
      created_at: m.created_at,
      updated_at: m.updated_at,
      steps_count: m.steps?.length || 0,
      description_preview: m.steps?.[0]?.description || '',
      accent_color:
        idx % 3 === 0
          ? 'border-emerald-500'
          : idx % 3 === 1
          ? 'border-blue-500'
          : 'border-indigo-500',
    }));
  } catch (err) {
    console.error('Error fetching manuals on server:', err);
    return [];
  }
}

/**
 * Server-only fetcher for manual by ID. Used inside Server Components.
 */
export async function getManualByIdServer(id: string): Promise<ManualWithSteps | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: manual, error } = await supabase
      .from('manuals')
      .select('*, steps(*)')
      .eq('id', id)
      .single();

    if (error || !manual) return null;

    const sortedSteps = (manual.steps || []).sort(
      (a: Step, b: Step) => a.step_order - b.step_order
    );

    return {
      ...manual,
      steps: sortedSteps,
    };
  } catch (err) {
    console.error('Error fetching manual by id on server:', err);
    return null;
  }
}
