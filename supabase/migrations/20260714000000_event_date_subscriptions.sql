-- "Dates not yet announced" → Notify me.
--
-- A subscription row is a one-shot promise held while an event's dates are
-- unannounced (date_confirmed = false / start_time IS NULL). When the dates
-- land, the trigger below fans out a real notification to every subscriber
-- and clears the rows — no scheduler, the announce transition itself pays
-- the promise.

CREATE TABLE IF NOT EXISTS public.event_date_subscriptions (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.event_date_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_date_subscriptions_select_own ON public.event_date_subscriptions;
CREATE POLICY event_date_subscriptions_select_own ON public.event_date_subscriptions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS event_date_subscriptions_insert_own ON public.event_date_subscriptions;
CREATE POLICY event_date_subscriptions_insert_own ON public.event_date_subscriptions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS event_date_subscriptions_delete_own ON public.event_date_subscriptions;
CREATE POLICY event_date_subscriptions_delete_own ON public.event_date_subscriptions
  FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_event_dates_announced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_was_announced boolean;
  v_is_announced boolean;
BEGIN
  v_was_announced := (OLD.date_confirmed AND OLD.start_time IS NOT NULL);
  v_is_announced  := (NEW.date_confirmed AND NEW.start_time IS NOT NULL);

  IF v_is_announced AND NOT v_was_announced THEN
    INSERT INTO public.notifications (user_id, type, title, message, link_url, payload)
    SELECT
      s.user_id,
      'event_dates_announced',
      NEW.title || ' has announced dates',
      'The dates you asked to hear about are live.',
      '/dna/convene/events/' || COALESCE(NEW.slug, NEW.id::text),
      jsonb_build_object('event_id', NEW.id)
    FROM public.event_date_subscriptions s
    WHERE s.event_id = NEW.id;

    DELETE FROM public.event_date_subscriptions WHERE event_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_event_dates_announced ON public.events;
CREATE TRIGGER trg_notify_event_dates_announced
AFTER UPDATE OF date_confirmed, start_time ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_event_dates_announced();
