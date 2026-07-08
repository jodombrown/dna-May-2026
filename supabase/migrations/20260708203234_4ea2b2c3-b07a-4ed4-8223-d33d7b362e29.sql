-- BD056: swap the role_declared_at affirmed-member PROXY onto the real
-- is_affirmed_member() predicate in the spaces community-visibility gate.
-- role_declared_at (onboarding role declaration) stood in for affirmed
-- membership before is_affirmed_member() existed; the true threshold is
-- The Affirmation (D027/D031). Applied while visibility='community' spaces
-- count = 0, so zero live rows change visibility; the correct gate is in
-- place before Arc 3 creates community spaces. Onboarding's separate use of
-- role_declared_at (OnboardingGuard) is a different gate and is untouched.
ALTER POLICY "Users can view public, community, or member spaces"
ON public.spaces
USING (
  (visibility = 'public')
  OR (visibility = 'community' AND public.is_affirmed_member((SELECT auth.uid())))
  OR (EXISTS (SELECT 1 FROM space_members sm
              WHERE sm.space_id = spaces.id AND sm.user_id = (SELECT auth.uid())))
);