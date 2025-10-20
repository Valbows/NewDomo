-- Create table for storing qualification data from Tavus objectives
CREATE TABLE IF NOT EXISTS qualification_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  position TEXT,
  objective_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qualification_conversation_id ON qualification_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_qualification_email ON qualification_data(email);
CREATE INDEX IF NOT EXISTS idx_qualification_received_at ON qualification_data(received_at);

-- Add RLS (Row Level Security) if needed
ALTER TABLE qualification_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on qualification_data" ON qualification_data
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE qualification_data IS 'Stores qualification data captured from Tavus objective completions';
COMMENT ON COLUMN qualification_data.conversation_id IS 'Tavus conversation ID that generated this data';
COMMENT ON COLUMN qualification_data.raw_payload IS 'Complete webhook payload for debugging';