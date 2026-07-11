## Goal
Turn DIA into a persistent right-side sheet (like the Universal Composer) instead of navigating to `/dna/dia`. Every "Ask DIA" entry point (right-rail card, suggested prompts, "Start a conversation") opens the sheet and, when a prompt is clicked, immediately runs that prompt inside the sheet.

## UX

- New right-side sheet: `DiaSheet` (Vaul on mobile, Radix Sheet on desktop, right-anchored, ~440px wide, full height, scrim on mobile only).
- Header: MateMasie mark + "DIA" + Alpha chip + close button.
- Body tabs: **Ask** (default), **Insights**, **History** — same three surfaces from `DiaPage`, but rendered inside the sheet.
- Composer pinned at the bottom of the Ask tab (textarea + send), matching the composer's visual language (rounded input, copper primary send button, subtle border, no shadow).
- Streaming answer area above the composer with markdown rendering, source chips, and a "New conversation" action.
- Respect `prefers-reduced-motion`; opacity-only reveal <=200ms per motion rules.

## Behavior

1. **Global open state** via a new `DiaSheetContext` (`open`, `openWith(prompt?)`, `close`). Provider mounted in `App.tsx` alongside other global providers. The sheet itself is lazy-loaded and only mounts when `open === true` (performance rule #1).
2. **Right-rail "Ask DIA" card** (`src/components/right-rail/AskDiaCard.tsx` or wherever it lives — locate via rg):
   - "Start a conversation" -> `openWith()` (empty).
   - Each suggested prompt chip -> `openWith(prompt)` which opens the sheet AND auto-submits that prompt.
   - Remove the `navigate('/dna/dia')` calls.
3. **Any other DIA entry points** (e.g., hub DIA panels' "Ask DIA about X") route through `openWith(seedPrompt)` instead of navigating.
4. **Route `/dna/dia`**: keep the route but redirect to previous location and auto-open the sheet, so old links still work without a dead page.
5. **Auto-submit**: when `openWith(prompt)` fires, the Ask tab seeds the input, triggers the same submit path as manual send, and streams the answer inline — no page nav, no reload.

## Files

New:
- `src/contexts/DiaSheetContext.tsx` — provider + `useDiaSheet()` hook.
- `src/components/dia/DiaSheet.tsx` — sheet shell (ResponsiveModal-style right anchor), lazy default export.
- `src/components/dia/DiaSheetAsk.tsx` — Ask tab: seeded input, submit, streaming answer list.
- `src/components/dia/DiaSheetMount.tsx` — lazy loader gated on `open`.

Edited:
- `src/App.tsx` — wrap tree in `DiaSheetProvider`, mount `<DiaSheetMount />` once globally.
- `src/components/right-rail/DnaRightRail.tsx` (and the Ask DIA card component) — wire chips + button to `useDiaSheet().openWith`.
- `src/components/hubs/shared/HubDIAPanel.tsx` — `onAskDIA` calls `openWith` instead of navigating.
- `src/pages/dna/DiaPage.tsx` — becomes a thin redirect that calls `openWith()` on mount and `navigate(-1)` (fallback `/dna/feed`), so `/dna/dia` no longer renders a full page.

Reused:
- Existing `DiaSearch`, `DiaHistory`, `DiaInsights` components are refactored slightly so `DiaSearch` accepts an `onSubmitted` callback and can be embedded inside the sheet (no container padding assumptions).

## Technical Details

- `openWith(prompt?: string)` stores `{ open: true, seedPrompt: prompt, seedNonce: Date.now() }`. The Ask tab watches `seedNonce` to trigger a fresh auto-submit even when the same prompt is chosen twice.
- Submission uses the existing DIA search hook/edge function that `DiaSearch` already calls — no backend changes.
- Sheet uses `Sheet`/`SheetContent side="right"` from shadcn on desktop and Vaul `Drawer` from bottom on mobile (via `useIsMobile`), keeping consistency with existing ResponsiveModal.
- History persistence continues to use the current DIA history storage; no schema changes.
- Realtime/perf: no new Supabase channels. Sheet content only mounts on open (React.lazy + Suspense).

## Out of Scope

- No visual redesign of the answer rendering beyond fitting the 440px column.
- No changes to DIA edge functions or model routing.

Confirm and I'll build it.