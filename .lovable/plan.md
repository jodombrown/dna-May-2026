
## Problems

1. **Copy Link on a Convene event card** copies `/post/{postId}` (from the generic `usePostActions.copyLink`), so it takes viewers to a nonexistent post URL. For a Convene announcement post, the copied link must point at the underlying event's public page.
2. **`/dna/convene/events/{slug}` returns "Event not found"** when opened by a signed-out visitor. `EventDetail` reads the `events` table directly, and RLS blocks anonymous access. A separate `PublicEventPage` at `/event/:slugOrId` exists (uses `get_public_event`), but the URL people actually share is the `/dna/convene/events/...` one, so that URL must render publicly.

## Fix

### 1. Copy Link points to the event's public URL

- Add an optional `copyLinkHref?: string` prop to `src/components/posts/PostMenuOwn.tsx` and `src/components/posts/PostMenuOthers.tsx`.
- When `copyLinkHref` is set, the "Copy link" menu item writes that URL to the clipboard directly (using `navigator.clipboard.writeText` + the existing toast) instead of calling `usePostActions.copyLink` (which builds `/post/{id}`).
- In `src/components/feed/cards/EventCard.tsx`, pass:
  ```
  copyLinkHref={`${window.location.origin}/dna/convene/events/${eventDetails?.slug || item.event_id}`}
  ```
  to both `PostMenuOwn` and `PostMenuOthers` (mirroring the existing `editHref` pattern).
- No changes to `usePostActions` — generic posts keep the current `/post/{id}` behavior.

### 2. `/dna/convene/events/:id` renders publicly

In `src/pages/dna/convene/EventDetail.tsx`:

- Extend the `event-detail` query so that when the direct `from('events')` lookups (by id, then by slug) both return `null`, it falls back to `supabase.rpc('get_public_event', { p_slug_or_id: slugOrId })`.
- When the row comes from `get_public_event`, mark it `isPublicProjection: true` and map its fields (title, slug, times, location_*, cover_image_url, cancellation_reason, is_curated, organizer_name/username/avatar_url) into the same shape the page already consumes.
- In the render tree, gate authenticated-only sections behind `!isPublicProjection && isLoggedIn`:
  - RSVP / StickyRSVPBar
  - Manage / cancel / delete / edit / share-in-chat / report actions
  - `EventActivityFeed`, `EventThreadCTA`, `DIADetailInsight`, `ConversationPicker`
  - Any query that hits `event_attendees`, `event_spaces`, DIA, etc. (already guarded by `enabled: !!user` in most cases — verify)
- Keep the public-safe blocks visible for everyone: hero + cover, title/subtitle, date/time + timezone, location (name/city/country + map when lat/lng present), description, organizer card (name/avatar/username link), curated source link, cancellation notice, `AddToCalendarButton`.
- For signed-out visitors, keep the existing "Sign in to RSVP" style banner (`showBanner`) that already exists in this file.
- Update the "Event not found" empty state so it only shows when BOTH the direct query AND `get_public_event` return null.

### Technical notes

- `get_public_event` is already deployed (SECURITY DEFINER, granted to `anon` + `authenticated`, filters `status='published' AND visibility='public'`). No new migration needed.
- The React Query key stays `['event-detail', slugOrId]`; the fetcher just adds the RPC fallback and a flag.
- No changes to routes, `PublicEventPage`, `App.tsx`, or `usePostActions`.
- Zero `any` types, no em-dashes, no new hardcoded URLs (uses `window.location.origin`), Tailwind only.

### Files touched

- `src/components/posts/PostMenuOwn.tsx` (add prop + branch)
- `src/components/posts/PostMenuOthers.tsx` (add prop + branch)
- `src/components/feed/cards/EventCard.tsx` (pass `copyLinkHref`)
- `src/pages/dna/convene/EventDetail.tsx` (RPC fallback + gate authed-only sections)

### Verification

- Signed-out `/dna/convene/events/{slug}` for a published public event renders hero, date, location, organizer, description, and calendar button (no RSVP / manage / feed sections).
- Signed-in view unchanged: full RSVP, manage, activity feed, DIA insight.
- Copy Link on a Convene announcement post writes `https://<host>/dna/convene/events/{slug}` and the resulting URL opens the same event page for both anon and authed viewers.
- Copy Link on non-Convene posts (Space/Story/Opportunity/plain) still uses `/post/{id}` (unchanged).
