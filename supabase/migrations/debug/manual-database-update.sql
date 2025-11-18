-- Manual Database Update for DOMO Score Changes
-- Run these commands in your Supabase SQL editor

-- 1. Remove the requested_videos column from video_showcase_data table
ALTER TABLE video_showcase_data DROP COLUMN IF EXISTS requested_videos;

-- 2. Update the table comment
COMMENT ON TABLE video_showcase_data IS 'Stores video showcase data captured from Tavus demo_video_showcase objective - tracks videos actually shown to users';

-- 3. Update the videos_shown column comment
COMMENT ON COLUMN video_showcase_data.videos_shown IS 'Array of video titles actually shown/fetched by the user during the demo';

-- 4. Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'video_showcase_data' 
ORDER BY ordinal_position;

-- 5. Check existing data (should only show videos_shown now)
SELECT id, conversation_id, videos_shown, objective_name, received_at 
FROM video_showcase_data 
LIMIT 5;