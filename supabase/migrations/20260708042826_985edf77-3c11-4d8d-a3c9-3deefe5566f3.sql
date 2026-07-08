BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT (SELECT count(*) FROM public.ad_campaigns)
       + (SELECT count(*) FROM public.advertisers)
       + (SELECT count(*) FROM public.ad_intake_submissions) INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'advertising tables gained % rows since the read; abort for archive review.', n; END IF;
END $$;

DROP FUNCTION public.track_ad_impression(uuid);
DROP FUNCTION public.track_ad_click(uuid);

DROP TABLE public.ad_campaigns;
DROP TABLE public.advertisers;
DROP TABLE public.ad_intake_submissions;
COMMIT;