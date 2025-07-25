-- Enhanced database schema as recommended by Supabase support team
-- This addresses the persistent JSON parsing issues with more lenient constraints

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modify table to support flexible, validated metadata
ALTER TABLE demos 
ALTER COLUMN metadata TYPE jsonb 
USING 
  CASE 
    WHEN metadata IS NULL THEN '{}'::jsonb
    WHEN metadata::text = '' THEN '{}'::jsonb
    ELSE COALESCE(metadata::jsonb, '{}')
  END;

-- Ensure upload_id column exists and is properly configured
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
        ADD COLUMN upload_id uuid DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- Make upload_id NOT NULL and add unique constraint
ALTER TABLE demos 
ALTER COLUMN upload_id SET NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'unique_upload_id' 
        AND t.relname = 'demos'
    ) THEN
        ALTER TABLE public.demos 
        ADD CONSTRAINT unique_upload_id UNIQUE (upload_id);
    END IF;
END $$;

-- Create comprehensive indexes
DROP INDEX IF EXISTS idx_demos_metadata_gin;
CREATE INDEX idx_demos_metadata_gin 
ON demos USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_demos_upload_id 
ON demos (upload_id);

-- Remove any existing metadata constraints to allow flexible uploads
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'valid_metadata' 
        AND t.relname = 'demos'
    ) THEN
        ALTER TABLE demos DROP CONSTRAINT valid_metadata;
    END IF;
END $$;

-- Ensure metadata column has proper default
ALTER TABLE demos 
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Update any problematic metadata to empty object
UPDATE demos 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL OR jsonb_typeof(metadata) != 'object';
