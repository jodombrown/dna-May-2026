
## Goal

Close the server-side loop on the "owner sees visitor UI on own profile" bug so the client-side fallback in `ProfileV2.tsx` becomes defense-in-depth, not the only guard. Verify with database impersonation and a live Playwright pass.

## Root cause (confirmed from live catalog)

`rpc_get_profile_bundle` currently returns:

```json
{ "profile": {...}, "activity": {...}, "connection_status": "...", "is_owner": true }
```

But the client (`ProfileV2Bundle` type + `ProfileV2.tsx`) reads `bundle.permissions.is_owner` and `bundle.should_show_public_landing`. Neither key is emitted by the RPC. So `permissions.is_owner` is always `undefined` in the authenticated path, which is exactly the bug the user reported at `/dna/jaunelamarro`.

## Changes

### 1. Migration: rewrite `rpc_get_profile_bundle` return shape

One migration, one function replacement. Same signature, same security definer, same auth checks. The only change is the returned JSON:

```text
{
  profile,
  tags: {},                       -- placeholder, matches client type
  activity,
  permissions: {
    is_owner,
    can_edit: is_owner,
    can_create_events: is_owner,
    can_create_public_spaces: is_owner,
    can_connect: NOT is_owner
  },
  visibility: { about, skills, interests, activity all 'public' },
  completion: { score: 0, suggested_actions: [] },
  verification_meta: {},
  connection_status,
  should_show_public_landing: false      -- authenticated bundle is never the public landing
}
```

Owner semantics: `is_owner = (v_auth_uid = v_profile.id)`. `should_show_public_landing` is hard-coded false for this RPC. The anon `get_public_profile` RPC (already stamps `should_show_public_landing: true` via the client normalizer) is untouched.

### 2. Four-persona certification (rolled-back transaction)

Run inside `BEGIN; ... ROLLBACK;` against the live DB:

```text
persona            | expected is_owner | expected should_show_public_landing | expected connect
-------------------|-------------------|-------------------------------------|-----------------
owner (self)       | true              | false                               | n/a
auth non-owner     | false             | false                               | can_connect: true
anon               | -> get_public_profile path, is_owner=false, landing=true
service_role       | RAISE 'authentication required'
```

Read `pg_get_functiondef` back after apply to confirm the new body, and print the JSON output per persona.

### 3. Client cleanup (frontend)

- `src/hooks/useProfileV2.ts`: no code change needed, but add a defensive `permissions: data.permissions ?? { is_owner: false, ... }` fallback so a stale RPC never crashes the view.
- `src/pages/ProfileV2.tsx`: keep the `isOwnerViewer = rawIsOwner || user?.id === profile.id` fallback. It stays as belt-and-suspenders.

### 4. Playwright verification

Signed-in as owner: visit `/dna/jaunelamarro`, assert (a) no "Connect" CTA, (b) no fixed "← DNA / Join DNA" banner, (c) owner chrome (edit affordance) renders. Screenshot.

Signed out: same URL, assert (a) `PublicSiteHeader` renders (no duplicate profile header), (b) Five C's discovery row renders, (c) clicking a C opens the right-sheet with waitlist CTA. Screenshot.

### 5. Guard against regression

Add a one-line note to `docs/03-ROUTES-AND-PAGES.md` (or the closest doc) that `rpc_get_profile_bundle` must return `permissions` and `should_show_public_landing`, mirroring the client type. Not a runtime guard, but a search hit for the next engineer.

## Files touched

- `supabase/migrations/<timestamp>_rpc_profile_bundle_permissions.sql` (new)
- `src/hooks/useProfileV2.ts` (defensive fallback)
- `docs/03-ROUTES-AND-PAGES.md` (contract note)
- `/tmp/browser/profile-owner/verify.py` (Playwright, not committed)

## Out of scope

- Splitting the RPC into owner/visitor variants
- Permanent pgTAP suite
- Any RLS policy changes
- Any Five C's content/copy changes

## Rollback

Migration is a single `CREATE OR REPLACE FUNCTION`. Rollback = re-apply the previous body captured above in this plan.
