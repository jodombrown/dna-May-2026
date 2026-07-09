ALTER POLICY "Users can view public, community, or member spaces"
ON public.spaces
USING (
  (visibility = 'public')
  OR ((visibility = 'community') AND ((SELECT auth.uid()) IS NOT NULL))
  OR (EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = spaces.id
          AND sm.user_id = (SELECT auth.uid())
     ))
);