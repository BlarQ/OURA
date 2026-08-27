-- OURA Production PostgreSQL Database Schema & Migration Script
-- Enables real-time synchronization between connected couples (e.g. adedamolaogunlala@gmail.com & collinsogunlala@gmail.com)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & COUPLES
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT UNIQUE,
  email TEXT,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('wife', 'husband')),
  avatar_url TEXT,
  couple_id TEXT,
  is_discreet_mode BOOLEAN DEFAULT FALSE,
  salary_sharing_level INT DEFAULT 0,
  is_salary_shared BOOLEAN DEFAULT FALSE,
  menstrual_sharing_level TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couples (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  invite_code TEXT UNIQUE NOT NULL,
  wife_id TEXT,
  husband_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FINANCE TABLES
CREATE TABLE IF NOT EXISTS salary_profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
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
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
  couple_id TEXT,
  type TEXT CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  related_item_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  paid_by TEXT CHECK (paid_by IN ('wife', 'husband')),
  status TEXT DEFAULT 'completed',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
  couple_id TEXT,
  category TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0.00,
  month_year TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  couple_id TEXT,
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
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  couple_id TEXT,
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

-- 4. MENSTRUAL HEALTH & DUTY SCHEDULE
CREATE TABLE IF NOT EXISTS menstrual_cycles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT,
  couple_id TEXT,
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

CREATE TABLE IF NOT EXISTS duty_schedules (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  couple_id TEXT,
  day1_date DATE,
  day1_type TEXT,
  day2_date DATE,
  day2_type TEXT,
  is_configured BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTIVITY (TASKS, DECISIONS, NOTES)
CREATE TABLE IF NOT EXISTS shared_tasks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  couple_id TEXT,
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
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  couple_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  wife_status TEXT DEFAULT 'pending',
  husband_status TEXT DEFAULT 'pending',
  selected_option_id TEXT,
  status TEXT DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MIGRATION ALTER COLUMNS (SAFE TO RUN IN SUPABASE SQL EDITOR)
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS couple_id TEXT;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS day1_date DATE;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS day1_type TEXT;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS day2_date DATE;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS day2_type TEXT;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS is_configured BOOLEAN DEFAULT TRUE;
ALTER TABLE duty_schedules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- PERMISSIVE RLS POLICIES FOR REAL-TIME COUPLE SYNC
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menstrual_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE duty_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals DISABLE ROW LEVEL SECURITY;
