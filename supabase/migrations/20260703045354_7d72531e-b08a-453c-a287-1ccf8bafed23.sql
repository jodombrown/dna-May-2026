BEGIN;

-- Rewrite 1: spaces SELECT — community tier for onboarded users
DROP POLICY IF EXISTS "Users can view public or member spaces" ON public.spaces;
CREATE POLICY "Users can view public, community, or member spaces"
  ON public.spaces FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR (
      visibility = 'community'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role_declared_at IS NOT NULL
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = spaces.id
        AND sm.user_id = (SELECT auth.uid())
    )
  );

-- Rewrite 2: space_members SELECT — roster legibility to co-members
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.space_members;
CREATE POLICY "Members can view the roster of their spaces"
  ON public.space_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members self_sm
      WHERE self_sm.space_id = space_members.space_id
        AND self_sm.user_id = (SELECT auth.uid())
    )
  );

-- Rewrite 3: space_tasks SELECT + INSERT — active-member gate
DROP POLICY IF EXISTS "Members can view space tasks" ON public.space_tasks;
CREATE POLICY "Active members can view space tasks"
  ON public.space_tasks FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_members.space_id = space_tasks.space_id
        AND space_members.user_id = (SELECT auth.uid())
        AND space_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Members can create tasks" ON public.space_tasks;
CREATE POLICY "Active members can create tasks"
  ON public.space_tasks FOR INSERT
  TO public
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_members.space_id = space_tasks.space_id
        AND space_members.user_id = (SELECT auth.uid())
        AND space_members.status = 'active'
    )
  );

COMMIT;