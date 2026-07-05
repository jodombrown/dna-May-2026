
CREATE OR REPLACE FUNCTION public.enforce_comments_disabled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_disabled boolean;
BEGIN
  SELECT comments_disabled INTO is_disabled
  FROM public.posts
  WHERE id = NEW.post_id;

  IF COALESCE(is_disabled, false) THEN
    RAISE EXCEPTION 'Comments are turned off for this post.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_comments_disabled ON public.post_comments;
CREATE TRIGGER trg_enforce_comments_disabled
  BEFORE INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_comments_disabled();
