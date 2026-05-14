## Problem

The DNA logo currently sits in a different place on `/dna/*` pages than on the landing page. Comparing the two headers:

**Landing page (`UnifiedHeader.tsx`)**
- Container: `max-w-7xl mx-auto px-2 sm:px-6 lg:px-8`
- Row: `h-16` (64px)
- Logo wrapper: `-ml-8` (pulls logo 32px left)
- Logo: `h-[80px] w-auto` (overflows row vertically by ~8px top/bottom — intentional)

Net effect on a 420px viewport: logo's left edge lands at roughly **-24px from container edge**, and its vertical center sits on the 64px row's centerline.

**Mobile `/dna/*` (`DnaMobileHeader.tsx`)**
- Row: `h-20` (80px), `pl-2 pr-2` (8px each side), no `-ml-*`
- Logo: `h-[80px] w-auto`

Net effect: logo's left edge lands at **+8px from screen edge**, and its vertical center sits on the 80px row's centerline.

So when the user navigates from `/` into `/dna/feed`, the logo visibly shifts ~32px right and ~8px down. The mobile fallback header (`MobileHeader.tsx`) does the same thing.

## Fix

Make the mobile DNA headers reproduce the landing-page logo geometry exactly. Touch only logo-positioning code; do not move the bubble, bell, or avatar around beyond what's required to share the row.

### 1. `src/components/mobile/DnaMobileHeader.tsx`
- Wrap the row in the same container the landing page uses: `max-w-7xl mx-auto px-2 sm:px-6 lg:px-8`.
- Change the row height from `h-20` to `h-16` so the logo sits on the same baseline as the landing page (the 80px logo will overflow the row vertically, matching the landing page exactly).
- Wrap the logo in a `-ml-8` flex container with `flex-shrink-0`, identical to `UnifiedHeader` lines 245-257.
- Keep the bubble as `flex-1 min-w-0` and the right cluster as `flex items-center gap-1.5 flex-shrink-0` so they still share the row cleanly.
- Update the `max-h-20`/`isVisible` collapse animation to `max-h-16` so the show/hide transition still matches the new row height.
- Keep `width={142} height={80}` on the `<img>` so CLS stays at zero.

### 2. `src/components/mobile/MobileHeader.tsx`
- Apply the same container + `-ml-8` wrapper + `h-16` row treatment around the existing `<img className="h-[80px] w-auto" />` so any non-DNA mobile route that still uses this header lines up too.

### 3. Verification (no source changes, just confirm)
- `src/components/header/Logo.tsx` and the four other `dnaLogo` usages already render at `h-[80px] w-auto`. Logo size is consistent; only the surrounding container differs, and that's what this plan fixes.
- The `useMobileHeaderHeight`/`useSetCSSHeaderHeight` hook measures the rendered element, so dropping the row from 80→64px will automatically reflow the content offset below — no hardcoded `pt-*` to chase.

## Out of scope

- Desktop `UnifiedHeader` itself (it's the reference, do not change it).
- Bubble width / composer behavior / right cluster icons.
- Bottom nav, PulseBar, second-row tabs on each hub.
- Any other `dna-logo` instance (DesignSystem, PitchDeck, IntroductionModal, IntroductionMessageCard) — those are in-content uses, not the persistent header.

## Manual check after implementation

Load `/` then click into `/dna/feed`, `/dna/convey`, `/dna/collaborate`, `/dna/connect`, `/dna/convene`, `/dna/contribute` at 375 / 390 / 420 / 430px. The logo's bounding box should not shift by a single pixel between landing and any `/dna/*` route.
