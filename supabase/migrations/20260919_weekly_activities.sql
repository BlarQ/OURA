-- ==============================================================================
-- Migration: Create or Update weekly_activities table with RLS Policies
-- Execute in Supabase SQL Editor: Dashboard -> SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. Create weekly_activities table
CREATE TABLE IF NOT EXISTS public.weekly_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manual_id UUID REFERENCES public.manuals(id) ON DELETE SET NULL,
    activity_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_slot TEXT,
    priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('routine', 'standard', 'critical')),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_weekly_activities_user_date ON public.weekly_activities(user_id, activity_date);

-- 3. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_weekly_activities_updated_at ON public.weekly_activities;
CREATE TRIGGER set_weekly_activities_updated_at
    BEFORE UPDATE ON public.weekly_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.weekly_activities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Users can only read, insert, update, delete their own activities)
DROP POLICY IF EXISTS "Users can view own weekly activities" ON public.weekly_activities;
CREATE POLICY "Users can view own weekly activities"
    ON public.weekly_activities
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly activities" ON public.weekly_activities;
CREATE POLICY "Users can insert own weekly activities"
    ON public.weekly_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weekly activities" ON public.weekly_activities;
CREATE POLICY "Users can update own weekly activities"
    ON public.weekly_activities
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly activities" ON public.weekly_activities;
CREATE POLICY "Users can delete own weekly activities"
    ON public.weekly_activities
    FOR DELETE
    USING (auth.uid() = user_id);
