# Space Feature Audit

**Date**: 2026-07-02
**Auditor**: Claude
**Scope**: The COLLABORATE "Spaces" feature end-to-end — routes/pages, live frontend
surfaces, database schema, RPCs/RLS, and TypeScript type contracts.
**Method**: Static analysis of `src/` and `supabase/migrations/` at branch
`claude/space-feature-audit-2144no` (even with `main`, no commits ahead at audit time).

> This is a **current-state** audit. It supersedes the pre-teardown
> `docs/audits/collaborate-architecture-audit.md` (2024-12-30), which describes an
> implementation (`useSpaces.ts`, `useSpaceMutations.ts`, `SpaceInsights.tsx`,
> `SuggestedSpaces.tsx`, `CollaborateHub` with live "My Spaces") that **no longer exists**.

---

## Executive Summary

The Spaces feature is in a **half-torn-down state**. A "Phase 2 teardown" removed the
entire user-facing implementation and a "R1-B-1 cleanup" migration reshaped the database
toward a new "locked spec" — **but the promised "R1-B-2" schema-creation migration was
never written**, and the frontend rebuild ("Phase 3") has not started.

What that leaves today:

- **Every routed Space page is a placeholder.** All of `/dna/collaborate/spaces/*`,
  `/dna/collaborate/my-spaces`, the legacy `/dna/spaces/*`, and `CollaborateHub` render
  `RebuildingPlaceholder`. There is no working create / browse / detail / board / settings flow.
- **The teardown was applied inconsistently on the frontend.** Profile Space surfaces are
  correctly hidden behind `REBUILD_FLAGS.collaborateContributeRebuild`, but the **feed left
  panel** (the most-visited surface) still renders live Space data and links every item into
  the stub pages — a live dead-end for any member of an active space.
- **The database is inconsistent with itself.** Tables were dropped "to be recreated" and
  never were; a handful of legacy `space_*` tables were orphaned (never dropped, never
  truncated); the `spaces.status` column default violates its own newly-added CHECK
  constraint; and RLS does not cover the new default visibility value.
- **TypeScript contracts are stale across the board.** Hand-written types still encode the
  pre-teardown enums (`invite_only`, `idea`), reference a dropped column (`privacy_level`),
  and are missing all 8 columns added by the locked spec. The generated Supabase types were
  not regenerated after the migration.

None of the *live* surfaces crash (the tables they touch still exist), so this is not a
"site is down" situation — it is a **feature that is off, leaking into the UI, and not yet
safe to turn back on**.

---

## 1. Route & Page Status

Routes from `src/App.tsx`; path constants from `src/config/routes.ts`.

| Route | Component | Status |
|---|---|---|
| `/dna/collaborate` | `CollaborateHub` | 🟡 `RebuildingLanding` placeholder (+ mobile header) |
| `/dna/collaborate/spaces` | `SpacesIndex` | 🔴 Stub |
| `/dna/collaborate/spaces/new` | `CreateSpace` | 🔴 Stub |
| `/dna/collaborate/spaces/:slug` | `SpaceDetail` (collaborate) | 🔴 Stub |
| `/dna/collaborate/spaces/:slug/board` | `SpaceBoard` | 🔴 Stub |
| `/dna/collaborate/spaces/:slug/settings` | `SpaceSettings` | 🔴 Stub |
| `/dna/collaborate/my-spaces` | `MySpaces` | 🔴 Stub |
| `/dna/spaces` (legacy) | `CollaborationSpaces` | 🔴 Stub |
| `/dna/spaces/:id` (legacy) | `SpaceDetail` | 🔴 Stub |
| `/dna/space/:slug` (legacy) | `LegacySpaceSlugRedirect` | ↪️ Redirects to a stub |
| `/admin/spaces` | `SpaceManagement` | 🟠 Live shell, no data |
| `/admin/spaces/moderation` | `SpaceModeration` | 🟠 Live shell, empty state |

All 🔴 stubs are `export default function X() { return <RebuildingDetailPlaceholder module="collaborate" />; }`.

---

## 2. What the Teardown Removed

Deleted source (referenced by the prior audit, confirmed **gone**):
`src/hooks/useSpaces.ts`, `src/hooks/useSpaceMutations.ts`,
`src/components/collaboration/SpaceInsights.tsx`,
`src/components/collaboration/SuggestedSpaces.tsx`, and the live `CollaborateHub` body.

