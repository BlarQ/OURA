import { createClient } from '@supabase/supabase-js';
import {
  UserProfile, Task, Activity, Project, Plan, PlanItem, SalaryRecord,
  IncomeRecord, ExpenseRecord, Transaction, Budget, Bill, SavingsGoal,
  Goal, Note, DailyReview, WeeklyReview, MonthlyReview, Notification,
  NotificationPreferences
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_01',
  full_name: 'User',
  email: 'user@oura.app',
  currency: 'NGN',
  minimum_safe_balance: 100000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  user_id: 'usr_01',
  task_reminders: true,
  overdue_reminders: true,
  bill_reminders: true,
  budget_warnings: true,
  low_balance_warnings: true,
  goal_reminders: true,
  plan_reminders: true,
  daily_review: true,
  weekly_review: true,
  monthly_review: true,
};

export const localStore = {
  profile: { ...DEFAULT_PROFILE },
  projects: [] as Project[],
  tasks: [] as Task[],
  activities: [] as Activity[],
  plans: [] as Plan[],
  salary: [] as SalaryRecord[],
  income: [] as IncomeRecord[],
  expenses: [] as ExpenseRecord[],
  transactions: [] as Transaction[],
  budgets: [] as Budget[],
  bills: [] as Bill[],
  savings: [] as SavingsGoal[],
  goals: [] as Goal[],
  notes: [] as Note[],
  notifications: [] as Notification[],
  notificationPreferences: { ...DEFAULT_NOTIF_PREFS },
  dailyReviews: [] as DailyReview[],
  weeklyReviews: [] as WeeklyReview[],
  monthlyReviews: [] as MonthlyReview[],
};

function getStorageKey(): string {
  const userId = localStore.profile?.id || localStore.profile?.email || 'guest';
  return `oura_store_${userId}`;
}

export function saveLocalStore() {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(localStore));
    localStorage.setItem('oura_last_active_user', localStore.profile.email || '');
  } catch (e) {
    console.warn('Failed to save store to localStorage:', e);
  }
}

export function loadLocalStore() {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.keys(parsed).forEach((k) => {
        if (k in localStore) {
          (localStore as any)[k] = parsed[k];
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load store from localStorage:', e);
  }
}

export function clearUserStore() {
  localStore.profile = { ...DEFAULT_PROFILE };
  localStore.projects = [];
  localStore.tasks = [];
  localStore.activities = [];
  localStore.plans = [];
  localStore.salary = [];
  localStore.income = [];
  localStore.expenses = [];
  localStore.transactions = [];
  localStore.budgets = [];
  localStore.bills = [];
  localStore.savings = [];
  localStore.goals = [];
  localStore.notes = [];
  localStore.notifications = [];
  localStore.notificationPreferences = { ...DEFAULT_NOTIF_PREFS };
}

// Auto-hydrate store on client load
if (typeof window !== 'undefined') {
  loadLocalStore();
}
