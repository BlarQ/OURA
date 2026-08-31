-- OURA Database Schema SQL Definition
-- PostgreSQL Schema with Row Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  minimum_safe_balance NUMERIC(14,2) NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  priority TEXT NOT NULL DEFAULT 'Medium',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date DATE NOT NULL,
  due_time TIME,
  category TEXT DEFAULT 'General',
  recurrence TEXT NOT NULL DEFAULT 'None',
  notification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Task Subtasks Table
CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Completed',
  accomplishment TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  budget NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Active',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Plan Items Table
CREATE TABLE IF NOT EXISTS public.plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  actual_amount NUMERIC(14,2) DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Planned',
  due_date DATE,
  purchased_date DATE,
  category TEXT DEFAULT 'General',
  notes TEXT,
  expense_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Salary Records Table
CREATE TABLE IF NOT EXISTS public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer TEXT NOT NULL,
  salary_month VARCHAR(7) NOT NULL, -- YYYY-MM
  basic_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  housing_allowance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  transport_allowance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  other_allowances NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  bonus NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  gross_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  net_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Income Records Table
CREATE TABLE IF NOT EXISTS public.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Expense Records Table
CREATE TABLE IF NOT EXISTS public.expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  plan_item_id UUID REFERENCES public.plan_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  related_type TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  category TEXT NOT NULL,
  budgeted_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  spent_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month, category)
);

-- 13. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Subscriptions',
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Monthly',
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  last_paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'In Progress',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Personal',
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'In Progress',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  attached_type TEXT,
  attached_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Reviews Tables
CREATE TABLE IF NOT EXISTS public.daily_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date DATE NOT NULL UNIQUE,
  tasks_completed_count INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  total_work_minutes INTEGER DEFAULT 0,
  accomplishments TEXT NOT NULL,
  challenges TEXT,
  outstanding TEXT,
  tomorrow_plans TEXT,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  work_minutes INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  total_income NUMERIC(14,2) DEFAULT 0.00,
  total_expenses NUMERIC(14,2) DEFAULT 0.00,
  total_saved NUMERIC(14,2) DEFAULT 0.00,
  biggest_accomplishment TEXT,
  highest_spending_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  total_work_hours NUMERIC(8,2) DEFAULT 0.00,
  task_completion_rate INTEGER DEFAULT 0,
  total_salary NUMERIC(14,2) DEFAULT 0.00,
  total_other_income NUMERIC(14,2) DEFAULT 0.00,
  total_expenses NUMERIC(14,2) DEFAULT 0.00,
  total_savings NUMERIC(14,2) DEFAULT 0.00,
  savings_rate NUMERIC(5,2) DEFAULT 0.00,
  key_highlights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Notifications & Preferences
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_type TEXT,
  related_id UUID,
  status TEXT NOT NULL DEFAULT 'Pending',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  task_reminders BOOLEAN DEFAULT TRUE,
  overdue_reminders BOOLEAN DEFAULT TRUE,
  bill_reminders BOOLEAN DEFAULT TRUE,
  budget_warnings BOOLEAN DEFAULT TRUE,
  low_balance_warnings BOOLEAN DEFAULT TRUE,
  goal_reminders BOOLEAN DEFAULT TRUE,
  plan_reminders BOOLEAN DEFAULT TRUE,
  daily_review BOOLEAN DEFAULT TRUE,
  weekly_review BOOLEAN DEFAULT TRUE,
  monthly_review BOOLEAN DEFAULT TRUE
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expense_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON public.income_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bills_user_due ON public.bills(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON public.plan_items(plan_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Generator Pattern for user_id tables
CREATE POLICY "Users access own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own activities" ON public.activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own salary" ON public.salary_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own income" ON public.income_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own expenses" ON public.expense_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own bills" ON public.bills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own savings" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own daily_reviews" ON public.daily_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own weekly_reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own monthly_reviews" ON public.monthly_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notification_preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
