# Manual CTA Tracking Table Setup

Since the automated table creation didn't work, please run the following SQL manually in your Supabase SQL Editor:

## 1. Create the CTA Tracking Table

```sql
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
```

## 2. Create Indexes

```sql
-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cta_tracking_conversation_id ON cta_tracking(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_demo_id ON cta_tracking(demo_id);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_shown_at ON cta_tracking(cta_shown_at);
CREATE INDEX IF NOT EXISTS idx_cta_tracking_cta_clicked_at ON cta_tracking(cta_clicked_at);
```

## 3. Add Foreign Key Constraint

```sql
-- Add foreign key constraint to demos table
ALTER TABLE cta_tracking
ADD CONSTRAINT fk_cta_tracking_demo_id
FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE;
```

## 4. Enable Row Level Security

```sql
-- Add RLS (Row Level Security)
ALTER TABLE cta_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on cta_tracking" ON cta_tracking
  FOR ALL USING (true);
```

## 5. Add Comments

```sql
-- Add comments for documentation
COMMENT ON TABLE cta_tracking IS 'Tracks when CTAs are shown and clicked during demo conversations';
COMMENT ON COLUMN cta_tracking.conversation_id IS 'Tavus conversation ID where the CTA was shown/clicked';
COMMENT ON COLUMN cta_tracking.demo_id IS 'Demo ID associated with the conversation';
COMMENT ON COLUMN cta_tracking.cta_shown_at IS 'Timestamp when the CTA was first shown to the user';
COMMENT ON COLUMN cta_tracking.cta_clicked_at IS 'Timestamp when the user clicked the CTA button';
COMMENT ON COLUMN cta_tracking.cta_url IS 'The URL the user was redirected to when clicking the CTA';
```

## How to Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Copy and paste the SQL above
6. Run each section one by one

## Verification

After running the SQL, you can verify the table was created by running:

```sql
SELECT * FROM cta_tracking LIMIT 1;
```

This should return an empty result set (no error) if the table was created successfully.
