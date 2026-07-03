-- Arc 4 · Cycle 4 · BD059 — Collaborate notification triggers onto add_notification.
-- All SECURITY DEFINER, search_path=public. In-App only. Idempotent.

-- 1) Join request -> notify active leads
CREATE OR REPLACE FUNCTION public.notify_space_join_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug text; v_name text; v_lead record;
BEGIN
  IF NEW.status <> 'invited' THEN RETURN NEW; END IF;
  SELECT slug, name INTO v_slug, v_name FROM spaces WHERE id = NEW.space_id;
  FOR v_lead IN
    SELECT user_id FROM space_members
    WHERE space_id = NEW.space_id AND role = 'lead' AND status = 'active'
  LOOP
    PERFORM add_notification(
      v_lead.user_id, 'space_join_request',
      'New join request',
      'Someone requested to join ' || COALESCE(v_name,'a space') || '.',
      jsonb_build_object('space_id', NEW.space_id, 'requester_id', NEW.user_id),
      '/dna/collaborate/spaces/' || v_slug
    );
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_space_join_request ON public.space_members;
CREATE TRIGGER trg_notify_space_join_request
  AFTER INSERT ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_space_join_request();

-- 2) Join approved -> notify requester
CREATE OR REPLACE FUNCTION public.notify_space_join_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug text; v_name text;
BEGIN
  IF OLD.status = 'invited' AND NEW.status = 'active' THEN
    SELECT slug, name INTO v_slug, v_name FROM spaces WHERE id = NEW.space_id;
    PERFORM add_notification(
      NEW.user_id, 'space_join_approved',
      'You''re in',
      'Your request to join ' || COALESCE(v_name,'a space') || ' was approved.',
      jsonb_build_object('space_id', NEW.space_id),
      '/dna/collaborate/spaces/' || v_slug
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_space_join_approved ON public.space_members;
CREATE TRIGGER trg_notify_space_join_approved
  AFTER UPDATE ON public.space_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_space_join_approved();

-- 3) Task assigned -> notify assignee (skip self)
CREATE OR REPLACE FUNCTION public.notify_space_task_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug text; v_name text; v_actor uuid := auth.uid();
BEGIN
  IF NEW.assignee_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN RETURN NEW; END IF;
  IF NEW.assignee_id = v_actor THEN RETURN NEW; END IF;
  SELECT slug, name INTO v_slug, v_name FROM spaces WHERE id = NEW.space_id;
  PERFORM add_notification(
    NEW.assignee_id, 'space_task_assigned',
    'New task assigned',
    'You were assigned "' || NEW.title || '" in ' || COALESCE(v_name,'a space') || '.',
    jsonb_build_object('space_id', NEW.space_id, 'task_id', NEW.id),
    '/dna/collaborate/spaces/' || v_slug || '/board'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_space_task_assigned ON public.space_tasks;
CREATE TRIGGER trg_notify_space_task_assigned
  AFTER INSERT OR UPDATE OF assignee_id ON public.space_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_space_task_assigned();

-- 4) Task completed -> notify leads + creator, deduped, skip actor
CREATE OR REPLACE FUNCTION public.notify_space_task_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug text; v_name text; v_actor uuid := auth.uid(); v_recip record;
BEGIN
  IF NOT (NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done') THEN RETURN NEW; END IF;
  SELECT slug, name INTO v_slug, v_name FROM spaces WHERE id = NEW.space_id;
  FOR v_recip IN
    SELECT DISTINCT uid FROM (
      SELECT user_id AS uid FROM space_members
        WHERE space_id = NEW.space_id AND role = 'lead' AND status = 'active'
      UNION
      SELECT NEW.created_by AS uid
    ) r
    WHERE uid IS NOT NULL AND uid <> v_actor
  LOOP
    PERFORM add_notification(
      v_recip.uid, 'space_task_completed',
      'Task completed',
      '"' || NEW.title || '" was completed in ' || COALESCE(v_name,'a space') || '.',
      jsonb_build_object('space_id', NEW.space_id, 'task_id', NEW.id),
      '/dna/collaborate/spaces/' || v_slug || '/board'
    );
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_space_task_completed ON public.space_tasks;
CREATE TRIGGER trg_notify_space_task_completed
  AFTER UPDATE OF status ON public.space_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_space_task_completed();

-- 5) Attachment added -> notify active members except uploader
CREATE OR REPLACE FUNCTION public.notify_space_attachment_added()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug text; v_name text; v_recip record;
BEGIN
  IF NEW.attached_to_type <> 'space' THEN RETURN NEW; END IF;
  SELECT slug, name INTO v_slug, v_name FROM spaces WHERE id = NEW.space_id;
  FOR v_recip IN
    SELECT user_id FROM space_members
    WHERE space_id = NEW.space_id AND status = 'active' AND user_id <> NEW.uploaded_by
  LOOP
    PERFORM add_notification(
      v_recip.user_id, 'space_attachment_added',
      'New file',
      'A file was added to ' || COALESCE(v_name,'a space') || '.',
      jsonb_build_object('space_id', NEW.space_id, 'attachment_id', NEW.id),
      '/dna/collaborate/spaces/' || v_slug
    );
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_space_attachment_added ON public.space_attachments;
CREATE TRIGGER trg_notify_space_attachment_added
  AFTER INSERT ON public.space_attachments
  FOR EACH ROW EXECUTE FUNCTION public.notify_space_attachment_added();
