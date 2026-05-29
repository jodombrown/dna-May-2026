BEGIN;

-- ============================================================
-- BD031 — events/events_old consolidation
-- 8 FK re-parents + 2 helper repairs + 6 RLS rewrites
-- Non-destructive. Atomic. No husk drops (BD032).
-- ============================================================

-- 1. RE-PARENT — 8 children, events_old -> events, same name, CASCADE preserved
ALTER TABLE public.event_analytics
  DROP CONSTRAINT event_analytics_event_id_fkey,
  ADD  CONSTRAINT event_analytics_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_blasts
  DROP CONSTRAINT event_blasts_event_id_fkey,
  ADD  CONSTRAINT event_blasts_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_registration_questions
  DROP CONSTRAINT event_registration_questions_event_id_fkey,
  ADD  CONSTRAINT event_registration_questions_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_registrations
  DROP CONSTRAINT event_registrations_event_id_fkey,
  ADD  CONSTRAINT event_registrations_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_reports
  DROP CONSTRAINT event_reports_event_id_fkey,
  ADD  CONSTRAINT event_reports_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_ticket_holds
  DROP CONSTRAINT event_ticket_holds_event_id_fkey,
  ADD  CONSTRAINT event_ticket_holds_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_ticket_types
  DROP CONSTRAINT event_ticket_types_event_id_fkey,
  ADD  CONSTRAINT event_ticket_types_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_waitlist
  DROP CONSTRAINT event_waitlist_event_id_fkey,
  ADD  CONSTRAINT event_waitlist_event_id_fkey
       FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. HELPER REPAIR — created_by -> organizer_id, verbatim body otherwise
CREATE OR REPLACE FUNCTION public.event_owner_id(p_event uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select organizer_id from public.events where id = p_event;
$function$;

CREATE OR REPLACE FUNCTION public.is_event_owner(p_event uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.events e
    where e.id = p_event and e.organizer_id = p_user
  );
$function$;

-- 3. RLS REWRITE — two-token swap (events_old->events, created_by->organizer_id),
--    everything else preserved byte-for-byte from pg_policies.

-- event_analytics / "Event creators view analytics" (SELECT, authenticated)
DROP POLICY "Event creators view analytics" ON public.event_analytics;
CREATE POLICY "Event creators view analytics" ON public.event_analytics
  FOR SELECT TO authenticated
  USING (
    (event_id IN ( SELECT events.id
       FROM events
      WHERE (events.organizer_id = ( SELECT auth.uid() AS uid)))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)
  );

-- event_blasts / "Event creators manage blasts" (ALL, authenticated)
DROP POLICY "Event creators manage blasts" ON public.event_blasts;
CREATE POLICY "Event creators manage blasts" ON public.event_blasts
  FOR ALL TO authenticated
  USING (
    (event_id IN ( SELECT events.id
       FROM events
      WHERE (events.organizer_id = ( SELECT auth.uid() AS uid)))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)
  )
  WITH CHECK (
    (event_id IN ( SELECT events.id
       FROM events
      WHERE (events.organizer_id = ( SELECT auth.uid() AS uid)))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)
  );

-- event_checkins / "Event staff manage checkins" (ALL, authenticated)
DROP POLICY "Event staff manage checkins" ON public.event_checkins;
CREATE POLICY "Event staff manage checkins" ON public.event_checkins
  FOR ALL TO authenticated
  USING (
    (registration_id IN ( SELECT r.id
       FROM (event_registrations r
         JOIN events e ON ((e.id = r.event_id)))
      WHERE (e.organizer_id = ( SELECT auth.uid() AS uid)))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)
  )
  WITH CHECK (
    (registration_id IN ( SELECT r.id
       FROM (event_registrations r
         JOIN events e ON ((e.id = r.event_id)))
      WHERE (e.organizer_id = ( SELECT auth.uid() AS uid)))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)
  );

-- event_registrations / "registrations_read_self_or_host" (SELECT, public)
DROP POLICY "registrations_read_self_or_host" ON public.event_registrations;
CREATE POLICY "registrations_read_self_or_host" ON public.event_registrations
  FOR SELECT TO public
  USING (
    (user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
       FROM events e
      WHERE ((e.id = event_registrations.event_id) AND (e.organizer_id = ( SELECT auth.uid() AS uid)))))
  );

-- event_registrations / "registrations_update_host" (UPDATE, public)
DROP POLICY "registrations_update_host" ON public.event_registrations;
CREATE POLICY "registrations_update_host" ON public.event_registrations
  FOR UPDATE TO public
  USING (
    EXISTS ( SELECT 1
       FROM events e
      WHERE ((e.id = event_registrations.event_id) AND (e.organizer_id = ( SELECT auth.uid() AS uid))))
  );

-- event_reports / "Users can view event reports" (SELECT, public)
DROP POLICY "Users can view event reports" ON public.event_reports;
CREATE POLICY "Users can view event reports" ON public.event_reports
  FOR SELECT TO public
  USING (
    (reported_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
       FROM events
      WHERE ((events.id = event_reports.event_id) AND (events.organizer_id = ( SELECT auth.uid() AS uid)))))
  );

COMMIT;