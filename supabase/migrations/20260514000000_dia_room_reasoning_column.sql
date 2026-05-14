-- ============================================================
-- DIA Room Reasoning: reasoning_generated_at column
-- ============================================================
-- The dia-room-reasoning edge function upgrades SQL-authored
-- reasoning_text to DIA-authored reasoning_text on room_curations
-- rows. This column records when the upgrade happened so the
-- downstream scheduled job can skip rows that are already fresh.
--
-- Defensive: room_curations may not yet exist in every
-- environment (Phase 4 schema is being merged in parallel). The
-- ALTER is wrapped so it only runs if the table exists; the
-- column itself uses IF NOT EXISTS so the migration is idempotent.
-- No backfill required; existing rows leave the column null.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'room_curations'
  ) THEN
    ALTER TABLE public.room_curations
      ADD COLUMN IF NOT EXISTS reasoning_generated_at timestamptz;
  END IF;
END
$$;
