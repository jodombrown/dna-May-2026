-- Drop the permissive realtime topic policies on public.messages that
-- allowed any authenticated client on the 'presence:global' topic to read
-- or insert message rows across conversations they are not part of.
-- Presence/typing broadcast authorization belongs on realtime.messages,
-- not on the messages table itself.
DROP POLICY IF EXISTS "Realtime read: scoped to topic" ON public.messages;
DROP POLICY IF EXISTS "Realtime write: scoped to topic" ON public.messages;