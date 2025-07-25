-- Enhance demos table with UUID support as recommended by Supabase support
-- This addresses the metadata processing issues

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add upload_id column to demos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'demos' 
        AND column_name = 'upload_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.demos 
        ADD COLUMN upload_id UUID DEFAULT uuid_generate_v4();
        
        -- Add unique constraint
        ALTER TABLE public.demos 
        ADD CONSTRAINT unique_upload_id UNIQUE (upload_id);
    END IF;
END $$;

-- Ensure metadata column is properly configured as JSONB
ALTER TABLE public.demos 
ALTER COLUMN metadata TYPE JSONB 
USING CASE 
    WHEN metadata IS NULL THEN '{}'::jsonb
    WHEN metadata::text = '' THEN '{}'::jsonb
    ELSE metadata::jsonb
END;

-- Set default value for metadata column
ALTER TABLE public.demos 
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demos_upload_id ON public.demos (upload_id);
CREATE INDEX IF NOT EXISTS idx_demos_user_id_created ON public.demos (user_id, created_at DESC);

-- Update the metadata GIN index to be more specific
DROP INDEX IF EXISTS idx_demos_metadata;
CREATE INDEX idx_demos_metadata ON public.demos USING gin (metadata jsonb_path_ops);
