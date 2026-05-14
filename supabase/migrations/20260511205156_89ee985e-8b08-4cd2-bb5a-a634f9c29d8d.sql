
ALTER TABLE public.dia_messaging_prefs
  ADD COLUMN IF NOT EXISTS email_digest boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient RECORD;
  v_sender_name TEXT;
  v_is_group BOOLEAN;
  v_conv_title TEXT;
  v_payload TEXT;
  v_url TEXT := 'https://ybhssuehmfnxrzneobok.supabase.co/functions/v1/send-push-notification';
  v_anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaHNzdWVobWZueHJ6bmVvYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTI0NzMsImV4cCI6MjA2NDU4ODQ3M30.Uur_V4TYm4yCYtDQAa4diIpdsKoKb5Bkuo0cWNZAY-Y';
  v_title TEXT;
BEGIN
  SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;

  -- Detect group via either conversations.is_group or conversations_new
  SELECT COALESCE(c.is_group, false), COALESCE(c.group_title, cn.title)
    INTO v_is_group, v_conv_title
  FROM conversations c
  FULL OUTER JOIN conversations_new cn ON cn.id = c.id
  WHERE COALESCE(c.id, cn.id) = NEW.conversation_id
  LIMIT 1;

  -- Fan out to all other participants
  FOR v_recipient IN
    SELECT cp.user_id, COALESCE(cp.is_muted, false) AS is_muted
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
  LOOP
    -- Always create in-app notification (only for 1:1; group has its own UX)
    IF NOT v_is_group THEN
      PERFORM create_notification(
        v_recipient.user_id,
        NEW.sender_id,
        'message',
        'New Message',
        COALESCE(v_sender_name, 'Someone') || ' sent you a message',
        '/dna/messages',
        'message',
        NEW.id
      );
    END IF;

    -- Skip push for muted participants
    IF v_recipient.is_muted THEN
      CONTINUE;
    END IF;

    v_title := CASE
      WHEN v_is_group THEN COALESCE(v_conv_title, 'Group') || ' • ' || COALESCE(v_sender_name, 'Someone')
      ELSE COALESCE(v_sender_name, 'New message')
    END;

    v_payload := json_build_object(
      'user_id', v_recipient.user_id,
      'title', v_title,
      'message', LEFT(COALESCE(NEW.content, 'New message'), 140),
      'type', 'message',
      'action_url', CASE WHEN v_is_group
        THEN '/dna/messages/group/' || NEW.conversation_id
        ELSE '/dna/messages/' || NEW.conversation_id END,
      'tag', 'msg-' || NEW.conversation_id
    )::text;

    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon
      ),
      body := v_payload::jsonb
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never break message insert on push failure
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
