-- Add metadata column to demo_videos for storing Twelve Labs data
ALTER TABLE demo_videos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for querying by metadata
CREATE INDEX IF NOT EXISTS idx_demo_videos_metadata ON demo_videos USING GIN (metadata);
