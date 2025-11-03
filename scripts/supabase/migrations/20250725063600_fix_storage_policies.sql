-- Fix storage policies for demo-videos bucket
-- The INSERT policy was missing the WITH CHECK clause

-- Drop and recreate the INSERT policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'demo-videos' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.demos WHERE user_id = auth.uid()
  )
);

-- Also ensure the bucket allows the correct file types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv']
WHERE id = 'demo-videos';
