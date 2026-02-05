-- Add public read access for the Workday demo (8cc16f2d-b407-4895-9639-643d1a976da4)
-- This allows the public /view route to access demo data without authentication

-- The specific Workday demo ID that should be publicly accessible
-- This is hardcoded for security - only this demo can be viewed without login

-- demos table: Allow public read for Workday demo
DROP POLICY IF EXISTS "Public can view Workday demo" ON public.demos;
CREATE POLICY "Public can view Workday demo" ON public.demos
  FOR SELECT
  USING (id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid);

-- demo_videos table: Allow public read for Workday demo videos
DROP POLICY IF EXISTS "Public can view Workday demo videos" ON public.demo_videos;
CREATE POLICY "Public can view Workday demo videos" ON public.demo_videos
  FOR SELECT
  USING (demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid);

-- knowledge_chunks table: Allow public read for Workday demo knowledge
DROP POLICY IF EXISTS "Public can view Workday demo knowledge" ON public.knowledge_chunks;
CREATE POLICY "Public can view Workday demo knowledge" ON public.knowledge_chunks
  FOR SELECT
  USING (demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid);

-- conversation_details table: Allow public read for Workday demo conversations
DROP POLICY IF EXISTS "Public can view Workday demo conversations" ON public.conversation_details;
CREATE POLICY "Public can view Workday demo conversations" ON public.conversation_details
  FOR SELECT
  USING (demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid);

-- qualification_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo qualification data" ON public.qualification_data;
CREATE POLICY "Public can view Workday demo qualification data" ON public.qualification_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid
    )
  );

-- product_interest_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo product interest" ON public.product_interest_data;
CREATE POLICY "Public can view Workday demo product interest" ON public.product_interest_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid
    )
  );

-- video_showcase_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo video showcase" ON public.video_showcase_data;
CREATE POLICY "Public can view Workday demo video showcase" ON public.video_showcase_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid
    )
  );

-- cta_tracking table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo cta tracking" ON public.cta_tracking;
CREATE POLICY "Public can view Workday demo cta tracking" ON public.cta_tracking
  FOR SELECT
  USING (demo_id = '8cc16f2d-b407-4895-9639-643d1a976da4'::uuid);

-- Add comments for documentation
COMMENT ON POLICY "Public can view Workday demo" ON public.demos
  IS 'Allows public access to the Workday demo for /view route without authentication';
