
-- Fix notify_post_comment trigger: post_comments uses user_id, not author_id
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id UUID;
BEGIN
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Skip self-notifications
  IF post_author_id IS NOT NULL AND post_author_id <> NEW.user_id THEN
    PERFORM create_notification(
      post_author_id,
      NEW.user_id,
      'post_comment',
      'New Comment',
      COALESCE((SELECT full_name FROM profiles WHERE id = NEW.user_id), 'Someone') || ' commented on your post',
      '/dna/connect/feed',
      'post',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Security: hide sensitive columns on communities from anon/authenticated
REVOKE SELECT (moderator_notes, rejection_reason, moderated_by) ON public.communities FROM anon, authenticated;

-- Security: hide contact email columns on profiles from other authenticated users
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon, authenticated;

-- Owner can still read their own contact info via this security-definer function
CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE(email text, phone text, phone_number text, whatsapp_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, phone, phone_number, whatsapp_number
  FROM public.profiles
  WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;

-- Security: hide sponsor contact email from anon/authenticated
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon, authenticated;
