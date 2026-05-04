# DNA Codebase Audit Report

**Generated:** 2026-05-04T16:42:33Z
**Repo HEAD:** `95d7978550d044bf199ea6148fff11d77ce4295f`
**Branch:** `claude/codebase-audit-sprint-11-DPOKg`
**Auditor:** Claude (Sprint 11 pre-flight)

---

## Executive Summary

**Overall Health Score: 77.9 / 100**

| Dimension | Score | Notes |
|---|---|---|
| TypeScript safety | 63.2 | strict mode disabled; 337 undocumented `any`. |
| RLS coverage | 94.4 | 169/179 tables fully secured; 10 read-only system tables intentionally SELECT-only. |
| Five C's interconnection | 90.0 | 9/10 junctions present; CONTRIBUTE → applications uses different schema (offers, not applications). |
| Mobile-first compliance | 73.0 | 54 Dialog usages without `useIsMobile()`/Drawer pattern; no fixed-width violations. |
| Build & toolchain | 70.0 | Vite build passes; main chunk 1.7 MB / 513 KB gzipped (>500 KB limit); ESLint config broken. |
| Code cleanliness | 62.2 | 189 orphaned exporting modules. |

### Top 3 Blockers
1. **`tsconfig.app.json` has `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`** — the codebase passes `tsc --noEmit` only because every safety rule is off. This is the silent root cause of the `any` proliferation. (Pass 1)
2. **N+1 in feed rendering** — `src/components/feed/PostCard.tsx:55` issues 6 `useQuery` calls per item; `CommentSection.tsx:250` issues 3. On a 50-item feed this is 300+ round-trips per render. (Pass 6)
3. **ESLint cannot run** — `@typescript-eslint/no-unused-expressions` peer-dep mismatch with ESLint 9.39.2 throws on every file. (Pass 9)

### Top 3 Quick Wins
1. **Delete `src/pages/dna/Impact.tsx` and the `App.tsx:55` lazy import.** The route `/dna/impact` already redirects to `/dna/contribute`; the component file is dead. <30 minutes. (Pass 4 / Pass 7)
2. **Pin a working `@typescript-eslint/*` version** in `package.json` to restore lint. <30 minutes; unlocks every subsequent code-quality pass.
3. **Enable `strictNullChecks: true` in `tsconfig.app.json`.** This is a single-line change with the smallest blast radius of the three strict flags and immediately surfaces real bugs without forcing a rewrite of every `any`. Treat the resulting error list as the Sprint 11 punch list.

