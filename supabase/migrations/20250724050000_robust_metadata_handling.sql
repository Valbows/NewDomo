-- Robust metadata handling as recommended by Supabase support team
-- This addresses the persistent JSON parsing issues

-- Ensure robust metadata handling
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modify demos table to support flexible metadata with validation
ALTER TABLE demos 
ALTER COLUMN metadata TYPE jsonb 
USING 
  CASE 
    WHEN metadata IS NULL THEN '{}'::jsonb
    WHEN metadata::text = '' THEN '{}'::jsonb
    ELSE metadata::jsonb 
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

-- Make upload_id NOT NULL and add unique constraint if not exists
ALTER TABLE demos 
ALTER COLUMN upload_id SET NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_upload_id' 
        AND table_name = 'demos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.demos 
        ADD CONSTRAINT unique_upload_id UNIQUE (upload_id);
    END IF;
END $$;

-- Create a comprehensive index on metadata using jsonb_path_ops for better performance
DROP INDEX IF EXISTS idx_demos_metadata;
DROP INDEX IF EXISTS idx_demos_metadata_gin;
CREATE INDEX idx_demos_metadata_gin 
ON demos USING gin (metadata jsonb_path_ops);

-- Add a check constraint to ensure metadata is valid JSON object
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE c.conname = 'valid_metadata' 
        AND t.relname = 'demos'
    ) THEN
        ALTER TABLE demos 
        ADD CONSTRAINT valid_metadata 
        CHECK (jsonb_typeof(metadata) = 'object');
    END IF;
END $$;

-- Create additional performance indexes
CREATE INDEX IF NOT EXISTS idx_demos_upload_id ON demos (upload_id);
CREATE INDEX IF NOT EXISTS idx_demos_user_id_created ON demos (user_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_demos_video_path ON demos (video_storage_path); -- Column name may vary

-- Add a function to validate metadata structure
CREATE OR REPLACE FUNCTION validate_demo_metadata(metadata_input jsonb)
RETURNS boolean AS $$
BEGIN
    -- Check if metadata is an object
    IF jsonb_typeof(metadata_input) != 'object' THEN
        RETURN false;
    END IF;
    
    -- Check for required fields (optional validation)
    IF NOT (metadata_input ? 'uploadId' AND metadata_input ? 'userId') THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate metadata on insert/update
CREATE OR REPLACE FUNCTION check_demo_metadata()
RETURNS trigger AS $$
BEGIN
    IF NOT validate_demo_metadata(NEW.metadata) THEN
        RAISE EXCEPTION 'Invalid metadata structure';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS validate_metadata_trigger ON demos;
CREATE TRIGGER validate_metadata_trigger
    BEFORE INSERT OR UPDATE ON demos
    FOR EACH ROW
    EXECUTE FUNCTION check_demo_metadata();
