CREATE TABLE public.affirmations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_at_affirm  public.dna_identity_role NOT NULL,
  witness_id      uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  statement       text NULL,
  affirmed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affirmations_statement_length CHECK (statement IS NULL OR char_length(statement) <= 1000),
  CONSTRAINT affirmations_witness_not_self CHECK (witness_id IS NULL OR witness_id <> profile_id),
  CONSTRAINT affirmations_role_not_exploring CHECK (role_at_affirm <> 'exploring')
);

CREATE UNIQUE INDEX affirmations_one_per_profile_idx ON public.affirmations (profile_id);
CREATE INDEX affirmations_witness_idx ON public.affirmations (witness_id);
CREATE INDEX affirmations_role_idx    ON public.affirmations (role_at_affirm);

GRANT SELECT ON public.affirmations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.affirmations TO authenticated;
GRANT ALL ON public.affirmations TO service_role;

ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affirmations are readable by declarer, witness, and on public profiles"
  ON public.affirmations
  FOR SELECT
  USING (
    profile_id = (SELECT auth.uid())
    OR witness_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = affirmations.profile_id AND p.is_public = true
    )
  );

CREATE POLICY "Users can create their own affirmation"
  ON public.affirmations
  FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Declarer can update their affirmation"
  ON public.affirmations
  FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_affirmation_witness_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_witness public.profiles%ROWTYPE;
BEGIN
  IF NEW.role_at_affirm = 'ally' THEN
    IF NEW.witness_id IS NULL THEN
      RAISE EXCEPTION 'ally affirmation requires a witness';
    END IF;
    SELECT * INTO v_witness FROM public.profiles WHERE id = NEW.witness_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'witness profile % not found', NEW.witness_id;
    END IF;
    IF v_witness.role NOT IN ('returnee', 'anchor') THEN
      RAISE EXCEPTION 'ally witness must be a returnee or anchor (got %)', v_witness.role;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.profile_id     IS DISTINCT FROM OLD.profile_id
    OR NEW.role_at_affirm IS DISTINCT FROM OLD.role_at_affirm
    OR NEW.witness_id     IS DISTINCT FROM OLD.witness_id
    OR NEW.affirmed_at    IS DISTINCT FROM OLD.affirmed_at
    THEN
      RAISE EXCEPTION 'only the statement field is mutable on an affirmation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_affirmation_witness_rules_trg
  BEFORE INSERT OR UPDATE ON public.affirmations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_affirmation_witness_rules();