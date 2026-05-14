
CREATE OR REPLACE FUNCTION public.get_email_digest_recipients()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  unread_total bigint,
  conversation_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH unread AS (
    SELECT cp.user_id,
           COUNT(DISTINCT cp.conversation_id) AS conv_count,
           COALESCE(SUM(GREATEST(0,
             (SELECT COUNT(*) FROM messages m
              WHERE m.conversation_id = cp.conversation_id
                AND m.sender_id != cp.user_id
                AND m.created_at > COALESCE(cp.last_read_at, 'epoch'::timestamptz))
           )), 0) AS total
    FROM conversation_participants cp
    WHERE COALESCE(cp.is_muted, false) = false
      AND COALESCE(cp.is_archived, false) = false
    GROUP BY cp.user_id
  )
  SELECT u.user_id,
         au.email::text,
         p.full_name,
         u.total AS unread_total,
         u.conv_count AS conversation_count
  FROM unread u
  JOIN auth.users au ON au.id = u.user_id
  LEFT JOIN profiles p ON p.id = u.user_id
  LEFT JOIN dia_messaging_prefs d ON d.user_id = u.user_id
  WHERE u.total > 0
    AND COALESCE(d.email_digest, true) = true
    AND COALESCE(p.last_seen_at, 'epoch'::timestamptz) < now() - interval '24 hours'
    AND au.email IS NOT NULL;
$$;

-- Schedule nightly digest at 14:00 UTC
SELECT cron.unschedule('messaging-email-digest-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'messaging-email-digest-daily');

SELECT cron.schedule(
  'messaging-email-digest-daily',
  '0 14 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ybhssuehmfnxrzneobok.supabase.co/functions/v1/messaging-email-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaHNzdWVobWZueHJ6bmVvYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTI0NzMsImV4cCI6MjA2NDU4ODQ3M30.Uur_V4TYm4yCYtDQAa4diIpdsKoKb5Bkuo0cWNZAY-Y'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
