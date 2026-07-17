## What's actually broken

The crash on Settings → Preferences isn't a rendering bug — it's a real runtime error surfaced by the global `ErrorBoundary`:

> tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance

Trace: `PreferencesSettings` → `useFirstRunTour` → two `supabase.channel(...).subscribe()` calls.

`useFirstRunTour` (src/hooks/useFirstRunTour.ts:154-182) creates channels named `first-run-tour:conn:<uid>` and `first-run-tour:evt:<uid>` — stable per user. The hook is already mounted elsewhere (the feed's tour panel). When Preferences opens inside the new in-sheet subpage, the hook mounts a second time, Supabase returns the same channel instance for that name, and `.subscribe()` throws.

`useProfile` already solved this with a ref-counted registry (src/hooks/useProfile.ts:20-60). `useFirstRunTour` needs the same treatment.

## Plan

### 1. Fix the subscribe crash (real bug)

`src/hooks/useFirstRunTour.ts` — replace the raw channel effect with the same ref-counted `Map` pattern used in `useProfile`:

- Module-level `Map<uid, { conn, evt, refs }>`.
- On mount: if entry exists, `refs++`; else create both channels, subscribe once, store.
- On unmount: `refs--`; when 0, `removeChannel` both and delete the map entry.
- Invalidation callback closes over `queryClient` via a `useRef` so a stale QC doesn't leak.

This resolves the Preferences crash and any other place the tour hook is used twice.

### 2. Redesign the error surface to match the Identity Sheet

Replace `src/components/ErrorBoundary.tsx`'s fallback UI. Current design uses gradient background, dna-terra/emerald/ochre stripe borders, colored dot decoration, and a hero-style layout — none of that matches the new Claude-style Identity Sheet.

New design language, matching `IdentitySheet` / `SettingsSheet`:

- Plain `bg-background` page, centered card at `max-w-lg`.
- Card: `bg-card border border-border rounded-lg` (no gradient stripes, no colored dots, no African-proverb block by default).
- Header row: small circular `bg-muted` icon tile with `AlertCircle` in `text-dna-copper`, then `text-heading font-display` title "Something went wrong" and a single `text-body text-muted-foreground` line.
- Primary action: `Try again` (calls a new `handleReset` that clears boundary state — no full page reload).
- Secondary actions rendered as `SettingsRow`-style rows (chevron-less): "Go back", "Return home", "Copy error details".
- Technical details in a `<details>` block using `text-caption font-mono` on `bg-muted/40` — closed by default (not `open`).
- Remove `dna-terra`, `dna-ochre`, gradient stripes, the proverb card, and the four-dot decoration to align with the anti-vibe-coded doctrine (no gradient-heavy hero, no decorative dots).
- Add a `reset` capability so the boundary can recover without `window.location.reload()` when the underlying error is transient (which this subscribe error is, after the fix).

### 3. Also apply inside the sheet

When an error is thrown by a lazy subpage inside `IdentitySheet`, today the whole app crashes into the global boundary because there's no inner boundary. Add a lightweight `SheetErrorPanel` (same visual language, smaller) wrapping the `Suspense` in `SettingsSheet.tsx` and `AccountDrawer.tsx` subpage renderer so a broken subpage shows a scoped error inside the sheet with Retry / Back, instead of blowing away the whole app.

### 4. Scope guardrails

- No schema, RLS, or backend changes.
- No changes to `useProfile` (already correct).
- No changes to the feed / preview area — this is purely error UI + one hook fix.
- Anti-vibe-coded doctrine respected: no gradient text, no pastel decoration, `font-display` only on the heading, semantic tokens only.

## Files touched

- `src/hooks/useFirstRunTour.ts` — ref-counted channel registry (fix crash).
- `src/components/ErrorBoundary.tsx` — redesigned fallback + `reset` handler.
- `src/components/ui/settings-kit/SheetErrorPanel.tsx` — new, scoped in-sheet error card.
- `src/pages/dna/settings/SettingsSheet.tsx` — wrap subpage `Suspense` in `SheetErrorPanel`.
- `src/components/navigation/AccountDrawer.tsx` — same wrap around its subpage `Suspense`.

## Verification

- Open Settings → Preferences: no crash, tour restart button still works.
- Force-throw inside a settings subpage: scoped `SheetErrorPanel` shows inside the sheet, main app + feed remain interactive.
- Force-throw at route level: new global error card renders in Identity Sheet visual language, "Try again" recovers without a page reload.
- Typecheck clean.
