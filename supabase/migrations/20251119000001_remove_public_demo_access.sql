-- SECURITY FIX: Remove overly permissive public access policies
-- These policies allowed ANYONE (authenticated or not) to view ALL demos
-- This was a critical security vulnerability

-- Remove public read policy for demos
DROP POLICY IF EXISTS "Public can view published demos" ON public.demos;

-- Remove public read policy for demo_videos
DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos;

-- Remove public read policy for knowledge_chunks
DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks;

-- After this migration, only the existing user-scoped policies remain:
-- 1. "Users can view their own demos" - FOR SELECT USING (auth.uid() = user_id)
-- 2. "Users can insert their own demos" - FOR INSERT WITH CHECK (auth.uid() = user_id)
-- 3. "Users can update their own demos" - FOR UPDATE USING (auth.uid() = user_id)
-- 4. "Users can delete their own demos" - FOR DELETE USING (auth.uid() = user_id)

-- This ensures proper data isolation between users
