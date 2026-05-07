# Composer Unification — Backend Verification Report

Branch: `claude/composer-backend-verification-uRkjG`
Scope: Verify universal Post Composer create-paths preserve every Sprint 2 / Sprint 3.6 interconnection side effect; consolidate where divergent.

---

## Phase 1 — Audit

### Composer submission systems (current state)

The universal composer ships with **two parallel submission services**, of which only one is actually wired to the live submit button:

| Service | File | Status |
|---|---|---|
| `MODE_HANDLERS` (live) | `src/components/composer/modeHandlers.ts` | Wired to `useUniversalComposer.submit` → `UniversalComposer.tsx` |
| `composerService` (dormant) | `src/services/composerService.ts` | Only used for `saveDraft`; `submit*` methods unreachable from UI |

### Path-by-path comparison

| Mode | Universal Path (live = `MODE_HANDLERS`) | Legacy Path | Same? | Side Effects Preserved? |
|---|---|---|---|---|
| **event** | `composer/modeHandlers.ts:318` → `supabase.functions.invoke('create-event')` → edge fn `supabase/functions/create-event/index.ts` → `INSERT INTO events` | `components/events/CreateEventDialog.tsx:135` → direct `INSERT INTO events` | YES — both terminate at `INSERT INTO public.events` | ✅ `trg_event_create_thread` (conversation), `trg_create_event_feed_post` (Pulse feed entry) fire on insert from either path. DIA bus + notification triggers are equivalent. Hashtag indexing piggybacks on the feed-post insert. |
| **space** | `composer/modeHandlers.ts:422` — `// STUBBED: Phase 2 teardown` (returns `{ success: true }` without any DB write) | `components/groups/CreateGroupDialog.tsx:106` → `INSERT INTO groups` (NOT `spaces`) | **NO** — universal does nothing; legacy targets the unrelated `groups` table | ❌ **Universal preserves nothing** (no insert, no trigger fires). `trg_space_create_channel` AFTER INSERT ON `spaces` exists in DB but never fires from the universal composer. Legacy form does not touch `spaces` either. |
| **opportunity (need)** | `composer/modeHandlers.ts:445` — `// STUBBED: Phase 2 teardown` (returns `{ success: true }` without any DB write) | None located in `src/` | **NO** — universal stubbed; no legacy form exists | ❌ `trg_opportunity_create_thread` AFTER INSERT ON `opportunities` exists in DB but never fires. |
| story / post / community | `feedWriter.createStandardPost` / `createStoryPost` / `createCommunityFeedPost` + direct `community_posts` insert | n/a | n/a | ✅ Existing post-side triggers preserved. |

### Existing DB-level side-effect machinery (verified)

- `trg_event_create_thread` (`20260220050734_*.sql:266`) → `create_event_messaging_thread`
- `trg_space_create_channel` (`20260220050734_*.sql:332`) → `create_space_messaging_channel` (`spaces`)
- `trg_opportunity_create_thread` (`20260220050734_*.sql:409`) → `create_opportunity_messaging_thread`
- `trg_create_event_feed_post` (`20260108060504_*.sql:36`) → posts row in `posts` for Pulse feed
- `trg_space_member_join_channel` (`20260220050734_*.sql:386`) → auto-adds new members to channel
- `trg_collab_space_create_channel` was dropped with `collaboration_spaces` in `20260429100000_*.sql:139`

### Schema state today (relevant tables)

- `events` — current (`20251025171327_*.sql`); has `is_cancelled` (no `status` column).
- `spaces` — locked-spec (`20260429100000_*.sql`); visibility ∈ {public, community, private, stealth}.
- `collaboration_spaces` — **dropped**.
- `opportunities` — composer-shape (`20260212100000_*.sql`); columns: `direction`, `category`, `compensation_type`, `location_relevance`, `audience`, `status`. Legacy `type`/`visibility`/`location` columns are gone.

### Audit conclusion — Phase 2 triggered

