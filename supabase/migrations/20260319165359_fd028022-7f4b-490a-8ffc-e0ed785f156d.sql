
-- Add path_type column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS path_type text CHECK (path_type IN ('student', 'professional')) DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

-- Add total_xp to fullstack_profiles
ALTER TABLE public.fullstack_profiles ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

-- Daily Challenges table
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_date DATE NOT NULL,
  challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  problem_1_completed BOOLEAN DEFAULT FALSE,
  problem_2_completed BOOLEAN DEFAULT FALSE,
  problem_3_completed BOOLEAN DEFAULT FALSE,
  problem_4_completed BOOLEAN DEFAULT FALSE,
  problem_5_completed BOOLEAN DEFAULT FALSE,
  total_xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  streak_badge TEXT CHECK (streak_badge IN ('none', 'bronze', 'silver', 'gold', 'platinum')) DEFAULT 'none',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- XP Levels table
CREATE TABLE public.xp_levels (
  user_id UUID PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  level_name TEXT DEFAULT 'Novice',
  level_number INTEGER DEFAULT 1,
  next_level_xp INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.xp_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp" ON public.xp_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON public.xp_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp" ON public.xp_levels FOR UPDATE USING (auth.uid() = user_id);

-- AI Conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT,
  scenario_type TEXT,
  transcript JSONB DEFAULT '[]'::jsonb,
  overall_score NUMERIC(3,1),
  feedback TEXT,
  recommended_topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video Library table (public read)
CREATE TABLE public.video_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  topic TEXT,
  duration_seconds INTEGER,
  difficulty TEXT,
  format TEXT CHECK (format IN ('tutorial', 'example', 'practice', 'tip')),
  view_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.video_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view videos" ON public.video_library FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_daily_challenges_user_date ON public.daily_challenges(user_id, challenge_date);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_streaks_user ON public.streaks(user_id);
