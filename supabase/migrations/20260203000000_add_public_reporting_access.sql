-- Add public read access to reporting tables for embeddable demos
-- This allows the public /view/[demoId]/reporting page to display analytics

-- conversation_details: Has demo_id, link directly to embeddable demos
DROP POLICY IF EXISTS "Public can view conversation details for embeddable demos" ON public.conversation_details;
CREATE POLICY "Public can view conversation details for embeddable demos" ON public.conversation_details
  FOR SELECT
  USING (
    demo_id IN (
      SELECT id FROM public.demos WHERE is_embeddable = true
    )
  );

-- qualification_data: Uses conversation_id, link through conversation_details
DROP POLICY IF EXISTS "Public can view qualification data for embeddable demos" ON public.qualification_data;
CREATE POLICY "Public can view qualification data for embeddable demos" ON public.qualification_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id IN (SELECT id FROM public.demos WHERE is_embeddable = true)
    )
  );

-- product_interest_data: Uses conversation_id, link through conversation_details
DROP POLICY IF EXISTS "Public can view product interest data for embeddable demos" ON public.product_interest_data;
CREATE POLICY "Public can view product interest data for embeddable demos" ON public.product_interest_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id IN (SELECT id FROM public.demos WHERE is_embeddable = true)
    )
  );

-- video_showcase_data: Uses conversation_id, link through conversation_details
DROP POLICY IF EXISTS "Public can view video showcase data for embeddable demos" ON public.video_showcase_data;
CREATE POLICY "Public can view video showcase data for embeddable demos" ON public.video_showcase_data
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT tavus_conversation_id FROM public.conversation_details
      WHERE demo_id IN (SELECT id FROM public.demos WHERE is_embeddable = true)
    )
  );

-- cta_tracking: Has demo_id, link directly to embeddable demos
DROP POLICY IF EXISTS "Public can view cta tracking for embeddable demos" ON public.cta_tracking;
CREATE POLICY "Public can view cta tracking for embeddable demos" ON public.cta_tracking
  FOR SELECT
  USING (
    demo_id IN (
      SELECT id FROM public.demos WHERE is_embeddable = true
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Public can view conversation details for embeddable demos" ON public.conversation_details
  IS 'Allows public access to conversation analytics for demos marked as embeddable, used by /view/[demoId]/reporting';
