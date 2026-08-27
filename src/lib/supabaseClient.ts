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

// Helper to guarantee 100% valid PostgreSQL UUID compliance for both UUID & TEXT columns
export const ensureValidUuid = (str?: string): string => {
  if (!str || str.trim() === '') return 'a7782000-0000-4000-a000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;

  // Generate deterministic 36-char valid UUID format from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `a7782000-0000-4000-a000-${hex.padStart(12, '0').slice(0, 12)}`;
};

// 1. Profile Sync
export const syncProfileToSupabase = async (profileData: any) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const validId = ensureValidUuid(profileData.id);
    const validCoupleId = ensureValidUuid(profileData.coupleId);

    const { data } = await supabase
      .from('profiles')
      .upsert({
        id: validId,
        user_id: validId,
        full_name: profileData.name,
        role: profileData.role,
        avatar_url: profileData.avatar,
        couple_id: validCoupleId,
        is_discreet_mode: profileData.isDiscreetMode,
        salary_sharing_level: profileData.salarySharingLevel,
        is_salary_shared: profileData.isSalaryShared,
        menstrual_sharing_level: profileData.menstrualSharingLevel,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    return data;
  } catch (e) {
    return null;
  }
};

// 2. Household Items Sync
export const fetchLiveHouseholdItemsFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return [];
  try {
    const validCoupleId = ensureValidUuid(coupleId);
    const { data, error } = await supabase
      .from('household_items')
      .select('*')
      .eq('couple_id', validCoupleId);
    if (error || !data) {
      return [];
    }
    return data.map((i) => ({
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
  } catch (e) {
    return [];
  }
};

export const insertHouseholdItemToSupabase = async (itemData: any) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const validItemId = ensureValidUuid(itemData.id);
    const validCoupleId = ensureValidUuid(itemData.coupleId || 'OURA-7782-W');

    const dbPayload = {
      id: validItemId,
      couple_id: validCoupleId,
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
    const { data } = await supabase.from('household_items').upsert(dbPayload, { onConflict: 'id' });
    return data;
  } catch (e) {
    return null;
  }
};

// 3. Transactions Sync
export const fetchLiveTransactionsFromSupabase = async (userId: string, coupleId: string) => {
  if (!isSupabaseConfigured()) return [];
  try {
    const validUserId = ensureValidUuid(userId);
    const validCoupleId = ensureValidUuid(coupleId);

    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .or(`user_id.eq.${validUserId},couple_id.eq.${validCoupleId}`);
    if (error || !data) {
      return [];
    }
    return data.map((t) => ({
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
  } catch (e) {
    return [];
  }
};

export const insertTransactionToSupabase = async (txData: any) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const validTxId = ensureValidUuid(txData.id);
    const validUserId = ensureValidUuid(txData.userId);
    const validCoupleId = ensureValidUuid(txData.coupleId || 'OURA-7782-W');

    const dbPayload = {
      id: validTxId,
      user_id: validUserId,
      couple_id: validCoupleId,
      type: txData.type,
      amount: txData.amount,
      date: txData.date,
      category: txData.category,
      description: txData.description,
      payment_method: txData.paymentMethod,
      related_item_id: txData.relatedItemId ? ensureValidUuid(txData.relatedItemId) : null,
      is_recurring: txData.isRecurring || false,
      is_shared: txData.isShared || false,
      paid_by: txData.paidBy,
      status: txData.status || 'completed'
    };
    const { data } = await supabase.from('financial_transactions').upsert(dbPayload, { onConflict: 'id' });
    return data;
  } catch (e) {
    return null;
  }
};

// 4. Tasks Sync
export const fetchLiveTasksFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return [];
  try {
    const validCoupleId = ensureValidUuid(coupleId);

    const { data, error } = await supabase
      .from('shared_tasks')
      .select('*')
      .eq('couple_id', validCoupleId);
    if (error || !data) {
      return [];
    }
    return data.map((tsk) => ({
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
  } catch (e) {
    return [];
  }
};

export const insertTaskToSupabase = async (taskData: any) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const validTaskId = ensureValidUuid(taskData.id);
    const validCoupleId = ensureValidUuid(taskData.coupleId || 'OURA-7782-W');

    const dbPayload = {
      id: validTaskId,
      couple_id: validCoupleId,
      title: taskData.title,
      description: taskData.description,
      assigned_to: taskData.assignedTo,
      due_date: taskData.dueDate,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      category: taskData.category || 'General'
    };
    const { data } = await supabase.from('shared_tasks').upsert(dbPayload, { onConflict: 'id' });
    return data;
  } catch (e) {
    return null;
  }
};

// 5. Duty Schedule Sync
export const fetchDutySetupFromSupabase = async (coupleId: string) => {
  if (!isSupabaseConfigured() || !coupleId) return null;
  try {
    const validCoupleId = ensureValidUuid(coupleId);

    const { data, error } = await supabase
      .from('duty_schedules')
      .select('*')
      .eq('couple_id', validCoupleId)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return {
      isConfigured: data.is_configured || true,
      day1Date: data.day1_date,
      day1Type: data.day1_type,
      day2Date: data.day2_date,
      day2Type: data.day2_type
    };
  } catch (e) {
    return null;
  }
};

export const insertDutySetupToSupabase = async (setupData: any) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const validCoupleId = ensureValidUuid(setupData.coupleId || 'OURA-7782-W');

    const dbPayload = {
      couple_id: validCoupleId,
      day1_date: setupData.day1Date,
      day1_type: setupData.day1Type,
      day2_date: setupData.day2Date,
      day2_type: setupData.day2Type,
      is_configured: setupData.isConfigured || true
    };
    const { data } = await supabase.from('duty_schedules').insert(dbPayload);
    return data;
  } catch (e) {
    return null;
  }
};
