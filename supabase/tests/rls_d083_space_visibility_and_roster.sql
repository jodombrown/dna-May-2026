-- RLS test harness for D083 (BD056) — run in the Supabase SQL Editor.
-- Wrap in a transaction and ROLLBACK; requires postgres session for SET LOCAL role.
--
-- Coverage:
--   T1  community-visibility spaces are hidden from a caller with role_declared_at IS NULL
--   T2  community-visibility spaces are visible to a caller with role_declared_at set
--   T3  public spaces are visible to anon and to any authenticated caller
--   T4  private spaces are visible only to members
--   T5  space_members roster is readable by any co-member (no recursion)
--   T6  space_members roster is NOT readable by a non-member
--   T7  space_tasks SELECT is gated on active membership
--   T8  space_tasks INSERT is gated on active membership + status='active'
--   T9  space_tasks SELECT/INSERT is refused to a member with status='invited'
--
-- Expected outputs marked as EXPECT: after each SELECT.

BEGIN;

-- ---------- Fixtures ----------
-- Two auth users. Substitute real UUIDs from auth.users if you have them,
-- otherwise create disposable rows in profiles keyed to synthetic UUIDs and
-- rely on RLS via set_config('request.jwt.claims',...).
SET LOCAL role postgres;

DO $$
DECLARE
  u_declared uuid := '11111111-1111-1111-1111-111111111111';
  u_bare     uuid := '22222222-2222-2222-2222-222222222222';
  u_outsider uuid := '33333333-3333-3333-3333-333333333333';
  s_public   uuid := '44444444-4444-4444-4444-444444444441';
  s_comm     uuid := '44444444-4444-4444-4444-444444444442';
  s_private  uuid := '44444444-4444-4444-4444-444444444443';
BEGIN
  INSERT INTO public.profiles (id, role_declared_at)
    VALUES (u_declared, now()) ON CONFLICT (id) DO UPDATE SET role_declared_at = now();
  INSERT INTO public.profiles (id, role_declared_at)
    VALUES (u_bare, NULL) ON CONFLICT (id) DO UPDATE SET role_declared_at = NULL;
  INSERT INTO public.profiles (id, role_declared_at)
    VALUES (u_outsider, now()) ON CONFLICT (id) DO UPDATE SET role_declared_at = now();

  INSERT INTO public.spaces (id, name, slug, visibility, status, created_by)
    VALUES
      (s_public,  'T Public',    's-public-'||s_public,  'public',    'active', u_declared),
      (s_comm,    'T Community', 's-comm-'  ||s_comm,    'community', 'active', u_declared),
      (s_private, 'T Private',   's-priv-'  ||s_private, 'private',   'active', u_declared)
    ON CONFLICT (id) DO NOTHING;

  -- Seat u_declared as active lead of all three; u_outsider active in private only for T4/T5.
  INSERT INTO public.space_members (space_id, user_id, role, status)
    VALUES
      (s_public,  u_declared, 'lead',        'active'),
      (s_comm,    u_declared, 'lead',        'active'),
      (s_private, u_declared, 'lead',        'active'),
      (s_private, u_outsider, 'contributor', 'active'),
      -- invited-only member for T9
      (s_public,  u_bare,     'contributor', 'invited')
    ON CONFLICT (space_id, user_id) DO NOTHING;

  INSERT INTO public.space_tasks (id, space_id, title, status, created_by)
    VALUES (gen_random_uuid(), s_public, 'T-task', 'open', u_declared)
    ON CONFLICT DO NOTHING;
END $$;

-- ---------- Helper to impersonate ----------
-- Use inline before each block:
--   SELECT set_config('request.jwt.claims', json_build_object('sub', '<uuid>','role','authenticated')::text, true);
--   SET LOCAL role authenticated;

-- ========== T1: community hidden from role_declared_at IS NULL ==========
SELECT set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t1_community_visible_to_bare
FROM public.spaces WHERE id = '44444444-4444-4444-4444-444444444442';
-- EXPECT: 0

-- ========== T2: community visible with role_declared_at set ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t2_community_visible_to_declared
FROM public.spaces WHERE id = '44444444-4444-4444-4444-444444444442';
-- EXPECT: 1

-- ========== T3: public visible to anon + authenticated ==========
SET LOCAL role postgres;
SET LOCAL role anon;
SELECT count(*) AS t3_public_visible_to_anon
FROM public.spaces WHERE id = '44444444-4444-4444-4444-444444444441';
-- EXPECT: 1

-- ========== T4: private visible only to members ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t4_private_visible_to_nonmember
FROM public.spaces WHERE id = '44444444-4444-4444-4444-444444444443';
-- EXPECT: 0

SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','33333333-3333-3333-3333-333333333333','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t4_private_visible_to_member
FROM public.spaces WHERE id = '44444444-4444-4444-4444-444444444443';
-- EXPECT: 1

-- ========== T5: co-member roster read (recursion guard) ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','33333333-3333-3333-3333-333333333333','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t5_roster_visible_to_comember
FROM public.space_members WHERE space_id = '44444444-4444-4444-4444-444444444443';
-- EXPECT: 2  (u_declared + u_outsider)  — if this errors with "infinite recursion", policy is wrong.

-- ========== T6: roster hidden from non-member ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t6_roster_visible_to_nonmember
FROM public.space_members WHERE space_id = '44444444-4444-4444-4444-444444444443';
-- EXPECT: 0

-- ========== T7: space_tasks SELECT requires active membership ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t7_tasks_visible_to_active_member
FROM public.space_tasks WHERE space_id = '44444444-4444-4444-4444-444444444441';
-- EXPECT: >=1

-- ========== T8: space_tasks INSERT requires active membership ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111','role','authenticated')::text, true);
SET LOCAL role authenticated;
INSERT INTO public.space_tasks (space_id, title, status, created_by)
VALUES ('44444444-4444-4444-4444-444444444441', 'T8 insert by active member', 'open',
        '11111111-1111-1111-1111-111111111111');
-- EXPECT: INSERT 0 1

-- ========== T9: invited (non-active) member is refused ==========
SET LOCAL role postgres;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222','role','authenticated')::text, true);
SET LOCAL role authenticated;
SELECT count(*) AS t9_tasks_visible_to_invited
FROM public.space_tasks WHERE space_id = '44444444-4444-4444-4444-444444444441';
-- EXPECT: 0

DO $$
BEGIN
  BEGIN
    INSERT INTO public.space_tasks (space_id, title, status, created_by)
    VALUES ('44444444-4444-4444-4444-444444444441', 'T9 invited insert should fail', 'open',
            '22222222-2222-2222-2222-222222222222');
    RAISE NOTICE 't9_invited_insert=UNEXPECTED_OK';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE 't9_invited_insert=REFUSED_OK';
  END;
END $$;

ROLLBACK;
