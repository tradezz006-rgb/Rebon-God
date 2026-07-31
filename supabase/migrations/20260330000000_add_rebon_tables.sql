-- Create Student Lessons table
CREATE TABLE IF NOT EXISTS public.rebon_student_lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    duration_estimate INTEGER,
    concept_explanation JSONB,
    key_points JSONB,
    quizzes JSONB,
    whiteboard_content JSONB,
    linked_scenario_ids JSONB
);

-- Create Professional Scenarios table
CREATE TABLE IF NOT EXISTS public.rebon_professional_scenarios (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    problem_statement TEXT,
    company_context TEXT,
    required_skills JSONB,
    steps_to_solve JSONB,
    common_mistakes JSONB,
    hints_level_1 JSONB,
    hints_level_2 JSONB,
    final_solution TEXT,
    evaluation_metrics JSONB,
    time_expected INTEGER,
    difficulty_level TEXT
);

-- Ensure RLS is enabled
ALTER TABLE public.rebon_student_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebon_professional_scenarios ENABLE ROW LEVEL SECURITY;

-- Add policies so users can read
CREATE POLICY "Allow public read access to rebon_student_lessons"
ON public.rebon_student_lessons FOR SELECT
TO public, authenticated, anon
USING (true);

CREATE POLICY "Allow public read access to rebon_professional_scenarios"
ON public.rebon_professional_scenarios FOR SELECT
TO public, authenticated, anon
USING (true);
