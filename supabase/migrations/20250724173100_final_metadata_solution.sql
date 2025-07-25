-- Final comprehensive metadata handling solution as recommended by Supabase support
-- This addresses the persistent JSON parsing issues with strict validation

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhance demos table for robust metadata handling
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

-- Create comprehensive indexes for performance
DROP INDEX IF EXISTS idx_demos_metadata_gin;
CREATE INDEX idx_demos_metadata_gin 
ON demos USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_demos_upload_id 
ON demos (upload_id);

-- Ensure metadata column has proper default and is JSONB
ALTER TABLE demos 
ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Update any NULL metadata to empty object
UPDATE demos 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL OR jsonb_typeof(metadata) != 'object';

-- Create a function to validate and sanitize metadata
CREATE OR REPLACE FUNCTION validate_and_sanitize_metadata(metadata_input jsonb)
RETURNS jsonb AS $$
DECLARE
    sanitized_metadata jsonb;
BEGIN
    -- Check if metadata is an object
    IF jsonb_typeof(metadata_input) != 'object' THEN
        RAISE EXCEPTION 'Metadata must be a JSON object';
    END IF;
    
    -- Check for required fields
    IF NOT (
        metadata_input ? 'uploadId' AND 
        metadata_input ? 'userId' AND 
        metadata_input ? 'fileName' AND 
        metadata_input ? 'fileType' AND 
        metadata_input ? 'fileSize' AND 
        metadata_input ? 'uploadTimestamp'
    ) THEN
        RAISE EXCEPTION 'Missing required metadata fields';
    END IF;
    
    -- Return sanitized metadata
    SELECT jsonb_build_object(
        'uploadId', metadata_input->>'uploadId',
        'userId', metadata_input->>'userId',
        'demoName', COALESCE(metadata_input->>'demoName', 'N/A'),
        'fileName', metadata_input->>'fileName',
        'fileType', metadata_input->>'fileType',
        'fileSize', metadata_input->>'fileSize',
        'uploadTimestamp', metadata_input->>'uploadTimestamp'
    ) INTO sanitized_metadata;
    
    RETURN sanitized_metadata;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate and sanitize metadata on insert/update
CREATE OR REPLACE FUNCTION sanitize_demo_metadata()
RETURNS trigger AS $$
BEGIN
    -- Validate and sanitize metadata
    NEW.metadata := validate_and_sanitize_metadata(NEW.metadata);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS sanitize_metadata_trigger ON demos;
CREATE TRIGGER sanitize_metadata_trigger
    BEFORE INSERT OR UPDATE ON demos
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_demo_metadata();
