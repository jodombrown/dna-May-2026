
-- 1) Saved DIA answers
CREATE TABLE IF NOT EXISTS public.dia_saved_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text text NOT NULL,
  answer text NOT NULL,
  tool_results jsonb DEFAULT '{}'::jsonb,
  citations jsonb DEFAULT '[]'::jsonb,
  query_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dia_saved_answers TO authenticated;
GRANT ALL ON public.dia_saved_answers TO service_role;
ALTER TABLE public.dia_saved_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved answers"
  ON public.dia_saved_answers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dia_saved_answers_user_created_idx
  ON public.dia_saved_answers (user_id, created_at DESC);

-- 2) Privilege-escalation guard on profiles
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may change anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Not permitted to change is_admin';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not permitted to change role';
  END IF;
  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'Not permitted to change verified';
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Not permitted to change verification_status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation_profiles ON public.profiles;
CREATE TRIGGER trg_prevent_privilege_escalation_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation_profiles();

-- 3) Privilege-escalation guard on users
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not permitted to change role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation_users ON public.users;
CREATE TRIGGER trg_prevent_privilege_escalation_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation_users();
