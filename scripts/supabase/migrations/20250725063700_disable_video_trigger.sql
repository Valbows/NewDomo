-- Disable the problematic video processing trigger for local development
-- This trigger is trying to call a remote production Edge Function which doesn't exist in local dev

-- Drop the trigger that's causing the JSON parsing error
DROP TRIGGER IF EXISTS on_new_video ON storage.objects;

-- Also drop the function since it's not needed for local development
DROP FUNCTION IF EXISTS handle_new_video();
