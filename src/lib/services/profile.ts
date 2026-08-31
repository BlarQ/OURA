import { UserProfile } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const userMeta = userData.user.user_metadata;
          if (userMeta?.full_name) {
            localStore.profile.full_name = userMeta.full_name;
          }
          if (userMeta?.currency) {
            localStore.profile.currency = userMeta.currency;
          }
          localStore.profile.email = userData.user.email || localStore.profile.email;
          localStore.profile.id = userData.user.id;
          saveLocalStore();
        }
      } catch (e) {}
    }
    return { ...localStore.profile };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    localStore.profile = {
      ...localStore.profile,
      ...updates,
      updated_at: new Date().toISOString().split('T')[0],
    };
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await supabase.auth.updateUser({
            data: { full_name: updates.full_name, currency: updates.currency },
          });
        }
      } catch (e) {}
    }

    return { ...localStore.profile };
  },
};
