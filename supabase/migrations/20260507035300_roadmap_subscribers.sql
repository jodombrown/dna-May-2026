-- ============================================================
-- ROADMAP Subscribers — pre-registration email capture
-- ============================================================
-- Captures email signups from the public /roadmap marketing page
-- for DNA's annual flagship event, ROADMAP.
--
-- Source values track which CTA the signup came from:
--   'hero'           — primary CTA in the hero section
--   'footer-cta'     — secondary CTA at page bottom
--   'inline'         — any inline capture (future)
--
-- RLS:
--   - Anyone (anon/authenticated) can INSERT
--   - Only admins (profiles.roles contains 'admin') can SELECT
--   - No UPDATE/DELETE policies — append-only by design
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roadmap_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hero',
  edition_year INT NOT NULL DEFAULT 2026,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT roadmap_subscribers_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT roadmap_subscribers_unique_per_edition
    UNIQUE (email, edition_year)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_subscribers_edition_year
  ON public.roadmap_subscribers(edition_year);

CREATE INDEX IF NOT EXISTS idx_roadmap_subscribers_subscribed_at
  ON public.roadmap_subscribers(subscribed_at DESC);

-- Enable RLS
ALTER TABLE public.roadmap_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public marketing page)
DROP POLICY IF EXISTS "Anyone can subscribe to ROADMAP updates"
  ON public.roadmap_subscribers;
CREATE POLICY "Anyone can subscribe to ROADMAP updates"
  ON public.roadmap_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read subscriber list
DROP POLICY IF EXISTS "Admins can read ROADMAP subscribers"
  ON public.roadmap_subscribers;
CREATE POLICY "Admins can read ROADMAP subscribers"
  ON public.roadmap_subscribers
  FOR SELECT
  USING (
    (SELECT auth.uid()) IN (
      SELECT id FROM public.profiles WHERE 'admin' = ANY(roles)
    )
  );

COMMENT ON TABLE public.roadmap_subscribers IS
  'Email pre-registration captures from the public /roadmap marketing page for DNA''s annual flagship event.';
COMMENT ON COLUMN public.roadmap_subscribers.source IS
  'Which CTA captured the signup (hero, footer-cta, inline, etc).';
COMMENT ON COLUMN public.roadmap_subscribers.edition_year IS
  'Which annual edition the subscriber registered for (e.g. 2026 for the inaugural).';
