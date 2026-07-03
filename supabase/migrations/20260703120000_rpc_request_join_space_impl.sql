-- Real implementation of public.rpc_request_join_space(p_space uuid).
--
-- Replaces the prior stub (which raised unconditionally). Behavior is keyed to
-- the target space's visibility:
--   * public    -> caller joins immediately as (role='contributor', status='active').
--   * community -> caller creates a pending request as (role='contributor', status='invited');
--                  a space lead later flips status to 'active' to admit them.
--   * private   -> self-join is refused ('This space is invite-only.').
--
-- The caller is always auth.uid() (never a passed-in id). Blocked users are
-- refused up front, and an existing membership short-circuits so re-requesting
-- is idempotent and never downgrades an already-active member.

CREATE OR REPLACE FUNCTION public.rpc_request_join_space(p_space uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user       uuid := auth.uid();
  v_visibility text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join a space.'
      USING errcode = '28000';
  END IF;

  SELECT visibility INTO v_visibility
  FROM public.spaces
  WHERE id = p_space;

  IF v_visibility IS NULL THEN
    RAISE EXCEPTION 'That space no longer exists.'
      USING errcode = 'P0002';
  END IF;

  -- Refuse blocked users before any write.
  IF public.is_blocked_from_space(_user_id => v_user, _space_id => p_space) THEN
    RAISE EXCEPTION 'You cannot join this space.'
      USING errcode = '42501';
  END IF;

  -- Already a member (any status, including the creator seated by the INSERT
  -- trigger): nothing to do. Keeps re-requests idempotent.
  IF EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = p_space AND user_id = v_user
  ) THEN
    RETURN;
  END IF;

  IF v_visibility = 'public' THEN
    INSERT INTO public.space_members (space_id, user_id, role, status)
    VALUES (p_space, v_user, 'contributor', 'active')
    ON CONFLICT (space_id, user_id) DO NOTHING;

  ELSIF v_visibility = 'community' THEN
    INSERT INTO public.space_members (space_id, user_id, role, status)
    VALUES (p_space, v_user, 'contributor', 'invited')
    ON CONFLICT (space_id, user_id) DO NOTHING;

  ELSE
    -- private (or any other non-joinable visibility)
    RAISE EXCEPTION 'This space is invite-only.'
      USING errcode = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_request_join_space(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_request_join_space(uuid) TO authenticated;

COMMENT ON FUNCTION public.rpc_request_join_space(uuid) IS
  'Self-service join for the calling user (auth.uid()). public=join active, community=request (invited), private=refused. Blocked users refused; idempotent for existing members.';
