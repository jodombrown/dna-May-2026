## What we already have (the "DNA hub" pattern)

Two shared components — this IS the DNA mobile chrome:

- `src/components/mobile/DnaMobileHeader.tsx` — the locked top row: DNA logo (left), one bubble in the center (composer / search / static), notification bell + avatar (right). Every /dna/* page must render this and nothing else in that row.
- `src/components/mobile/DnaMobileHubShell.tsx` — the wrapper that mounts `DnaMobileHeader` fixed at top, an optional always-visible `tabs` row directly below it (the "menu nav"), the scrolling content, and `MobileBottomNav` at the bottom.

Hub-by-hub status of the header + menu-nav pattern:

```text
Hub          Header row                Menu-nav row
---------    -----------------------   ----------------------------------
Feed         DnaMobileHeader           MobileFeedTabs ("All" + icons)      ✓
Connect      DnaMobileHeader           ConnectMobileTabs                    ✓
Convene      DnaMobileHeader           ConveneMobileTabs                    ✓
Contribute   DnaMobileHeader           ContributeMobileTabs                 ✓
Collaborate  DnaMobileHeader           (missing)                            ✗
Convey       (missing entirely)        (missing)                            ✗
```

`/dna/convey` is currently routed to `ConveyHub -> ConveyDiscovery`, which renders a standalone `HubHero` megaphone card and never mounts `DnaMobileHubShell`. The canonical Convey hub `pages/dna/Convey.tsx -> ConveyStoryHub` (which does render `DnaMobileHeader` and a 5-tab bar) is defined but not wired to the route.

## Fixes

### 1. Collaborate — add the menu-nav row

- New `src/components/collaborate/CollaborateMobileTabs.tsx`, mirroring `ConnectMobileTabs`. Tabs (icon-first, active tab shows its label):
  - Spaces (Users icon) → `/dna/collaborate`
  - My Spaces (Bookmark icon) → `/dna/collaborate/my-spaces`
  - Discover (Compass icon) → `/dna/collaborate/spaces`
  Active tab derived from `useLocation().pathname`.
- Update `src/components/collaborate/SpacesShell.tsx` to accept an optional `tabs?: ReactNode` and pass it straight through to `DnaMobileHubShell`.
- `CollaborateHub`, `MySpaces`, and `SpacesIndex` all render `<SpacesShell tabs={<CollaborateMobileTabs />} ... />` so every Collaborate surface shows the same second row.

### 2. Convey — put the canonical hub back on the route

- Change `App.tsx` `/dna/convey` to render `pages/dna/Convey.tsx` (which returns `ConveyStoryHub`) instead of `pages/dna/convey/ConveyHub.tsx`. `ConveyStoryHub` already mounts `DnaMobileHeader` and already has its 5-section tab bar (Pulse / Curated / My Circle / My Voice / Saved) — the only visible change on mobile is that both surfaces now appear.
- Wrap the mobile branch of `ConveyStoryHub` in `DnaMobileHubShell` so its tab bar is passed via the `tabs` prop, matching the way every other hub renders. Removes the current bespoke `fixed` header handling in that file.
- `pages/dna/convey/ConveyHub.tsx` + `ConveyDiscovery.tsx` stay in the tree for now (referenced from a couple of DIA discovery cards), but are no longer the /dna/convey landing.

### 3. Guardrail so this doesn't regress on the next new page

- Extend `docs/MOBILE_HUB_BUBBLE_BEHAVIOR.md` with a "Menu-nav contract" section: every `/dna/*` hub MUST render through `DnaMobileHubShell` and MUST pass a `tabs` node (even single-tab hubs render a one-item bar for visual parity). New pages that skip either fail review.
- Extend `src/test/dnaMobileHubShell.test.tsx` with two new cases that mount Collaborate and Convey at mobile viewport and assert (a) `DnaMobileHeader` is present and (b) at least one `role="tablist"` sits directly beneath it.

## What to tell reviewers going forward

Point them at `MOBILE_HUB_BUBBLE_BEHAVIOR.md`. The single-line rule: any new `/dna/*` page must render through `DnaMobileHubShell`, pass one `bubble` (composer / search / static) and one `tabs` node — same top row, same second row, only the bubble content and tab labels change per hub.

## Out of scope

- No visual redesign of the header, bubble, tabs, or bottom nav.
- No changes to Feed / Connect / Convene / Contribute (they already conform).
- No changes to desktop layouts — this is the mobile shell only.
- Not deleting `ConveyDiscovery` in this pass; that's a separate cleanup once we confirm nothing links to it.