Retained but now **dead** (no reachable caller while the feature is off):
- `src/hooks/useSpaceChannel.ts` — only consumers were the now-stubbed detail/board pages.
- `src/types/spaceTypes.ts` — only importer is the flag-gated `ProfileV2Spaces.tsx`.
- `messagingPrdService` space-channel methods: `getSpaceChannel` (only caller is the dead
  hook), `getSpaceChannels` (no callers), `createSpaceChannel` (exposed via `useMessagingPrd`
  but nothing consumes it). The shared `getConversationsByContext` helper is still live for
  its `'event'`/`'opportunity'` variants; only the `'space'` wrappers are orphaned.
- `src/components/_archived/misc/*` Space widgets and `feed/activity-cards/FeedSpaceCard.tsx`
  (reachable only through a barrel that is imported nowhere) — fully dead.

---

## 3. Database State

Migrations apply in timestamp order; later statements win. The two reshaping migrations are
`20260429000000_teardown_collaborate_contribute_truncate.sql` (data TRUNCATE only) and
`20260429100000_collaborate_rebuild_r1b1_cleanup_remediation.sql` (drops + `spaces` augment).

### 3.1 🔴 CRITICAL — the "R1-B-2" schema-creation migration does not exist

`20260429100000` explicitly states *"Does NOT create any new tables (R1-B-2 does that)"* and,
on that promise, drops `space_activity_log`, `milestones`, `tasks`, `initiatives`,
`collaborate_tasks`, and `collaborate_nudges`. **No R1-B-2 migration was ever written.** Every
migration after `20260429100000` (through the latest, `20260702021701`) is unrelated (feed,
messaging, composer, right-rail). There is **no `boards` table anywhere** in the repo, and the
board/task/milestone layer that a Space board page needs is simply absent. The COLLABORATE
schema is stuck mid-rebuild.

### 3.2 `spaces` table — EXISTS (augmented)

Created `20251114061454`, augmented by the cleanup. Locked-spec highlights:
`visibility` CHECK `('public','community','private','stealth')` DEFAULT `'community'`;
`status` CHECK `('active','paused','completed','archived')`;
new columns `slug` (unique), `cover_image_url`, `cultural_pattern`, `currency_type`, `scale`,
`tier`, `owner_user_id` (FK→profiles), `primary_language`, `template_id` (retyped UUID→TEXT),
`archived_at`, `archive_reason`; dropped `privacy_level` and the old UUID `template_id` FK.

**🔴 BUG — `status` default violates its own CHECK.** The column default is still
`'idea'` (`20251114061454` line 9); the cleanup re-added the CHECK as
`('active','paused','completed','archived')` but never altered the default. Any
`INSERT` that omits `status` defaults to `'idea'` → **CHECK violation → insert fails**.
*Mitigation:* the canonical `create_space_with_channel` RPC passes `p_status DEFAULT 'active'`
explicitly, so the intended create path is safe; the bug bites only a direct
`.from('spaces').insert()` that omits `status`. Fix: `ALTER COLUMN status SET DEFAULT 'active'`.

### 3.3 Other `space_*` tables

| Table | State | Notes |
|---|---|---|
| `space_members` | ✅ EXISTS | **Legacy schema** (composite PK, `role` CHECK `lead/core_contributor/contributor`, `status` CHECK `active/invited/removed`). R1-B-2 was meant to recreate it — did not. |
| `space_reports` | ✅ EXISTS | Created `20251231100001`; cleanup repointed FK→`spaces`, rewrote `set_space_report_creator_id()` and RLS. **Missing from generated `types.ts`** — see §5. |
| `space_templates` | ✅ EXISTS | Explicitly **preserved** by cleanup. |
| `space_roles` | ✅ EXISTS | Explicitly **preserved** by cleanup. |
| `space_activity_log` | 🔴 DROPPED, not recreated | `DROP ... CASCADE` in cleanup with "R1-B-2 recreates" — R1-B-2 never ran. |
| `space_tasks` | 🟠 ORPHANED | Legacy table; never truncated, never dropped; outside locked architecture; still queried by `SpaceManagement`. |
| `space_updates` | 🟠 ORPHANED | Legacy leftover; never touched by teardown. |
| `space_attachments` | 🟠 ORPHANED | Legacy leftover. |
| `space_task_dependencies` | 🟠 ORPHANED | Legacy leftover; FK → `space_tasks`. |
| `collaboration_spaces` / `collaboration_memberships` | 🔴 DROPPED | Retired by cleanup. |

### 3.4 RPCs / functions

Live: `create_space_messaging_channel`, `get_thread_participant_count`,
`create_space_with_channel` (post-cleanup; inserts Space + creator-as-lead + channel),
`set_space_report_creator_id`, `add_creator_as_member`, and the membership/util family
(`is_member_of_space`, `rpc_request_join_space`, `rpc_membership_approve/reject`, etc.).
**Orphaned:** `update_space_activity()` — its triggers were on `collaborate_tasks`/`initiatives`,
both dropped, so it is now attached to nothing. **Dropped:** `trg_auto_create_collab_space_channel()`.

