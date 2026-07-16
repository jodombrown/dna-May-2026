-- N2 notifications convergence — make `read` the canonical read column in code paths.
--
-- This migration is code-before-drop preparation. It does NOT drop `is_read`
-- (that is the N2 DB tail). It:
--   1. Rewrites get_user_notifications to source read-state from `read` and to
--      expose both `read` (canonical) and `is_read` (kept transiently for any
--      still-deployed client that reads the old field). No reference to the
--      is_read column remains inside the function, so the column can later be
--      dropped without breaking this RPC.
--   2. Strengthens notifications_sync_read so the two columns stay in true
--      lockstep on every write (the prior version only filled NULLs, so a
--      write that set only `read` left `is_read` stale — which would keep the
--      is_read-based get_unread_notification_count from decrementing). With
--      this, code that writes only `read` keeps the existing count RPC correct
--      until the DB tail rewrites it and drops the column + trigger.

-- 1. get_user_notifications — read-state from `read`, dual-output for compat.
--    DROP first: adding the `read` OUT column changes the return row type,
--    which CREATE OR REPLACE cannot do. The DROP + CREATE run in one migration
--    transaction, so callers never observe a missing function.
DROP FUNCTION IF EXISTS public.get_user_notifications(uuid, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id uuid,
  p_unread_only boolean DEFAULT false,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  notification_id uuid,
  actor_id uuid,
  actor_username text,
  actor_full_name text,
  actor_avatar_url text,
  type text,
  title text,
  message text,
  action_url text,
  entity_type text,
  entity_id uuid,
  read boolean,
  is_read boolean,
  created_at timestamp with time zone,
  read_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS notification_id,
    p.id AS actor_id,
    p.username AS actor_username,
    p.full_name AS actor_full_name,
    p.avatar_url AS actor_avatar_url,
    n.type,
    n.title,
    n.message,
    n.link_url AS action_url,
    COALESCE(n.payload->>'entity_type', 'notification')::TEXT AS entity_type,
    COALESCE(
      (n.payload->>'entity_id')::UUID,
      (n.payload->>'post_id')::UUID,
      n.id
    ) AS entity_id,
    n.read,
    n.read AS is_read,
    n.created_at,
    CASE WHEN n.read THEN n.updated_at ELSE NULL END AS read_at
  FROM notifications n
  LEFT JOIN profiles p ON p.id = COALESCE(
    (n.payload->>'actor_id')::UUID,
    (n.payload->>'commenter_id')::UUID,
    (n.payload->>'sender_id')::UUID,
    (n.payload->>'from_user_id')::UUID,
    (n.payload->>'requester_id')::UUID,
    (n.payload->>'liker_id')::UUID
  )
  WHERE n.user_id = p_user_id
    AND (NOT p_unread_only OR n.read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 2. notifications_sync_read — true lockstep mirror on INSERT and UPDATE.
CREATE OR REPLACE FUNCTION public.notifications_sync_read()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Both columns are NOT NULL DEFAULT false; honor whichever was set true.
    IF NEW.read THEN
      NEW.is_read := true;
    ELSIF NEW.is_read THEN
      NEW.read := true;
    ELSE
      NEW.read := false;
      NEW.is_read := false;
    END IF;
  ELSE
    -- Mirror whichever column the write actually changed.
    IF NEW.read IS DISTINCT FROM OLD.read THEN
      NEW.is_read := NEW.read;
    ELSIF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
      NEW.read := NEW.is_read;
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$function$;
