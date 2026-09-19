-- ==============================================================================
-- MyManual Database Schema, RLS Policies & Storage Configuration
-- App: Personalized IT Procedure Documentation App ('MyManual' / 'AdeManual')
-- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- Table: public.manuals
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on manuals(user_id) for fast user lookup
CREATE INDEX IF NOT EXISTS idx_manuals_user_id ON public.manuals(user_id);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_manuals_updated_at ON public.manuals;
CREATE TRIGGER set_manuals_updated_at
    BEFORE UPDATE ON public.manuals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- Table: public.steps
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID NOT NULL REFERENCES public.manuals(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'document', 'audio', 'none') OR media_type IS NULL),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for steps
CREATE INDEX IF NOT EXISTS idx_steps_manual_id ON public.steps(manual_id);
CREATE INDEX IF NOT EXISTS idx_steps_manual_order ON public.steps(manual_id, step_order);

-- ==============================================================================
-- Table: public.weekly_activities (IT Weekday Operations Planner: Mon - Fri)
-- ==============================================================================
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for weekly_activities
CREATE INDEX IF NOT EXISTS idx_weekly_activities_user_date ON public.weekly_activities(user_id, activity_date);

DROP TRIGGER IF EXISTS set_weekly_activities_updated_at ON public.weekly_activities;
CREATE TRIGGER set_weekly_activities_updated_at
    BEFORE UPDATE ON public.weekly_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- Row Level Security (RLS) - Table Security Policies
-- ==============================================================================

ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_activities ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS for 'manuals' (Users manage only their own manuals)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own manuals" ON public.manuals;
CREATE POLICY "Users can view own manuals"
    ON public.manuals
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own manuals" ON public.manuals;
CREATE POLICY "Users can insert own manuals"
    ON public.manuals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own manuals" ON public.manuals;
CREATE POLICY "Users can update own manuals"
    ON public.manuals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own manuals" ON public.manuals;
CREATE POLICY "Users can delete own manuals"
    ON public.manuals
    FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS for 'steps' (Access restricted to the owner of the associated manual)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view steps of own manuals" ON public.steps;
CREATE POLICY "Users can view steps of own manuals"
    ON public.steps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.manuals
            WHERE public.manuals.id = steps.manual_id
              AND public.manuals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert steps into own manuals" ON public.steps;
CREATE POLICY "Users can insert steps into own manuals"
    ON public.steps
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.manuals
            WHERE public.manuals.id = steps.manual_id
              AND public.manuals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update steps of own manuals" ON public.steps;
CREATE POLICY "Users can update steps of own manuals"
    ON public.steps
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.manuals
            WHERE public.manuals.id = steps.manual_id
              AND public.manuals.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.manuals
            WHERE public.manuals.id = steps.manual_id
              AND public.manuals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete steps of own manuals" ON public.steps;
CREATE POLICY "Users can delete steps of own manuals"
    ON public.steps
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.manuals
            WHERE public.manuals.id = steps.manual_id
              AND public.manuals.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- RLS for 'weekly_activities'
-- ------------------------------------------------------------------------------
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

-- ==============================================================================
-- Supabase Storage: 'manual_media' Bucket & Storage RLS
-- Objects are partitioned by user_id: <user_id>/<manual_id>/<file_name>
-- ==============================================================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('manual_media', 'manual_media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can view their own manual media" ON storage.objects;
CREATE POLICY "Users can view their own manual media"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'manual_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can upload their own manual media" ON storage.objects;
CREATE POLICY "Users can upload their own manual media"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'manual_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update their own manual media" ON storage.objects;
CREATE POLICY "Users can update their own manual media"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'manual_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'manual_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own manual media" ON storage.objects;
CREATE POLICY "Users can delete their own manual media"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'manual_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
