import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Supabase Helper Methods for Live Data Persistence
export const syncProfileToSupabase = async (profileData: any) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'user_id' });
  if (error) console.error('Supabase profile sync error:', error);
  return data;
};

export const fetchLiveTransactionsFromSupabase = async (userId: string, coupleId: string) => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .or(`user_id.eq.${userId},couple_id.eq.${coupleId}`)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase transactions fetch error:', error);
    return [];
  }
  return data || [];
};

export const insertTransactionToSupabase = async (txData: any) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('financial_transactions').insert(txData);
  if (error) console.error('Supabase transaction insert error:', error);
  return data;
};

export const fetchLiveHouseholdItemsFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('household_items')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase household items fetch error:', error);
    return [];
  }
  return data || [];
};

export const insertHouseholdItemToSupabase = async (itemData: any) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('household_items').insert(itemData);
  if (error) console.error('Supabase household item insert error:', error);
  return data;
};
