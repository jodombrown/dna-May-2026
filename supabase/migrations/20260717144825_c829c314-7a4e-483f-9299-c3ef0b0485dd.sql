
-- 1) Message attachments: drop LIKE-based policy, restrict to owner (uploader)
DROP POLICY IF EXISTS "Owners and conversation participants view attachments" ON storage.objects;

CREATE POLICY "Owners view own message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2) Materialized view: remove from Data API by revoking role access
REVOKE ALL ON public.mv_profile_footprint_counts FROM anon, authenticated, PUBLIC;
-- service_role retains access for RPCs / edge functions
GRANT SELECT ON public.mv_profile_footprint_counts TO service_role;

-- 3) SECURITY DEFINER: revoke anon EXECUTE on internal helper not meant to be public
REVOKE EXECUTE ON FUNCTION public.dia_promote_grounded_to_notifications() FROM anon, PUBLIC;
