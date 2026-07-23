-- Demolish the unchartered community model.
--
-- Rationale: the community model is absent from the v0.0 Scope Charter §2 surface set
-- (seven surfaces IN — App, Membership, Daily, Collaborate, ROADMAP, Directory, Website —
-- Communities is not among them, and is not even a named deferral). Five tables, all at
-- 0 rows; the sole application consumer (src/services/communityPostsService.ts) is dead
-- (no static or dynamic importers); zero external FK dependents; the only dependent
-- database function is the community-only privilege-escalation guard. The model duplicates
-- Chapters (D029/D030 DNA × Place) and Spaces (D084 space_tasks substrate).
--
-- Supersedes the community_memberships SELECT/UPDATE self-referential recursion finding
-- (42P17 at plan time) as won't-fix: the table carrying the recursion is removed.
--
-- Verified before apply: 0 rows across all five tables, 0 external FK dependents,
-- 0 unexpected function dependents, 0 view dependents. Idempotent (IF EXISTS),
-- children-first, no CASCADE (an unknown dependent would fail loudly rather than drop silently).
DROP TABLE IF EXISTS public.community_event_attendees;   -- leaf -> community_events
DROP TABLE IF EXISTS public.community_posts;             -- leaf -> communities
DROP TABLE IF EXISTS public.community_events;            -- -> communities
DROP TABLE IF EXISTS public.community_memberships;       -- -> communities
DROP TABLE IF EXISTS public.communities;                 -- root
DROP FUNCTION IF EXISTS public.prevent_community_privilege_escalation();
