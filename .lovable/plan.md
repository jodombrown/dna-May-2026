## Scope

Five things, all building on the Phase 1-4 work already in place:

1. Adaptive onboarding right-rail behavior (esp. hide-forever-once-100%)
2. Unit tests for the gate + completion math
3. Verify tour deep links + auto-advance-on-real-completion
4. "Restart onboarding tour" button in Settings > Preferences
5. Gate the Create Event entry buttons with a progress + deep-link notice

## Details

### 1. Adaptive right-rail states (`OnboardingRightRail.tsx` + `useOnboardingState.ts`)

Three explicit states, matching what the user described:

- **New authorised user** (`stage === 'first_run'`) — Welcome card + "Start setup" CTA (already implemented, keep as-is).
- **Returning, incomplete** (`getting_started` / `active`) — Progress bar + prioritised checklist + deep link (already implemented, keep as-is).
- **Complete** (`stage === 'complete'`) — Show the "Profile at 100%" celebration card **once**, then hide the panel entirely on subsequent loads. Persistence: insert a `user_onboarding_selections` row (`selection_type='profile_complete_acked'`, `target_title='v1'`). Behavior:
  - First time reaching 100%: show the celebration card with a small "Got it" dismiss button.
  - After dismissal: panel returns `null` for all future sessions while percent stays ≥ 95%.
  - If completion later drops below 95% (user removes a field), the getting-started/active panel returns and the ack row is cleared automatically the next time they hit 100% again (delete the ack when percent < 95).

Extend `useOnboardingState` with a `completionAcked: boolean` derived from the same query so the rail can gate on it.

### 2. Unit tests

New file: `src/lib/__tests__/featureGate.test.ts` (vitest, matches existing pattern in `src/test/`).

Cases:

- `calculateProfileCompletionPts`
  - Empty / null profile → 0.
  - Fully populated profile (all 14 fields valid) → 100.
  - Whitespace-only strings are treated as empty (bio="   " → not counted).
  - Skills array with fewer than 3 valid entries → skills field not counted.
- `getMissingFields`
  - Returns fields sorted by priority asc, then points desc.
  - Empty profile returns all 14 fields.
- `evaluateFeatureGate`
  - `event_create` on a profile missing `bio` → `allowed=false`, `missing` contains `bio`.
  - `event_create` on a complete profile → `allowed=true`, `missing=[]`.
  - `post_create` on a profile at 25% overall but with avatar/full_name/headline complete → `allowed=false` (percent gate).
  - Each key in `FEATURE_GATES` returns a well-formed `GateResult` (label, reason, percent, minPercent).
- Gate/scorer field-id sync
  - Every field id in every `FEATURE_GATES[k].fields` must exist in the ids returned by `getProfileFieldChecks(fullProfile)`. This catches drift if someone renames a field in the scorer without updating gates.

### 3. Tour verification

Two concerns, both fixed in `useFirstRunTour.ts` + `FirstRunActionTour.tsx`:

- **Deep link correctness** — audit each step's `href` against the actual routes:
  - `sectors` / `bio` → `/dna/profile/edit#professional` ✓ (route exists)
  - `skills` → `/dna/profile/edit#discovery` ✓
  - `first_connection` → `/dna/connect/discover` ✓
  - `first_event` → `/dna/convene/events` ✓ (route exists)
- **Advance only on real completion** — steps with a `satisfiesField` are already tied to the profileCompletion scorer, so they only turn green when the field truly satisfies the scorer's rule (e.g., bio ≥ 50 chars, skills ≥ 3 entries). Remove the optimistic `markStepDone` call that currently fires for `sectors` / `bio` / `skills` when the user clicks their CTA — those must stay pending until the underlying field is real. Keep optimistic marking only for `first_connection` and `first_event` (no field to observe).
- Add a small vitest for the state derivation: given a set of `completed` field ids and a set of persisted step markers, assert which steps are `done`.

### 4. Restart tour button

Add a "Restart first-run tour" row to `src/pages/dna/settings/PreferencesSettings.tsx`. It:

- Reads `useFirstRunTour()`.
- Shows a description + a `Restart tour` button.
- On click: call `reopenTour()` (deletes the skip row) AND clear the individual step markers so all 5 steps come back. Requires extending `useFirstRunTour` with a `resetTour()` method that deletes both the skip row and every `first_run_tour_step` row for the user, then invalidates the query.
- After click, toast "Tour restarted" and let the user navigate to the feed.

### 5. Event Create gate

The "Create Event" entry points today are:
- `src/components/feed/FeedHeroGreeting.tsx` (quick action pill)
- `src/components/profile-v2/ProfileV2Events.tsx` (empty-state CTA)

Both currently open the universal composer in `event` mode. Wrap the click with the gate:

- New component `src/components/gating/GatedActionButton.tsx` — thin wrapper: takes `feature` (a `FeatureKey`), `onAllowed`, and normal button props. If the gate allows, invokes `onAllowed`; if locked, opens a `ResponsiveModal` containing `<FeatureGateNotice feature={...} />` (which already shows progress bar `X% / 60%`, missing fields, and a "Complete profile" deep link to `/dna/profile/edit`).
- Swap the two Create Event triggers to use `GatedActionButton` with `feature="event_create"`.
- Bonus: same wrapper is drop-in for future gates (Space create, Contribute post, Story publish).

## Files

New:
- `src/components/gating/GatedActionButton.tsx`
- `src/lib/__tests__/featureGate.test.ts`
- `src/hooks/__tests__/useFirstRunTour.derive.test.ts` (pure-logic derivation test)

Modified:
- `src/hooks/useOnboardingState.ts` — expose `completionAcked`.
- `src/components/right-rail/OnboardingRightRail.tsx` — hide-after-ack behavior for complete stage; add "Got it" ack action.
- `src/hooks/useFirstRunTour.ts` — add `resetTour()`, remove premature optimistic `markStepDone` for field-backed steps.
- `src/components/onboarding/FirstRunActionTour.tsx` — remove optimistic mark for `sectors` / `bio` / `skills`.
- `src/pages/dna/settings/PreferencesSettings.tsx` — add "Restart first-run tour" row.
- `src/components/feed/FeedHeroGreeting.tsx` — Event pill uses `GatedActionButton`.
- `src/components/profile-v2/ProfileV2Events.tsx` — empty-state CTA uses `GatedActionButton`.

## Out of scope

- No changes to the underlying composer, event form, or `create-event` edge function.
- No new persisted table columns — reusing `user_onboarding_selections` with new `selection_type` values (`profile_complete_acked`).
- No changes to Phase 1-2 security triggers or right-rail composition beyond what's listed above.
