-- Fix video_showcase_data table schema to include demo_id for consistency
-- This will make video tracking work properly

-- Add demo_id column to video_showcase_data table
ALTER TABLE video_showcase_data 
ADD COLUMN IF NOT EXISTS demo_id UUID;

-- Add foreign key constraint
ALTER TABLE video_showcase_data 
ADD CONSTRAINT fk_video_showcase_demo_id 
FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE;

-- Update the comment
COMMENT ON COLUMN video_showcase_data.demo_id IS 'Reference to the demo that this video showcase belongs to';

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'video_showcase_data' 
ORDER BY ordinal_position;