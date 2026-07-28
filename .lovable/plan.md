## What I verified

The current app still contains the old/regressed code in the exact areas you called out:

- **Five C's row:** the title and intro are empty, and Convey does not span the full mobile row.
- **Five C's sheet:** the Waitlist CTA is back, arrows are grouped together, Connect still has a left arrow, Convey still has a right arrow, and there is no visible scroll indicator.
- **Public post page:** signed-out post actions still show a Join the Waitlist button, share/canonical URLs still use the raw route param instead of the resolved slug, and UUID-to-slug redirect is not implemented in the route shell.
- **Profile page:** the upper/primary Join the Waitlist CTA is still present, and the surviving CTA heartbeat treatment is not applied.
- **Database:** `get_public_post`, `generate_slug`, and `posts_generate_slug_trigger` exist, but there are still **33 public posts without slugs**, so existing UUID URLs cannot consistently redirect to branded URLs until those rows are backfilled.

## Fix plan

1. **Public post branded URLs**
   - Update `PublicPostPage` so when a UUID route resolves to a post with a slug, it redirects to `/post/{slug}` using `replace`.
   - Pass the resolved canonical slug into `PublicPostView` so copy/share/canonical/OG URLs use the slug instead of the UUID.
   - Remove the signed-out Join the Waitlist action from the post engagement area.
   - Fix the build typing around the `get_public_post` RPC without `as any` and without requiring fields the public RPC does not return.

2. **Backfill missing public post slugs**
   - Run a Supabase migration that fills slugs for existing public posts where `slug` is null or blank.
   - Use content-derived slugs for title-less posts and keep the existing `generate_slug` uniqueness behavior.
   - Leave private/deleted post visibility unchanged.

3. **Five C's discovery row**
   - Restore a real title and intro for the Five C's section on public share surfaces.
   - Make the final Convey card span both mobile columns so it stretches left to right instead of leaving an empty slot.

4. **Five C's detail sheet**
   - Remove the Waitlist CTA from the sheet completely.
   - Put navigation arrows on opposite sides of the sheet controls.
   - Hide the left arrow on Connect and hide the right arrow on Convey.
   - Add a visible animated scroll indicator when the sheet has scrollable content.
   - Preserve vertical scrolling on mobile and desktop.

5. **Public profile CTA**
   - Remove the upper/primary Join the Waitlist CTA from the profile hero area.
   - Apply the distinctive heartbeat pulse only to the remaining Join the Waitlist CTA lower on the page.
   - Use the existing `animate-heartbeat` token already present in Tailwind rather than reintroducing the rejected animation.

6. **Verification**
   - Check the relevant rendered pages in the browser at mobile and desktop sizes.
   - Confirm a UUID public post redirects to its slug after the slug backfill.
   - Confirm the post page no longer shows the extra Waitlist CTA.
   - Confirm the Five C's mobile grid, sheet arrows, scroll indicator, and profile CTA behavior are all restored.