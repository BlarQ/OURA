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

// Supabase Helper Methods for Real-Time Data Persistence Across Accounts

// 1. Profile Sync
export const syncProfileToSupabase = async (profileData: any) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: profileData.id,
      user_id: profileData.id,
      full_name: profileData.name,
      role: profileData.role,
      avatar_url: profileData.avatar,
      couple_id: profileData.coupleId,
      is_discreet_mode: profileData.isDiscreetMode,
      salary_sharing_level: profileData.salarySharingLevel,
      is_salary_shared: profileData.isSalaryShared,
      menstrual_sharing_level: profileData.menstrualSharingLevel,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  if (error) console.error('Supabase profile sync error:', error);
  return data;
};

// 2. Household Items Sync
export const fetchLiveHouseholdItemsFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return [];
  const { data, error } = await supabase
    .from('household_items')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase household items fetch error:', error);
    return [];
  }
  return (data || []).map((i) => ({
    id: i.id,
    coupleId: i.couple_id,
    name: i.name,
    category: i.category,
    room: i.room || 'Living Room',
    estimatedPrice: Number(i.estimated_price || 0),
    currentPrice: Number(i.current_price || 0),
    quantity: i.quantity || 1,
    status: i.status || 'needed',
    purchasedBy: i.purchased_by,
    purchaseDate: i.purchase_date,
    warrantyMonths: i.warranty_months,
    isWorkplaceApartment: i.is_workplace_apartment || false,
    priceHistory: []
  }));
};

export const insertHouseholdItemToSupabase = async (itemData: any) => {
  if (!isSupabaseConfigured()) return null;
  const dbPayload = {
    id: itemData.id,
    couple_id: itemData.coupleId || 'OURA-7782-W',
    name: itemData.name,
    category: itemData.category,
    room: itemData.room || 'Living Room',
    estimated_price: itemData.estimatedPrice || 0,
    current_price: itemData.currentPrice || 0,
    quantity: itemData.quantity || 1,
    status: itemData.status || 'needed',
    purchased_by: itemData.purchasedBy,
    purchase_date: itemData.purchaseDate,
    warranty_months: itemData.warrantyMonths,
    is_workplace_apartment: itemData.isWorkplaceApartment || false
  };
  const { data, error } = await supabase.from('household_items').upsert(dbPayload, { onConflict: 'id' });
  if (error) console.error('Supabase household item insert error:', error);
  return data;
};

// 3. Transactions Sync
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
  return (data || []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    coupleId: t.couple_id,
    type: t.type,
    amount: Number(t.amount || 0),
    date: t.date,
    category: t.category,
    description: t.description,
    paymentMethod: t.payment_method,
    relatedItemId: t.related_item_id,
    isRecurring: t.is_recurring || false,
    isShared: t.is_shared || false,
    paidBy: t.paid_by,
    status: t.status || 'completed'
  }));
};

export const insertTransactionToSupabase = async (txData: any) => {
  if (!isSupabaseConfigured()) return null;
  const dbPayload = {
    id: txData.id,
    user_id: txData.userId,
    couple_id: txData.coupleId || 'OURA-7782-W',
    type: txData.type,
    amount: txData.amount,
    date: txData.date,
    category: txData.category,
    description: txData.description,
    payment_method: txData.paymentMethod,
    related_item_id: txData.relatedItemId,
    is_recurring: txData.isRecurring || false,
    is_shared: txData.isShared || false,
    paid_by: txData.paidBy,
    status: txData.status || 'completed'
  };
  const { data, error } = await supabase.from('financial_transactions').upsert(dbPayload, { onConflict: 'id' });
  if (error) console.error('Supabase transaction insert error:', error);
  return data;
};

// 4. Tasks Sync
export const fetchLiveTasksFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return [];
  const { data, error } = await supabase
    .from('shared_tasks')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase tasks fetch error:', error);
    return [];
  }
  return (data || []).map((tsk) => ({
    id: tsk.id,
    coupleId: tsk.couple_id,
    title: tsk.title,
    description: tsk.description,
    assignedTo: tsk.assigned_to,
    dueDate: tsk.due_date,
    priority: tsk.priority || 'medium',
    status: tsk.status || 'pending',
    category: tsk.category || 'General'
  }));
};

export const insertTaskToSupabase = async (taskData: any) => {
  if (!isSupabaseConfigured()) return null;
  const dbPayload = {
    id: taskData.id,
    couple_id: taskData.coupleId || 'OURA-7782-W',
    title: taskData.title,
    description: taskData.description,
    assigned_to: taskData.assignedTo,
    due_date: taskData.dueDate,
    priority: taskData.priority || 'medium',
    status: taskData.status || 'pending',
    category: taskData.category || 'General'
  };
  const { data, error } = await supabase.from('shared_tasks').upsert(dbPayload, { onConflict: 'id' });
  if (error) console.error('Supabase task insert error:', error);
  return data;
};

// 5. Duty Schedule Sync
export const fetchDutySetupFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return null;
  const { data, error } = await supabase
    .from('duty_schedules')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Supabase duty setup fetch error:', error);
    return null;
  }
  if (!data) return null;
  return {
    isConfigured: data.is_configured || true,
    day1Date: data.day1_date,
    day1Type: data.day1_type,
    day2Date: data.day2_date,
    day2Type: data.day2_type
  };
};

export const insertDutySetupToSupabase = async (setupData: any) => {
  if (!isSupabaseConfigured()) return null;
  const dbPayload = {
    couple_id: setupData.coupleId || 'OURA-7782-W',
    day1_date: setupData.day1Date,
    day1_type: setupData.day1Type,
    day2_date: setupData.day2Date,
    day2_type: setupData.day2Type,
    is_configured: setupData.isConfigured || true
  };
  const { data, error } = await supabase.from('duty_schedules').insert(dbPayload);
  if (error) console.error('Supabase duty setup insert error:', error);
  return data;
};