### Recommended Sprint 11 Focus
1. **Restore the type-safety guardrail.** Fix lint (quick win #2), enable `strictNullChecks` (quick win #3), then plan a phased migration toward `noImplicitAny`. Reset the Sprint 1 Tier 1.3 baseline using the 446 number from this audit (337 undocumented + 109 documented exceptions).
2. **Refactor PostCard / CommentItem to single batched queries.** This is the single biggest user-visible perf gain available. Target `select('*, author:profiles(...), reactions:post_reactions(...)')` in the parent feed query and pass slices to child components as props.
3. **Bundle splitting for `index-*.js`.** 1.7 MB raw is heavy on mobile. Split out html2canvas, recharts (`generateCategoricalChart`), and `emoji-picker-react` via `manualChunks` — these three alone are ~1 MB.

---

## Findings by Severity

### Blocker

_None._ No production blockers identified for Sprint 11. The platform builds, RLS is in place, and core interconnections exist.

### High

| # | Title | Module | File | Line | Recommendation |
|---|---|---|---|---|---|
| H1 | TS strict mode disabled across the project | platform | `tsconfig.app.json` | — | Enable `strictNullChecks` first; plan phased rollout for `noImplicitAny`. Document the migration target in CLAUDE.md. |
| H2 | N+1: PostCard issues 6 useQuery calls per item | convey/feed | `src/components/feed/PostCard.tsx` | 55 | Move author + counts + viewer-state into the parent feed query via `.select('*, profiles(*), post_reactions(...)')`; pass denormalized data as props. |

### Medium

| # | Title | Module | File | Line | Recommendation |
|---|---|---|---|---|---|
| M1 | 337 undocumented `any` violations | platform | `src/` (top: `src/pages/admin/contributions/ContributionAnalytics.tsx` 16) | — | Treat as type-debt backlog. Sprint 11 task: type the top-10 files (~94 occurrences). |
| M2 | CONVEY excerpt metadata leak — partial fix | convey | `src/components/convey/ConveyEditorialCards.tsx` | 39, 258, 393, 474 | `getExcerpt()` cleans line 280 + 478 only. Title fallbacks (`story.content?.substring(...)` when `story.title` is empty) at 258/393/474 still leak metadata. Apply `getExcerpt()` (or new `getTitle()`) to every fallback. Same issue in `ConveyCategorySection.tsx:151`, `ConveyTrendingSection.tsx:96`, `ConveyStoryCard.tsx:187/229/306`. |
| M3 | N+1: CommentItem issues 3 useQuery calls per comment | feed | `src/components/feed/CommentSection.tsx` | 250 | Batch in parent useQuery using `.select('*, author:profiles(id, display_name, avatar_url), comment_likes(user_id)')`. |
| M4 | ESLint configuration broken | platform | `eslint.config.js` | — | Pin compatible `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` versions matching ESLint 9.39. |
| M5 | Main bundle 1.7 MB / 513 KB gzipped (>500 KB limit) | platform | `dist/assets/index-*.js` | — | Add `manualChunks` config splitting html2canvas, recharts, emoji-picker into separate async chunks. |
| M6 | Sprint 1 Tier 1.3 (50% any reduction) — unverifiable | platform | `src/` | — | No baseline shipped. Reset baseline to 446 (337 undocumented + 109 documented exceptions). With strict:false there is no enforcement mechanism — see H1. |

### Low

| # | Title | Module | File | Line | Recommendation |
|---|---|---|---|---|---|
| L1 | CONVEY Story badge color (verification) | convey | `src/components/convey/ConveyEditorialCards.tsx` | 245 | **No action.** Already uses `bg-dna-copper/90` (HSL 25 51% 46% = #B87333). Compliant. |
| L2 | CONTRIBUTE/COLLABORATE schema boundary | contribute | `supabase/migrations/2025111408*` | — | **No action.** Boundary is logically defensible: COLLABORATE = standalone opportunity marketplace; CONTRIBUTE = space-scoped need/offer pairs. Should NOT be unified. Document the distinction in CLAUDE.md. |
| L3 | Legacy `/dna/Impact` page orphaned | contribute | `src/pages/dna/Impact.tsx` | 1 | Delete file + the import at `App.tsx:55`. Route already redirects. |
| L4 | DIA matching omits CONTRIBUTE category | dia | `supabase/migrations/20260212300000_dia_core_engine_tables.sql` | 53 | `dia_match_results.match_category` CHECK only allows `('people','opportunity','space','event')`. If contribution matching is on the roadmap, plan a migration to add `'contribution'`. Otherwise leave as-is. |
| L5 | Loop INSERT in badge backfill | connect | `src/services/profileIdentityHubService.ts` | 658 | Replace per-rule `await supabase.from('profile_badges').insert(...)` with one batched `.insert(badgesArray)`. |
| L6 | 189 orphaned exporting modules | platform | `src/` | — | Run a delete-pass after Sprint 11. Top candidates: `src/components/_archived/*` (already labelled), `src/components/feed/CommentDrawer.tsx`, `src/components/feed/CreatePost.tsx`, `src/components/messaging/inbox/ConversationListItem.tsx` (duplicate of `messaging/ConversationListItem.tsx`). See full list in JSON. |

---

## Pass-by-Pass Detail

### Pass 1 — TypeScript Health

- `tsc --noEmit -p tsconfig.app.json` → **0 errors**. (But see config below.)
- `tsconfig.app.json`: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`. **Fail.**
- `tsconfig.json`: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`, `noUnusedParameters: false`.
- Total `any` occurrences in `src/` (excluding `_archived`): **446**
  - Documented exception (`supabase as any` / `(supabase as any)`): **109**
  - **Undocumented violations: 337**

**Top 10 files by undocumented `any` count:**

| Count | File |
|---|---|
| 16 | `src/pages/admin/contributions/ContributionAnalytics.tsx` |
| 13 | `src/pages/ProfileEdit.tsx` |
| 13 | `src/pages/admin/analytics/CollaborationAnalytics.tsx` |
| 10 | `src/pages/africa/RegionHubPage.tsx` |
| 10 | `src/pages/dna/admin/ConveyAnalytics.tsx` |
| 9  | `src/pages/africa/CountryHubPage.tsx` |
| 8  | `src/services/badge-service.ts` |
| 7  | `src/pages/NotificationSettingsPage.tsx` |
| 6  | `src/components/feed/CommentSection.tsx` |
| 6  | `src/components/feed/cards/OpportunityFeedCard.tsx` |

**Sample undocumented violations** (first 10; full list of 337 in `public/audit/audit-report.json`):

- `src/components/admin/AdminDashboardLayout.tsx:211` — `setPendingFeedback((stats as any)?.feedback?.pending || 0);`
- `src/components/admin/AdminDashboardLayout.tsx:212` — `setPendingModeration((stats as any)?.moderation?.pending_flags || 0);`
- `src/components/admin/EngagementDashboard.tsx:31` — `event_context: any;`
- `src/components/admin/ContributionModerationQueue.tsx:67` — `user_name: (item.profiles as any)?.display_name || 'Unknown',`
- `src/components/profile/ProfileDataFetcher.ts:4` — `export const useProfileDataFetcher = (profile: any) => {`
- `src/components/profile/ProfileMissingFields.tsx:17` — `profile: any;`
- `src/components/profile/form/hooks/useProfileFormState.ts:6` — `profile: any;`
- `src/components/feed/CommentSection.tsx:250` — `function CommentItem({ comment }: { comment: any }) {`
- `src/components/profile/AvatarUploadModal.tsx:37` — `(croppedArea: any, croppedAreaPixels: any)`
- `src/components/ui/responsive-modal.tsx:63-73` — multiple `{...(props as any)}` spread calls

### Pass 2 — RLS Audit

- Total active tables (after applying drop-table reconciliation): **179**
- Tables with **no RLS enabled**: **0** ✓
- Tables with RLS enabled but **zero policies**: **0** ✓
- Tables with RLS enabled but **SELECT-only on a writable table**: **10** (read-only system tables — intentional)
- **Coverage: 169/179 = 94.4 % fully secured**

The 10 SELECT-only tables are all read-only reference data:
`badge_definitions`, `cron_job_logs`, `event_reminder_logs`, `geographic_relevance`, `hub_metrics`, `rate_limit_checks`, `reserved_hashtags`, `space_templates`, `super_admin_protected`, `username_history`. No remediation needed.

No blocker findings.

### Pass 3 — Five C's Interconnection

| Junction | Status | Evidence |
|---|---|---|
| CONNECT (profiles) ↔ CONVENE (events) — `event_attendees` | ✅ Present | `supabase/migrations/20251025171327_b588f6f5-29e2-4aef-b332-c05e48943164.sql` creates `event_attendees`. |
| CONNECT ↔ COLLABORATE — `space_members` | ✅ Present | `supabase/migrations/20250808004949_9d834cd4-abc1-415b-bb90-f5b98da966ad.sql` (also `collaboration_memberships`). |
| CONNECT ↔ COLLABORATE — `opportunity_applications` | ✅ Present | `applications` table with `user_id REFERENCES profiles(id)` and `opportunity_id REFERENCES opportunities(id)` (`supabase/migrations/20251006141555_*.sql`). |
| CONNECT ↔ CONTRIBUTE — `contribute_applications` | ⚠️ Partial | No table named `contribute_applications`. Contribute flow uses `contribution_offers (need_id, created_by uuid, message, ...)`. `created_by` is a UUID without an explicit FK to `profiles(id)` (relies on the auth.users.id == profiles.id Supabase convention). |
| CONNECT ↔ CONVEY — `posts.author_id → profiles` | ✅ Present | `posts.author_id` added with FK to `auth.users(id)` (`supabase/migrations/20250727051046-*.sql`). |
| CONVENE ↔ COLLABORATE — `events.related_space_id` | ✅ Present | `events.related_space_id UUID` and `collaboration_spaces.related_event_id UUID` added in `supabase/migrations/20260212100001_post_composer_alter_tables.sql`. |
| CONVENE ↔ messaging — auto-thread on event INSERT | ✅ Present | `trg_event_create_thread AFTER INSERT ON events` + `trg_registration_join_thread ON event_registrations` (`supabase/migrations/20260220050734_*.sql`). |
| COLLABORATE ↔ messaging — auto-channel on space INSERT | ✅ Present | `trg_space_create_channel ON spaces` + `trg_collab_space_create_channel ON collaboration_spaces` + `trg_space_member_join_channel ON space_members`. |
| CONTRIBUTE ↔ messaging — auto-thread on opportunity INSERT | ✅ Present | `create_opportunity_messaging_thread` RPC + `trg_auto_create_opportunity_thread`. |
| 5 C's ↔ DIA — polymorphic reference | ⚠️ Partial | `dia_match_results` table has `match_category` CHECK `('people','opportunity','space','event')` + `matched_entity_id UUID`. **No `dia_cards` table** — this role is filled by `dia_match_results`. **CONTRIBUTE not in match_category enum** (only 'opportunity'). |

**Score: 9/10 = 90 %** present. The two partials are conscious design choices, not bugs:
- CONTRIBUTE → `contribution_offers.created_by` works via the auth-id convention; no FK declaration is the only defect.
- DIA polymorphism is via `match_category` rather than a dedicated `dia_cards` table; semantics are equivalent.

### Pass 4 — DIA Naming Compliance

- Files mentioning `DIA`, `dia_`, or `/dia/`: **218**
- Of those, files containing `Assistant` (case-sensitive whole-word): **0** ✓
- `Assistant` anywhere in `src/`: **0** ✓
- `ADME` anywhere in `src/`: **0** ✓
- `Diaspora Network Assistant` / `Network Assistant` / `AI Assistant`: **0** ✓

**`Impact` as module name** (excluding "Impact Score / Impact Story / Impact Report" attribution contexts):

| File | Line | Context | Status |
|---|---|---|---|
| `src/App.tsx` | 55 | `const DnaImpact = lazy(() => import("./pages/dna/Impact"));` | ⚠️ **Orphaned import — route only redirects.** Recommend deleting. |
| `src/App.tsx` | 152 | `ImpactDashboardPage = lazy(() => import("./pages/dna/contribute/ImpactDashboard"));` | ✓ Lives under `contribute/`, valid Impact-Dashboard naming inside CONTRIBUTE. |
| `src/App.tsx` | 261-262 | `LegacyImpactIdRedirect` | ✓ Explicit legacy redirect; intentional. |
| `src/App.tsx` | 639 | `<Route path="/dna/impact" element={<Navigate to="/dna/contribute" replace />} />` | ✓ Intentional URL backwards compatibility. |
| `src/pages/dna/Impact.tsx` | 1 | Component file still present | ⚠️ Dead — never rendered (route is `Navigate`). |

DIA naming is clean. `Impact` as a module identifier survives only as a redirect; the component file should be deleted.

### Pass 5 — Mobile-First Compliance

- `useIsMobile()` hook is used in **11** files.
- Files importing `Dialog`: 7 (component-level).
- Files using `<Dialog>` JSX: **58** (excluding `_archived`).
- Files using `<Dialog>` JSX **without** `useIsMobile()` or a Drawer/responsive-modal counterpart: **54**.

**Top 5 Dialog-heavy files lacking mobile pattern:**
- `src/components/connect/sidebar/EventDemoDialogs.tsx` (16 Dialogs)
- `src/pages/admin/spaces/SpaceModeration.tsx` (14)
- `src/pages/admin/contributions/ContributionModeration.tsx` (14)
- `src/pages/admin/UserManagement.tsx` (14) — _admin pages, mobile-low-priority_
- `src/components/convene/management/team/TeamManager.tsx` (12)

**Fixed-width violations >375 px:** **0**. The `min-w-[…]` ladder caps at 300 px. The only `w-[1400px]`-class values are `max-w-[1400px]` containers (max-width, not min-width — fine).

The Dialog finding is a heuristic — many of those 54 files are admin pages where mobile fidelity is intentionally lower priority. Recommend a manual triage to surface the user-facing ones (e.g., `connect/sidebar/EventDemoDialogs.tsx`, `convene/management/*`).

### Pass 6 — N+1 Query Detection

- Total `useQuery` calls: 600
- Total `supabase.from(...)` calls: 75

**True `await supabase.from()` inside `for-of` loops:**
- `src/services/profileIdentityHubService.ts:658` — badge backfill, one INSERT per rule. Low impact.
- `src/components/feed/CommentDrawer.tsx:147` — false positive on inspection.

**Per-row useQuery patterns (the real N+1 hotspots):**

| Rank | File | Line | Pattern |
|---|---|---|---|
| 1 | `src/components/feed/PostCard.tsx` | 55 | 6 useQuery per card: `author`, `likeCount`, `hasLiked`, `commentCount`, `shareCount`, `isSaved`. On a 50-item feed = 300 queries. |
| 2 | `src/components/feed/CommentSection.tsx` | 250 | `CommentItem` runs 3 useQuery (`author`, `likeCount`, `hasLiked`) per comment. |
| 3 | `src/services/profileIdentityHubService.ts` | 658 | Loop-INSERT, batchable. |
| 4 | `src/components/posts/PostCard.tsx` | (alt) | Mirror of #1 in alternate file location — verify which is canonical. |
| 5 | `src/components/convene/EventOrganizerCard.tsx` | id-prop child useQuery; verify whether rendered inside a `.map()`. |

The first two are the dominant cost. Recommend a parent-side join via Supabase's `select('*, profiles(...), post_reactions(...)')` and prop drilling to children.

### Pass 7 — Orphaned Components

- Total `.ts/.tsx` files in `src/` (excluding `_archived`): 1,165
- Reachable from imports + entry points: 974
- **Orphaned exporting files: 189**

**Note on dates:** all files report `lastModified: 2026-05-04` because git checkouts don't preserve mtimes. The dates reflect repo checkout time, not actual edit history. Use `git log --diff-filter=A --follow` for true creation dates.

**Notable orphans (full list of 189 in JSON):**
- `src/components/feed/CommentDrawer.tsx`, `CreatePost.tsx`, `PostComments.tsx`, `ReactionBar.tsx`, `ShareMenu.tsx`, `BookmarkButton.tsx`, `FeedSkeleton.tsx`, `FeedRightSidebar.tsx`, `FeedQuickLinks.tsx`, `FeedProfileCard.tsx`, `FeedGreeting.tsx`, `TrendingHashtags.tsx`, `ContextLabel.tsx` — feed components likely superseded by `UniversalFeedItem` / `Feed.tsx`.
- `src/components/messaging/ConversationListItem.tsx` AND `src/components/messaging/inbox/ConversationListItem.tsx` — duplicate.
- `src/components/messaging/MessageBubble.tsx`, `MessageComposer.tsx`, `MessageSearch.tsx`, `TypingIndicator.tsx`, `GroupHeader.tsx`, `GroupInfoPanel.tsx` — likely superseded by feedback/messaging refactors.
- `src/components/network/ConnectionCard.tsx`, `ConnectionRequestCard.tsx`, `MutualConnections.tsx`, `NetworkSearch.tsx` — duplicates of `connect/` equivalents.
- `src/components/connect/ConnectTabs.tsx`, `EventCard.tsx`, `ModernEventCard.tsx`, `PrototypeNotice.tsx`, `SearchTypeahead.tsx` — pre-current-design components.
- `src/components/{collaborate,contribute}/*DIADiscoveryCard.tsx` — only `convene/ConveneDIADiscoveryCard.tsx` is wired up.
- `src/components/StayNotifiedPanel/*`, `JoinBetaDialog.tsx`, `RequestDemoDialog.tsx`, `BuildingTogetherSection.tsx`, `WhoIsDNAForSection.tsx`, `PlatformFeatureShowcase.tsx`, `FeedbackPanel.tsx` — landing-page artifacts.

Recommend a delete-sweep PR after Sprint 11 closes.

### Pass 8 — Known Issues Verification

#### a. CONVEY Story badge color
- File: `src/components/convey/ConveyEditorialCards.tsx:245`
- Background class: `bg-dna-copper/90` → `--dna-copper: 25 51% 46%` (≈ #B87333 family). ✓ **Compliant.**
- Border: `border-l-dna-copper` (line 236). ✓
- Status: **fixed.**
- Caveat: `src/components/convey/ConveyStoryCard.tsx:96-104` (legacy variant) maps `'story'` subtype to `bg-dna-gold/10` — different design, different file, intentional.

#### b. CONVEY excerpt metadata leak
- File: `src/components/convey/ConveyEditorialCards.tsx:39` defines `getExcerpt()`, which strips: markdown punctuation, `Read Time: X min | Tags: ...` headers, concatenated CamelCase hashtag blocks, and pipe-prefixed metadata.
- Used at: line 280, line 478. ✓ **Fixed at those call sites.**
- **Still leaking** (raw `story.content?.substring(0, N)` without sanitization):
  - `src/components/convey/ConveyEditorialCards.tsx:258, 393, 474` — `<h3>` title fallbacks (when `story.title` is empty).
  - `src/components/convey/ConveyCategorySection.tsx:151`
  - `src/components/convey/ConveyTrendingSection.tsx:96`
  - `src/components/convey/ConveyStoryCard.tsx:187, 229, 306`
  - `src/components/profile/RecentActivity.tsx:61, 208, 255` (lower visibility)
- Status: **partially fixed.** Apply `getExcerpt()` (or extract a shared util) to all of the above.

#### c. CONTRIBUTE / COLLABORATE boundary

| Field | `opportunities` (COLLABORATE) | `contribution_needs` (CONTRIBUTE) | `contribution_offers` (CONTRIBUTE) |
|---|---|---|---|
| primary key | id | id | id |
| owner | created_by → auth.users | created_by | created_by |
| **scope** | standalone | **space_id NOT NULL → spaces** | space_id NOT NULL → spaces |
| relation | — | — | **need_id → contribution_needs** |
| title | ✓ | ✓ | — |
| description | ✓ (text) | ✓ (text) | message (text) |
| type | role_type | type (enum) | — |
| status | status text | status (enum) | status (enum) |
| visibility | ✓ | — | — |
| organization | ✓ | — | — |
| location | ✓ | region | — |
| tags | tags TEXT[] | focus_areas TEXT[] | — |
| **money** | — | target_amount NUMERIC + currency | offered_amount NUMERIC + currency |
| **time** | deadline DATE | time_commitment + duration + needed_by | — |
| priority | — | priority (enum) | — |

**Conclusion:** Logically defensible. They model different things:
- **COLLABORATE.opportunities** = standalone marketplace listing ("we're hiring a fellow"). Discoverable platform-wide. Public.
- **CONTRIBUTE.contribution_needs + contribution_offers** = pair-bonded request/response inside a space ("our space needs $5,000 for the cohort" → "I can give $1,000"). Always scoped to a space; supports money + time + matched offers.

These should NOT be unified. The shared concept (a posting that someone can respond to) is too thin to outweigh the distinct cardinality (1:N for needs:offers) and the space-scope invariant on CONTRIBUTE.

**Action:** document this distinction in `CLAUDE.md` so it survives.

#### d. Sprint 1 Tier 1.3 — TypeScript any reduction

- Sprint 5 target: 50 % reduction.
- Current state: 446 `any` total (337 undocumented + 109 documented `supabase as any` exceptions).
- Sprint 1 baseline: not visible in this audit — no committed metric file or report under `audit-reports/` matches.
- With `strict: false` / `noImplicitAny: false` / `strictNullChecks: false` in `tsconfig.app.json`, **there is no enforcement mechanism preventing new `any` from being added.** The Tier 1.3 metric is unverifiable without a baseline and cannot meaningfully decrease without a tsconfig change.
- Status: **goal-not-met / unverifiable.** Recommend resetting the baseline to 446 in Sprint 11 with strict-mode enablement as the lever.

### Pass 9 — Console / Build Health

- `npm run build`: ✓ **passes** in 20.43 s, 300 chunks, 12 MB total dist.
- `npm run lint`: ✗ **fails** — `TypeError: Error while loading rule '@typescript-eslint/no-unused-expressions': Cannot read properties of undefined (reading 'allowShortCircuit')`. ESLint 9.39.2 + `@typescript-eslint/eslint-plugin` peer-dep mismatch.

**Build warnings:**
- `(!) Some chunks are larger than 500 kB after minification.` Triggered by `index-Bce24oBR.js` at 1,701 kB / 513 kB gzipped.

**Largest 10 chunks:**

| Size (raw) | Gzip | Chunk |
|---|---|---|
| 1,701.82 kB | 513.50 kB | `index-Bce24oBR.js` |
| 388.70 kB | 102.48 kB | `Encoder-Bjhl56bl.js` (zxing barcode) |
| 325.95 kB | 87.76 kB | `generateCategoricalChart-TjHteor5.js` (recharts) |
| 269.99 kB | 63.79 kB | `emoji-picker-react.esm-BCGG6n1N.js` |
| 218.13 kB | 68.85 kB | `MyEvents-aU0vu3eX.js` |
| 201.42 kB | 48.03 kB | `html2canvas.esm-CBrSDip1.js` |
| 157.96 kB | 46.85 kB | `ConveneMapView-Cuz3EkqH.js` |
| 150.15 kB | 51.39 kB | `index.es-D0j2niV5.js` |
| 118.14 kB | 35.58 kB | `EventDetail-DSIVSSjV.js` |
| 102.31 kB | 25.34 kB | `ProfileV2-Bhfci7s0.js` |

---

## Appendix: Raw Data

### A. tsconfig flags (current)

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "strict": false,
    "strictNullChecks": false,
    ...
  }
}
```

### B. RLS — the 10 SELECT-only tables

`badge_definitions`, `cron_job_logs`, `event_reminder_logs`, `geographic_relevance`, `hub_metrics`, `rate_limit_checks`, `reserved_hashtags`, `space_templates`, `super_admin_protected`, `username_history`.

All are read-only reference / log tables. No remediation needed.

### C. Module file inventory

| Module | Pages | Components | Hooks |
|---|---|---|---|
| connect | 3 | 71 | 0 |
| convene | 13 | 41 | 6 |
| collaborate | 9 | 2 | 0 |
| contribute | 8 | 3 | 0 |
| convey | 5 | 16 | 0 |

### D. Caveats

1. **File mtimes (`lastModified`) reflect repo checkout time**, not actual edit history. Git does not preserve mtimes on checkout.
2. **N+1 detection is heuristic.** True N+1 requires runtime instrumentation; this pass flags structural patterns that are highly likely to be N+1 at render time.
3. **Mobile-first Dialog count is heuristic.** Many of the 54 flagged files are admin pages where mobile parity is intentionally deprioritized.
4. **The 189 orphans count includes archived-but-not-moved code.** Some are intentional (kept for reference); others are dead. Triage required before delete-sweep.
5. **`tsc --noEmit` returning 0 errors is misleading** because every safety flag is off in `tsconfig.app.json`. The real type-error count under `strict: true` would be substantial.

### E. Files generated by this audit

- `AUDIT_REPORT.md` (this document)
- `public/audit/audit-report.json` (machine-readable, consumed by `/admin/code-health`)
