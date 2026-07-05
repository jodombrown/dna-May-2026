BEGIN;

ALTER TABLE public.affirmations DISABLE TRIGGER USER;

INSERT INTO public.affirmations (
  profile_id,
  role_at_affirm,
  witness_id,
  statement,
  affirmed_at,
  attested_at
) VALUES (
  'f2c1d415-254b-4881-99bc-988657ffc562',
  'returnee',
  NULL,
  'I was searching for where I belong, and Ghana answered. I returned to my heritage and my roots, and in finding myself I found the work. I affirm my commitment to The Return: as a representative, a recipient, and an advocate for the Global African Diaspora''s return to mobilize Africa''s progress. I cross this threshold first so the body can cross after me.',
  now(),
  now()
);

ALTER TABLE public.affirmations ENABLE TRIGGER USER;

COMMIT;