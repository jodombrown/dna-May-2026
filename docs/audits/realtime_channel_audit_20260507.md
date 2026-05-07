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

## Phase 2 — HIGH (Pending)

Same anti-pattern (unfiltered subscriptions on high-write tables) at
lower blast radius:

- `useRealtimeReactions`
- `GroupDetailsPage` group likes/comments
- `EventsPage` unfiltered events channel

## Phase 3 — MEDIUM (Pending, needs design)

- Hook multiplication consolidation: `messages` ×3, `notifications` ×4
- Pulse realtime gap-closer for connection-accept

## Phase 4 — LOW (Pending)

- `AccountDrawer` static imports cleanup
- `notificationSystemService.deliverInApp` missing cleanup
