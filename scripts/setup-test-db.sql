-- Test Database Setup Script
-- Run this in your test Supabase project to create the necessary tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demos table
CREATE TABLE IF NOT EXISTS demos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  tavus_conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_details table
CREATE TABLE IF NOT EXISTS conversation_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  demo_id UUID REFERENCES demos(id) ON DELETE CASCADE,
  tavus_conversation_id TEXT NOT NULL,
  conversation_name TEXT,
  transcript JSONB,
  perception_analysis TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qualification_data table (contact info)
CREATE TABLE IF NOT EXISTS qualification_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  position TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_interest_data table
CREATE TABLE IF NOT EXISTS product_interest_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  primary_interest TEXT,
  pain_points TEXT[],
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_showcase_data table
CREATE TABLE IF NOT EXISTS video_showcase_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  videos_shown TEXT[],
  objective_name TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cta_tracking table
CREATE TABLE IF NOT EXISTS cta_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  demo_id UUID REFERENCES demos(id) ON DELETE CASCADE,
  cta_shown_at TIMESTAMP WITH TIME ZONE,
  cta_clicked_at TIMESTAMP WITH TIME ZONE,
  cta_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data for demos
INSERT INTO demos (id, name, tavus_conversation_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Demo', 'test-conversation-id')
ON CONFLICT (id) DO NOTHING;

-- Insert test conversation details
INSERT INTO conversation_details (
  id, demo_id, tavus_conversation_id, conversation_name, 
  transcript, perception_analysis, started_at, completed_at, 
  duration_seconds, status
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'conv-1',
    'Test Conversation 1',
    '[{"speaker": "user", "text": "Hello", "timestamp": 1000}, {"speaker": "replica", "text": "Hi there!", "timestamp": 2000}]'::jsonb,
    'User appears engaged and attentive',
    '2024-01-01T10:00:00Z',
    '2024-01-01T10:05:00Z',
    300,
    'completed'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'conv-2',
    'Test Conversation 2',
    NULL,
    NULL,
    '2024-01-01T11:00:00Z',
    NULL,
    NULL,
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test contact info
INSERT INTO qualification_data (conversation_id, first_name, last_name, email, position) VALUES 
  ('conv-1', 'John', 'Doe', 'john@example.com', 'Developer')
ON CONFLICT DO NOTHING;

-- Insert test product interest
INSERT INTO product_interest_data (conversation_id, primary_interest, pain_points) VALUES 
  ('conv-1', 'Workforce Planning', ARRAY['Manual processes', 'Data silos'])
ON CONFLICT DO NOTHING;

-- Insert test video showcase
INSERT INTO video_showcase_data (conversation_id, videos_shown, objective_name) VALUES 
  ('conv-1', ARRAY['Video 1', 'Video 2'], 'video_showcase')
ON CONFLICT DO NOTHING;

-- Insert test CTA tracking
INSERT INTO cta_tracking (conversation_id, demo_id, cta_shown_at, cta_clicked_at, cta_url) VALUES 
  ('conv-1', '550e8400-e29b-41d4-a716-446655440000', '2024-01-01T10:04:00Z', '2024-01-01T10:04:30Z', 'https://example.com')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_details_demo_id ON conversation_details(demo_id);
CREATE INDEX IF NOT EXISTS idx_conversation_details_tavus_id ON conversation_details(tavus_conversation_id);
CREATE INDEX IF NOT EXISTS idx_qualification_data_conversation_id ON qualification_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_product_interest_conversation_id ON product_interest_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_video_showcase_conversation_id ON video_showcase_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_conversation_id ON cta_tracking(conversation_id);

-- Set up Row Level Security (RLS) - Optional but recommended
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interest_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_showcase_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for testing (allow all operations for now)
CREATE POLICY IF NOT EXISTS "Allow all operations on demos for testing" ON demos FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on conversation_details for testing" ON conversation_details FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on qualification_data for testing" ON qualification_data FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on product_interest_data for testing" ON product_interest_data FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on video_showcase_data for testing" ON video_showcase_data FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all operations on cta_tracking for testing" ON cta_tracking FOR ALL USING (true);