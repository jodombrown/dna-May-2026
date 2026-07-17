## Goal

Replace the current scroll-and-click Settings + Profile experience with a Claude-inspired identity system that fits DNA's brand (warm cream, Lora + Inter, emerald/forest/copper, Adinkra-integrated). One coherent loop across three surfaces — Settings, the Account slide-over, and the Public Profile — plus a set of reusable primitives so the pattern can spread through the app.

Scope decided:
- Full identity system + design primitives
- Full-screen sheet on mobile, right-side panel on desktop
- Public profile: editorial hero + grouped sections below
- Primitives roll out next to: Account drawer, Notifications/My Reports/Blocked Users, Composer secondary screens

---

## Part 1 — The design primitives (foundation)

New shared components under `src/components/ui/settings-kit/`. These are DNA-branded, not literal Claude copies — grouped rounded lists on warm cream, hairline dividers, chevron rows, no shadows-everywhere.

- `IdentitySheet` — the shell. Vaul drawer bottom-sheet on mobile (full height, drag handle), Radix right-side panel on desktop (~440px, slides in from right, dims app). Wraps children, owns close/back/title chrome, honors `prefers-reduced-motion`.
- `SettingsGroup` — rounded 12px container (`bg-card`, `border-border/40`) with an optional uppercase section label above it (small caps, muted).
- `SettingsRow` — one row: leading icon, label, optional value/badge on the right, optional chevron. `min-h-touch`. Variants: `nav` (chevron, pushes subpage), `toggle` (Switch), `value` (read-only), `destructive` (red).
- `SettingsSubpage` — pushes into the sheet with back-chevron; sheet stays open, content transitions in. No route change, no full-page scroll.
- `SettingsField` — for the few real form controls (name, username, email). Label-above-input, inline validation.

Rules baked in: no `text-xl`+ per row, no per-row shadows, no icon-in-pastel-circle. Copper accent only on the active/selected state, sparingly.

---

## Part 2 — Settings (`/dna/settings`)

Today: 8 subroutes, each its own scrolling page, chrome overhead per page. Change: one sheet, one scroll, subpages push in.

Structure inside the sheet:

```text
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
 • Daily Briefs         Morning/Afternoon/Evening [chevron]

PRIVACY
 • Public profile       [chevron]  (field-level visibility grid)
 • Blocked users        [chevron]  count
 • My reports           [chevron]  count

APP
 • Language             English
 • Appearance           System [Light|Dark|System]
 • Mapbox               Connected ✓  [chevron]
 • Haptic feedback      [toggle]

MY HASHTAGS               [chevron]  New badge
FEEDBACK & SUPPORT        [chevron]

Footer: Sign out (subtle, not destructive-red)
        App version • Terms • Privacy
```

Backwards compat: `/dna/settings/*` routes keep working but redirect into the sheet with the right subpage pre-opened, so deep links from emails/notifications still land correctly.

Deletes: `MobileSettingsView`, `MobileSettingsMainContent`, and the current `SettingsLayout` sidebar nav become obsolete. Keep them one release, then remove.

---

## Part 3 — Account slide-over (screenshot 8)

Currently: a big list with My activity / Collaborate / Account sections and Sign-out. The circled "Settings & preferences" row is the entry point to Part 2.

Rework it into the same sheet primitive but as a shorter Account drawer:

```text
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
 • Settings & preferences   [chevron → opens Part 2 sheet]
 • Take platform tour
 • Alpha test guide
 • Help & feedback

Sign out
```

Same visual language, same rows. Tapping "Settings & preferences" opens the full IdentitySheet on top — Claude's exact model. On desktop both live in the right panel; drawer pushes deeper instead of stacking.

---

## Part 4 — Public profile (`/dna/:username`)

Hybrid: editorial hero, grouped sections below. Reuses the same rounded-group language so the public and private sides of identity feel like one product.

```text
─────────────── Editorial hero ───────────────
[banner: gradient or user image, subtle Adinkra pattern at 6% opacity]
[avatar 96px]
Full Name                                      (Lora, text-heading)
@username • Headline                           (Inter, text-body)
City, Country  •  Origin: Ghana  •  Soft ✓    (text-meta, hairline dividers between)

[Connect]   [Message]   [•••]                  (primary, secondary, more)
──────────────────────────────────────────────

FIVE C's FOOTPRINT                             (validated activity, not vanity)
 Connect     127 connections
 Convene     8 events hosted • 34 attended
 Collaborate 3 active spaces
 Contribute  12 contributions given
 Convey      6 stories

ABOUT
 Bio paragraph (respects visibility settings)
 Languages • Industry • Company

ACTIVITY
 • Recent posts        [chevron]
 • Upcoming events     [chevron]
 • Public spaces       [chevron]

HERITAGE & INTENTIONS
 (only if user chose to show)
```

