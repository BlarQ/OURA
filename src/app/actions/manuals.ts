'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createManualServerAction(formData: FormData) {
  const title = formData.get('title') as string;

  if (!title || !title.trim()) {
    return { error: 'Please enter a manual title' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Insert new manual
  const { data: manual, error: insertError } = await supabase
    .from('manuals')
    .insert({
      title: title.trim(),
      user_id: user.id,
    })
    .select('id')
    .single();

  if (insertError || !manual) {
    console.error('Failed to create manual:', insertError);
    return { error: insertError?.message || 'Failed to create manual in database' };
  }

  // Insert initial default step
  await supabase.from('steps').insert({
    manual_id: manual.id,
    step_order: 1,
    title: 'Initial Setup & Prerequisites',
    description: 'Document initial dependencies, file paths, and environment prerequisites here.',
    media_type: 'none',
  });

  revalidatePath('/dashboard');
  revalidatePath('/');
  redirect(`/manuals/${manual.id}/edit`);
}

export async function deleteManualServerAction(manualId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('manuals')
    .delete()
    .eq('id', manualId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting manual:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}
