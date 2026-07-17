## The problem

The Account drawer (opened from the avatar) and the Settings sheet (`/dna/settings`) currently duplicate the entire "Account / Notifications & display / Content & safety / About" stack. Users hit the same rows in two places, and there is no single home for "the stuff about me." At the same time the public profile still pays a per-section RPC/COUNT tax and has no in-page navigation, so scrolling is heavy.

This plan is one turn of work in three parts, all shipped together.

---

## Part A — Collapse Account drawer + Settings into one IA

One drawer, one sheet, zero duplicated rows. The drawer opened from the avatar becomes the **You** entry point (identity + my work + share/sign-out + a single "Settings" row). `/dna/settings` becomes the **Settings** entry point (account / privacy / notifications / preferences / safety / about). No row exists in both places.

**New drawer (avatar → sheet), top-to-bottom:**

```text
[Identity card]  → pushes Profile editor in-sheet
─────────────────────────────────
You
  View public profile
  Share profile
─────────────────────────────────
My work
  My posts & updates
  My stories
  Saved items
  My spaces
  My events
  My contributions        ← currently uncategorized, add
  My applications         ← currently uncategorized, add
─────────────────────────────────
Guides
  Platform tour
  Alpha test guide
  Help & feedback
─────────────────────────────────
  Settings                → navigates to /dna/settings (sheet)
  Sign out
```

**New Settings sheet (`/dna/settings`):**

```text
[Identity card]  → pushes Profile editor in-sheet
─────────────────────────────────
Account
  Profile        (name, headline, avatar, bio, heritage)
  Login & security   (renamed from "Account": email, password, sessions, delete)
  Privacy & visibility  (merged: who sees what + public-visibility toggles)
─────────────────────────────────
Notifications & display
  Notifications
  Preferences
  Appearance         ← new stub row for density/theme (already inside Preferences today, promote label)
─────────────────────────────────
Content & safety
  My hashtags
  My reports
  Blocked users
  Muted authors      ← currently only reachable from post menu, expose here
─────────────────────────────────
Connected accounts     ← new: Mapbox token screen we already built lives here
  Mapbox
─────────────────────────────────
About
  About DNA
  Terms of service
  Privacy policy
  App version
```

Rules to eliminate future drift:
- Rows live in exactly one of the two surfaces. The drawer never shows Account/Privacy/Notifications/Preferences/Safety rows.
- Both surfaces reuse the same lazy subpage registry (single `SETTINGS_SUBPAGES` map re-exported from `settings-kit`) so a subpage cannot exist in one place and not the other.
- Legacy `?section=` deep-links preserved; add aliases for `muted`, `mapbox`, `visibility`.

---

## Part B — Consolidated profile data flow + MV footprint counts

Today `DiasporaFootprint` fires five `count: exact` queries against `connections / event_attendees / space_members / contribution_offers / posts` on every profile view. `useProfileV2` already calls `rpc_get_profile_bundle`; we fold the counts into it.

1. **Materialized view** `public.mv_profile_footprint_counts(user_id, connections, events, spaces, contributions, posts, refreshed_at)` — one row per user, refreshed via `pg_cron` every 15 minutes (concurrent refresh, unique index on `user_id`).
2. **RPC** `rpc_get_profile_bundle_v2(p_username, p_viewer_id)` = existing bundle + `activity.counts` populated from the MV in one round-trip. `get_public_profile` gets the same counts appended for anon viewers.
3. **`useProfileV2`** switched to v2 RPC; `DiasporaFootprint` reads `bundle.activity.counts` instead of running its own queries (falls back to 0 if MV row missing so a brand-new user still renders).
4. **`useProfile`** (own profile) already single-RPC via `get_own_profile`; no changes there, just make sure the completion score and footprint use the same bundle so the two hooks stay consistent across pages (hero on ProfileV2 + drawer identity card + right rail).

Net effect: profile load drops from 1 bundle + 5 counts to 1 bundle.

---

## Part C — Sticky section navigator + editorial rhythm on the public profile

1. Add `<ProfileSectionNav />` — a sticky sub-header that appears under the hero once the hero scrolls out. Three anchors: **About**, **Activity**, **Expertise**. Uses `IntersectionObserver` to highlight the active section, `scrollIntoView({ block: 'start' })` on click, respects `prefers-reduced-motion`. Hidden on mobile (mobile keeps linear scroll; the nav appears on `md:` and up).
2. Regroup `ProfileV2.tsx` sections under three anchor IDs (`#about`, `#activity`, `#expertise`) and apply `ProfileSectionLabel` uniformly at the top of each — same copper-accent letter-spaced label already used for "Five C's footprint" so hero → footer reads as one editorial rhythm.
3. Space rhythm: `Stack gap="xl"` between anchor sections, `Stack gap="lg"` inside them, no bespoke margins.

---

## Technical details

**Files touched**
- `src/components/navigation/AccountDrawer.tsx` — trim to You / My work / Guides / Settings link / Sign out; delete Account/Privacy/Notifications/Preferences/Safety/About groups.
- `src/pages/dna/settings/SettingsSheet.tsx` — rename rows, add Appearance / Muted authors / Connected accounts / App version, merge visibility toggles into Privacy subpage.
- `src/components/ui/settings-kit/index.ts` — export shared `SETTINGS_SUBPAGES` registry.
- `src/pages/dna/settings/PrivacySettings.tsx` — merge public-visibility toggles inline.
- `src/pages/dna/settings/MutedAuthorsSettings.tsx` — new subpage (list + unmute), reuses `muted_authors` table.
- `src/pages/dna/settings/MapboxSettings.tsx` — already exists, re-slotted under Connected accounts.
- `src/hooks/useProfileV2.ts` — swap RPC to `rpc_get_profile_bundle_v2`.
- `src/components/profile-v2/DiasporaFootprint.tsx` — read `bundle.activity.counts`, drop the 5 queries.
- `src/pages/ProfileV2.tsx` — wrap sections in `<section id="…">`, insert `<ProfileSectionNav />`.
- `src/components/profile-v2/ProfileSectionNav.tsx` — new.

**Migration (single file)**
- `CREATE MATERIALIZED VIEW public.mv_profile_footprint_counts …` with `CREATE UNIQUE INDEX` on `user_id` (required for concurrent refresh).
- `GRANT SELECT ON public.mv_profile_footprint_counts TO authenticated, anon, service_role`.
- `CREATE OR REPLACE FUNCTION public.rpc_get_profile_bundle_v2(...)` returning existing bundle jsonb with `activity.counts` merged. `SECURITY DEFINER`, `SET search_path = public`. Revoke public, grant execute to `authenticated, anon`.
- `pg_cron` job every 15 min: `REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_profile_footprint_counts`.
- Extend `public.get_public_profile` to left-join the MV and include counts.

**Reversibility**
- Drawer/settings changes are UI-only; a single revert restores the old rows.
- v2 RPC ships alongside v1; `useProfileV2` can flip back by name if needed.
- MV can be dropped without touching bundle v1.

---

## Out of scope this turn
- Actually promoting the "Appearance" subpage to a full theme picker (row exists, opens Preferences for now).
- Rewriting `ProfileEdit` into an in-sheet stepper (kept as the current single form pushed as a subpage).
- Moving `My applications` / `My contributions` list pages themselves — we're only adding drawer entries that navigate to them.