-- Create table for storing product interest discovery data from Tavus objectives
CREATE TABLE IF NOT EXISTS product_interest_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  objective_name TEXT NOT NULL DEFAULT 'product_interest_discovery',
  primary_interest TEXT,
  pain_points TEXT[],
  event_type TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_interest_conversation_id ON product_interest_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_product_interest_received_at ON product_interest_data(received_at);
CREATE INDEX IF NOT EXISTS idx_product_interest_objective ON product_interest_data(objective_name);

-- Add RLS (Row Level Security) if needed
ALTER TABLE product_interest_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on product_interest_data" ON product_interest_data
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE product_interest_data IS 'Stores product interest discovery data captured from Tavus objective completions';
COMMENT ON COLUMN product_interest_data.conversation_id IS 'Tavus conversation ID that generated this data';
COMMENT ON COLUMN product_interest_data.primary_interest IS 'What interests the user most about the product';
COMMENT ON COLUMN product_interest_data.pain_points IS 'Array of pain points mentioned by the user';
COMMENT ON COLUMN product_interest_data.raw_payload IS 'Complete webhook payload for debugging';