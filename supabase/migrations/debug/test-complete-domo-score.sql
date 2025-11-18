-- Test Complete Domo Score Capture
-- This script will help us test if all 5 score components can be captured

-- 1. Find available demos
SELECT 
  id,
  name,
  status,
  tavus_conversation_id,
  created_at
FROM demos 
WHERE status = 'published' OR status = 'draft'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if we have any existing conversation data to analyze
SELECT 
  cd.tavus_conversation_id,
  cd.conversation_name,
  cd.status,
  cd.completed_at,
  -- Check each score component
  CASE WHEN qd.id IS NOT NULL THEN 1 ELSE 0 END as has_contact_info,
  CASE WHEN pid.id IS NOT NULL THEN 1 ELSE 0 END as has_product_interest,
  CASE WHEN vsd.id IS NOT NULL AND array_length(vsd.videos_shown, 1) > 0 THEN 1 ELSE 0 END as has_video_data,
  CASE WHEN ct.cta_clicked_at IS NOT NULL THEN 1 ELSE 0 END as has_cta_click,
  CASE WHEN cd.perception_analysis IS NOT NULL THEN 1 ELSE 0 END as has_perception_analysis,
  -- Calculate total score
  (CASE WHEN qd.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN pid.id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN vsd.id IS NOT NULL AND array_length(vsd.videos_shown, 1) > 0 THEN 1 ELSE 0 END +
   CASE WHEN ct.cta_clicked_at IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN cd.perception_analysis IS NOT NULL THEN 1 ELSE 0 END) as total_score
FROM conversation_details cd
LEFT JOIN qualification_data qd ON cd.tavus_conversation_id = qd.conversation_id
LEFT JOIN product_interest_data pid ON cd.tavus_conversation_id = pid.conversation_id
LEFT JOIN video_showcase_data vsd ON cd.tavus_conversation_id = vsd.conversation_id
LEFT JOIN cta_tracking ct ON cd.tavus_conversation_id = ct.conversation_id
WHERE cd.created_at > NOW() - INTERVAL '7 days'
ORDER BY cd.created_at DESC
LIMIT 10;

-- 3. Create a test conversation record to simulate a complete flow
-- (This would normally be created by the actual conversation)
INSERT INTO conversation_details (
  tavus_conversation_id,
  conversation_name,
  status,
  created_at,
  completed_at,
  duration_seconds,
  perception_analysis
) VALUES (
  'test-complete-score-' || extract(epoch from now())::text,
  'Test Complete Domo Score Conversation',
  'completed',
  NOW(),
  NOW() + INTERVAL '5 minutes',
  300,
  '{"overall_score": 0.85, "engagement_score": 0.9, "sentiment_score": 0.8, "interest_level": "high", "key_insights": ["User appeared engaged", "Maintained eye contact", "Positive facial expressions"]}'::jsonb
) RETURNING tavus_conversation_id;

-- Note: After running the above, use the returned conversation_id for the following inserts
-- Replace 'YOUR_TEST_CONVERSATION_ID' with the actual ID from the previous query

-- 4. Insert test data for all 5 score components
-- (Replace YOUR_TEST_CONVERSATION_ID with the actual ID from step 3)

-- Contact Information (1 point)
-- INSERT INTO qualification_data (
--   conversation_id,
--   first_name,
--   last_name,
--   email,
--   position,
--   received_at
-- ) VALUES (
--   'YOUR_TEST_CONVERSATION_ID',
--   'Test',
--   'User',
--   'test@example.com',
--   'Software Engineer',
--   NOW()
-- );

-- Product Interest (1 point)
-- INSERT INTO product_interest_data (
--   conversation_id,
--   primary_interest,
--   pain_points,
--   received_at
-- ) VALUES (
--   'YOUR_TEST_CONVERSATION_ID',
--   'improving organization and efficiency',
--   ARRAY['difficulty staying organized', 'need better planning tools'],
--   NOW()
-- );

-- Video Showcase (1 point)
-- INSERT INTO video_showcase_data (
--   conversation_id,
--   videos_shown,
--   objective_name,
--   received_at
-- ) VALUES (
--   'YOUR_TEST_CONVERSATION_ID',
--   ARRAY['Workforce Planning: Planning and Executing in a Single System'],
--   'video_showcase',
--   NOW()
-- );

-- CTA Tracking (1 point)
-- INSERT INTO cta_tracking (
--   conversation_id,
--   demo_id,
--   cta_shown_at,
--   cta_clicked_at,
--   cta_url
-- ) VALUES (
--   'YOUR_TEST_CONVERSATION_ID',
--   (SELECT id FROM demos LIMIT 1),
--   NOW(),
--   NOW() + INTERVAL '1 minute',
--   'https://forms.workday.com/en-us/sales/adaptive-planning-free-trial/form.html'
-- );

-- 5. Verify the complete score calculation
-- (Replace YOUR_TEST_CONVERSATION_ID with the actual ID)
-- SELECT 
--   cd.tavus_conversation_id,
--   cd.conversation_name,
--   -- Individual components
--   CASE WHEN qd.id IS NOT NULL THEN '✅' ELSE '❌' END || ' Contact Info' as contact_confirmation,
--   CASE WHEN pid.id IS NOT NULL THEN '✅' ELSE '❌' END || ' Product Interest' as reason_for_visit,
--   CASE WHEN vsd.id IS NOT NULL AND array_length(vsd.videos_shown, 1) > 0 THEN '✅' ELSE '❌' END || ' Video Showcase' as platform_feature_interest,
--   CASE WHEN ct.cta_clicked_at IS NOT NULL THEN '✅' ELSE '❌' END || ' CTA Execution' as cta_execution,
--   CASE WHEN cd.perception_analysis IS NOT NULL THEN '✅' ELSE '❌' END || ' Visual Analysis' as perception_analysis,
--   -- Total score
--   (CASE WHEN qd.id IS NOT NULL THEN 1 ELSE 0 END +
--    CASE WHEN pid.id IS NOT NULL THEN 1 ELSE 0 END +
--    CASE WHEN vsd.id IS NOT NULL AND array_length(vsd.videos_shown, 1) > 0 THEN 1 ELSE 0 END +
--    CASE WHEN ct.cta_clicked_at IS NOT NULL THEN 1 ELSE 0 END +
--    CASE WHEN cd.perception_analysis IS NOT NULL THEN 1 ELSE 0 END) || '/5' as total_domo_score
-- FROM conversation_details cd
-- LEFT JOIN qualification_data qd ON cd.tavus_conversation_id = qd.conversation_id
-- LEFT JOIN product_interest_data pid ON cd.tavus_conversation_id = pid.conversation_id
-- LEFT JOIN video_showcase_data vsd ON cd.tavus_conversation_id = vsd.conversation_id
-- LEFT JOIN cta_tracking ct ON cd.tavus_conversation_id = ct.conversation_id
-- WHERE cd.tavus_conversation_id = 'YOUR_TEST_CONVERSATION_ID';