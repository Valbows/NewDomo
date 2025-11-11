-- Ensure all DOMO Score infrastructure is properly set up
-- This migration is idempotent and can be run multiple times safely

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure all required tables exist with proper structure
-- (These should already exist from previous migrations, but this ensures consistency)

-- 1. Qualification Data Table
CREATE TABLE IF NOT EXISTS public.qualification_data (
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

-- 2. Product Interest Data Table  
CREATE TABLE IF NOT EXISTS public.product_interest_data (
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

-- 3. Video Showcase Data Table
CREATE TABLE IF NOT EXISTS public.video_showcase_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  requested_videos TEXT[],
  videos_shown TEXT[],
  objective_name TEXT NOT NULL DEFAULT 'demo_video_showcase',
  event_type TEXT NOT NULL DEFAULT 'conversation.objective.completed',
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CTA Tracking Table
CREATE TABLE IF NOT EXISTS public.cta_tracking (
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

-- Add foreign key constraint for cta_tracking if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cta_tracking_demo_id'
  ) THEN
    ALTER TABLE public.cta_tracking 
    ADD CONSTRAINT fk_cta_tracking_demo_id 
    FOREIGN KEY (demo_id) REFERENCES public.demos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_qualification_conversation_id ON public.qualification_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_qualification_email ON public.qualification_data(email);
CREATE INDEX IF NOT EXISTS idx_qualification_received_at ON public.qualification_data(received_at);

CREATE INDEX IF NOT EXISTS idx_product_interest_conversation_id ON public.product_interest_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_product_interest_received_at ON public.product_interest_data(received_at);
CREATE INDEX IF NOT EXISTS idx_product_interest_objective ON public.product_interest_data(objective_name);

CREATE INDEX IF NOT EXISTS idx_video_showcase_conversation_id ON public.video_showcase_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_video_showcase_received_at ON public.video_showcase_data(received_at);
CREATE INDEX IF NOT EXISTS idx_video_showcase_objective_name ON public.video_showcase_data(objective_name);

CREATE INDEX IF NOT EXISTS idx_cta_tracking_conversation_id ON public.cta_tracking(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_demo_id ON public.cta_tracking(demo_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_shown_at ON public.cta_tracking(cta_shown_at);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_clicked_at ON public.cta_tracking(cta_clicked_at);

-- Enable RLS on all tables
ALTER TABLE public.qualification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interest_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_showcase_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- Qualification Data Policies
DROP POLICY IF EXISTS "Allow all operations on qualification_data" ON public.qualification_data;
CREATE POLICY "Allow all operations on qualification_data" ON public.qualification_data
  FOR ALL USING (true);

-- Product Interest Data Policies  
DROP POLICY IF EXISTS "Allow all operations on product_interest_data" ON public.product_interest_data;
CREATE POLICY "Allow all operations on product_interest_data" ON public.product_interest_data
  FOR ALL USING (true);

-- Video Showcase Data Policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.video_showcase_data;
CREATE POLICY "Allow all operations for authenticated users" ON public.video_showcase_data
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for service role" ON public.video_showcase_data;
CREATE POLICY "Allow all operations for service role" ON public.video_showcase_data
  FOR ALL USING (auth.role() = 'service_role');

-- CTA Tracking Policies
DROP POLICY IF EXISTS "Allow all operations on cta_tracking" ON public.cta_tracking;
CREATE POLICY "Allow all operations on cta_tracking" ON public.cta_tracking
  FOR ALL USING (true);

-- Add updated_at triggers for all tables
DROP TRIGGER IF EXISTS handle_updated_at_qualification_data ON public.qualification_data;
CREATE TRIGGER handle_updated_at_qualification_data
  BEFORE UPDATE ON public.qualification_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_product_interest_data ON public.product_interest_data;
CREATE TRIGGER handle_updated_at_product_interest_data
  BEFORE UPDATE ON public.product_interest_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_video_showcase_data ON public.video_showcase_data;
CREATE TRIGGER handle_updated_at_video_showcase_data
  BEFORE UPDATE ON public.video_showcase_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_cta_tracking ON public.cta_tracking;
CREATE TRIGGER handle_updated_at_cta_tracking
  BEFORE UPDATE ON public.cta_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add table comments for documentation
COMMENT ON TABLE public.qualification_data IS 'Stores qualification data captured from Tavus objective completions';
COMMENT ON TABLE public.product_interest_data IS 'Stores product interest discovery data captured from Tavus objective completions';
COMMENT ON TABLE public.video_showcase_data IS 'Stores video showcase data captured from Tavus demo_video_showcase objective';
COMMENT ON TABLE public.cta_tracking IS 'Tracks when CTAs are shown and clicked during demo conversations';

-- Add column comments
COMMENT ON COLUMN public.qualification_data.conversation_id IS 'Tavus conversation ID that generated this data';
COMMENT ON COLUMN public.qualification_data.raw_payload IS 'Complete webhook payload for debugging';

COMMENT ON COLUMN public.product_interest_data.conversation_id IS 'Tavus conversation ID that generated this data';
COMMENT ON COLUMN public.product_interest_data.primary_interest IS 'What interests the user most about the product';
COMMENT ON COLUMN public.product_interest_data.pain_points IS 'Array of pain points mentioned by the user';
COMMENT ON COLUMN public.product_interest_data.raw_payload IS 'Complete webhook payload for debugging';

COMMENT ON COLUMN public.video_showcase_data.conversation_id IS 'Tavus conversation ID from webhook';
COMMENT ON COLUMN public.video_showcase_data.requested_videos IS 'Array of video titles requested by the user';
COMMENT ON COLUMN public.video_showcase_data.videos_shown IS 'Array of video titles actually shown to the user';
COMMENT ON COLUMN public.video_showcase_data.objective_name IS 'Name of the Tavus objective (should be demo_video_showcase)';
COMMENT ON COLUMN public.video_showcase_data.raw_payload IS 'Full webhook payload for debugging and future analysis';

COMMENT ON COLUMN public.cta_tracking.conversation_id IS 'Tavus conversation ID where the CTA was shown/clicked';
COMMENT ON COLUMN public.cta_tracking.demo_id IS 'Demo ID associated with the conversation';
COMMENT ON COLUMN public.cta_tracking.cta_shown_at IS 'Timestamp when the CTA was first shown to the user';
COMMENT ON COLUMN public.cta_tracking.cta_clicked_at IS 'Timestamp when the user clicked the CTA button';
COMMENT ON COLUMN public.cta_tracking.cta_url IS 'The URL the user was redirected to when clicking the CTA';