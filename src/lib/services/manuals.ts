import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import type { Manual, Step, MediaType } from '@/types/database.types';

export interface ManualWithSteps extends Manual {
  steps: Step[];
}

export interface ManualListItem extends Manual {
  steps_count: number;
  description_preview?: string;
  accent_color?: string;
}

export interface StepPayload {
  id?: string;
  step_order: number;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: MediaType | null;
}

// ---------------------------------------------------------------------------
// Client Component Operations (Safe for 'use client' components)
// ---------------------------------------------------------------------------

export async function getManuals(): Promise<ManualListItem[]> {
  try {
    const supabase = createBrowserSupabase();
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
    console.error('Error fetching manuals on client:', err);
    return [];
  }
}

export async function getManualById(id: string): Promise<ManualWithSteps | null> {
  try {
    const supabase = createBrowserSupabase();
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
  } catch {
    return null;
  }
}

export async function createManual(title: string): Promise<string | null> {
  try {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: manual, error } = await supabase
      .from('manuals')
      .insert({
        title: title.trim(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !manual) throw error;

    // Create default initial step
    await supabase.from('steps').insert({
      manual_id: manual.id,
      step_order: 1,
      title: 'Initial Setup & Prerequisites',
      description: '',
      media_type: 'none',
    });

    return manual.id;
  } catch (err) {
    console.error('Failed to create manual:', err);
    return null;
  }
}

/**
 * Batch saves manual title and all steps to Supabase PostgreSQL database.
 */
export async function saveManualWithSteps(
  manualId: string,
  title: string,
  steps: StepPayload[]
): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();

    // 1. Update manual title & updated_at timestamp
    const { error: manualErr } = await supabase
      .from('manuals')
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', manualId);

    if (manualErr) throw manualErr;

    // 2. Synchronize steps: delete existing steps and batch insert new ordered steps
    const { error: deleteErr } = await supabase
      .from('steps')
      .delete()
      .eq('manual_id', manualId);

    if (deleteErr) throw deleteErr;

    const newStepsToInsert = steps.map((s, idx) => ({
      manual_id: manualId,
      step_order: idx + 1,
      title: s.title ? s.title.trim() : `Step ${idx + 1}`,
      description: s.description ? s.description.trim() : '',
      media_url: s.media_url || null,
      media_type: s.media_type || 'none',
    }));

    if (newStepsToInsert.length > 0) {
      const { error: stepsErr } = await supabase
        .from('steps')
        .insert(newStepsToInsert);
      if (stepsErr) throw stepsErr;
    }

    return true;
  } catch (err) {
    console.error('Failed to save manual with steps:', err);
    return false;
  }
}

export async function deleteManual(manualId: string): Promise<boolean> {
  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from('manuals').delete().eq('id', manualId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Uploads media (images or compressed video blobs) to Supabase Storage bucket 'manual_media'
 * organized by: {user_id}/{manual_id}/{filename}
 */
export async function uploadMediaToStorage(
  fileOrBlob: File | Blob,
  manualId: string,
  fileNameCustom?: string,
  contentTypeCustom?: string
): Promise<string | null> {
  try {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to upload media');

    const mimeType =
      contentTypeCustom ||
      (fileOrBlob instanceof File ? fileOrBlob.type : fileOrBlob.type || 'application/octet-stream');

    let fileExt = 'bin';
    if (mimeType.startsWith('image/')) {
      fileExt = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    } else if (mimeType.startsWith('video/')) {
      fileExt = 'mp4';
    } else if (fileOrBlob instanceof File) {
      fileExt = fileOrBlob.name.split('.').pop() || 'bin';
    }

    const cleanBaseName = fileNameCustom
      ? fileNameCustom.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `media_${Date.now()}`;

    // Storage path structure: {user_id}/{manual_id}/{filename}
    const storagePath = `${user.id}/${manualId}/${cleanBaseName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('manual_media')
      .upload(storagePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('manual_media').getPublicUrl(storagePath);

    return publicUrl;
  } catch (err) {
    console.error('Upload to manual_media storage failed:', err);
    return null;
  }
}
