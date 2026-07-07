BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.dia_nudges;
  IF n <> 0 THEN
    RAISE EXCEPTION 'dia_nudges has % rows at drop time; archive was skipped on a 0-row read. Aborting for re-scope.', n;
  END IF;
END $$;
DROP POLICY IF EXISTS dia_nudges_select_own ON public.dia_nudges;
DROP POLICY IF EXISTS dia_nudges_update_own_lifecycle ON public.dia_nudges;
DROP TABLE public.dia_nudges;
COMMIT;