-- Test script to verify DOMO Score infrastructure
-- Run this after applying the migrations to test the system

-- Insert test data for a sample conversation
DO $$
DECLARE
  test_conversation_id TEXT := 'test_conv_123';
  test_demo_id UUID;
BEGIN
  -- Get a demo ID (or create a test one)
  SELECT id INTO test_demo_id FROM public.demos LIMIT 1;
  
  IF test_demo_id IS NULL THEN
    RAISE NOTICE 'No demos found. Create a demo first to test DOMO score.';
    RETURN;
  END IF;

  -- Insert test qualification data (1 point)
  INSERT INTO public.qualification_data (
    conversation_id, first_name, last_name, email, objective_name, event_type
  ) VALUES (
    test_conversation_id, 'John', 'Doe', 'john@example.com', 'qualification', 'completed'
  ) ON CONFLICT DO NOTHING;

  -- Insert test product interest data (1 point)
  INSERT INTO public.product_interest_data (
    conversation_id, primary_interest, pain_points, event_type
  ) VALUES (
    test_conversation_id, 'AI automation', ARRAY['manual processes', 'time consuming'], 'completed'
  ) ON CONFLICT DO NOTHING;

  -- Insert test video showcase data (1 point)
  INSERT INTO public.video_showcase_data (
    conversation_id, requested_videos, videos_shown
  ) VALUES (
    test_conversation_id, ARRAY['Product Demo', 'Features Overview'], ARRAY['Product Demo']
  ) ON CONFLICT DO NOTHING;

  -- Insert test CTA tracking data (1 point)
  INSERT INTO public.cta_tracking (
    conversation_id, demo_id, cta_shown_at, cta_clicked_at, cta_url
  ) VALUES (
    test_conversation_id, test_demo_id, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '2 minutes', 'https://example.com/signup'
  ) ON CONFLICT DO NOTHING;

  -- Insert test conversation details with perception analysis (1 point)
  INSERT INTO public.conversation_details (
    demo_id, tavus_conversation_id, conversation_name, perception_analysis, status
  ) VALUES (
    test_demo_id, test_conversation_id, 'Test Conversation', 
    '{"analysis": "User appeared engaged and attentive throughout the conversation"}', 'completed'
  ) ON CONFLICT (tavus_conversation_id) DO NOTHING;

  RAISE NOTICE 'Test data inserted for conversation: %', test_conversation_id;
  RAISE NOTICE 'This conversation should score 5/5 points in DOMO Score';
END $$;

-- Query to verify the test data
SELECT 
  'qualification_data' as table_name,
  COUNT(*) as records,
  STRING_AGG(conversation_id, ', ') as conversation_ids
FROM public.qualification_data 
WHERE conversation_id LIKE 'test_conv_%'

UNION ALL

SELECT 
  'product_interest_data' as table_name,
  COUNT(*) as records,
  STRING_AGG(conversation_id, ', ') as conversation_ids
FROM public.product_interest_data 
WHERE conversation_id LIKE 'test_conv_%'

UNION ALL

SELECT 
  'video_showcase_data' as table_name,
  COUNT(*) as records,
  STRING_AGG(conversation_id, ', ') as conversation_ids
FROM public.video_showcase_data 
WHERE conversation_id LIKE 'test_conv_%'

UNION ALL

SELECT 
  'cta_tracking' as table_name,
  COUNT(*) as records,
  STRING_AGG(conversation_id, ', ') as conversation_ids
FROM public.cta_tracking 
WHERE conversation_id LIKE 'test_conv_%'

UNION ALL

SELECT 
  'conversation_details' as table_name,
  COUNT(*) as records,
  STRING_AGG(tavus_conversation_id, ', ') as conversation_ids
FROM public.conversation_details 
WHERE tavus_conversation_id LIKE 'test_conv_%';