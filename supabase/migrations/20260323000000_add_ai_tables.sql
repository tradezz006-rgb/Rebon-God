-- Create the user_roadmaps table
CREATE TABLE IF NOT EXISTS public.user_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_level TEXT NOT NULL,
    roadmap_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Protect the tables with RLS
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roadmap"
    ON public.user_roadmaps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmap"
    ON public.user_roadmaps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmap"
    ON public.user_roadmaps FOR UPDATE
    USING (auth.uid() = user_id);


-- Create the user_hidden_metrics table for Internal AI Analytics
CREATE TABLE IF NOT EXISTS public.user_hidden_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_speed FLOAT DEFAULT 0.0,
    precision_score FLOAT DEFAULT 0.0,
    ai_hints_used INTEGER DEFAULT 0,
    strong_areas JSONB DEFAULT '[]'::jsonb,
    weak_areas JSONB DEFAULT '[]'::jsonb,
    skill_radar JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Protect the metrics table (Invisible largely, but user needs access to write to it via API)
ALTER TABLE public.user_hidden_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hidden metrics"
    ON public.user_hidden_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hidden metrics"
    ON public.user_hidden_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hidden metrics"
    ON public.user_hidden_metrics FOR UPDATE
    USING (auth.uid() = user_id);
