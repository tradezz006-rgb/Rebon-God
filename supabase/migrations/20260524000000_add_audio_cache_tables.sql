-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- audio_files table (Pillar 1: Pre-generated lesson audio)
CREATE TABLE IF NOT EXISTS public.audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id VARCHAR(50) NOT NULL,
    audio_type VARCHAR(50) NOT NULL, -- 'intro', 'block', 'iq', 'challenge', 'summary'
    block_number INT,
    block_type VARCHAR(100),
    step_number INT,
    question_number INT,
    response_type VARCHAR(50), -- 'correct', 'wrong', NULL
    r2_key VARCHAR(255) NOT NULL,
    cdn_url VARCHAR(500) NOT NULL,
    duration_seconds FLOAT,
    char_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sarvam_called BOOLEAN DEFAULT TRUE
);

-- qa_voice_cache table (Pillar 2 & 3: Dynamic QA Voice Cache with pgvector)
CREATE TABLE IF NOT EXISTS public.qa_voice_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 of normalized text
    question_original TEXT NOT NULL,
    question_normal TEXT NOT NULL,
    lesson_id VARCHAR(50),
    section_id VARCHAR(50),
    answer_text TEXT NOT NULL,
    whiteboard_text TEXT, -- cached whiteboard bullet points
    r2_key VARCHAR(255) NOT NULL,
    cdn_url VARCHAR(500) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'json_data', 'groq'
    served_count INT DEFAULT 0,
    groq_called BOOLEAN DEFAULT FALSE,
    sarvam_called BOOLEAN DEFAULT TRUE,
    question_embedding VECTOR(384), -- pgvector vector column (using 384-dimensional miniLM/GTE embeddings)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_served_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cosine similarity match function for semantic search
CREATE OR REPLACE FUNCTION public.match_qa_voice (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  question_original TEXT,
  answer_text TEXT,
  whiteboard_text TEXT,
  cdn_url VARCHAR(500),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa_voice_cache.id,
    qa_voice_cache.question_original,
    qa_voice_cache.answer_text,
    qa_voice_cache.whiteboard_text,
    qa_voice_cache.cdn_url,
    1 - (qa_voice_cache.question_embedding <=> query_embedding) AS similarity
  FROM qa_voice_cache
  WHERE 1 - (qa_voice_cache.question_embedding <=> query_embedding) > match_threshold
  ORDER BY qa_voice_cache.question_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Indexes for lightning-fast performance
CREATE INDEX IF NOT EXISTS idx_audio_files_lookup 
    ON public.audio_files(lesson_id, audio_type, block_number, step_number, question_number, response_type);
CREATE INDEX IF NOT EXISTS idx_qa_voice_cache_hash 
    ON public.qa_voice_cache(question_hash);

-- Enable RLS
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_voice_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so frontend can check caches directly via Supabase client!)
CREATE POLICY "Allow public read access to audio_files"
    ON public.audio_files FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access to qa_voice_cache"
    ON public.qa_voice_cache FOR SELECT
    USING (true);

-- Allow all operations for service role and auth
CREATE POLICY "Allow service role or auth to manage audio_files"
    ON public.audio_files FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role or auth to manage qa_voice_cache"
    ON public.qa_voice_cache FOR ALL
    USING (true)
    WITH CHECK (true);
