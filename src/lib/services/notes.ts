import { Note } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const noteService = {
  async getNotes(): Promise<Note[]> {
    let dbNotes: Note[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbNotes = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbNotes.map((n) => n.id));
    const localOnly = localStore.notes.filter((n) => !dbIds.has(n.id));
    return [...dbNotes, ...localOnly];
  },

  async createNote(data: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Note> {
    const today = new Date().toISOString().split('T')[0];
    const newNote: Note = {
      ...data,
      id: `note_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
    };

    localStore.notes.unshift(newNote);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;

        const dbPayload = {
          user_id: userId,
          title: data.title,
          content: data.content,
        };

        const { data: nData, error } = await supabase
          .from('notes')
          .insert([dbPayload])
          .select('*')
          .single();

        if (!error && nData) {
          const idx = localStore.notes.findIndex((n) => n.id === newNote.id);
          if (idx !== -1) {
            localStore.notes[idx] = { ...newNote, ...nData };
            saveLocalStore();
          }
          return { ...newNote, ...nData };
        }
      } catch (e) {}
    }

    return newNote;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    if (supabase && !id.startsWith('note_')) {
      try {
        await supabase.from('notes').update(updates).eq('id', id);
      } catch (e) {}
    }

    const index = localStore.notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...localStore.notes[index],
      ...updates,
      updated_at: today,
    };
    localStore.notes[index] = updated;
    saveLocalStore();
    return updated;
  },

  async deleteNote(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('note_')) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (e) {}
    }

    localStore.notes = localStore.notes.filter((n) => n.id !== id);
    saveLocalStore();
    return true;
  },
};
