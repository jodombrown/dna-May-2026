
-- Tighten feedback-media INSERT policy to require folder ownership matching auth.uid()
DROP POLICY IF EXISTS "Authenticated users can upload feedback media" ON storage.objects;

CREATE POLICY "Authenticated users can upload feedback media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
