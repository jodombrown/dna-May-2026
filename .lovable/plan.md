
## Problem

Several counters on the profile page display real numbers but do nothing when tapped. Only the small stat grid in screenshot 3 (Connections / Posts / Spaces / Events) is wired up — the rest are dead ends.

Confirmed dead spots:
- **Diaspora Footprint pills** (`DiasporaFootprint.tsx`): "1 Connect", "1 Convene", "1 Collaborate" render as plain `<div>`s with no click handler.
- **Hero meta line** (`ProfileV2Hero.tsx`): "1 connections · N followers · N following" is plain text.

The working stat grid (`ProfileV2QuickStats.tsx`) already has the correct destination logic (owner vs non-owner), so we reuse the same routes.

## Fix

### 1. Make Diaspora Footprint pills clickable
File: `src/components/profile-v2/DiasporaFootprint.tsx`
- Accept `isOwner` and `username` props (passed from `ProfileV2.tsx`).
- Convert each pill from `<div>` to `<button>` with hover/focus styling and 44px min target.
- Wire click handlers per Five C:
  - Connect → `/dna/connect/network?tab=connections` (owner) or `/dna/u/:username/connections` fallback → `/dna/connect/discover` (non-owner).
  - Convene → `/dna/convene/my-events` (owner) or `/dna/convene` (non-owner).
  - Collaborate → `/dna/collaborate/my-spaces` (owner) or `/dna/collaborate` (non-owner).
  - Contribute → `/dna/contribute/my-contributions` (owner) or `/dna/contribute` (non-owner).
  - Convey → `/dna/convey` (owner) or `/dna/feed?author=:username` (non-owner).

### 2. Make the hero meta counts clickable
File: `src/components/profile-v2/ProfileV2Hero.tsx`
- Wrap `{connectionsCount} connections`, `{followerCount} followers`, `{followingCount} following` in `<button>`s (inline, underline-on-hover).
- Destinations mirror the QuickStats "Connections" route (owner: `/dna/connect/network?tab=connections`; non-owner: `/dna/connect/discover`). Followers/following → same network route with `?tab=followers` / `?tab=following` (falls back gracefully if the tab isn't wired yet).

### 3. Verify the working pattern is applied consistently
- Confirm `ProfileV2QuickStats` remains unchanged (it's the reference).
- No other silent counters on the profile page.

## Out of scope for this pass

Auditing every counter across every hub (feed sidebars, admin cards, community widgets) would balloon the change. Once you approve this, I can do a second sweep of non-profile surfaces if you want.

## Technical notes

- Reuse existing routes; no new pages, no new data hooks.
- All new buttons: 44px min-height, keyboard-focusable, `aria-label` with count + destination.
- Owner detection: `ProfileV2.tsx` already computes `isOwner`; pass it into `DiasporaFootprint`.
