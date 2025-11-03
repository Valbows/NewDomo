-- Add missing chunk_type column to knowledge_chunks table
-- This column is required by the application to categorize different types of knowledge chunks

-- Add the chunk_type column with the expected enum values
ALTER TABLE public.knowledge_chunks 
ADD COLUMN chunk_type TEXT NOT NULL DEFAULT 'document' 
CHECK (chunk_type IN ('transcript', 'qa', 'document'));

-- Update existing records to have appropriate chunk_type values
-- Records with both question and answer are likely Q&A pairs
UPDATE public.knowledge_chunks 
SET chunk_type = 'qa' 
WHERE question IS NOT NULL AND answer IS NOT NULL;

-- Records with source containing 'transcript' are likely transcripts
UPDATE public.knowledge_chunks 
SET chunk_type = 'transcript' 
WHERE source LIKE '%transcript%' OR source LIKE '%video%';

-- All others remain as 'document' (the default)
