-- Add embed support columns to demos table
-- This enables B2B customers to embed their demos on external websites via iFrame

-- Add embeddable flag (defaults to false - must be explicitly enabled)
ALTER TABLE demos ADD COLUMN IF NOT EXISTS is_embeddable BOOLEAN DEFAULT false;

-- Add unique embed token for public access (auto-generated UUID)
ALTER TABLE demos ADD COLUMN IF NOT EXISTS embed_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Add allowed domains for CORS/security (empty array means all domains allowed)
ALTER TABLE demos ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';

-- Create index on embed_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_demos_embed_token ON demos(embed_token) WHERE embed_token IS NOT NULL;

-- RLS policy for public embed access
-- Only allows reading demos that are explicitly marked as embeddable
CREATE POLICY "Public can view embeddable demos via token" ON demos
  FOR SELECT
  USING (is_embeddable = true AND embed_token IS NOT NULL);

-- Comment on columns for documentation
COMMENT ON COLUMN demos.is_embeddable IS 'Whether this demo can be embedded on external websites via iFrame';
COMMENT ON COLUMN demos.embed_token IS 'Unique token used in embed URL for public access without authentication';
COMMENT ON COLUMN demos.allowed_domains IS 'List of domains allowed to embed this demo (empty = all domains allowed)';