Editorial choices vs. current implementation:
- Lora on the name only (heritage moment), Inter everywhere else
- Hairline dividers between meta pills instead of chips-in-cards
- No emoji, no gradient text, one accent (Copper) on `Soft ✓` and section labels
- The Five C's footprint replaces the current stat-cards row — same data, denser typography, feels like a magazine masthead

Signed-out landing keeps the Five C's discovery block already in place. The editorial hero replaces the current visitor top-nav CTA visually but keeps the same single "Join the waitlist" affordance.

---

## Part 5 — Backend / data plane cleanup

The user flagged "design the backend better." Concrete moves:

1. Consolidate profile reads behind `get_profile_bundle_v2` — one RPC returns `{ profile, tags, activity, permissions, visibility, completion, verification_meta, footprint_counts }`. `useProfile` and `useProfileV2` both hit it; kills the current double-fetch on the profile page.
2. Add `footprint_counts` as a materialized view refreshed on write (connections, events hosted/attended, active spaces, contributions, stories). Eliminates the 5 separate count queries the current profile makes.
3. `profile_settings` JSONB column on `profiles` (nullable) holds sheet-scoped prefs: `appearance`, `haptics`, `language`, and per-section visibility that isn't already on `public_visibility`. One write per settings change instead of N.
4. `useSettingsPrefs()` hook wraps read + optimistic write for that JSONB, so every SettingsRow toggle flushes in <100ms without a network round-trip in the UI.
5. Keep all writes under the existing RLS `profiles_update_self` policy. No new tables, no schema break — additive columns + one MV.

---

## Part 6 — Rollout of primitives after Settings/Profile

Once `IdentitySheet` + `SettingsGroup` + `SettingsRow` ship, apply them (in order, one PR each) to:

1. Account slide-over — same PR as Part 3 (already covered).
2. Notifications center — currently `/dna/notifications`. Convert to grouped rows: Unread, Today, Earlier. Same chevron/subpage model for filters.
3. My Reports & Blocked Users — trivial conversions, already list-shaped.
4. Composer secondary screens — post-visibility, audience picker, event date/time, space privacy. Each becomes a `SettingsSubpage` that pushes into a composer-scoped `IdentitySheet` instead of the current modal stacks. This is the biggest scroll-and-click reduction in the app.

Not touched in this plan: feed, hub landings, messaging threads. The primitives are opt-in; existing surfaces stay until they earn a conversion.

---

## Sequencing

1. Primitives (`IdentitySheet`, `SettingsGroup`, `SettingsRow`, `SettingsSubpage`, `SettingsField`) + Storybook page at `/dna/styleguide/settings-kit` for four-persona review.
2. Settings sheet (Part 2) + legacy route redirects.
3. Account drawer refit (Part 3).
4. Public profile editorial hero + grouped sections (Part 4).
5. Backend: `get_profile_bundle_v2` + `footprint_counts` MV + `profile_settings` JSONB. (Can land in parallel with step 4; frontend falls back to current RPCs until deployed.)
6. Rollout PRs for Notifications, Reports, Blocked, Composer sub-screens.

Each step is independently shippable and reversible.

---

## Technical notes

- Mobile sheet: `vaul` `<Drawer>` with the project's `vaul-drawer-handle` workaround (per memory). Full-height, no snap points, back-swipe closes.
- Desktop panel: Radix Dialog with `data-side="right"`, `max-w-md`, own animation (`slide-in-right` 300ms, opacity fade on overlay). Keeps the app behind visible and interactive-blocked.
- Subpage transitions: internal state machine (`stack: string[]`), CSS `translate-x` transition 250ms, `prefers-reduced-motion` → opacity-only.
- All rows are real buttons/links (semantic), keyboard-navigable, focus rings visible, `min-h-touch` (44px).
- No em-dashes anywhere in copy (project rule).
- No `text-xl`, `text-2xl` — use `text-title`/`text-heading` from tokens.
- One accent (Copper) per screen, on state only, never as a fill.

---

## What "done" looks like

- Opening Settings from anywhere is one tap; every setting is reachable in ≤2 taps from the drawer.
- Public profile above the fold on 375px shows name, headline, location, verification, and the primary action without scrolling.
- One RPC call powers the profile page (down from the current 6+).
- `IdentitySheet` is used by at least 4 surfaces (Settings, Account, Notifications, one composer sub-screen) before we call the pattern established.

## Prompt for Claude Code (deliverable the user asked for)

A separate `.lovable/prompts/identity-system.md` file will be added containing the full spec above rewritten as a Claude Code implementation brief — file list, component APIs, RPC signature, migration SQL, acceptance criteria, and four-persona certification checklist — so the user can hand it off cleanly.