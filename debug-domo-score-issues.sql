-- Debug DOMO Score Issues
-- Run these queries to check the current state of data for conversation c208cca5ecf2743a

-- 1. Check if CTA tracking data exists
SELECT 
  id,
  conversation_id,
  demo_id,
  cta_shown_at,
  cta_clicked_at,
  cta_url,
  created_at,
  updated_at
FROM cta_tracking 
WHERE conversation_id = 'c208cca5ecf2743a'
ORDER BY created_at DESC;

-- 2. Check if video showcase data exists
SELECT 
  id,
  conversation_id,
  videos_shown,
  objective_name,
  received_at
FROM video_showcase_data 
WHERE conversation_id = 'c208cca5ecf2743a'
ORDER BY received_at DESC;

-- 3. Check conversation details
SELECT 
  id,
  tavus_conversation_id,
  conversation_name,
  status,
  created_at,
  completed_at
FROM conversation_details 
WHERE tavus_conversation_id = 'c208cca5ecf2743a'
ORDER BY created_at DESC;

-- 4. Check qualification data (contact info)
SELECT 
  id,
  conversation_id,
  first_name,
  last_name,
  email,
  position,
  received_at
FROM qualification_data 
WHERE conversation_id = 'c208cca5ecf2743a'
ORDER BY received_at DESC;

-- 5. Check product interest data
SELECT 
  id,
  conversation_id,
  primary_interest,
  pain_points,
  received_at
FROM product_interest_data 
WHERE conversation_id = 'c208cca5ecf2743a'
ORDER BY received_at DESC;

-- 6. Check all tables for any data with this conversation ID
SELECT 'cta_tracking' as table_name, COUNT(*) as count FROM cta_tracking WHERE conversation_id = 'c208cca5ecf2743a'
UNION ALL
SELECT 'video_showcase_data' as table_name, COUNT(*) as count FROM video_showcase_data WHERE conversation_id = 'c208cca5ecf2743a'
UNION ALL
SELECT 'qualification_data' as table_name, COUNT(*) as count FROM qualification_data WHERE conversation_id = 'c208cca5ecf2743a'
UNION ALL
SELECT 'product_interest_data' as table_name, COUNT(*) as count FROM product_interest_data WHERE conversation_id = 'c208cca5ecf2743a'
UNION ALL
SELECT 'conversation_details' as table_name, COUNT(*) as count FROM conversation_details WHERE tavus_conversation_id = 'c208cca5ecf2743a';