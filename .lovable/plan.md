## Fix plan

1. **Stop the `history.replaceState` loop**
   - Remove the global `history.pushState` / `history.replaceState` monkey patch from `useSetCSSHeaderHeight`.
   - Replace it with a safe route-aware recalculation that listens to React Router location changes instead of patching browser history.
   - Make `OnboardingGuard` redirects idempotent so it never calls `navigate(..., { replace: true })` when the app is already at the intended path and query string.

2. **Stabilize the onboarding completion flow**
   - After Step 7 saves, invalidate the onboarding/profile queries before routing to `/dna/feed`.
   - Use `replace: true` for the final onboarding navigation so the browser stack does not bounce back into `/onboarding`.
   - Remove the delayed `setTimeout` navigation and reduce the confetti/toast behavior that is visually colliding with the wizard and bottom nav.
   - Keep the D054 data guarantees intact: partial mode still only updates role/place fields and does not touch `diaspora_status`.

3. **Correct the welcome message**
   - Change the completion toast from `Welcome to DNA!` to `Welcome to the Diaspora Network of Africa`.
   - Replace the party icon with the actual DNA logo so the logo carries the short `DNA` brand while the text spells out the full name.

4. **Fix the first-time walkthrough content and icon mapping**
   - Update `FirstTimeWalkthrough` so the cards are named by the actual surface/module, not `DNA Connect`, `DNA Feed`, or `DNA Convey`.
   - Use the proper module/icon system:
     - Feed: platform feed icon and title `Feed`
     - Connect: Sankofa / Connect icon and title `Connect`
     - Convene: Nkonsonkonson / Convene icon and title `Convene`
     - Collaborate: Funtunfunefu Denkyemfunefu / Collaborate icon and title `Collaborate`
     - Contribute: Adinkrahene / Contribute icon and title `Contribute`
     - Convey: Mpatapo / Convey icon and title `Convey`
   - Remove the obsolete `Coming After Beta` slide because Convene, Collaborate, and Contribute are open in the current architecture.

5. **Verify the affected flow**
   - Re-test completing onboarding on mobile viewport.
   - Confirm no `replaceState` SecurityError appears.
   - Confirm no import-module failure screen appears during the walkthrough.
   - Confirm the welcome message, logo, slide titles, and icons match the corrected DNA architecture.
   - Then re-run the `seed-01` SQL verification for Path B if you have completed Steps 6 and 7.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>