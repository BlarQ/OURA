import { supabase, localStore, saveLocalStore, loadLocalStore, clearUserStore } from '../supabase/client';
import { UserProfile, CurrencyCode } from '@/types';

export interface OnboardingData {
  full_name: string;
  email: string;
  currency: CurrencyCode;
  monthly_salary: number;
  minimum_safe_balance: number;
  occupation?: string;
  roster_preference?: string;
  focus_goals?: string[];
}

export const authService = {
  async signUp(email: string, password: string, onboarding: OnboardingData): Promise<{ user: any; profile: UserProfile } | null> {
    clearUserStore();
    const today = new Date().toISOString().split('T')[0];

    const profile: UserProfile = {
      id: `usr_${Date.now()}`,
      full_name: onboarding.full_name,
      email: onboarding.email,
      currency: onboarding.currency || 'NGN',
      minimum_safe_balance: onboarding.minimum_safe_balance || 50000,
      created_at: today,
      updated_at: today,
    };

    localStore.profile = profile;
    if (onboarding.monthly_salary) {
      localStore.salary = [
        {
          id: `sal_${Date.now()}`,
          user_id: profile.id,
          employer: onboarding.occupation || 'Main Employer',
          salary_month: today.substring(0, 7),
          basic_salary: onboarding.monthly_salary,
          housing_allowance: 0,
          transport_allowance: 0,
          other_allowances: 0,
          bonus: 0,
          deductions: 0,
          gross_salary: onboarding.monthly_salary,
          net_salary: onboarding.monthly_salary,
          payment_date: today,
          created_at: today,
          updated_at: today,
        },
      ];
    }
    saveLocalStore();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: onboarding.full_name,
              currency: onboarding.currency,
            },
          },
        });

        if (!error && data?.user) {
          profile.id = data.user.id;
          localStore.profile = profile;
          saveLocalStore();
          return { user: data.user, profile };
        }
      } catch (e) {
        console.warn('Supabase auth signup warning:', e);
      }
    }

    return { user: { id: profile.id, email }, profile };
  },

  async signIn(email: string, password: string): Promise<boolean> {
    clearUserStore();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error && data?.user) {
          localStore.profile.email = email;
          localStore.profile.id = data.user.id;
          if (data.user.user_metadata?.full_name) {
            localStore.profile.full_name = data.user.user_metadata.full_name;
          }
          loadLocalStore();
          saveLocalStore();
          return true;
        }
      } catch (e) {}
    }

    // Local authentication simulation
    if (email) {
      localStore.profile.email = email;
      localStore.profile.id = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStore.profile.full_name = email.split('@')[0].toUpperCase();
      loadLocalStore();
      saveLocalStore();
      return true;
    }
    return false;
  },

  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    clearUserStore();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oura_last_active_user');
    }
    window.location.href = '/login';
  },
};
