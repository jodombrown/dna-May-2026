-- Arc 4 · Cycle 1 — task_comments RLS reconcile (Note 3)
--
-- Retire the `is_member_of_space` shim (which reads `collaboration_memberships`
-- with roles ['owner','admin','member'] and a status='approved' gate) from the
-- task_comments surface and re-point it onto the canonical `space_members`
-- table, mirroring the space_tasks canonical policy pattern.
--
-- Access is NOT loosened:
--   * read / insert  -> any ACTIVE member of the space (bare membership, matching
--                       the space_tasks "Members can view / create" pattern)
--   * insert         -> additionally requires author_id = auth.uid()
--   * delete         -> comment author OR a space `lead` (the canonical equivalent
--                       of the shim's elevated ['owner','admin'] role)
--   * update         -> no policy (comments remain immutable, as before)
--
-- The canonical active-member gate is `space_members.status = 'active'`
-- (space_members.status CHECK ('active','invited','removed')). This preserves the
-- intent of the shim's approved-member gate without copying its 'approved' literal.
--
-- auth.uid() is wrapped as (select auth.uid()) to match the optimized
-- space_tasks policies and keep the value cached per-statement.

-- Ensure RLS is on (no-op if already enabled).
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Drop EVERY existing policy on task_comments so no shim-based policy survives,
-- regardless of its exact name in the live catalog. The canonical set below is
-- then the complete policy surface for this table.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_comments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_comments', pol.policyname);
  END LOOP;
END $$;

-- READ: any active member of the space can view its task comments.
CREATE POLICY "Members can view task comments"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_members.space_id = task_comments.space_id
      AND space_members.user_id = (select auth.uid())
      AND space_members.status = 'active'
  )
);

-- INSERT: active members can add their own comments.
CREATE POLICY "Members can create task comments"
ON public.task_comments
FOR INSERT
WITH CHECK (
  author_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_members.space_id = task_comments.space_id
      AND space_members.user_id = (select auth.uid())
      AND space_members.status = 'active'
  )
);

-- DELETE: the comment author, or a space lead, may delete a comment.
CREATE POLICY "Authors and leads can delete task comments"
ON public.task_comments
FOR DELETE
USING (
  -- Comment author can delete their own comment
  author_id = (select auth.uid())
  OR
  -- Space leads can delete any comment in their space
  EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_members.space_id = task_comments.space_id
      AND space_members.user_id = (select auth.uid())
      AND space_members.status = 'active'
      AND space_members.role = 'lead'
  )
);
