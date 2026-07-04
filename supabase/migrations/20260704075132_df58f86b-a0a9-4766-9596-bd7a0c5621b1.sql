-- BD061 follow-on: Affirmation notifications onto add_notification.
-- Events: witness-request (INSERT), witness-request on re-pick (UPDATE,
-- pending), affirmed-confirmation to declarer (UPDATE, attestation).

CREATE OR REPLACE FUNCTION public.notify_affirmation_witness_request()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.add_notification(
    NEW.witness_id,
    'affirmation_witness_request',
    'You have been named as a witness',
    'A member of the body has named you to witness their Affirmation.',
    jsonb_build_object(
      'affirmation_id', NEW.id,
      'declarer_profile_id', NEW.profile_id,
      'role_at_affirm', NEW.role_at_affirm
    ),
    '/dna/affirm/attest/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_affirmation_update_events()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Attestation: notify the declarer their Affirmation is witnessed.
  IF OLD.attested_at IS NULL AND NEW.attested_at IS NOT NULL THEN
    PERFORM public.add_notification(
      NEW.profile_id,
      'affirmation_attested',
      'Your Affirmation has been witnessed',
      'Your witness has attested your Affirmation. You are an Affirmed Member.',
      jsonb_build_object(
        'affirmation_id', NEW.id,
        'witness_id', NEW.witness_id
      ),
      '/dna/membership'
    );
    RETURN NEW;
  END IF;

  -- Witness re-pick while pending: notify the newly named witness.
  IF NEW.attested_at IS NULL
     AND NEW.witness_id IS DISTINCT FROM OLD.witness_id
     AND NEW.witness_id IS NOT NULL THEN
    PERFORM public.add_notification(
      NEW.witness_id,
      'affirmation_witness_request',
      'You have been named as a witness',
      'A member of the body has named you to witness their Affirmation.',
      jsonb_build_object(
        'affirmation_id', NEW.id,
        'declarer_profile_id', NEW.profile_id,
        'role_at_affirm', NEW.role_at_affirm
      ),
      '/dna/affirm/attest/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_affirmation_insert_trg
AFTER INSERT ON public.affirmations
FOR EACH ROW EXECUTE FUNCTION public.notify_affirmation_witness_request();

CREATE TRIGGER notify_affirmation_update_trg
AFTER UPDATE ON public.affirmations
FOR EACH ROW EXECUTE FUNCTION public.notify_affirmation_update_events();