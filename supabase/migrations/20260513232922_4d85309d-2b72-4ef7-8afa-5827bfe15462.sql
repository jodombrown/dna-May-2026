-- Sprint A: Create dia_nudges table per the May 2026 spec
-- Drop the unapplied Feb 2026 schema if it ever lands, so this is the source of truth.
DROP TABLE IF EXISTS public.dia_nudges CASCADE;

CREATE TABLE public.dia_nudges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type      TEXT NOT NULL,
  c_module        TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'feed',
  priority        SMALLINT NOT NULL DEFAULT 3,
  headline        TEXT NOT NULL,
  body            TEXT,
  action          JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'queued',
  entity_kind     TEXT,
  entity_id       UUID,
  emitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  seen_at         TIMESTAMPTZ,
  acted_on_at     TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dia_nudges_module_chk
    CHECK (c_module IN ('connect','convene','collaborate','contribute','convey','dia','cross')),
  CONSTRAINT dia_nudges_channel_chk
    CHECK (channel IN ('feed','notification','both')),
  CONSTRAINT dia_nudges_priority_chk
    CHECK (priority BETWEEN 1 AND 5),
  CONSTRAINT dia_nudges_entity_pair_chk
    CHECK ((entity_kind IS NULL AND entity_id IS NULL) OR (entity_kind IS NOT NULL AND entity_id IS NOT NULL)),
  CONSTRAINT dia_nudges_status_chk
    CHECK (status IN ('queued','delivered','seen','acted_on','dismissed','expired','suppressed'))
);

-- Throttle / lookup indexes
CREATE INDEX idx_dia_nudges_user_emitted   ON public.dia_nudges (user_id, emitted_at DESC);
CREATE INDEX idx_dia_nudges_user_type_time ON public.dia_nudges (user_id, nudge_type, emitted_at DESC);
CREATE INDEX idx_dia_nudges_user_active    ON public.dia_nudges (user_id, status) WHERE status IN ('queued','delivered','seen');
CREATE INDEX idx_dia_nudges_expires        ON public.dia_nudges (expires_at) WHERE status NOT IN ('dismissed','acted_on','expired');
CREATE INDEX idx_dia_nudges_entity         ON public.dia_nudges (entity_kind, entity_id) WHERE entity_id IS NOT NULL;

-- RLS: select-own + update-own-lifecycle. Inserts/deletes are service_role only.
ALTER TABLE public.dia_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dia_nudges_select_own"
  ON public.dia_nudges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "dia_nudges_update_own_lifecycle"
  ON public.dia_nudges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON public.dia_nudges TO authenticated;
GRANT ALL          ON public.dia_nudges TO service_role;