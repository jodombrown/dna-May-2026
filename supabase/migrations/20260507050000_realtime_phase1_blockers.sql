-- =====================================================
-- PHASE 1 REALTIME BLOCKER REMEDIATION
-- =====================================================
-- Source: docs/audits/realtime_channel_audit_20260507.md
--
-- This migration enables filtered realtime subscriptions on three
-- tables that previously could not back user-scoped channels:
--
--   1. conversation_participants — backs the user-scoped unread
--      message count subscription (Fix #1 / useUnreadCounts).
--      The `broadcast_new_message` AFTER INSERT trigger on
--      messages_new already increments unread_count on this table,
--      so subscribing to UPDATEs filtered by user_id provides the
--      same signal as the prior unfiltered messages INSERT channel
--      without the platform-wide invalidation storm.
--
--   2. groups — backs GroupsBrowse public-only realtime updates
--      (Fix #3) filtered by privacy=eq.public.
--
--   3. group_members — backs GroupsPage membership-scoped realtime
--      updates (Fix #3) filtered by user_id=eq.<current user>.
--
-- REPLICA IDENTITY FULL is required so UPDATE events include the
-- full row, allowing the realtime server to evaluate user_id and
-- privacy filters against the new row data.
-- =====================================================

-- 1. conversation_participants
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.conversation_participants;
  END IF;
END $$;

-- 2. groups
ALTER TABLE public.groups REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.groups;
  END IF;
END $$;

-- 3. group_members
ALTER TABLE public.group_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.group_members;
  END IF;
END $$;
