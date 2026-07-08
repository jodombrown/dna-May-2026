-- Hardening (Cleanup Phase, Cycle 3): admin content moderation was silently
-- no-op'ing — posts and post_comments carry only author-own UPDATE policies,
-- so ContentModeration's writes matched zero rows on others' content.
-- Mirrors the existing "Admins can update any profile" precedent.

CREATE POLICY "Admins can update any post"
ON public.posts FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any comment"
ON public.post_comments FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));