### 3.5 RLS gaps

- **`spaces` SELECT** exposes only `visibility = 'public'` OR membership. The new default
  visibility is `'community'`, which the public-read branch does **not** cover → community
  spaces are invisible to non-members despite the naming. New `owner_user_id` has no policy
  (policies still key on `created_by`).
- **`space_members` SELECT** is self-only (`user_id = auth.uid()`) — a member cannot read the
  rest of their space's roster, and other tables' RLS subqueries (`EXISTS (SELECT 1 FROM
  space_members …)`) inherit this restriction.
- `space_reports` RLS was correctly rewritten by the cleanup and is consistent.

---

## 4. Frontend Surface Classification

**Live & ungated (⚠️ leaking):**
- `FeedLeftPanel` → rendered on every feed visit (`src/pages/dna/Feed.tsx`). Queries
  `space_members` for Five-C stat counts; hosts `FeedActiveSpaces`.
- `FeedActiveSpaces` — **the most exposed Space surface.** Queries `space_members` + `spaces`
  (both exist, no error) and renders the user's active spaces. Every item
  `navigate('/dna/collaborate/spaces/${space.id}')` → **stub placeholder** (also navigates by
  `.id` where the rebuilt route expects `:slug`).
- `feed/cards/SpaceCard.tsx` — rendered for any feed item of `type === 'space'`; "View Space"
  → same stub route.

**Live but data-neutered (admin):**
- `SpaceManagement` (`/admin/spaces`) — reachable, renders, but its space list is **hard-coded
  to empty** ("table retired… no-op") and archive is a no-op. A shell with zero data. "View
  Space" `window.open` → stub. Its `SpaceWithDetails` interface still models retired
  `collaboration_spaces` columns (`title`, `image_url`, `tags`).
- `SpaceModeration` (`/admin/spaces/moderation`) — reachable; queries `space_reports` (which
  **does exist** in the DB) via an `as any` cast and defensively handles `42P01`. Archive-space
  step is a no-op. Functional for report triage, hollow for enforcement.

**Gated (hidden by `REBUILD_FLAGS`, wired to a live route):**
- `ProfileV2Spaces` — consumer `ProfileV2.tsx` is live (`/dna/:username`); returns `null` while
  the flag is `true`. Flip the flag and it renders — but it filters `status in ['active','idea']`
  (dead value) and links to stub routes.

**Dead (gated *and* unrouted, or no importer):**
- `ProfileSpacesSection` — flag-gated **and** its only consumer (`PublicProfile.tsx`) is lazy-
  imported but never mounted on any `<Route>`.
- `_archived/misc/*`, `FeedSpaceCard`, `useSpaceChannel`, and the `messagingPrdService`
  space-channel methods (see §2).

### Dead-end navigation into stubs (live callers)

These live paths send users to a `RebuildingPlaceholder`:
`FeedActiveSpaces`, `SpaceCard`, `FeedContributionCard`, `NotificationItem` /
`NotificationsDropdown` (space notifications), `DiaSearch`, `FiveCsEngagement`,
`NetworkActivityFeed`, `useDailyPulse` (task deep-links), plus admin "View Space" buttons.

---

## 5. Type / Contract Drift (TS vs DB)

**`src/types/spaceTypes.ts`** (hand-written, stale):
- `SpaceStatus = 'idea' | 'active' | 'completed' | 'paused'` — includes dropped `'idea'`,
  missing `'archived'`.
- `SpaceVisibility = 'public' | 'invite_only'` — `'invite_only'` is invalid; missing
  `'community'`, `'private'`, `'stealth'`.
- `interface Space` is missing all 8 new columns (`cultural_pattern`, `currency_type`, `scale`,
  `tier`, `owner_user_id`, `primary_language`, `cover_image_url`, `archived_at`,
  `archive_reason`); `external_link` has no DB column (phantom).

**`src/integrations/supabase/types.ts`** (generated, not regenerated post-migration):
- Still declares dropped `privacy_level` (Row/Insert/Update) and a stale
  `spaces_template_id_fkey → space_templates` relationship.
- Missing all 8 new columns.
- **Omits the `space_reports` table entirely** (which is why `SpaceModeration` casts to `any`).

**`src/types/collaborate.ts`** (hand-written, stale):
- `PrivacyLevel` / `privacy_level` (lines 1, 42, 65) reference a dropped column.

