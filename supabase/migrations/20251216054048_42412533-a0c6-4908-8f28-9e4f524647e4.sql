-- Create table for tracking scenario progress and performance history
CREATE TABLE public.scenario_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  overall_score NUMERIC(4,2),
  fluency_score NUMERIC(4,2),
  clarity_score NUMERIC(4,2),
  confidence_score NUMERIC(4,2),
  tone_score NUMERIC(4,2),
  filler_words_score NUMERIC(4,2),
  structure_score NUMERIC(4,2),
  grammar_score NUMERIC(4,2),
  feedback_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenario_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress"
ON public.scenario_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.scenario_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_scenario_progress_user_id ON public.scenario_progress(user_id);
CREATE INDEX idx_scenario_progress_scenario_id ON public.scenario_progress(scenario_id);