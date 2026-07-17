# DNA Identity System — Claude Code Implementation Brief

**Goal.** Rebuild DNA's Settings, Account slide-over, and Public Profile as one Claude-inspired identity system on shared primitives. Kill the current scroll-and-click fatigue. Establish reusable primitives that spread through Notifications, Reports, Blocked Users, and Composer sub-screens.

**Non-negotiables.** DNA brand only, no literal Claude copy. Warm cream (`#F9F7F4`) background, Lora on headings, Inter on body/UI. Emerald + Forest + Copper accents used sparingly. No purple/indigo/violet, no gradient text, no icon-in-pastel-circle grids, no `rounded-2xl` default (use `rounded-xl`), no shadows-everywhere. No em-dashes anywhere. Every touch target ≥44px. Adinkra icons only where the Five C's are named.

---

## What already exists in the repo (starter kit — use these)

- `src/components/ui/settings-kit/IdentitySheet.tsx` — sheet shell. Vaul bottom sheet on mobile, Radix right-panel on desktop. Owns close/back chrome and a subpage stack. Exposes `useIdentitySheet()` and `useIdentitySheetSafe()`.
- `src/components/ui/settings-kit/SettingsGroup.tsx` — rounded grouped-list container with optional uppercase label.
- `src/components/ui/settings-kit/SettingsRow.tsx` — one row. Variants: `nav` (chevron + optional `subpage`), `toggle` (Switch), `value` (read-only), `destructive`.
- Vaul workaround: use a plain `<div vaul-drawer-handle="" />` (per project memory), never `<Drawer.Handle />`.
- Hooks: `useIsMobile` at `src/hooks/useMobile`, `useAuth`, `useProfile` (own profile via `get_own_profile` RPC), `useProfileV2` (viewed profile via `rpc_get_profile_bundle`).

## Part 1 — Settings sheet at /dna/settings (replace SettingsRouteShell)

Build `src/pages/dna/settings/SettingsSheet.tsx`. Mount it from `/dna/settings` and use React state (not routes) for subpages. Legacy paths `/dna/settings/{account,privacy,blocked,reports,notifications,preferences,hashtags}` must keep working: they render the same `SettingsSheet` with the matching subpage pre-opened via a URL param (`?section=privacy`), so email deep links don't break.

Structure inside the sheet (this is the authoritative layout):

```
Header:  [avatar] Full name • @username        (tap → Profile subpage)
         email
─────────────────────────────────────────────
ACCOUNT
 • Profile              [chevron]
 • Email & password     [chevron]
 • Verification         Soft ✓
 • Delete account       (destructive, in subpage footer)

NOTIFICATIONS
 • Push                 [toggle]
 • Email digests        [chevron]
 • Daily Briefs         Morning / Afternoon / Evening [chevron]

PRIVACY
 • Public profile       [chevron]  (field-level visibility grid)
 • Blocked users        [chevron]  count
 • My reports           [chevron]  count

APP
 • Language             English
 • Appearance           System [Light | Dark | System]
 • Mapbox               Connected ✓ [chevron]
 • Haptic feedback      [toggle]

MY HASHTAGS               [chevron]  New badge
FEEDBACK & SUPPORT        [chevron]

Footer: Sign out (subtle, not destructive-red)
        App version • Terms • Privacy
```

**Subpage sourcing.** Do NOT rewrite the 8 existing settings pages from scratch. Wrap each of `AccountSettings.tsx`, `PrivacySettings.tsx`, `BlockedUsersSettings.tsx`, `MyReportsSettings.tsx`, `NotificationSettings.tsx`, `PreferencesSettings.tsx`, `MyHashtagsSettings.tsx` in a lightweight adapter that strips their outer chrome (page header, back button, mobile shell) and renders them inside the sheet's scroll area. If a page's density is wrong for the sheet, refactor its body to use `SettingsGroup`+`SettingsRow` — but do it as a follow-up commit, one page per commit.

**Delete after conversion (one release later, not now).** `SettingsLayout.tsx`, `SettingsRouteShell.tsx`, `MobileSettingsView`, `MobileSettingsMainContent`.

## Part 2 — Account drawer (screenshot: user's mobile Account slide-over)

Rework the existing account drawer at `src/contexts/AccountDrawerContext.tsx` + its consumer to use `IdentitySheet` with the exact same visual language as Settings.

Content:

```
[avatar] Full name
         @username • view public profile →
─────────────────────────────────────────────
MY WORK
 • My posts & updates
 • My stories
 • My spaces
 • My events
 • Saved items

ACCOUNT
 • Settings & preferences   → opens Part 1 sheet ON TOP
 • Take platform tour
 • Alpha test guide
 • Help & feedback

Sign out
```

When "Settings & preferences" is tapped, open the Part 1 `SettingsSheet` as a second `IdentitySheet` on top. Both sheets are allowed to stack; the Account drawer stays mounted underneath.

## Part 3 — Public profile at /dna/:username (editorial hero + grouped sections)

File: `src/pages/PublicProfilePage.tsx` (or wherever `/dna/:username` resolves — trace from `App.tsx`). Read the profile via the existing `useProfileV2` hook.

Layout:

```
─────────────── Editorial hero ───────────────
banner (gradient or image, subtle Adinkra pattern at 6% opacity)
avatar 96px
Full Name                       (font-display / Lora, text-heading)
@username • Headline            (Inter, text-body)
City, Country  •  Origin: Ghana  •  Soft ✓
                                (text-meta, hairline dividers between pills)

[Connect]   [Message]   [•••]   (primary, secondary, more)
──────────────────────────────────────────────

FIVE C's FOOTPRINT              (uses Adinkra icons)
 Connect     127 connections
 Convene     8 events hosted • 34 attended
 Collaborate 3 active spaces
 Contribute  12 contributions given
 Convey      6 stories

ABOUT
 Bio paragraph (respects visibility settings)
 Languages • Industry • Company

ACTIVITY
 • Recent posts        [chevron → subpage or route]
 • Upcoming events     [chevron]
 • Public spaces       [chevron]

HERITAGE & INTENTIONS  (only if user set visible)
```

