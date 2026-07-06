## Scope

You raised eight items covering Discover polish, mobile chrome consistency across Collaborate / Contribute / Messages / Notifications / Feedback / Settings, and one regression test. I'll group them so the shared work (a single "DNA mobile hub shell") is done once and reused, then finish per-page fixes and the test.

## Phase 1 — Discover polish (small, safe)

1. **Load More UX**
  - Track a dedicated `isLoadingMore` state in `Discover.tsx` so the button disables and shows a spinner only during the paginated fetch (today `loading` is shared with the initial skeleton state).
  - On fetch failure, set `loadMoreError` and render an inline retry row ("Couldn't load more members. Retry") instead of silently hiding the button.
  - Keep the existing dedupe + `hasMore` end state (already renders "You're all caught up").
2. **End-of-list state consistency**
  - Extract the "You're all caught up" block into a shared `<CaughtUpNotice />` in `src/components/shared/` and reuse it on Discover (both when `hasMore === false` and when the last page returned 0 net-new members after dedupe).
3. **Automated regression test** (`src/test/discoverPagination.test.tsx`)
  - Mock `supabase.rpc('discover_members', …)` to return overlapping IDs on page 2, non-overlapping on page 3, then empty.
  - Assert: page 1 renders N cards, clicking Load More increments the RPC's `p_offset` (20, then 40, then 60), overlapping IDs never duplicate in the DOM, and the "You're all caught up" notice appears once the RPC returns an empty page.

## Phase 2 — DNA Mobile Hub Shell (shared chrome)

Create one canonical mobile shell used by every `/dna/*` hub that doesn't already have a bespoke layout. This is the piece that makes Collaborate / Messages / Notifications / Feedback / Settings feel like Feed / Connect / Convene.

- **New file** `src/components/mobile/DnaMobileHubShell.tsx`
  - Renders `DnaMobileHeader` (logo / bubble / bell / avatar) in a `fixed top-0` container measured with `useMobileHeaderHeight`.
  - Wraps the top bar in a `useScrollDirection`-driven collapse (same "hide top bar on scroll, keep tabs visible" pattern already used in Connect).
  - Optional `tabs` slot rendered directly under the top bar and always visible.
  - Applies `paddingTop` to the content column from the measured height.
  - Reserves `pb-bottom-nav` for the bottom navigation.
- Refactor `SpacesShell` to compose `DnaMobileHubShell` instead of its own fixed header (removes the current "static" bubble that just says "Search Spaces…" and doesn't behave).
- Reuse it for Messages, Notifications, Feedback, and Settings shells below.

## Phase 3 — Per-page fixes using the shared shell

4. **Collaborate hub feels foreign** (screenshot 1)
  - Wrap `CollaborateHub.tsx` (and `MySpaces`, `SpacesIndex`) with `DnaMobileHubShell`.
  - Move the "Collaborate / Create Space" title row + description into a `tabs`-style secondary row so the top bar carries only logo / search bubble / bell / avatar, matching Feed & Connect.
  - Bubble becomes a live `search` bubble that filters the currently shown lists (My Spaces + Discover) client-side, matching how Connect's search behaves.
  - Ensure the bottom nav is present (`pb-bottom-nav`) — same as other hubs.
5. **Contribute header scroll behavior** (matches Connect fix)
  - Update `ContributeHub.tsx` to drive `ContributeMobileHeader` with a `useScrollDirection` flag: `isRow1Visible` collapses the top bar on scroll, tab row stays fixed. Uses the same measured-height pattern as Connect so content padding stays correct.
6. **Messages page missing bottom nav** (screenshot 5)
  - Locate the messages page shell (`src/pages/dna/Messages.tsx` / mobile view) and wrap it with `DnaMobileHubShell` (search-bubble variant), and add the missing `pb-bottom-nav` so the global bottom nav re-appears. Keep the existing Primary / Requests / Spam / Archive tabs as the `tabs` slot.
7. **Notifications / Settings / Feedback don't match** (screenshot 6)
  - Wrap `NotificationsPage`, `src/pages/dna/settings/*`, and the Feedback hub page in `DnaMobileHubShell` with a `static` bubble that shows the page title (e.g. "Notifications", "Settings", "Alpha Feedback"). Result: same top bar chrome, same bottom nav, same content padding as Feed / Connect.
  - Remove any duplicated in-page back arrows / close buttons that competed with the shell.

## Phase 4 — Guardrail

- Extend `src/test/mobileHeaderOverlap.test.tsx` (already the header regression) with a snapshot that fails if a `/dna/*` hub renders without `DnaMobileHubShell` or without `pb-bottom-nav`.

## Technical notes

- No schema, RLS, or edge-function changes. All work is React / Tailwind.
- Uses only existing hooks: `useMobile`, `useScrollDirection`, `useMobileHeaderHeight`, `useHeaderVisibility`.
- No new dependencies.
- Complies with the mobile-first + Anti Vibe-Coded doctrine (no new gradients, no new colors, keeps 44px targets, no em-dashes).

## Out of scope (flag for later)

- Desktop redesign of Collaborate (you said "mobile now"). I meant that right now I'm focused on the mobile view right now but fix both desktop and mobile as always
- Any changes to comment / posts logic (already shipped previously).
- Redesigning the individual Settings sub-pages beyond wrapping them in the shell.