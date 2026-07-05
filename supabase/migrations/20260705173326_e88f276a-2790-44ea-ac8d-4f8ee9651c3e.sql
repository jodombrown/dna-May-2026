
CREATE TABLE IF NOT EXISTS public.sponsor_logo_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('upload','update','delete')),
  storage_path TEXT,
  logo_url TEXT,
  sponsor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsor_logo_audit_log TO authenticated;
GRANT ALL ON public.sponsor_logo_audit_log TO service_role;

ALTER TABLE public.sponsor_logo_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sponsor logo audit log"
  ON public.sponsor_logo_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS sponsor_logo_audit_log_created_at_idx
  ON public.sponsor_logo_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS sponsor_logo_audit_log_admin_idx
  ON public.sponsor_logo_audit_log (admin_user_id);

CREATE OR REPLACE FUNCTION public.log_sponsor_logo_action(
  _action TEXT,
  _storage_path TEXT DEFAULT NULL,
  _logo_url TEXT DEFAULT NULL,
  _sponsor_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _id UUID;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF _action NOT IN ('upload','update','delete') THEN
    RAISE EXCEPTION 'Invalid action: %', _action USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sponsor_logo_audit_log (
    admin_user_id, action, storage_path, logo_url, sponsor_id, metadata
  ) VALUES (
    _uid, _action, _storage_path, _logo_url, _sponsor_id, COALESCE(_metadata, '{}'::jsonb)
  ) RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_sponsor_logo_action(TEXT, TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_sponsor_logo_action(TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
