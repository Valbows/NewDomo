-- Remove requested_videos column from video_showcase_data table
-- We only need videos_shown for DOMO score calculation

-- Drop the requested_videos column
ALTER TABLE video_showcase_data DROP COLUMN IF EXISTS requested_videos;

-- Update the comment for the table
COMMENT ON TABLE video_showcase_data IS 'Stores video showcase data captured from Tavus demo_video_showcase objective - tracks videos actually shown to users';

-- Update the comment for videos_shown column
COMMENT ON COLUMN video_showcase_data.videos_shown IS 'Array of video titles actually shown/fetched by the user during the demo';