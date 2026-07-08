
## What's actually wrong with the Pulse Bar

The slowness when you tap a Pulse item is not the navigation itself — SPA `<Link>` transitions are instant. The Pulse Bar is quietly saturating the browser and the network so that, at the moment you click, the app is busy doing work it shouldn't be doing. Three concrete defects in `src/hooks/usePulseBar.ts`, plus one contributing factor at the route layer.

### Root cause 1 - Unfiltered realtime subscriptions on the hottest tables

Three of the five realtime channels subscribe with **no `filter`**:

- `contribution_offers` (all rows, all users)
- `post_likes` (every like, platform-wide)
- `post_comments` (every comment, platform-wide)

Every like or comment anyone posts anywhere on DNA fires an event into your browser and invalidates the pulse query. On an active platform this is dozens of events per minute per session. This directly violates the Performance Foundation rule ("every `postgres_changes` MUST include a filter; unfiltered on `post_likes` / `post_comments` / `contribution_offers` is a bug").

### Root cause 2 - Every invalidation refires all 10 fetches

The invalidation key is `[PULSE_QUERY_KEY]`, and the query fn runs `Promise.all` of five fetchers, which themselves issue ~10 Supabase reads (some with joins on `events`, `spaces`, `contribution_needs`, plus a follow-up `profiles.in()` for Connect and two `post_likes` / `post_comments` `.in()` scans for Convey). One stranger's like across the platform = 10 queries fired in parallel from your session. When you tap a Pulse item mid-cascade, the click has to wait for React to finish re-rendering with new data plus for the network to free up.

### Root cause 3 - Redundant 10-minute polling on top of realtime

`refetchInterval: 10 * 60 * 1000` runs regardless of the realtime subscriptions. When realtime is working, the poll is pure overhead; when realtime is broken, it masks the bug. Pick one.

### Contributing factor - Route-level lazy chunks

Every hub in `App.tsx` is `lazy()` (`ConveneHub`, `CollaborateHub`, `ContributeHub`, `ConveyHub`, `Connect`). First tap on each downloads a chunk. That's fine in isolation, but combined with the cascade above it turns a 200-400ms chunk fetch into "forever." Fixing 1-3 makes this feel instant again; we can additionally prefetch the chunk on hover/press.

---

## The fix

### 1. Scope every realtime subscription to this user

In `src/hooks/usePulseBar.ts`:

- `contribution_offers` → add `filter: 'offerer_id=eq.${user.id}'` **and** a second channel for offers on the user's own needs (via a `contribution_needs.created_by` scoped filter, or drop the second channel and rely on the periodic refetch for the "offers received" side if a direct filter isn't available — realtime `postgres_changes` filters don't traverse joins).
- `post_likes` → `filter: 'post_id=in.(...)'` is not supported for realtime; instead subscribe scoped to the user's own posts by switching to a lightweight `author_id`-scoped channel on `posts` for engagement-relevant updates, or drop this channel entirely and let the 10-min poll / manual invalidations from the Convey hub handle it. Same for `post_comments`.
- Keep `connections` (already filtered by `recipient_id`), `event_attendees` (already filtered by `user_id`), `space_members` (already filtered by `user_id`) as-is.

Target: **zero unfiltered channels** on high-write tables. This alone eliminates 95% of the invalidation storm.

### 2. Debounce and narrow the invalidation

- Replace immediate `queryClient.invalidateQueries({ queryKey: [PULSE_QUERY_KEY] })` with a shared debounced invalidator (300-500ms trailing) so bursts collapse into one refetch.
- Key the invalidation to this user: `queryKey: [PULSE_QUERY_KEY, user.id]` so we don't accidentally invalidate across sessions in dev/HMR.

### 3. Drop the redundant poll, lengthen stale time

- Remove `refetchInterval` entirely (realtime + tab-focus refetch is enough).
- Keep `staleTime: 5 * 60 * 1000`.
- Add `refetchOnWindowFocus: false` for pulse — it's ambient, not critical.

### 4. Make the click itself instant

In `src/components/pulse/PulseItem.tsx`:

- On `onMouseEnter` / `onTouchStart` / `onFocus`, call the route's dynamic import so the chunk is warm by the time the click lands. Simplest form: import the page module lazily and trigger the promise on hover; React Router will resolve the already-fetched module synchronously on navigation.
- No visual change; purely a prefetch.

### 5. Verification

After the edits:

1. Reload `/dna/convene`, open DevTools Network, filter to `rest/v1`. Idle for 60s. Expected: **no pulse re-fetch bursts** unless the current user's own data changes.
2. Have a second account like/comment on an unrelated post. Expected: **no network activity** in this session.
3. Tap each Pulse item cold, then warm. Expected: cold ≤ chunk-fetch time, warm ≈ instant.
4. Confirm counts still update when the current user accepts a connection, RSVPs an event, joins a space (the three filtered channels that survive).

---

## Files touched

- `src/hooks/usePulseBar.ts` — realtime scoping, debounced invalidator, drop `refetchInterval`, add `refetchOnWindowFocus: false`.
- `src/components/pulse/PulseItem.tsx` — hover/touch prefetch of the destination route chunk.

No schema changes, no UI changes, no behavior change beyond "it stops thrashing."

---

## Out of scope for this pass (flagging, not doing)

- The messages inbox is issuing a per-conversation `messages?select=id&conversation_id=eq.…` request for every conversation on load (visible in the network snapshot). That's a separate N+1 in the messaging layer and a real perf hit, but it's not the Pulse Bar.
- Full route-code-splitting review across `/dna/*` hubs.
