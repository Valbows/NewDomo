-- Create missing tables that should exist but don't
-- This migration ensures all required tables are present

-- Enable the pgvector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create demo_videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.demo_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    duration_seconds INTEGER,
    processing_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transcript TEXT
);

-- Ensure RLS is enabled and policies are correct for demo_videos
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select their demo videos" ON public.demo_videos;
CREATE POLICY "Users can select their demo videos" ON public.demo_videos FOR SELECT USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can insert their demo videos" ON public.demo_videos;
CREATE POLICY "Users can insert their demo videos" ON public.demo_videos FOR INSERT WITH CHECK ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can update their demo videos" ON public.demo_videos;
CREATE POLICY "Users can update their demo videos" ON public.demo_videos FOR UPDATE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can delete their demo videos" ON public.demo_videos;
CREATE POLICY "Users can delete their demo videos" ON public.demo_videos FOR DELETE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

-- Create knowledge_chunks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    question TEXT,
    answer TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add vector_embedding column if it doesn't exist
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS vector_embedding vector(1536);

-- Ensure RLS is enabled and policies are correct for knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select their knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Users can select their knowledge chunks" ON public.knowledge_chunks FOR SELECT USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can insert their knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Users can insert their knowledge chunks" ON public.knowledge_chunks FOR INSERT WITH CHECK ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can update their knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Users can update their knowledge chunks" ON public.knowledge_chunks FOR UPDATE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());
DROP POLICY IF EXISTS "Users can delete their knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Users can delete their knowledge chunks" ON public.knowledge_chunks FOR DELETE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

-- Create index for vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS knowledge_chunks_vector_embedding_idx ON public.knowledge_chunks USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 100);

-- Add storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('demo-videos', 'demo-videos', false, 104857600) -- 100MB limit
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for storage buckets
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
CREATE POLICY "Users can view their own videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.demos WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.demos WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.demos WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'demo-videos' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.demos WHERE user_id = auth.uid()
));
