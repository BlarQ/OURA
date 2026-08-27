-- OURA PostgreSQL Database Schema & RLS Policies
-- Comprehensive schema for authenticating, user profile, couple connection, salary profiles,
-- financial ledgers, household tracking, duty rotation, menstrual records, meals, and tasks.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & COUPLE TABLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('wife', 'husband')),
  avatar_url TEXT,
  couple_id UUID,
  is_discreet_mode BOOLEAN DEFAULT FALSE,
  salary_sharing_level INT DEFAULT 0, -- 0..4
  is_salary_shared BOOLEAN DEFAULT FALSE,
  menstrual_sharing_level TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT UNIQUE NOT NULL,
  wife_id UUID REFERENCES profiles(id),
  husband_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FINANCE TABLES
CREATE TABLE IF NOT EXISTS salary_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  salary_name TEXT NOT NULL,
  employer TEXT,
  frequency TEXT DEFAULT 'monthly',
  gross_salary NUMERIC(12, 2) DEFAULT 0.00,
  net_salary NUMERIC(12, 2) DEFAULT 0.00,
  salary_date INT DEFAULT 25,
  currency TEXT DEFAULT 'NGN',
  other_income NUMERIC(12, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id),
  type TEXT CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(12, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  related_item_id UUID,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE, -- FALSE = private, TRUE = shared
  paid_by TEXT CHECK (paid_by IN ('wife', 'husband')),
  status TEXT DEFAULT 'completed',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id),
  couple_id UUID REFERENCES couples(id),
  category TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0.00,
  month_year TEXT NOT NULL, -- e.g. '2026-08'
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id),
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0.00,
  deadline DATE,
  monthly_contribution NUMERIC(12, 2) DEFAULT 0.00,
  category TEXT DEFAULT 'dream_home',
  is_shared BOOLEAN DEFAULT TRUE,
  husband_contribution NUMERIC(12, 2) DEFAULT 0.00,
  wife_contribution NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOUSEHOLD EQUIPMENT & PURCHASES
CREATE TABLE IF NOT EXISTS household_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  room TEXT DEFAULT 'Living Room',
  estimated_price NUMERIC(12, 2) DEFAULT 0.00,
  current_price NUMERIC(12, 2) DEFAULT 0.00,
  quantity INT DEFAULT 1,
  status TEXT DEFAULT 'needed',
  purchased_by TEXT,
  purchase_date DATE,
  warranty_months INT,
  is_workplace_apartment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES household_items(id) ON DELETE CASCADE,
  recorded_date TIMESTAMPTZ DEFAULT NOW(),
  price NUMERIC(12, 2) NOT NULL,
  recorded_by TEXT
);

-- 4. MENSTRUAL HEALTH
CREATE TABLE IF NOT EXISTS menstrual_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow TEXT DEFAULT 'medium',
  pain_level INT DEFAULT 1,
  symptoms TEXT[],
  energy TEXT DEFAULT 'normal',
  mood TEXT,
  sleep_hours NUMERIC(4,1),
  stress_level TEXT DEFAULT 'moderate',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DUTY SCHEDULE
CREATE TABLE IF NOT EXISTS duty_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  last_duty_date DATE NOT NULL,
  last_duty_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTIVITY (TASKS, DECISIONS, NOTES, REMINDERS)
CREATE TABLE IF NOT EXISTS shared_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT CHECK (assigned_to IN ('wife', 'husband', 'both')),
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  wife_status TEXT DEFAULT 'pending',
  husband_status TEXT DEFAULT 'pending',
  selected_option_id UUID,
  status TEXT DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menstrual_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;

-- Profile RLS: Users can view their own profile or their linked partner's profile
CREATE POLICY "Profiles view policy" ON profiles FOR SELECT
  USING (auth.uid() = user_id OR couple_id IN (SELECT couple_id FROM profiles WHERE user_id = auth.uid()));

-- Salary Profiles RLS: Private unless is_salary_shared is true and shared with partner in same couple
CREATE POLICY "Salary private view policy" ON salary_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM profiles p_owner
        JOIN profiles p_viewer ON p_owner.couple_id = p_viewer.couple_id
        WHERE p_owner.user_id = salary_profiles.user_id
        AND p_viewer.user_id = auth.uid()
        AND p_owner.is_salary_shared = TRUE
        AND p_owner.salary_sharing_level > 0
      )
    )
  );

-- Financial Transactions RLS: User can see own transactions OR shared transactions within couple
CREATE POLICY "Financial transactions view policy" ON financial_transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_shared = TRUE AND couple_id IN (
        SELECT couple_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Menstrual Health RLS: Strictly private unless partner sharing level permits
CREATE POLICY "Menstrual health privacy policy" ON menstrual_cycles FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p_owner
      JOIN profiles p_viewer ON p_owner.couple_id = p_viewer.couple_id
      WHERE p_owner.user_id = menstrual_cycles.user_id
      AND p_viewer.user_id = auth.uid()
      AND p_owner.menstrual_sharing_level != 'private'
    )
  );
