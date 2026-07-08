BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.user_dna_points;
  IF n <> 0 THEN RAISE EXCEPTION 'user_dna_points gained % rows since read; abort for archive review.', n; END IF;
END $$;

DROP TRIGGER sync_dna_points_trigger ON public.impact_log;

DROP FUNCTION public.sync_dna_points_from_impact();
DROP FUNCTION public.update_dna_points(uuid, text, integer);
DROP FUNCTION public.check_badge_unlocks(uuid);
DROP FUNCTION public.get_leaderboard(text, text, text, integer);

DROP TABLE public.user_dna_points;
COMMIT;