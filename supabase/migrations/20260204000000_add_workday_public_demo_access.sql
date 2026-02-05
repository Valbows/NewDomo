-- Add public read access for the Workday demo (cbb04ff3-07e7-46bf-bfc3-db47ceaf85de)
-- This allows the public /view route to access demo data without authentication

-- The specific Workday demo ID that should be publicly accessible
-- This is hardcoded for security - only this demo can be viewed without login

-- demos table: Allow public read for Workday demo
DROP POLICY IF EXISTS "Public can view Workday demo" ON public.demos;
CREATE POLICY "Public can view Workday demo" ON public.demos
  FOR SELECT
  USING (id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid);

-- demo_videos table: Allow public read for Workday demo videos
DROP POLICY IF EXISTS "Public can view Workday demo videos" ON public.demo_videos;
CREATE POLICY "Public can view Workday demo videos" ON public.demo_videos
  FOR SELECT
  USING (demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid);

-- knowledge_chunks table: Allow public read for Workday demo knowledge
DROP POLICY IF EXISTS "Public can view Workday demo knowledge" ON public.knowledge_chunks;
CREATE POLICY "Public can view Workday demo knowledge" ON public.knowledge_chunks
  FOR SELECT
  USING (demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid);

-- conversation_details table: Allow public read for Workday demo conversations
DROP POLICY IF EXISTS "Public can view Workday demo conversations" ON public.conversation_details;
CREATE POLICY "Public can view Workday demo conversations" ON public.conversation_details
  FOR SELECT
  USING (demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid);

-- qualification_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo qualification data" ON public.qualification_data;
CREATE POLICY "Public can view Workday demo qualification data" ON public.qualification_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid
    )
  );

-- product_interest_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo product interest" ON public.product_interest_data;
CREATE POLICY "Public can view Workday demo product interest" ON public.product_interest_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid
    )
  );

-- video_showcase_data table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo video showcase" ON public.video_showcase_data;
CREATE POLICY "Public can view Workday demo video showcase" ON public.video_showcase_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid
    )
  );

-- cta_tracking table: Allow public read for Workday demo data
DROP POLICY IF EXISTS "Public can view Workday demo cta tracking" ON public.cta_tracking;
CREATE POLICY "Public can view Workday demo cta tracking" ON public.cta_tracking
  FOR SELECT
  USING (demo_id = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de'::uuid);

-- Add comments for documentation
COMMENT ON POLICY "Public can view Workday demo" ON public.demos
  IS 'Allows public access to the Workday demo for /view route without authentication';
