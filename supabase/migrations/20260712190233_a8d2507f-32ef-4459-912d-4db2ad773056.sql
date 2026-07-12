UPDATE public.events
SET status = CASE
  WHEN is_cancelled = true THEN 'cancelled'
  WHEN status IN ('draft','published','cancelled','completed') THEN status
  ELSE 'draft'
END;

UPDATE public.events
SET visibility = CASE WHEN is_public = true THEN 'public' ELSE 'private' END;

ALTER TABLE public.events
  ALTER COLUMN status     SET DEFAULT 'draft',
  ALTER COLUMN status     SET NOT NULL,
  ALTER COLUMN visibility SET DEFAULT 'public',
  ALTER COLUMN visibility SET NOT NULL;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft','published','cancelled','completed'));

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_visibility_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_visibility_check
  CHECK (visibility IN ('public','community','private'));