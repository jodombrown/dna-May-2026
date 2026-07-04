-- ============================================================================
-- BD060: Notifications triggers regression harness
-- ============================================================================
-- Codifies the Cycle 4 verification block for the five BD059 triggers plus
-- the positive-dedup case for space_task_completed.
--
-- WHAT IT PROVES
--   T1  notify_space_join_request           - invite fires, lead receives
--   T2  notify_space_join_approved          - invited->active fires, requester receives
--   T3a notify_space_task_assigned          - assignee != actor fires
--   T3b notify_space_task_assigned          - self-assign guard suppresses
--   T4a notify_space_task_completed         - actor collapses to self => 0 rows
--   T4b notify_space_task_completed         - non-actor lead + creator both notified
--                                             (positive dedup: actor still excluded)
--   T5a notify_space_attachment_added       - other active member receives
--   T5b notify_space_attachment_added       - uploader excluded
--
-- HOW TO RUN
--   psql "$PG_URL" -f supabase/tests/notifications_triggers_regression.sql
--   The whole block runs in a single transaction wrapped by BEGIN/ROLLBACK,
--   so a successful run leaves the database untouched. If any RAISE fires,
--   the transaction still rolls back on ROLLBACK below.
--
--   Substitute the three USER_* placeholders with real auth.users ids before
--   running; the script cannot invent them (spaces.created_by FK to users).
--
-- IMPERSONATION
--   Uses SET LOCAL role authenticated + SET LOCAL request.jwt.claims to make
--   auth.uid() resolve inside SECURITY DEFINER trigger bodies, exactly as the
--   web client hits the same triggers. RLS is exercised, not bypassed.
-- ============================================================================

\set USER_A '''053d4157-00fd-474c-a6ef-c782ea096d35'''  -- actor / lead / uploader
\set USER_B '''0d5d84e5-2860-4fa3-8501-9bf4a51b458a'''  -- other lead / assignee / other member
\set USER_C '''12743769-ddb3-40c8-86e5-f654ae9579c6'''  -- non-lead creator

\set SPACE_ID     '''00000000-0000-0000-0000-0000000000f2'''
\set SPACE_POS    '''00000000-0000-0000-0000-0000000000f3'''
\set TASK_ASSIGN  '''00000000-0000-0000-0000-000000000b01'''
\set TASK_COMPACT '''00000000-0000-0000-0000-000000000b02'''
\set TASK_POSDED  '''00000000-0000-0000-0000-000000000b03'''
\set ATTACH_ID    '''00000000-0000-0000-0000-000000000c01'''

BEGIN;

-- ----------------------------------------------------------------------------
-- Space 1: five-trigger primary block (T1, T2, T3, T4a, T5)
-- ----------------------------------------------------------------------------
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = json_build_object('sub', :USER_A, 'role','authenticated')::text;

INSERT INTO spaces (id, slug, name, space_type, created_by, visibility, status)
VALUES (:SPACE_ID, 'vregress', 'Regression harness', 'project', :USER_A, 'private', 'active');

-- add_creator_as_member already inserted USER_A as lead active.
-- Invite USER_B => T1 fires (lead A notified).
INSERT INTO space_members (space_id, user_id, role, status)
VALUES (:SPACE_ID, :USER_B, 'contributor', 'invited');

-- Approve USER_B => T2 fires (requester B notified). Bump to lead so T4a has an actor-only lead set.
UPDATE space_members SET status='active', role='lead'
 WHERE space_id=:SPACE_ID AND user_id=:USER_B;

-- Assign a task to USER_B as actor USER_A => T3a fires. Self-assign later tests T3b.
INSERT INTO space_tasks (id, space_id, title, status, created_by, assignee_id)
VALUES (:TASK_ASSIGN, :SPACE_ID, 'Assigned to B', 'open', :USER_A, :USER_B);

-- T3b: reassign to actor (A). Guard should suppress.
UPDATE space_tasks SET assignee_id=:USER_A WHERE id=:TASK_ASSIGN;

-- T4a: task created by A, completed by A. Leads = {A}, creator = A => collapses to actor => 0 rows.
INSERT INTO space_tasks (id, space_id, title, status, created_by, assignee_id)
VALUES (:TASK_COMPACT, :SPACE_ID, 'Actor-only completion', 'open', :USER_A, :USER_A);
UPDATE space_tasks SET status='done' WHERE id=:TASK_COMPACT;

-- T5: A uploads. Recipient set = active members - uploader = {B}. B should get 1, A should get 0.
INSERT INTO space_attachments (id, space_id, uploader_id, attached_to_type, attached_to_id, file_url, file_name)
VALUES (:ATTACH_ID, :SPACE_ID, :USER_A, 'space', :SPACE_ID, 'https://x/y.pdf', 'y.pdf');

-- ----------------------------------------------------------------------------
-- Space 2: positive dedup case for T4b
-- Two leads (A, B) + non-lead creator (C). Task created by C, completed by A.
-- Expected recipients = {B, C}; A excluded by skip-actor.
-- ----------------------------------------------------------------------------
INSERT INTO spaces (id, slug, name, space_type, created_by, visibility, status)
VALUES (:SPACE_POS, 'vpos', 'Positive dedup', 'project', :USER_A, 'private', 'active');

