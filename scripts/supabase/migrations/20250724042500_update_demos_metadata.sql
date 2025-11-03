-- Update demos table to properly handle JSONB metadata
-- This addresses the "invalid input syntax for type json" error

-- First, ensure the demos table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.demos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    video_storage_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If the table already exists, alter the metadata column to ensure it's JSONB
DO $$ 
BEGIN
    -- Check if metadata column exists and alter it to JSONB if needed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'demos' 
        AND column_name = 'metadata'
        AND table_schema = 'public'
    ) THEN
        -- Alter existing metadata column to JSONB
        ALTER TABLE public.demos 
        ALTER COLUMN metadata TYPE JSONB 
        USING CASE 
            WHEN metadata IS NULL THEN '{}'::jsonb
            WHEN metadata::text = '' THEN '{}'::jsonb
            ELSE metadata::jsonb
        END;
    ELSE
        -- Add metadata column if it doesn't exist
        ALTER TABLE public.demos 
        ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create an index on the metadata column for better performance
CREATE INDEX IF NOT EXISTS idx_demos_metadata ON public.demos USING gin (metadata);

-- Enable Row Level Security
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for demos table (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own demos" ON public.demos;
DROP POLICY IF EXISTS "Users can insert their own demos" ON public.demos;
DROP POLICY IF EXISTS "Users can update their own demos" ON public.demos;
DROP POLICY IF EXISTS "Users can delete their own demos" ON public.demos;

CREATE POLICY "Users can view their own demos" ON public.demos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demos" ON public.demos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demos" ON public.demos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own demos" ON public.demos
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_demos_updated_at ON public.demos;
CREATE TRIGGER handle_demos_updated_at
    BEFORE UPDATE ON public.demos
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