**Code reading/writing dropped values:**
- `ProfileV2Spaces.tsx:64,102` — `.in('status', ['active','idea'])` (dead value `'idea'`).
- `ConveyItemForm.tsx:37,62` — `spaceVisibility === 'invite_only'` (dead value).

> Note: `privacy_level` and `invite_only` also appear in **posts/feed** and **groups/events**
> code respectively — those belong to *different* tables that legitimately retain those
> columns/enums and are **not** Spaces drift.

---

## 6. Prioritized Findings

### P0 — Correctness / must fix before rebuild
1. **Write the missing R1-B-2 migration** (or formally re-scope). The dropped
   `space_activity_log` and the boards/tasks/milestones layer must be (re)created before any
   Space board/task UI can exist. (§3.1)
2. **Fix `spaces.status` default** — `ALTER COLUMN status SET DEFAULT 'active'`; the current
   `'idea'` default violates the CHECK on any status-less insert. (§3.2)

### P1 — Broken/leaking UX & security
3. **Gate the feed Space surfaces** behind `REBUILD_FLAGS` (or hide the "Active Spaces"
   section) — `FeedActiveSpaces` / `FeedLeftPanel` / `SpaceCard` currently dead-end users into
   the teardown placeholder. Aligns feed with the already-gated profile surfaces. (§4)
4. **RLS: cover `'community'` visibility** in the `spaces` SELECT policy (currently only
   `'public'` + membership), and reconsider the self-only `space_members` SELECT so members can
   read their roster. Decide policy treatment of `owner_user_id`. (§3.5)

### P2 — Cleanup / contract hygiene
5. **Regenerate `src/integrations/supabase/types.ts`** so it reflects the locked `spaces`
   schema and includes `space_reports` (removes the `as any` cast in `SpaceModeration`). (§5)
6. **Update hand-written types** (`spaceTypes.ts`, `collaborate.ts`) to the locked enums/columns;
   remove `'idea'`/`'invite_only'`/`privacy_level`/`external_link`; fix
   `ProfileV2Spaces` and `ConveyItemForm` value comparisons. (§5)
7. **Decide the fate of orphaned tables** `space_tasks`, `space_updates`, `space_attachments`,
   `space_task_dependencies` and the orphaned `update_space_activity()` function — either fold
   into the locked architecture or drop them. (§3.3, §3.4)
8. **Delete dead code** once the rebuild plan is set: `useSpaceChannel`, orphaned
   `messagingPrdService` space methods, `_archived/misc/*` widgets, `FeedSpaceCard`. (§2)
9. **Correct `docs/04-FEATURE-STATUS.md`** — it still claims "✅ Space creation and management"
   and "✅ Public/private spaces," which is false while the feature is stubbed.

---

## 7. Phase 3 Rebuild Readiness Checklist

- [ ] R1-B-2 migration authored: `space_members` (locked schema), `space_activity_log`,
      boards/tasks/milestones layer created.
- [ ] `spaces.status` default corrected.
- [ ] RLS updated for `community` visibility and `owner_user_id`; `space_members` read scope decided.
- [ ] Orphaned `space_*` tables + `update_space_activity()` resolved (adopt or drop).
- [ ] `types.ts` regenerated; `spaceTypes.ts` / `collaborate.ts` aligned to locked spec.
- [ ] Route params standardized on `slug` (feed/admin currently pass `id`).
- [ ] Feed Space surfaces gated until pages exist (no dead-ends).
- [ ] Stub pages replaced; `REBUILD_FLAGS.collaborateContributeRebuild` flipped to `false`.
- [ ] Dead code removed; `docs/04-FEATURE-STATUS.md` updated.

---

## Appendix — Key References

- Cleanup migration: `supabase/migrations/20260429100000_collaborate_rebuild_r1b1_cleanup_remediation.sql`
- Teardown (truncate): `supabase/migrations/20260429000000_teardown_collaborate_contribute_truncate.sql`
- `spaces` create: `supabase/migrations/20251114061454_a390a649-8229-4431-8443-25ea7ee8fa42.sql`
- Rebuild flag: `src/lib/rebuildFlags.ts`
- Stub pages: `src/pages/dna/collaborate/*.tsx`, `src/pages/{SpaceDetail,CollaborationSpaces}.tsx`
- Live feed surfaces: `src/components/feed/{FeedLeftPanel,FeedActiveSpaces}.tsx`, `src/components/feed/cards/SpaceCard.tsx`
- Admin: `src/pages/admin/spaces/{SpaceManagement,SpaceModeration}.tsx`
- Types: `src/types/spaceTypes.ts`, `src/types/collaborate.ts`, `src/integrations/supabase/types.ts`
- Prior (superseded) audit: `docs/audits/collaborate-architecture-audit.md`
