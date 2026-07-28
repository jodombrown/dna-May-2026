## Goal

Turn the platform's "Join the Waitlist" calls to action into "Sign up", and unblock the signup path so a new test Member account can be created.

## What is actually blocking signup

Verified against the code and the live database:

- `src/config/featureFlags.ts` exports `WAITLIST_MODE = true`. In `src/pages/Auth.tsx:45` this redirects any `/auth?mode=signup` visit to `/waitlist`. This is the only live block on the signup form.
- The `REGISTRATION_ENABLED` row in `feature_flags` is `false`, but nothing in `src/` reads it on the signup path (`useFeatureFlags` exposes it and no component consumes it). It is inert today. Leaving it as is; flag only if you want the DB switch to be the real control later.
- `supabase/config.toml` has `enable_signup = true`. The live Auth setting lives in the Supabase dashboard and is outside the Lovable lane. If signup still 400s after this change, that toggle is the next place to look.

## Changes

1. `src/config/featureFlags.ts`: set `WAITLIST_MODE = false` and update the comment block so the restore path is accurate.
2. Replace the copy "Join the Waitlist" with "Sign up" across the 24 source files that carry it, keeping each button's existing destination (`/auth?mode=signup`) and styling. Files include the public header (`PublicSiteHeader.tsx`), `UnifiedHeader.tsx`, `HeroSection.tsx`, `WhoIsDNAForSection.tsx`, `ManifestoCTA.tsx`, `FiveCDetailSheet.tsx`, `PublicProfileCTA.tsx`, `PublicProfileLandingView.tsx`, `PublicPostView.tsx`, `PublicEventPage.tsx`, `EventDetail.tsx`, the Partner pages, `Programs.tsx`, `Install.tsx`, `Contact.tsx`, `FactSheetPage.tsx`, `FeatureDetail.tsx`, `InviteSignup.tsx`, `DemoMovement.tsx`.
3. Leave the dedicated waitlist surfaces themselves alone as surfaces (`src/pages/Waitlist.tsx`, `WaitlistPopup.tsx`, `BetaWaitlist.tsx`) but stop pointing generic CTAs at them; the `/waitlist` route stays reachable so existing links do not 404. If you would rather retire the waitlist page entirely, say so and I will fold that in.

## Verification

- Typecheck passes.
- A signed-out Playwright visit to `/auth?mode=signup` renders the signup form rather than redirecting to `/waitlist`.
- Grep confirms zero remaining "Join the Waitlist" strings on CTA buttons.

## Note on lanes

Nothing here touches the database or an edge function. If the live Supabase Auth "Allow new users to sign up" toggle is off, that is a dashboard action for you, and I will hand back the exact place to click rather than attempting it.