INSERT INTO space_members (space_id, user_id, role, status) VALUES
  (:SPACE_POS, :USER_B, 'lead',        'active'),
  (:SPACE_POS, :USER_C, 'contributor', 'active');

SET LOCAL "request.jwt.claims" = json_build_object('sub', :USER_C, 'role','authenticated')::text;
INSERT INTO space_tasks (id, space_id, title, status, created_by)
VALUES (:TASK_POSDED, :SPACE_POS, 'Positive dedup task', 'open', :USER_C);

SET LOCAL "request.jwt.claims" = json_build_object('sub', :USER_A, 'role','authenticated')::text;
UPDATE space_tasks SET status='done' WHERE id=:TASK_POSDED;

-- ----------------------------------------------------------------------------
-- Assertions
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  a uuid := :USER_A;
  b uuid := :USER_B;
  c uuid := :USER_C;
  n_t1 int; n_t2 int;
  n_t3a int; n_t3b int;
  n_t4a int; n_t4b_total int; n_t4b_actor int; n_t4b_leadb int; n_t4b_creator int;
  n_t5a int; n_t5b int;
BEGIN
  SELECT count(*) INTO n_t1  FROM notifications WHERE type='space_join_request'    AND user_id=a AND payload->>'space_id'=:SPACE_ID;
  SELECT count(*) INTO n_t2  FROM notifications WHERE type='space_join_approved'   AND user_id=b AND payload->>'space_id'=:SPACE_ID;

  SELECT count(*) INTO n_t3a FROM notifications WHERE type='space_task_assigned'   AND user_id=b AND payload->>'task_id'=:TASK_ASSIGN;
  SELECT count(*) INTO n_t3b FROM notifications WHERE type='space_task_assigned'   AND user_id=a AND payload->>'task_id'=:TASK_ASSIGN;

  SELECT count(*) INTO n_t4a FROM notifications WHERE type='space_task_completed'  AND payload->>'task_id'=:TASK_COMPACT;

  SELECT count(*)                                 INTO n_t4b_total   FROM notifications WHERE type='space_task_completed' AND payload->>'task_id'=:TASK_POSDED;
  SELECT count(*) FILTER (WHERE user_id=a)        INTO n_t4b_actor   FROM notifications WHERE type='space_task_completed' AND payload->>'task_id'=:TASK_POSDED;
  SELECT count(*) FILTER (WHERE user_id=b)        INTO n_t4b_leadb   FROM notifications WHERE type='space_task_completed' AND payload->>'task_id'=:TASK_POSDED;
  SELECT count(*) FILTER (WHERE user_id=c)        INTO n_t4b_creator FROM notifications WHERE type='space_task_completed' AND payload->>'task_id'=:TASK_POSDED;

  SELECT count(*) INTO n_t5a FROM notifications WHERE type='space_attachment_added' AND user_id=b AND payload->>'attachment_id'=:ATTACH_ID;
  SELECT count(*) INTO n_t5b FROM notifications WHERE type='space_attachment_added' AND user_id=a AND payload->>'attachment_id'=:ATTACH_ID;

  IF n_t1  <> 1 THEN RAISE EXCEPTION 'T1  join_request:   expected 1 got %',  n_t1;  END IF;
  IF n_t2  <> 1 THEN RAISE EXCEPTION 'T2  join_approved:  expected 1 got %',  n_t2;  END IF;
  IF n_t3a <> 1 THEN RAISE EXCEPTION 'T3a task_assigned:  expected 1 got %',  n_t3a; END IF;
  IF n_t3b <> 0 THEN RAISE EXCEPTION 'T3b self-assign:    expected 0 got %',  n_t3b; END IF;
  IF n_t4a <> 0 THEN RAISE EXCEPTION 'T4a actor-only:     expected 0 got %',  n_t4a; END IF;
  IF n_t4b_total   <> 2 THEN RAISE EXCEPTION 'T4b total:   expected 2 got %', n_t4b_total;   END IF;
  IF n_t4b_actor   <> 0 THEN RAISE EXCEPTION 'T4b actor:   expected 0 got %', n_t4b_actor;   END IF;
  IF n_t4b_leadb   <> 1 THEN RAISE EXCEPTION 'T4b lead_b:  expected 1 got %', n_t4b_leadb;   END IF;
  IF n_t4b_creator <> 1 THEN RAISE EXCEPTION 'T4b creator: expected 1 got %', n_t4b_creator; END IF;
  IF n_t5a <> 1 THEN RAISE EXCEPTION 'T5a attachment recv: expected 1 got %', n_t5a; END IF;
  IF n_t5b <> 0 THEN RAISE EXCEPTION 'T5b uploader excl:   expected 0 got %', n_t5b; END IF;

  RAISE NOTICE 'BD060 regression: all 11 assertions passed';
END $$;

-- ----------------------------------------------------------------------------
-- Rollback: no state persists regardless of pass/fail
-- ----------------------------------------------------------------------------
ROLLBACK;
