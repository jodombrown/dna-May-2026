-- Align rpc_request_join_space with D083 (BD056):
--   community-visibility spaces require the caller to have declared their role
--   (role_declared_at IS NOT NULL) — the Arc-2 proxy for Affirmed-Member.
--   This mirrors the spaces SELECT policy so a user who cannot see a community
--   space also cannot self-request into it via the SECURITY DEFINER RPC.
CREATE OR REPLACE FUNCTION public.rpc_request_join_space(p_space uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user       uuid := auth.uid();
  v_visibility text;
  v_declared   timestamptz;
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

  IF public.is_blocked_from_space(_user_id => v_user, _space_id => p_space) THEN
    RAISE EXCEPTION 'You cannot join this space.'
      USING errcode = '42501';
  END IF;

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
    -- Arc-2 proxy: caller must have declared their role to reach community spaces.
    SELECT role_declared_at INTO v_declared
    FROM public.profiles WHERE id = v_user;
    IF v_declared IS NULL THEN
      RAISE EXCEPTION 'Finish onboarding (declare your role) to join community spaces.'
        USING errcode = '42501';
    END IF;

    INSERT INTO public.space_members (space_id, user_id, role, status)
    VALUES (p_space, v_user, 'contributor', 'invited')
    ON CONFLICT (space_id, user_id) DO NOTHING;

  ELSE
    RAISE EXCEPTION 'This space is invite-only.'
      USING errcode = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_request_join_space(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_request_join_space(uuid) TO authenticated;

COMMENT ON FUNCTION public.rpc_request_join_space(uuid) IS
  'D083 self-join. public=active; community=invited (requires profiles.role_declared_at, Arc-2 proxy for Affirmed-Member); private=refused. Blocked users refused; idempotent for existing members.';