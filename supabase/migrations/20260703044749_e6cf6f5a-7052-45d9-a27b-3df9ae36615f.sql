BEGIN;

-- Delta 1: lifecycle enum widen
ALTER TABLE public.spaces DROP CONSTRAINT IF EXISTS spaces_status_check;

ALTER TABLE public.spaces
  ADD CONSTRAINT spaces_status_check
  CHECK (status = ANY (ARRAY[
    'idea'::text,
    'forming'::text,
    'active'::text,
    'completed'::text,
    'paused'::text,
    'abandoned'::text
  ]));

-- Delta 2: visibility CHECK widen
ALTER TABLE public.spaces DROP CONSTRAINT IF EXISTS spaces_visibility_check;

ALTER TABLE public.spaces
  ADD CONSTRAINT spaces_visibility_check
  CHECK (visibility = ANY (ARRAY[
    'public'::text,
    'community'::text,
    'private'::text
  ]));

-- Delta 3: privacy_level collapse
DROP INDEX IF EXISTS public.idx_spaces_privacy;

ALTER TABLE public.spaces DROP CONSTRAINT IF EXISTS spaces_privacy_level_check;

ALTER TABLE public.spaces DROP COLUMN IF EXISTS privacy_level;

COMMIT;