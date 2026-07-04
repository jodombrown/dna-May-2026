-- BD061: reconcile affirmations to BD060 (pending-then-attest, universal Affirmed witness).
-- Trigger binding unchanged; function body replaced.

ALTER TABLE public.affirmations ADD COLUMN attested_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_affirmed_member(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affirmations
    WHERE profile_id = p_profile_id AND attested_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_affirmed_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_affirmed_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_affirmation_witness_rules()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_witness_role public.dna_identity_role;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.attested_at IS NOT NULL THEN
      RAISE EXCEPTION 'an affirmation cannot be inserted pre-attested';
    END IF;
    IF NEW.witness_id IS NULL THEN
      RAISE EXCEPTION 'a named witness is required';
    END IF;
    IF NOT public.is_affirmed_member(NEW.witness_id) THEN
      RAISE EXCEPTION 'witness must be an Affirmed Member';
    END IF;
    IF NEW.role_at_affirm = 'ally' THEN
      SELECT role INTO v_witness_role
      FROM public.profiles WHERE id = NEW.witness_id;
      IF v_witness_role IS NULL
         OR v_witness_role NOT IN ('returnee','anchor') THEN
        RAISE EXCEPTION 'ally crossings require a returnee or anchor witness';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Path 1: attestation. Witness-only, exactly the NULL -> ts transition.
    IF OLD.attested_at IS NULL AND NEW.attested_at IS NOT NULL THEN
      IF auth.uid() IS DISTINCT FROM OLD.witness_id THEN
        RAISE EXCEPTION 'only the named witness can attest';
      END IF;
      IF NEW.profile_id <> OLD.profile_id
         OR NEW.role_at_affirm <> OLD.role_at_affirm
         OR NEW.witness_id IS DISTINCT FROM OLD.witness_id
         OR NEW.affirmed_at <> OLD.affirmed_at
         OR NEW.statement IS DISTINCT FROM OLD.statement THEN
        RAISE EXCEPTION 'attestation may set attested_at and nothing else';
      END IF;
      IF NOT public.is_affirmed_member(OLD.witness_id) THEN
        RAISE EXCEPTION 'witness must still be an Affirmed Member at attestation';
      END IF;
      IF OLD.role_at_affirm = 'ally' THEN
        SELECT role INTO v_witness_role
        FROM public.profiles WHERE id = OLD.witness_id;
        IF v_witness_role IS NULL
           OR v_witness_role NOT IN ('returnee','anchor') THEN
          RAISE EXCEPTION 'ally attestation requires a returnee or anchor witness';
        END IF;
      END IF;
      RETURN NEW;
    END IF;

    -- Path 2: pending edits. Declarer may change statement and witness only.
    IF OLD.attested_at IS NULL THEN
      IF NEW.profile_id <> OLD.profile_id
         OR NEW.role_at_affirm <> OLD.role_at_affirm
         OR NEW.affirmed_at <> OLD.affirmed_at
         OR NEW.attested_at IS NOT NULL THEN
        RAISE EXCEPTION 'only statement and witness are mutable while pending';
      END IF;
      IF NEW.witness_id IS DISTINCT FROM OLD.witness_id THEN
        IF NEW.witness_id IS NULL THEN
          RAISE EXCEPTION 'a named witness is required';
        END IF;
        IF NOT public.is_affirmed_member(NEW.witness_id) THEN
          RAISE EXCEPTION 'witness must be an Affirmed Member';
        END IF;
        IF OLD.role_at_affirm = 'ally' THEN
          SELECT role INTO v_witness_role
          FROM public.profiles WHERE id = NEW.witness_id;
          IF v_witness_role IS NULL
             OR v_witness_role NOT IN ('returnee','anchor') THEN
            RAISE EXCEPTION 'ally crossings require a returnee or anchor witness';
          END IF;
        END IF;
      END IF;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'an affirmation is immutable after attestation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_attest_affirmation(p_affirmation_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.affirmations
  SET attested_at = now()
  WHERE id = p_affirmation_id
    AND witness_id = auth.uid()
    AND attested_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no pending affirmation naming you as witness';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_attest_affirmation(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_attest_affirmation(uuid) TO authenticated;