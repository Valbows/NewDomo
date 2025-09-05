-- Add detailed conversation storage table
-- This stores rich conversation data from Tavus conversation library
CREATE TABLE IF NOT EXISTS public.conversation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  tavus_conversation_id TEXT NOT NULL,
  conversation_name TEXT,
  
  -- Transcript data
  transcript JSONB, -- Full conversation transcript with timestamps
  
  -- Perception analysis data
  perception_analysis JSONB, -- Full perception analysis from Tavus
  
  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
  
  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_tavus_conversation UNIQUE (tavus_conversation_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_details_demo_id 
  ON public.conversation_details(demo_id);

CREATE INDEX IF NOT EXISTS idx_conversation_details_tavus_id 
  ON public.conversation_details(tavus_conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_details_completed_at 
  ON public.conversation_details(completed_at DESC);

-- GIN indexes for JSONB columns for fast queries
CREATE INDEX IF NOT EXISTS idx_conversation_details_transcript_gin 
  ON public.conversation_details USING GIN (transcript);

CREATE INDEX IF NOT EXISTS idx_conversation_details_perception_gin 
  ON public.conversation_details USING GIN (perception_analysis);

-- Row Level Security
ALTER TABLE public.conversation_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access conversation details for their own demos
DROP POLICY IF EXISTS "Users can access their own conversation details" ON public.conversation_details;
CREATE POLICY "Users can access their own conversation details" ON public.conversation_details
  FOR ALL
  USING (
    demo_id IN (
      SELECT id FROM public.demos WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    demo_id IN (
      SELECT id FROM public.demos WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at_conversation_details ON public.conversation_details;
CREATE TRIGGER handle_updated_at_conversation_details
  BEFORE UPDATE ON public.conversation_details
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
