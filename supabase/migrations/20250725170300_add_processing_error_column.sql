-- Add missing processing_error column to demo_videos table
-- This column is used to store error messages when video processing fails

ALTER TABLE public.demo_videos 
ADD COLUMN processing_error TEXT;
