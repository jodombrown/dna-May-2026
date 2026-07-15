# Signed-out Post Page: CTA Consolidation + Five C's Discovery

Mirror the pattern we shipped on signed-out profiles (`/dna/:username`) on the public post page (`/post/:slug`). Today that page has **five** CTAs stacked on one screen (top-nav "Join the Waitlist", floating banner "Join the Waitlist", inline "Join the Waitlist to Engage", bottom card "Join the Waitlist", bottom card "Learn About DNA"). We're cutting that to a single primary CTA on the post itself, keeping the platform header as the persistent join affordance, and adding the same Five C's discovery row + right-sheet used on signed-out profiles.

## Scope

File: `src/pages/PublicPostPage.tsx` only. No schema, no RPC, no auth changes. Signed-in view is untouched.

## What changes

### 1. Remove redundant CTAs (signed-out only)

Remove these three elements entirely:

- **Floating animated banner** ("Shared from DNA. Connect with the diaspora" + Join the Waitlist button) — lines ~245-274 and the `showBanner` state/effect. This is the direct analog of the "← DNA / Join DNA" banner we killed on profiles.
- **Bottom "Join the Conversation on DNA" gradient card** with dual CTAs (Join Waitlist + Learn About DNA) — lines ~424-460. Replaced by the Five C's row.
- **Inline "Join the Waitlist to Engage" button** on the post card — replace with a single quieter engagement affordance (see below).

Kept CTAs:
- `UnifiedHeader` "Join the Waitlist" (top-right) — this is the universal, non-intrusive join affordance, matching profile pages.
- Share / copy-link icon button on the post card — utility, not a join CTA.

### 2. Replace inline engagement CTA

The current button reads "Join the Waitlist to Engage" (full-width, primary green). Replace for signed-out users with a subtler, purpose-specific bar directly under the engagement stats:

```
[ Heart icon ]  Like, comment, and reply on DNA   →  [ Join the Waitlist ]
```

- Single row, `bg-muted/40`, small text on the left, one outline-primary button on the right.
- No gradient, no full-width green block.
- Signed-in users keep the existing "Like & Comment" primary button unchanged.

### 3. Add Five C's discovery row + sheet (signed-out only)

Reuse the existing `FiveCsDiscoverySection` component (`src/components/five-cs/FiveCsDiscoverySection.tsx`) that already powers the signed-out profile. Mount it below the author card when `!isLoggedIn`, passing post/author context for analytics:

```tsx
{!isLoggedIn && (
  <div className="mt-8">
    <FiveCsDiscoverySection
      username={authorUsername}
      memberFirstName={post.author?.full_name?.split(' ')[0] ?? null}
    />
  </div>
)}
```

Same 5 cards, same right-sheet detail, same waitlist CTA inside the sheet — one consistent "learn what DNA is" surface across public profile + public post.

### 4. Analytics

Extend the existing `five_cs_card_open` PostHog event with a `source: 'public_post'` tag (the component already accepts `username`; we'll pass the author's username and add `source` inside `FiveCsDiscoverySection` via a new optional `source` prop, defaulting to `'public_profile'` so profile behavior is unchanged).

## Final signed-out page structure

```text
[ UnifiedHeader: logo | About Us | Join the Waitlist | Sign In ]

[ Post Card ]
  author row + share icon
  post content / image / link preview
  engagement stats (likes, comments)
  subtle "Like, comment, and reply on DNA → Join the Waitlist" bar
  copy-link icon

[ Compact Author Card: avatar + name + View Profile ]

[ Five C's Discovery Row: 5 Adinkra cards ]
  → click opens right-sheet with detail + Join the Waitlist CTA

[ Footer ]
```

CTA count drops from 5 to 2 above the fold (header + inline join bar), plus the Five C's cards which are discovery, not join-nags.

## Signed-in behavior

Unchanged: no banner today (already conditional), no bottom gradient card (already conditional), keeps "Like & Comment" primary button, no Five C's row.

## Out of scope

- No changes to the post card's data model, share behavior, SEO/JSON-LD, or the Author card.
- No changes to `FiveCsDiscoveryRow` copy/icons (still empty heading/subtitle per your last edit).
- No mobile-specific redesign — the existing responsive rules already cover it.
- No changes to `/post/:id` route or slug resolution.

## Files touched

- `src/pages/PublicPostPage.tsx` — remove 2 CTA blocks, replace inline engage button, mount `FiveCsDiscoverySection`.
- `src/components/five-cs/FiveCsDiscoverySection.tsx` — add optional `source` prop for analytics tagging (default `'public_profile'`).

## Verification

- Playwright signed-out visit to `/post/gipc-and-dacf-investment-partnership`: assert no floating banner, no "Join the Conversation" gradient card, no "Join the Waitlist to Engage" button, Five C's row present, right-sheet opens on card click.
- Signed-in visit: assert page still shows "Like & Comment" and no Five C's row.
