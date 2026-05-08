# Realtime Channel Audit — 2026-05-07

Tracks Supabase realtime channel hygiene across the DNA platform. Scope:
identify subscriptions that violate the Performance Foundation Spec
(filter-by-user, no shared channel names, mandatory cleanup) and remediate
in priority order.

Severity tiers used below:

- **BLOCKER** — alpha-blocking. Causes incorrect behavior visible to
  testers (privacy leakage, lost notifications, subscribe collisions).
- **HIGH** — performance-critical. Unfiltered subscriptions on high-write
  tables that will degrade under load.
- **MEDIUM** — architectural. Hook multiplication, gap-closer
  inconsistencies that need design proposals before implementation.
- **LOW** — cleanup. Static imports, missing cleanups in less-used paths.

---

## Phase 1 — BLOCKER (Resolved)

The three alpha-blocker findings from this audit have been remediated on
branch `claude/fix-realtime-blockers-98Z0j` (migration
`20260507050000_realtime_phase1_blockers.sql`). Lovable verification still
pending per the Phase 1 PRD.

### Fix #1 — `useUnreadCounts` no longer subscribes to all messages

**File:** `src/hooks/useUnreadCounts.ts`

**Before:** Subscribed to every `messages` INSERT event platform-wide
(no filter). Every DM sent by any user invalidated every active
session's unread query.

**After:** Subscribes to UPDATE events on `conversation_participants`
filtered by `user_id=eq.${user.id}`. The existing
`broadcast_new_message` AFTER INSERT trigger on `messages_new` already
maintains the denormalized `unread_count` column on this table, so the
new subscription captures the same recipient signal at user scope.
Channel renamed to `unread-messages-${user.id}` for clarity.

Migration `20260507050000_realtime_phase1_blockers.sql` adds
`conversation_participants` to the `supabase_realtime` publication and
sets `REPLICA IDENTITY FULL` so UPDATE events carry full row data for
filter evaluation.

### Fix #2 — `BadgeToastListener` no longer fires for other users

**File:** `src/components/notifications/BadgeToastListener.tsx`

**Before:** Filtered by `type=eq.badge_awarded` only. Every badge earned
by any user platform-wide produced a toast in every active session — a
privacy-adjacent regression.

**After:** Filters by `user_id=eq.${user.id}` (Realtime
`postgres_changes` only supports a single filter per subscription) and
performs a client-side check on the `type` field inside the handler.
Channel renamed to `badge-toasts-${user.id}`. The component now consumes
`useAuth()` and skips subscription until the user is loaded.

### Fix #3 — Groups subscribe collision and platform-wide invalidation

**Files:** `src/pages/GroupsPage.tsx`, `src/pages/dna/convene/GroupsBrowse.tsx`

**Before:** Both components subscribed to a shared channel name
`groups_updates` with no filter. Two issues compounded:

1. The shared name caused subscribe/unsubscribe lifecycle ambiguity
   when both pages mounted concurrently.
2. The unfiltered `event: '*'` subscription invalidated both queries
   for every group action by every user.

**After:**

- `GroupsPage` (member-facing): channel `groups-page-${user.id}`,
  subscribed to `group_members` filtered by `user_id=eq.${user.id}`.
  Membership joins/leaves and role changes for the current user drive
  refetch; broader group activity is handled by the existing query
  staleness window.
- `GroupsBrowse` (discovery surface): channel
  `groups-browse-${user.id}`, subscribed to `groups` INSERT filtered
  by `privacy=eq.public`. Private and secret groups are intentionally
  excluded from the discovery realtime path.

Migration adds both `groups` and `group_members` to the
`supabase_realtime` publication with `REPLICA IDENTITY FULL`.

### Out-of-scope sighting noted during Phase 1

`src/components/_archived/dashboard/DashboardGroupsColumn.tsx` still
contains the original unfiltered `groups_updates` subscription. The file
is in the `_archived/` tree and is not imported by any active code path,
so it does not affect runtime behavior. Left as-is to keep Phase 1 scope
tight; can be deleted as part of a future archive cleanup.

---

## Phase 2 — HIGH (Resolved)

The three Phase 2 HIGH-severity findings have been remediated on branch
`claude/fix-realtime-subscriptions-OkVEz`. Lovable verification still
pending per the Phase 2 PRD.

Schema check performed against the migrations in `supabase/migrations/`:

- `post_likes`, `post_reactions` — only `post_id`, `user_id`. **No**
  `post_author_id` denormalization, so Approach A (author-scoped) was
  not available without a new migration; Approach B (post-set-scoped)
  was used instead.
- `group_post_likes`, `group_post_comments` — only `post_id`,
  `user_id`/`author_id`. **No** `group_id` denormalization, so the
  filter is `post_id=in.(...)` against the currently-loaded group post
  set rather than `group_id=eq.${groupId}`.

### Fix #1 — `useRealtimeReactions` scoped to a post set

**File:** `src/hooks/useRealtimeReactions.ts`,
`src/contexts/SocialFeedContext.tsx`

**Before:** Subscribed to every `post_likes` and `post_reactions`
INSERT/DELETE platform-wide. Every reaction by any user invalidated
every active session that mounted the hook.

**After:** Hook now requires a `postIds: readonly string[]` prop. When
the array is empty, no subscription is created. When non-empty, both
channels carry `filter: post_id=in.(${ids.join(',')})`. The post-id key
is sorted and joined to give a stable dependency that doesn't rebuild
the channel for the same set in a different array reference.
`SocialFeedProvider` derives the post set from `Object.keys(engagement)`
(the posts it has been asked to track via `initializePost`).

### Fix #2 — `GroupDetailsPage` scoped to current group's post set

**File:** `src/pages/GroupDetailsPage.tsx`

**Before:** A single channel subscribed to `group_posts` (filtered by
`group_id`), `group_members` (filtered by `group_id`), and unfiltered
`group_post_likes` and `group_post_comments`. Every like/comment on
every group's posts platform-wide invalidated every session viewing any
group.

**After:** The channel is split. The original `group_${groupId}_updates`
channel keeps `group_posts` and `group_members` (both already filtered
by `group_id`). A second channel
`group_${groupId}_engagement_${idCount}` subscribes to
`group_post_likes` and `group_post_comments` filtered by
`post_id=in.(...)` against the loaded posts query result. The
engagement channel is rebuilt when posts change (e.g. a new post
arrives via the `group_posts` subscription, which triggers a refetch,
which yields a new post-id key).

### Fix #3 — `EventsPage` realtime removed in favor of 60s polling

**File:** `src/pages/EventsPage.tsx`

**Before:** Subscribed to all `events` table changes (INSERT/UPDATE/
DELETE) with no filter. Every event created or modified by any user
invalidated every session's events page.

**After:** Realtime channel removed entirely. The existing `useQuery`
gains `refetchInterval: 60_000`. Events are infrequent compared to
reactions/comments, so 60 second freshness is acceptable and the cost
of an unfiltered channel is not justified. If product feedback later
demands sub-5s freshness for invited events specifically, the rollback
plan is to add Option 2 (filter by `event_attendees` membership scope).

## Phase 3 — MEDIUM (Pending, needs design)

- Hook multiplication consolidation: `messages` ×3, `notifications` ×4
- Pulse realtime gap-closer for connection-accept

## Phase 4 — LOW (Pending)

- `AccountDrawer` static imports cleanup
- `notificationSystemService.deliverInApp` missing cleanup
