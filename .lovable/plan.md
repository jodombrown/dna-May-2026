## Goal

Temporarily replace every "Join Now" signup CTA with a "Join the Waitlist" action, in a way that's trivial to revert to the original signup behavior later.

Registration is already locked at the database level (`feature_flags.REGISTRATION_ENABLED = false` per `docs/BETA_ACCESS_CONTROL.md`), so this is purely a front-of-house change: stop pointing users at `/auth?mode=signup` and instead point them at the existing waitlist/beta signup flow.

## Approach: one central flag, one shared component

Rather than editing each CTA individually (fragile to revert), introduce a single feature flag and a single shared CTA component. Flip one boolean to bring "Join Now" back.

### 1. Add a flag

In `src/config/featureFlags.ts` (already exists):

```ts
export const WAITLIST_MODE = true; // set to false to restore "Join Now"
```

### 2. Add a shared `JoinCTA` component

New file `src/components/shared/JoinCTA.tsx`:

- When `WAITLIST_MODE === true`: renders a button labeled "Join the Waitlist" that opens the existing `BetaSignupDialog` (already used by `JoinDNADialog`).
- When `WAITLIST_MODE === false`: renders a `<Link to="/auth?mode=signup">` labeled "Join Now" - identical to today's behavior.
- Accepts `variant`, `size`, `className`, and optional `label` overrides so it can drop into every existing spot without visual regression.

### 3. Replace the CTAs (surface-level only)

Swap the current "Join Now" call sites to use `<JoinCTA />`:

- `src/components/manifesto/ManifestoCTA.tsx` (green pulsing button on manifesto)
- `src/components/public-profile/PublicProfileCTA.tsx` (copper button on public profiles)
- `src/components/public-profile/PublicProfileHeader.tsx` (header CTA on public profiles)
- Any other "Join Now" / `/auth?mode=signup` link surfaced by a quick grep sweep before editing (landing page hero, nav, footer-area CTAs). I'll enumerate them in build mode and convert each in the same pass.

The auth page itself (`/auth`) is NOT touched - existing users must still be able to sign in, and the page already shows the beta notice on the signup tab per `BETA_ACCESS_CONTROL.md`. Password reset, magic links, and OAuth login continue to work.

### 4. Revert path (documented in the flag file)

To bring Join Now back:

1. Set `WAITLIST_MODE = false` in `src/config/featureFlags.ts`.
2. (Optional) Delete `JoinCTA.tsx` and restore direct `<Link to="/auth?mode=signup">` usages - or just leave the component in place, it's a no-op wrapper when the flag is off.

No database migration, no route changes, no deletion of auth code. Fully reversible from one line.

## Out of scope

- Changing `feature_flags.REGISTRATION_ENABLED` (already false).
- Editing `/auth` page copy or the existing `JoinDNADialog` / `BetaSignupDialog` (they already work).
- Adding new waitlist storage - `BetaSignupDialog` already writes through `send-universal-email` with `formType: 'beta_request'`.

## Question before I build

Two small choices - reply with a preference or "your call" and I'll pick:

1. **Waitlist UI**: reuse the existing `BetaSignupDialog` (name, email, LinkedIn, interest - richer capture), or the lighter `JoinBetaDialog` variant? Default: `BetaSignupDialog`.
2. **Button label**: "Join the Waitlist", "Request Early Access", or "Join the Beta"? Default: "Join the Waitlist".
