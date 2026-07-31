-- Lesson summaries (mission log)
CREATE TABLE IF NOT EXISTS public.lesson_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT,
  lesson_title TEXT,
  concepts_covered JSONB DEFAULT '[]',
  doubts_asked JSONB DEFAULT '[]',
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session feedback (post-class debrief)
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT,
  lesson_title TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  understood_concepts JSONB DEFAULT '[]',
  confusing_concepts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own lesson summaries"
  ON public.lesson_summaries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own session feedback"
  ON public.session_feedback
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
