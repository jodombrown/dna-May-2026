## Problem

On every page, there's an empty ~56px band between the header navigation and the page content (visible in all three screenshots). The header looks "detached" from the hero/banner below it.

## Root Cause

`src/layouts/BaseLayout.tsx` renders a spacer div that always reserves space for **header + PulseBar**:

```
height: calc(var(--roadmap-banner-height, 0px)
           + var(--unified-header-height, 56px)
           + var(--pulse-bar-height, 56px))
```

`PulseBar` (`src/components/pulse/PulseBar.tsx`) returns `null` when there is no user (public/marketing pages like `/`, `/about`, `/connect` preview) and on mobile. On mobile it correctly sets `--pulse-bar-height: 0px`, but on **desktop when logged out** it never sets the variable, so the spacer falls back to the hard-coded `56px` default — producing the visible empty band.

## Fix

Single-file change in `src/components/pulse/PulseBar.tsx`:

Extend the existing effect so that whenever `PulseBar` is not rendered (mobile OR no user), `--pulse-bar-height` is forced to `0px`, and restored only when it actually renders.

Effectively: change the guard from `if (isMobile)` to `if (isMobile || !user)` so the CSS var is zeroed in both cases.

## Why this is the right scope

- Affects every page consistently (the spacer is global in `BaseLayout`).
- No layout changes for authenticated users — `PulseBar` still renders and still reports its real height.
- No hero/section padding edits needed; the gap goes away because the reserved space goes to 0 when there's no PulseBar.

## Verification

- Public pages (`/`, `/about`, `/connect`) on desktop: header sits flush against hero/banner.
- Authenticated `/dna/feed` desktop: PulseBar still appears directly below header, no overlap.
- Mobile: unchanged (already 0).