## What the "red dot behind the bar" actually is

Zooming into the annotation on IMG_5444: it is not a red pixel — the red circle is your marker. The artifact inside the circle is a **thin vertical orange-brown line at the right edge of the screen**, sitting between the second card (the Convene "Hosting" event card with the copper border) and continuing down behind the semi-transparent `MobileBottomNav`.

Reading the card structure, the color and vertical position match the **`border-2` right edge of the Convene event card poking out past its container by ~1–2px**. The card above it (the Convey "Update" post card) has a slightly narrower box because it uses different horizontal padding / max-width than the event card. When the event card is wider than the feed column, its right border pokes past the feed's clip line and shows through the translucent bottom nav (which uses `bg-background/95 backdrop-blur-md`), which is exactly the "behind the bar" appearance.

No red UI element exists there — no notification dot, no FeedbackFAB (that's hidden on mobile), no `bg-destructive` badge on this route.

## Plan

1. Confirm the source on a live signed-in session with Playwright — take an element screenshot of the second card + right screen edge, log `getBoundingClientRect().right` for the feed column, each card, and the event card's image/media wrapper. Expect the event card's right edge > feed column's right edge by 1–4px.
2. Identify the specific card wrapper that overflows. Prime suspects (in order):
   - `src/components/feed/activity-cards/FeedEventCard.tsx` outer wrapper — mismatched `mx-` / negative margin vs the Convey post card.
   - `src/components/convene/ConveneEventCard.tsx` if the feed reuses it — its media block uses `absolute inset-0` gradients that assume no border; combined with `border-2`, total width = container + 4px.
   - The feed row container in `src/components/feed` (`FeedList` / `UniversalFeed`) — the two card types may be rendered with different padding.
3. Fix in the frontend only, no logic changes:
   - Align the event card's outer container to match the Convey card's padding/width so both cards clip identically to the feed column.
   - Add `overflow-hidden` on the card wrapper so the `border-2` and any inner absolute layers are always contained.
   - If the border is the culprit, either move it to `ring-2 ring-inset` (stays inside the box) or reduce to `border` and rely on the existing shadow.
4. Verify: re-run Playwright at 420×741, screenshot the same region, confirm the two cards share the same right edge and nothing bleeds under the bottom nav. Also check at 375px and 768px.

## Technical notes

- Root cause is almost certainly a width/padding mismatch between the Convey post card and the Convene event card in the feed list, plus a `border-2` on the outer box that adds 2px each side outside the "content box" the sibling card uses.
- `MobileBottomNav` (`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md`, z-50) lets anything with a lower z-index show through faintly — that's why the sliver looks like it's "behind" the bar.
- Change is presentation-only: card wrapper classes in one or two files. No route, data, or state changes.

Ready to switch to build mode and apply the fix once you approve.