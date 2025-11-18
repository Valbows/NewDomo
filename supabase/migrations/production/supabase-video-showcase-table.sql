-- Video Showcase Data Table
-- Captures data from demo_video_showcase objective

CREATE TABLE IF NOT EXISTS video_showcase_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  requested_videos TEXT[], -- Array of video titles requested by user
  videos_shown TEXT[], -- Array of video titles actually shown
  objective_name TEXT NOT NULL DEFAULT 'demo_video_showcase',
  event_type TEXT NOT NULL DEFAULT 'conversation.objective.completed',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_payload JSONB, -- Store the full webhook payload for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_showcase_conversation_id ON video_showcase_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_video_showcase_received_at ON video_showcase_data(received_at);
CREATE INDEX IF NOT EXISTS idx_video_showcase_objective_name ON video_showcase_data(objective_name);

-- Enable Row Level Security (RLS)
ALTER TABLE video_showcase_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- (adjust this based on your security requirements)
CREATE POLICY "Allow all operations for authenticated users" ON video_showcase_data
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON video_showcase_data
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE video_showcase_data IS 'Stores video showcase data captured from Tavus demo_video_showcase objective';
COMMENT ON COLUMN video_showcase_data.conversation_id IS 'Tavus conversation ID from webhook';
COMMENT ON COLUMN video_showcase_data.requested_videos IS 'Array of video titles requested by the user';
COMMENT ON COLUMN video_showcase_data.videos_shown IS 'Array of video titles actually shown to the user';
COMMENT ON COLUMN video_showcase_data.objective_name IS 'Name of the Tavus objective (should be demo_video_showcase)';
COMMENT ON COLUMN video_showcase_data.raw_payload IS 'Full webhook payload for debugging and future analysis';