Two of the three universal paths are stubs. Trigger network in the database is intact and ready, but the universal composer never reaches it for spaces / opportunities. Phase 2 therefore creates a single consolidated RPC per entity that the composer (and Lovable's UI rebuild) can call to guarantee both the entity insert and the linked-thread/channel id arrive together.

---

## Phase 2 — Consolidated RPCs

Migration: `supabase/migrations/20260507040000_composer_consolidated_rpcs.sql`

Three SECURITY DEFINER functions, each:

- requires `auth.uid()` (raises 42501 on anon)
- sets `created_by` / `organizer_id := auth.uid()` so the table's own RLS INSERT policy authorises the row
- runs as a single implicit transaction (PostgreSQL rolls back the entity insert if the linked-conversation read or fallback create fails)
- relies on the existing AFTER INSERT triggers to materialise the linked conversation; falls back to the public `create_*_messaging_*` helper if the trigger swallowed an exception
- returns JSONB with both the entity id and the linked thread / channel id so the UI can navigate post-creation

| RPC | Returns | Trigger relied on | Fallback |
|---|---|---|---|
| `create_event_with_thread(...)` | `{ entity_id, linked_thread_id }` | `trg_event_create_thread` | `create_event_messaging_thread` |
| `create_space_with_channel(...)` | `{ entity_id, linked_channel_id }` | `trg_space_create_channel` + `trg_space_member_join_channel` (creator added to `space_members` so they enter the channel) | `create_space_messaging_channel` |
| `create_opportunity_with_thread(...)` | `{ entity_id, linked_thread_id }` | `trg_opportunity_create_thread` | `create_opportunity_messaging_thread` |

All three are `REVOKE ALL FROM PUBLIC` then `GRANT EXECUTE TO authenticated`.

### RLS confirmation

No new tables are introduced — only functions — so there are no new RLS policies to write. The RPCs operate against tables whose RLS policies (`events_insert`, `spaces` policies from `20260429100000`, `Users can create opportunities`) all check `auth.uid() = organizer_id|created_by`. Because each RPC sets that column to `auth.uid()` before insert, every existing INSERT policy passes. No new exception is granted.

The RPCs validate inputs server-side (title length, future start time, format-specific location/meeting requirements, direction/visibility enums) so the contract holds even when callers skip client-side validation.

---

## Phase 3 — Seed Data Reconciliation

`SEED_DATA.sql` had three concrete drift points against the current schema; all are fixed:

1. **`events`** — was inserting `status = 'published'` (column doesn't exist). Replaced with explicit `is_public = true, is_cancelled = false` and added `meeting_url` placeholders for virtual/hybrid rows so the `valid_location` CHECK constraint passes.
2. **`collaboration_spaces`** — table was dropped (`20260429100000`). Rewrote all five space inserts against the canonical `spaces` table (`name`, `slug`, `space_type`, `status`, `visibility`, `created_by`).
3. **`opportunities`** — legacy `type / visibility / location` columns are gone. Rewrote all ten inserts against the composer schema (`direction`, `category`, `compensation_type`, `location_relevance`, `audience`, `status`, plus `specific_region` / `specific_country` where applicable).

The bottom verification query was also updated from `collaboration_spaces.title` to `spaces.name`.

---

## Phase 4 — Type-Debt Sweep on Touched Files

Files touched in Phases 1–3:

- `supabase/migrations/20260507040000_composer_consolidated_rpcs.sql` (new)
- `SEED_DATA.sql` (modified)

Both are SQL. There are no TypeScript `any` types, `console.log` statements, or hardcoded URLs in source code to replace as a result of Phases 1–3. The seed SQL contains `meeting_url` placeholder strings (`https://meet.example.com/...`) — these are seed data values, not constants in TypeScript code, so they remain in-file.

| Touched file | `any` removed | `console.log` removed | URLs extracted |
|---|---|---|---|
| `20260507040000_composer_consolidated_rpcs.sql` | 0 (n/a, SQL) | 0 (n/a, SQL) | 0 (n/a, SQL) |
| `SEED_DATA.sql` | 0 (n/a, SQL) | 0 (n/a, SQL) | 0 (URLs are seed data, not code) |

No TypeScript files were modified, so no type debt was introduced.

---

## Out-of-scope (deferred to Lovable)

Per the brief, these are explicitly **not** addressed here:

- Wiring `MODE_HANDLERS.space.submit` and `MODE_HANDLERS.need.submit` to call the new RPCs (UI change).
- Deletion of `CreateEventDialog.tsx` / `CreateGroupDialog.tsx` legacy forms.
- Route-definition changes.
- Composer UI behaviour.

When Lovable lands the UI rebuild, the call shape is:

```ts
const { data, error } = await supabase.rpc('create_event_with_thread', { ... });
// data: { entity_id: uuid, linked_thread_id: uuid }
```

…and equivalent for `create_space_with_channel` / `create_opportunity_with_thread`. Both ids are returned together so the success screen can navigate to either the entity or the linked thread without a second round trip.
