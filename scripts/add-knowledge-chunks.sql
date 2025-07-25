-- Add knowledge_chunks table for demo configuration
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  chunk_type TEXT NOT NULL, -- 'transcript', 'summary', 'key_points', etc.
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  chunk_index INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS knowledge_chunks_demo_id_idx ON public.knowledge_chunks(demo_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_type_idx ON public.knowledge_chunks(chunk_type);
CREATE INDEX IF NOT EXISTS knowledge_chunks_demo_type_idx ON public.knowledge_chunks(demo_id, chunk_type);

-- Enable RLS
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own knowledge chunks" ON public.knowledge_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.demos 
      WHERE demos.id = knowledge_chunks.demo_id 
      AND demos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own knowledge chunks" ON public.knowledge_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.demos 
      WHERE demos.id = knowledge_chunks.demo_id 
      AND demos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own knowledge chunks" ON public.knowledge_chunks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.demos 
      WHERE demos.id = knowledge_chunks.demo_id 
      AND demos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own knowledge chunks" ON public.knowledge_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.demos 
      WHERE demos.id = knowledge_chunks.demo_id 
      AND demos.user_id = auth.uid()
    )
  );
