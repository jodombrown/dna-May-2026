
-- 1) Paginated + filterable audit log RPC (admin-only)
CREATE OR REPLACE FUNCTION public.list_sponsor_logo_audit_log(
  _admin_user_id uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _from timestamptz DEFAULT NULL,
  _to timestamptz DEFAULT NULL,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  admin_user_id uuid,
  action text,
  storage_path text,
  logo_url text,
  sponsor_id uuid,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  IF _action IS NOT NULL AND _action NOT IN ('upload','update','delete') THEN
    RAISE EXCEPTION 'invalid action filter' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT a.*
    FROM public.sponsor_logo_audit_log a
    WHERE (_admin_user_id IS NULL OR a.admin_user_id = _admin_user_id)
      AND (_action IS NULL OR a.action = _action)
      AND (_from IS NULL OR a.created_at >= _from)
      AND (_to IS NULL OR a.created_at <= _to)
  ), total AS (
    SELECT count(*)::bigint AS c FROM filtered
  )
  SELECT f.id, f.admin_user_id, f.action, f.storage_path, f.logo_url,
         f.sponsor_id, f.metadata, f.created_at, total.c AS total_count
  FROM filtered f, total
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(_offset, 0), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_sponsor_logo_audit_log(uuid, text, timestamptz, timestamptz, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_sponsor_logo_audit_log(uuid, text, timestamptz, timestamptz, int, int) TO authenticated, service_role;

-- 2) Address sponsors.contact_email/contact_name exposure by revoking column-level SELECT
--    from authenticated and re-granting only the non-sensitive columns.
REVOKE SELECT ON public.sponsors FROM anon, authenticated;
GRANT SELECT (id, name, slug, description, website_url, logo_url, tier, is_active, created_at, updated_at)
  ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

-- Admin-only RPC to fetch full sponsor record including contact fields
CREATE OR REPLACE FUNCTION public.get_sponsor_contact(_sponsor_id uuid)
RETURNS TABLE (
  id uuid,
  contact_name text,
  contact_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT s.id, s.contact_name, s.contact_email
  FROM public.sponsors s
  WHERE s.id = _sponsor_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_sponsor_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sponsor_contact(uuid) TO authenticated, service_role;
