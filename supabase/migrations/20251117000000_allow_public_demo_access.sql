-- Allow public read access to demos and demo_videos
-- This enables the /demos/[demoId]/experience page to work without authentication

-- Add public read policy for demos
DROP POLICY IF EXISTS "Public can view published demos" ON public.demos;
CREATE POLICY "Public can view published demos"
  ON public.demos
  FOR SELECT
  USING (true);

-- Add public read policy for demo_videos
DROP POLICY IF EXISTS "Public can view demo videos" ON public.demo_videos;
CREATE POLICY "Public can view demo videos"
  ON public.demo_videos
  FOR SELECT
  USING (true);

-- Add public read policy for knowledge_chunks (needed for AI conversations)
DROP POLICY IF EXISTS "Public can view knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Public can view knowledge chunks"
  ON public.knowledge_chunks
  FOR SELECT
  USING (true);

-- Note: Users still need to be authenticated to INSERT/UPDATE/DELETE their own demos
-- The existing policies for those operations remain unchanged