**Editorial rules.** Lora on the name only. Hairline dividers between meta pills (no chip-cards). One accent color per screen (Copper) on `Soft ✓` and section labels. No emoji, no gradient text. The signed-out landing keeps the existing Five C's discovery block below the profile body — do not remove it.

Reuse the existing `FiveCsDiscoveryRow` / `FiveCsDiscoverySection` components untouched.

## Part 4 — Backend consolidation

**Migration:** additive only, no schema break, no CASCADE.

```sql
-- 1. profile_settings JSONB — sheet-scoped prefs
alter table public.profiles
  add column if not exists profile_settings jsonb not null default '{}'::jsonb;

-- 2. footprint_counts materialized view refreshed via trigger on write
create materialized view if not exists public.profile_footprint_counts as
select
  p.id as profile_id,
  coalesce((select count(*) from public.connections c
            where (c.user_id = p.id or c.connected_user_id = p.id)
              and c.status = 'accepted'), 0) as connections,
  coalesce((select count(*) from public.events e
            where e.creator_id = p.id and e.status = 'published'), 0) as events_hosted,
  coalesce((select count(*) from public.event_attendees ea
            where ea.user_id = p.id and ea.status = 'attended'), 0) as events_attended,
  coalesce((select count(*) from public.space_members sm
            join public.spaces s on s.id = sm.space_id
            where sm.user_id = p.id and s.archived_at is null), 0) as active_spaces,
  coalesce((select count(*) from public.contribution_offers co
            where co.contributor_id = p.id and co.status = 'fulfilled'), 0) as contributions_given,
  coalesce((select count(*) from public.posts po
            where po.author_id = p.id and po.mode = 'story' and po.deleted_at is null), 0) as stories
from public.profiles p;

create unique index if not exists profile_footprint_counts_profile_id
  on public.profile_footprint_counts (profile_id);

grant select on public.profile_footprint_counts to anon, authenticated;
grant all on public.profile_footprint_counts to service_role;
```

Refresh strategy: `pg_cron` every 15 min for now, upgrade to write-triggered refresh once volume warrants it.

**RPC:** extend the existing `rpc_get_profile_bundle` to also return `footprint_counts` from the MV in its JSON payload. No new function. Frontend gets one call.

**Frontend hooks:**
- `useSettingsPrefs()` — reads/writes `profiles.profile_settings` JSONB with optimistic update. Debounced 300ms writes. Uses TanStack Query cache invalidation, not realtime.
- `useProfileV2` — already fine, will pick up `footprint_counts` automatically.

## Part 5 — Rollout order after Settings/Profile ships

One PR each, in this order:

1. **Notifications center** (`/dna/notifications`) — convert to grouped rows: Unread, Today, Earlier. Use `SettingsGroup` + row-per-notification. Filters push as subpages.
2. **My Reports** and **Blocked Users** — trivial list conversions.
3. **Composer secondary screens** — post visibility, audience picker, event date/time, space privacy. Each becomes a `SettingsRow` with `subpage` inside a composer-scoped `IdentitySheet`. Biggest scroll-and-click reduction in the app.

Feed, hubs, and messaging threads are OUT of scope for this system. Do not convert them.

---

## Acceptance criteria

- Opening Settings from anywhere is one tap; every setting is reachable in ≤2 taps from the Account drawer.
- Public profile on 375px viewport shows name, headline, location, verification, and the primary action above the fold.
- Profile page issues one RPC call (`rpc_get_profile_bundle`), verified in the Network tab. Down from the current 6+.
- `IdentitySheet` is used by at least 4 surfaces before the pattern is called established.
- All new copy passes the em-dash guard.
- `scripts/check-adinkra-usage.ts`, `scripts/check-forbidden-classes.ts`, and `scripts/check-responsive-dialogs.ts` all pass on the diff.

## Four-persona certification (mandatory before merge)

For each persona, sign in and walk the loop: open account drawer → open settings → open a subpage → close both → visit own public profile → visit another user's public profile.

- Signed-out visitor
- Signed-in member (jaunelamarro)
- Signed-in owner viewing their own profile (chrome must show edit affordances, no Connect CTA)
- Admin

Report any surface where chrome, data, or actions diverge from the plan.

## Technical notes

- Sheet subpages transition via `motion-safe:animate-fade-in` (already wired). Do not add scale or translate; project motion rules forbid them.
- `prefers-reduced-motion` must collapse all sheet motion to opacity-only.
- Deep-link parity: `/dna/settings/privacy` renders `SettingsSheet` with `section=privacy` pre-opened. All 7 legacy paths mapped.
- Do not touch `src/integrations/supabase/types.ts` — regenerate via CLI after the migration lands.
- No `text-xl` / `text-2xl` / `text-3xl` — use `text-title` / `text-heading` / `text-display` from tokens.
- One accent (Copper) per screen, on state only, never as fill.

## Deliverable order for Claude Code

1. Wire `SettingsSheet` at `/dna/settings` with legacy `?section=` deep links (Part 1).
2. Refit `AccountDrawer` onto `IdentitySheet` (Part 2).
3. Ship the migration + extend `rpc_get_profile_bundle` (Part 4).
4. Rebuild the public profile (Part 3) — depends on Part 4.
5. Ship Notifications / Reports / Blocked conversion (Part 5.1–5.2).
6. Composer sub-screens (Part 5.3) — last, biggest surface area.

Each step ships independently, is reversible, and does not block the next.
