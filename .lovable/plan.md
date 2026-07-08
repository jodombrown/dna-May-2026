## Goal

Replace user-facing "Sign Up" / "Sign up" / "Get Started" copy with **"Join Now"** across the platform, and reorder auth CTA pairs so **Join Now appears before Sign In**.

## Scope — copy changes

Rename every user-facing "Sign Up" / "Sign up" / "Get Started" button and heading to **"Join Now"** in:

- `src/components/UnifiedHeader.tsx` (top nav — the button shown in screenshot 1)
- `src/components/HeroSection.tsx` (homepage hero — screenshot 3)
- `src/pages/Auth.tsx` — the "Sign In / Sign Up" tab toggle becomes **"Sign In / Join Now"** (screenshot 2), and the "Create Account" submit button becomes **"Join Now"**
- `src/pages/PublicPostPage.tsx`, `src/pages/PublicEventPage.tsx`, `src/pages/InviteSignup.tsx`
- `src/pages/PartnerWithDna.tsx`, `src/pages/PartnerStart.tsx`, `src/pages/PartnerSector.tsx`
- `src/pages/Programs.tsx` ("Get Started Today" → "Join Now")
- `src/pages/Install.tsx`, `src/pages/FactSheetPage.tsx` ("Sign Up Today" → "Join Now")
- `src/pages/documentation/FeatureDetail.tsx` ("Ready to get started?" CTA + Sign Up button)
- `src/components/demo/sections/DemoMovement.tsx` ("Get Started" in the card from screenshot 4)
- `src/components/public-profile/PublicProfileHeader.tsx`, `PublicProfileCTA.tsx`
- `src/components/profile-v2/PublicProfileLandingView.tsx`
- `src/components/manifesto/ManifestoCTA.tsx`
- `src/components/convey/ConveyDIADiscoveryCard.tsx`
- `src/components/WhoIsDNAForSection.tsx`
- `src/components/auth/BetaWaitlist.tsx`
- `src/pages/dna/convene/EventDetail.tsx` (only the auth CTA labels, not the "Register" event action)
- `src/components/tours/FeatureTour.tsx`, `src/components/onboarding/OnboardingTour.tsx`, `src/components/onboarding/FirstTimeWalkthrough.tsx` (final tour CTA)

## Scope — button order

Wherever "Sign In" and "Sign Up / Get Started" appear as a pair, flip so **Join Now renders first**, Sign In second. Confirmed locations:

- `UnifiedHeader.tsx` (screenshot 1 pair)
- `HeroSection.tsx` (screenshot 3 pair)
- `PublicPostPage.tsx`, `PublicEventPage.tsx`, `InviteSignup.tsx` header CTAs
- `PartnerWithDna.tsx`, `PartnerStart.tsx` CTA pairs
- Any other file above that renders both buttons adjacent

Visual styling stays the same: **Join Now = primary (filled emerald)**, **Sign In = secondary (outline)**.

## Out of scope (intentionally NOT changed)

- Internal code identifiers: `signUp()` function, `mode=signup` URL query, `/invite` route, table names (`waitlist_signups`, `hub_notification_signups`, `beta_signup_data`), component filenames (`InviteSignup.tsx`, `BetaSignupDialog`, `AmbassadorSignupDialog`)
- The "Onboarding" tour "Get Started" that starts an in-app walkthrough for already-logged-in users — the user's request is about acquisition copy, not tour navigation. **Flag for confirmation:** should the tour CTAs also switch to "Join Now"? Default: leave them as "Get Started" since the user is already joined. Will confirm after review, or change if requested.
- Reset password copy ("Enter the email you used to sign up") — descriptive prose, not a CTA
- Admin/legacy files under `_archived/`

## Verification

- `rg "Sign [Uu]p|Get Started"` on `src/` after edits, review remaining hits are all internal/intentional
- Spot-check the four screens from the uploaded screenshots (header, /auth, hero, demo movement card)
- tsgo typecheck