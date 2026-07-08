-- Hardening security atom (Cleanup Phase, Cycle 3).
-- 1) Closes the peer-read leak on profiles.email: any authenticated user could read
--    any public/connected profile's email via the table-level SELECT grant.
-- 2) Closes creator self-moderation writes on communities moderation columns.
-- 3) Strips email from rpc_get_profile_bundle, which leaked the full profiles row
--    via row_to_json ROWTYPE serialization (SECURITY DEFINER bypasses grants).
-- Column lists are derived from the live catalog at apply time; each DO block
-- fails closed (raises, aborting the whole migration) rather than half-applying.

-- (1) profiles: replace table-level SELECT with explicit column grant, email excluded
REVOKE SELECT ON public.profiles FROM anon, authenticated;
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name <> 'email';
  IF cols IS NULL THEN
    RAISE EXCEPTION 'profiles column list came back empty — aborting grant reshape';
  END IF;
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated', cols);
END $$;

-- (2) communities: replace table-level INSERT/UPDATE; moderation fields excluded;
--     anon write grants deliberately not re-issued (RLS already blocks; fail-loud preferred)
REVOKE INSERT, UPDATE ON public.communities FROM anon, authenticated;
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'communities'
    AND column_name NOT IN ('moderator_notes', 'rejection_reason', 'moderated_by', 'moderated_at');
  IF cols IS NULL THEN
    RAISE EXCEPTION 'communities column list came back empty — aborting grant reshape';
  END IF;
  EXECUTE format('GRANT INSERT (%1$s), UPDATE (%1$s) ON public.communities TO authenticated', cols);
END $$;

-- (3) rpc_get_profile_bundle: in-place rewrite, fail-closed.
--     Replaces row_to_json(v_profile) with ((to_jsonb(v_profile) - 'email')::json)
--     so the bundle keeps every current and future column EXCEPT email.
DO $$
DECLARE fndef text; newdef text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO fndef
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'rpc_get_profile_bundle';
  IF fndef IS NULL THEN
    RAISE EXCEPTION 'rpc_get_profile_bundle not found — aborting';
  END IF;
  newdef := replace(fndef, 'row_to_json(v_profile)', '((to_jsonb(v_profile) - ''email'')::json)');
  IF newdef = fndef THEN
    RAISE EXCEPTION 'pattern row_to_json(v_profile) not found in rpc_get_profile_bundle — body has drifted from the audited shape; abort and rewrite manually';
  END IF;
  EXECUTE newdef;
END $$;