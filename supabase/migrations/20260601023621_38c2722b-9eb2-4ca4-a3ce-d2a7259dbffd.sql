-- 1) Advertisers: revoke column-level SELECT on sensitive fields from anon/authenticated.
-- Admins retain full access via the existing "Admins manage advertisers" ALL policy plus table-level grants.
REVOKE SELECT (billing_email, internal_notes, contact_email, contact_phone)
  ON public.advertisers FROM anon, authenticated;

-- 2) Realtime: replace overly broad policies with topic-scoped ones.
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;

-- Helper: is the current user a participant in the conversation referenced by a typing:{uuid} topic?
CREATE OR REPLACE FUNCTION public.is_typing_topic_participant(_topic text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _topic LIKE 'typing:%' THEN EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = NULLIF(substring(_topic from 8), '')::uuid
        AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
    ELSE false
  END;
$$;

-- SELECT (subscribe): allow presence:global, allow typing:{conv} only for participants.
CREATE POLICY "Realtime read: scoped to topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = 'presence:global')
  OR (realtime.topic() LIKE 'typing:%' AND public.is_typing_topic_participant(realtime.topic()))
);

-- INSERT (broadcast/presence): same scope.
CREATE POLICY "Realtime write: scoped to topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() = 'presence:global')
  OR (realtime.topic() LIKE 'typing:%' AND public.is_typing_topic_participant(realtime.topic()))
);