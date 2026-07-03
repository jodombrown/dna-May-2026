
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a uuid;
  v_user_b uuid;
  v_recipient uuid;
  v_sender_name text;
  v_sender_avatar text;
  v_preview text;
  v_content text;
BEGIN
  -- Skip if message soft-deleted at insert
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_a, user_b INTO v_user_a, v_user_b
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF v_user_a IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient := CASE WHEN v_user_a = NEW.sender_id THEN v_user_b ELSE v_user_a END;

  IF v_recipient IS NULL OR v_recipient = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name, avatar_url INTO v_sender_name, v_sender_avatar
  FROM public.profiles
  WHERE id = NEW.sender_id;

  v_sender_name := COALESCE(v_sender_name, 'Someone');
  v_content := COALESCE(NULLIF(trim(NEW.content), ''), '');
  IF v_content = '' THEN
    v_preview := v_sender_name || ' sent you a message.';
  ELSE
    v_preview := v_sender_name || ': "' || left(v_content, 100) ||
                 CASE WHEN length(v_content) > 100 THEN '...' ELSE '' END || '"';
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, message, link_url, is_read, payload
  ) VALUES (
    v_recipient,
    'new_message',
    'New Message',
    v_preview,
    '/dna/messages/' || NEW.conversation_id::text,
    false,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'sender_name', v_sender_name,
      'sender_avatar', v_sender_avatar,
      'conversation_id', NEW.conversation_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block message send
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_message_notification ON public.messages;
CREATE TRIGGER trg_create_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.create_message_notification();
