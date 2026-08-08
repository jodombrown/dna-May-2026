-- BD411/423. Relationships Phase 1 schema: parties, event_engagements,
-- event_engagement_roles. These tables did not exist anywhere in the catalog
-- or in supabase/types.ts prior to this migration — verified by grep across
-- supabase/migrations and src/integrations/supabase/types.ts, never assumed
-- from the ticket narrative. This migration creates them so the Relationships
-- pane (CommunicationsHub.tsx) has real tables to query, per the schema shape
-- described in BD423: a Party (person or organization) can be engaged by many
-- events, each engagement carries one or more roles (sponsor, partner, vendor,
-- exhibitor, volunteer, team member).
--
-- Deliberately NOT touched here, per BD413/BD414 (deferred):
--   * Vendor's procurement fields (invoice/deliverable)
--   * Exhibitor's Activation model
--   * Sponsor/Exhibitor fulfillment tracking
-- Those need their own schema pass once this list view is live and proven.
--
-- event_engagement_roles is intentionally separate from the pre-existing
-- public.event_roles table (used by TeamManager.tsx for event-staff
-- permissions/access control). event_roles grants a user PLATFORM ACCESS to
-- manage an event; event_engagement_roles describes a PARTY'S RELATIONSHIP to
-- an event (sponsor, vendor, etc.) and confers no access. "Team member" is
-- included here as a relationship category for the Party list/messaging
-- surface, not as a substitute for event_roles-based permissioning.
--
-- Security invariants (BD268, catalogInvariants.test.ts): every policy below
-- is scoped TO authenticated with an organizer/creator predicate — anon is
-- never granted and never named in a policy, so INV2 (anon-reachable drift)
-- stays green with no baseline row needed. INV9 (authenticated read surface)
-- only gates on LOSS, not gains, so these new authenticated-readable columns
-- need no baseline row either.

-- =====================================================================
-- 1. parties — a person or organization, independent of any one event
-- =====================================================================
CREATE TABLE public.parties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL DEFAULT 'organization' CHECK (kind IN ('person', 'organization')),
  name        text NOT NULL CHECK (btrim(name) <> ''),
  email       text,
  phone       text,
  notes       text,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parties_name_idx ON public.parties USING gin (to_tsvector('simple', name));
CREATE INDEX parties_created_by_idx ON public.parties(created_by);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. event_engagements — a party engaged by one event
-- =====================================================================
CREATE TABLE public.event_engagements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  party_id    uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_engagements_event_party_unique UNIQUE (event_id, party_id)
);

CREATE INDEX event_engagements_event_id_idx ON public.event_engagements(event_id);
CREATE INDEX event_engagements_party_id_idx ON public.event_engagements(party_id);

ALTER TABLE public.event_engagements ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. event_engagement_roles — role(s) a party holds within one engagement
-- =====================================================================
CREATE TABLE public.event_engagement_roles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_engagement_id   uuid NOT NULL REFERENCES public.event_engagements(id) ON DELETE CASCADE,
  role                  text NOT NULL CHECK (role IN
    ('sponsor', 'partner', 'vendor', 'exhibitor', 'volunteer', 'team_member')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_engagement_roles_unique UNIQUE (event_engagement_id, role)
);

CREATE INDEX event_engagement_roles_engagement_id_idx ON public.event_engagement_roles(event_engagement_id);
CREATE INDEX event_engagement_roles_role_idx ON public.event_engagement_roles(role);

ALTER TABLE public.event_engagement_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 4. updated_at triggers — reuse the shared touch_updated_at() function
--    (already defined for user_reports, see 20260511163441_*.sql)
-- =====================================================================
CREATE TRIGGER trg_touch_parties
  BEFORE UPDATE ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_touch_event_engagements
  BEFORE UPDATE ON public.event_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- 5. RLS policies
--    event_engagements / event_engagement_roles: organizer-of-the-event only,
--    same shape as the existing event_roles_select policy (organizer_id
--    check via EXISTS against events). parties: visible/writable to whoever
--    created the row, or to any organizer who has engaged them on an event
--    they run — a party is shared directory state once engaged, not private
--    to the organizer who happened to add it first.
-- =====================================================================

CREATE POLICY parties_select ON public.parties
FOR SELECT TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.event_engagements ee
    JOIN public.events e ON e.id = ee.event_id
    WHERE ee.party_id = parties.id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY parties_insert ON public.parties
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY parties_update ON public.parties
FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.event_engagements ee
    JOIN public.events e ON e.id = ee.event_id
    WHERE ee.party_id = parties.id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY event_engagements_select ON public.event_engagements
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_engagements.event_id AND e.organizer_id = auth.uid())
);

CREATE POLICY event_engagements_insert ON public.event_engagements
FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_engagements.event_id AND e.organizer_id = auth.uid())
);

CREATE POLICY event_engagements_update ON public.event_engagements
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_engagements.event_id AND e.organizer_id = auth.uid())
);

CREATE POLICY event_engagements_delete ON public.event_engagements
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_engagements.event_id AND e.organizer_id = auth.uid())
);

CREATE POLICY event_engagement_roles_select ON public.event_engagement_roles
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.event_engagements ee
    JOIN public.events e ON e.id = ee.event_id
    WHERE ee.id = event_engagement_roles.event_engagement_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY event_engagement_roles_insert ON public.event_engagement_roles
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_engagements ee
    JOIN public.events e ON e.id = ee.event_id
    WHERE ee.id = event_engagement_roles.event_engagement_id AND e.organizer_id = auth.uid()
  )
);

CREATE POLICY event_engagement_roles_delete ON public.event_engagement_roles
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.event_engagements ee
    JOIN public.events e ON e.id = ee.event_id
    WHERE ee.id = event_engagement_roles.event_engagement_id AND e.organizer_id = auth.uid()
  )
);
