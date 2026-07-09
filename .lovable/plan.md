# Fix: Reshare dialog layout shifts on mobile when typing

## Diagnosis
The "Share this post" modal in `src/components/feed/dialogs/ReshareDialog.tsx` is built on Radix `Dialog` with `sm:max-w-[600px]`. Two problems combine to produce the visible shift between screenshot 1 (unfocused) and screenshot 2 (focused with text):

1. **Dialog width overflows on mobile.** The dialog has no mobile width cap. When the mobile keyboard opens the visualViewport shrinks, Radix keeps the dialog centered via `translate(-50%,-50%)`, and its natural content width (600px preview card + button row) starts extruding past the viewport, so title/description/preview text get clipped on the right edge.
2. **Action row grows when typing.** The submit button label switches from `Reshare` to `Reshare with Comment` the moment any character is typed. Combined with `Quick Reshare` next to it in a `flex justify-end gap-2` row with no wrap/shrink, the row widens and pushes the whole dialog to overflow further. That is the "look and feel changed" the user is describing.
3. **Not using the platform's ResponsiveModal.** Project standard (memory) is Radix Dialog on desktop, Vaul Drawer on mobile via `ResponsiveModal` (as `src/components/posts/ShareDialog.tsx` already does). This alone stabilises the mobile experience: the sheet is pinned to the bottom, resizes with the keyboard, and never horizontally shifts.

## Fix (scope: presentation only, single file)
Edit `src/components/feed/dialogs/ReshareDialog.tsx`:

- Replace `Dialog / DialogContent / DialogHeader / DialogTitle / DialogDescription` with `ResponsiveModal / ResponsiveModalHeader / ResponsiveModalTitle / ResponsiveModalDescription / ResponsiveModalFooter` (same primitive used by `ShareDialog`).
- Constrain width with `className="sm:max-w-[600px]"` on the modal so desktop is unchanged; mobile becomes a bottom drawer that never overflows horizontally.
- Wrap body content in `px-4` and move the action row into `ResponsiveModalFooter` with `flex-col-reverse sm:flex-row sm:justify-end gap-2` so on mobile the primary button stacks full-width above the secondary and cannot cause horizontal growth.
- Stabilise the CTA: keep the button label constant as `Reshare` regardless of `commentary` content (icon + label do not mutate on keystroke). This removes the width jump between screenshots 1 and 2.
- Give the textarea `w-full` and the preview `Card` `w-full min-w-0` with `overflow-hidden`, and add `break-words` to the content `<p>` so long text wraps instead of forcing width.

No behavior/business-logic changes: `onReshare`, `onOpenChange`, commentary state, loading state, and legacy `onSuccess` fallback all preserved. The sibling `src/components/feed/ReshareDialog.tsx` (different, "Reshare Post" title) is not touched since screenshots show the `dialogs/ReshareDialog.tsx` variant.

## Verification
- Open the feed on mobile viewport (420px), press Reshare, confirm sheet slides up from bottom, no horizontal shift, textarea focus opens keyboard without the modal changing width or clipping the title/preview.
- Type text: button label stays "Reshare", no layout jump.
- Desktop: dialog still centered at 600px max width, footer buttons on one row.
