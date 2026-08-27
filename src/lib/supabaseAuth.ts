import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Role, UserProfile } from './types';

export interface SupabaseAuthResult {
  success: boolean;
  user?: any;
  profile?: UserProfile;
  error?: string;
}

export const signUpUserWithSupabase = async (
  email: string,
  password: string,
  fullName: string,
  role: Role,
  inviteCode?: string
): Promise<SupabaseAuthResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      profile: {
        id: `usr-${Date.now()}`,
        name: fullName || (role === 'wife' ? 'Wife' : 'Husband'),
        role: role,
        avatar: role === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼',
        partnerName: 'Partner',
        partnerRole: role === 'wife' ? 'husband' : 'wife',
        coupleId: inviteCode || 'COUPLE-OURA-LIVE',
        isDiscreetMode: false,
        salarySharingLevel: 3,
        isSalaryShared: true,
        menstrualSharingLevel: 'moderate',
        husbandWfhDays: ['Tuesday']
      }
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth SignUp error:', authError);
      return { success: false, error: authError.message };
    }

    const authUser = authData.user;
    const coupleId = inviteCode?.trim() ? inviteCode.trim() : `OURA-${Math.floor(1000 + Math.random() * 9000)}`;

    if (authUser) {
      const newProfileData = {
        user_id: authUser.id,
        full_name: fullName,
        role: role,
        avatar_url: role === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼',
        couple_id: coupleId,
        is_discreet_mode: false,
        salary_sharing_level: 3,
        is_salary_shared: true,
        menstrual_sharing_level: role === 'wife' ? 'moderate' : 'private'
      };

      await supabase.from('profiles').upsert(newProfileData, { onConflict: 'user_id' });
    }

    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = fullName || (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));

    const profile: UserProfile = {
      id: authUser?.id || `usr-${Date.now()}`,
      name: formattedName,
      role: role,
      avatar: role === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼',
      partnerName: 'Partner',
      partnerRole: role === 'wife' ? 'husband' : 'wife',
      coupleId: coupleId,
      isDiscreetMode: false,
      salarySharingLevel: 3,
      isSalaryShared: true,
      menstrualSharingLevel: role === 'wife' ? 'moderate' : 'private',
      husbandWfhDays: ['Tuesday']
    };

    return { success: true, user: authUser, profile };
  } catch (err: any) {
    console.error('Supabase auth exception:', err);
    return { success: false, error: err?.message || 'Authentication error' };
  }
};

export const signInUserWithSupabase = async (
  email: string,
  password: string,
  fallbackRole: Role = 'husband'
): Promise<SupabaseAuthResult> => {
  if (!isSupabaseConfigured()) {
    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    return {
      success: true,
      profile: {
        id: `usr-${Date.now()}`,
        name: formattedName,
        role: fallbackRole,
        avatar: fallbackRole === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼',
        partnerName: 'Partner',
        partnerRole: fallbackRole === 'wife' ? 'husband' : 'wife',
        coupleId: 'COUPLE-OURA-LIVE',
        isDiscreetMode: false,
        salarySharingLevel: 3,
        isSalaryShared: true,
        menstrualSharingLevel: 'moderate',
        husbandWfhDays: ['Tuesday']
      }
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase Auth SignIn error:', authError);

      // Handle 'Email not confirmed' gracefully so user can continue seamlessly
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        return {
          success: true,
          profile: {
            id: `usr-${Date.now()}`,
            name: formattedName,
            role: fallbackRole,
            avatar: fallbackRole === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼',
            partnerName: 'Partner',
            partnerRole: fallbackRole === 'wife' ? 'husband' : 'wife',
            coupleId: 'OURA-LIVE',
            isDiscreetMode: false,
            salarySharingLevel: 3,
            isSalaryShared: true,
            menstrualSharingLevel: 'private',
            husbandWfhDays: ['Tuesday']
          }
        };
      }

      return { success: false, error: authError.message };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { success: false, error: 'User sign in failed' };
    }

    // Attempt to fetch profile row from DB
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = authUser.user_metadata?.full_name || profileRow?.full_name || (nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
    const role: Role = profileRow?.role || authUser.user_metadata?.role || fallbackRole;

    const profile: UserProfile = {
      id: authUser.id,
      name: formattedName,
      role: role,
      avatar: profileRow?.avatar_url || (role === 'wife' ? '👩🏾‍⚕️' : '👨🏾‍💼'),
      partnerName: 'Partner',
      partnerRole: role === 'wife' ? 'husband' : 'wife',
      coupleId: profileRow?.couple_id || 'COUPLE-OURA-LIVE',
      isDiscreetMode: profileRow?.is_discreet_mode || false,
      salarySharingLevel: profileRow?.salary_sharing_level ?? 3,
      isSalaryShared: profileRow?.is_salary_shared ?? true,
      menstrualSharingLevel: profileRow?.menstrual_sharing_level || (role === 'wife' ? 'moderate' : 'private'),
      husbandWfhDays: ['Tuesday']
    };

    return { success: true, user: authUser, profile };
  } catch (err: any) {
    console.error('Supabase auth exception:', err);
    return { success: false, error: err?.message || 'Sign in error' };
  }
};
