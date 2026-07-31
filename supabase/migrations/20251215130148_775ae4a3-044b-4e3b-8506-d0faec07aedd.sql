-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  communication_level TEXT DEFAULT 'beginner' CHECK (communication_level IN ('beginner', 'moderate', 'pro', 'ultra_pro')),
  overall_score NUMERIC DEFAULT 0,
  fluency_score NUMERIC DEFAULT 0,
  clarity_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  tone_score NUMERIC DEFAULT 0,
  filler_words_score NUMERIC DEFAULT 0,
  structure_score NUMERIC DEFAULT 0,
  grammar_score NUMERIC DEFAULT 0,
  assessment_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create quiz_results table
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL, -- 'initial', 'video', 'assessment'
  video_id TEXT,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  time_taken_seconds INTEGER,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" 
ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create voice_sessions table for AVA interactions
CREATE TABLE public.voice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'assessment', 'scenario', 'practice'
  scenario_id TEXT,
  transcript TEXT,
  ava_feedback TEXT,
  fluency_score NUMERIC,
  clarity_score NUMERIC,
  confidence_score NUMERIC,
  tone_score NUMERIC,
  filler_words_count INTEGER,
  structure_score NUMERIC,
  grammar_score NUMERIC,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice sessions" 
ON public.voice_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice sessions" 
ON public.voice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create learning_progress table for video tracking
CREATE TABLE public.learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER NOT NULL,
  replay_count INTEGER DEFAULT 0,
  marked_understood BOOLEAN DEFAULT FALSE,
  quiz_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning progress" 
ON public.learning_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning progress" 
ON public.learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress" 
ON public.learning_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create corporate_scenarios table
CREATE TABLE public.corporate_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL, -- 'hr_interview', 'manager_update', 'team_meeting', 'client_call'
  scenario_name TEXT NOT NULL,
  context TEXT NOT NULL,
  goal TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.corporate_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scenarios" 
ON public.corporate_scenarios FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" 
ON public.corporate_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" 
ON public.corporate_scenarios FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();