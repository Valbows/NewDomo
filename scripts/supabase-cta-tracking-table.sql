-- Create table for tracking CTA (Call-to-Action) executions
CREATE TABLE IF NOT EXISTS cta_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  demo_id UUID NOT NULL,
  cta_shown_at TIMESTAMP WITH TIME ZONE,
  cta_clicked_at TIMESTAMP WITH TIME ZONE,
  cta_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cta_tracking_conversation_id ON cta_tracking(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_demo_id ON cta_tracking(demo_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_shown_at ON cta_tracking(cta_shown_at);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_clicked_at ON cta_tracking(cta_clicked_at);

-- Add foreign key constraint to demos table
ALTER TABLE cta_tracking 
ADD CONSTRAINT fk_cta_tracking_demo_id 
FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE;

-- Add RLS (Row Level Security)
ALTER TABLE cta_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on cta_tracking" ON cta_tracking
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE cta_tracking IS 'Tracks when CTAs are shown and clicked during demo conversations';
COMMENT ON COLUMN cta_tracking.conversation_id IS 'Tavus conversation ID where the CTA was shown/clicked';
COMMENT ON COLUMN cta_tracking.demo_id IS 'Demo ID associated with the conversation';
COMMENT ON COLUMN cta_tracking.cta_shown_at IS 'Timestamp when the CTA was first shown to the user';
COMMENT ON COLUMN cta_tracking.cta_clicked_at IS 'Timestamp when the user clicked the CTA button';
COMMENT ON COLUMN cta_tracking.cta_url IS 'The URL the user was redirected to when clicking the CTA';