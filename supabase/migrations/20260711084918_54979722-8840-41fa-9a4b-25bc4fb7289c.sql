-- BD084 — Contribute pipe repair.

-- 1. Columns the composer already writes
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS direction            text,
  ADD COLUMN IF NOT EXISTS category             text,
  ADD COLUMN IF NOT EXISTS compensation_type    text,
  ADD COLUMN IF NOT EXISTS compensation_details jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS location_relevance   text,
  ADD COLUMN IF NOT EXISTS specific_region      text,
  ADD COLUMN IF NOT EXISTS specific_country     text,
  ADD COLUMN IF NOT EXISTS duration             text,
  ADD COLUMN IF NOT EXISTS deadline             timestamptz,
  ADD COLUMN IF NOT EXISTS requirements         text,
  ADD COLUMN IF NOT EXISTS related_space_id     uuid REFERENCES public.spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS budget_range         jsonb,
  ADD COLUMN IF NOT EXISTS audience             text    NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS media                jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- 2. The give → to → impact triple (BD084)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS give_what       text,
  ADD COLUMN IF NOT EXISTS give_to         text,
  ADD COLUMN IF NOT EXISTS intended_impact text;

COMMENT ON COLUMN public.opportunities.give_what IS
  'Contribute triple (BD084): what is offered or needed. e.g. "4 hrs/week", "Marketing lead".';
COMMENT ON COLUMN public.opportunities.give_to IS
  'Contribute triple (BD084): who or what it goes to. e.g. "HealthTech", "Open to match".';
COMMENT ON COLUMN public.opportunities.intended_impact IS
  'Contribute triple (BD084): the consequence. e.g. "100K users", "Ship faster".';

-- 3. Constrain direction to the composer's enum
ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_direction_check;
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_direction_check
  CHECK (direction IS NULL OR direction IN ('need', 'offer'));

-- 4. Feed lookup index
CREATE INDEX IF NOT EXISTS idx_opportunities_direction_status
  ON public.opportunities (direction, status);