# DNA Web App — Auth & Feed Flow Audit (for D054 Migration)

**Scope:** docs-only audit of the `/auth` and `/dna/feed` flows.
**Repo root:** `/home/user/diaspora-network-of-africa-f34bc5b5`
**Note on routing:** The auth page is mounted at `/auth` (not `/dna/auth`) per `src/App.tsx:321`. There is no `/dna/auth` route; the brief should be read as "the auth flow that gates `/dna/*`". All authenticated `/dna/*` routes are wrapped in `OnboardingGuard`, which is the de-facto auth gate today.

---

## Auth Flow

### Route definitions (entry points)

| Path | Component | Guard | File:line |
|---|---|---|---|
| `/auth` | `Auth` (sign-in only; sign-up disabled, points to `/waitlist`) | `AuthGuard redirectAuth` | `src/App.tsx:321` |
| `/reset-password` | `ResetPassword` | `AuthGuard redirectAuth` | `src/App.tsx:322` |
| `/onboarding` | `Onboarding` (intentionally NOT wrapped in `OnboardingGuard`) | none | `src/App.tsx:325` |
| `/invite` | `InviteSignup` (the only live sign-up surface) | none | `src/App.tsx:827` |
| `/admin-login` | `AdminLogin` | none | `src/App.tsx:752` |
| `/` | `Index` | `AuthGuard` (does not force auth, just blocks on `loading`) | `src/App.tsx:316` |
| every `/dna/*` route (except `/dna/welcome`, `/dna/:username`, story/event detail) | varies | `OnboardingGuard` (auth + onboarding) | `src/App.tsx:329-731` |

### Auth page components

- **`src/pages/Auth.tsx`** — sign-in form + LinkedIn OIDC button. Sign-up is removed (line 121 comment: "signup disabled — users go to /waitlist"). After successful login, redirects to `redirectTo || '/dna/feed'` (line 21, 64).
  - `handleSignIn` calls `useAuth().signIn(...)` (line 37) and on success fetches `profiles.first_name, full_name` (lines 51-57) for the greeting.
  - `handleLinkedInSignIn` calls `supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc', redirectTo: '/dna/feed' })` (line 79-84).
- **`src/pages/ResetPassword.tsx`** — request-link form. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/onboarding/reset-password-complete' })` at `src/pages/ResetPassword.tsx:18-21`. (Note: the route `/onboarding/reset-password-complete` is NOT registered in `src/App.tsx` — likely a dead link.)
- **`src/pages/InviteSignup.tsx`** — invite-only sign-up. Validates a code against `invites` table (line 39-43), then calls `supabase.auth.signUp(...)` (line 82) with `data.referral_code` and follows with RPC `handle_referral_signup` (line 98). Redirects to `/dna/feed` (line 110).
- **`src/pages/Onboarding.tsx`** — 5-step onboarding wizard (User Type → Identity → Diaspora Origin → Discovery → Username). Upserts into `profiles` and sets `onboarding_completed_at` (lines 154-188), then navigates to `/dna/feed` (line 210).
- **`src/components/auth/JoinDNADialog.tsx`**, **`BetaSignupDialog.tsx`**, **`BetaWaitlist.tsx`** — marketing/dialog surfaces (not in the core auth path).
- **`src/components/auth/TierGate.tsx`** — subscription tier gate (unrelated to identity layers; safe to ignore for D054).
- **Legacy `src/components/_archived/misc/PasswordResetForm.tsx`** — archived; not routed.

### Auth context / provider

- **`src/contexts/AuthContext.tsx`** is the single source of session state.
  - `UserProfile` interface at lines 9-48 — declares the shape that consumers expect. **Already declares** `country_of_origin`, `current_country`, `diaspora_origin`, `diaspora_status`, `engagement_intentions`, `onboarding_completed_at`, but has **no concept of a `role` enum (returnee/anchor/ally/exploring)** and **no `continent` field**.
  - `AuthProvider` at lines 81-306:
    - `fetchProfile` does `supabase.from('profiles').select('*').eq('id', userId).maybeSingle()` (lines 91-95) with a 150 ms retry (lines 102-110).
    - `onAuthStateChange` listener at lines 142-159 — refetches profile on every auth event.
    - `signUp` (lines 192-244) — calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo: '/dna/feed', data: { full_name } } })`.
    - `signIn` (lines 246-275) — calls `supabase.auth.signInWithPassword`.
    - `signOut` (lines 277-285) — calls `supabase.auth.signOut`.
    - `updatePassword` (lines 287-292) — calls `supabase.auth.updateUser({ password })`.
    - `refreshProfile` (lines 132-136) — re-runs `fetchProfile` for current user.
- **`AuthProvider` is mounted** in `src/App.tsx:301` (inside `BrowserRouter`).
- `useAuth()` is consumed in ~532 files (confirmed via grep).

### Auth hooks

- **`src/hooks/useProfile.ts`** — current user's own profile via `profilesService.getCurrentUserProfile()` (line 66). Maintains a per-user realtime channel registry (`realtime:profiles:self:<uid>`, lines 23-58) and invalidates `['profile', uid]` on any change.
- **`src/hooks/useProfileV2.ts`** — viewing other users' profiles (out of scope for the auth flow, but reads the same `profiles` table).
- **`src/hooks/useProfileCompletion.ts`** — calculates `requiredComplete` / `allComplete` based on `avatar_url`, `headline`, `current_country || location`, `bio`, `skills`, `sectors`. Reads `profile_completion`, `connections`, `posts`, `space_members`. **This is the existing profile-completeness gate.** It does NOT consider `role` or any "declared vs exploring" state.
- **`src/hooks/useIsAdmin.ts`** — calls `is_admin_user` RPC; only checks admin/moderator (`app_role` enum), unrelated to D054 identity roles.
- **`src/hooks/useBetaStatus.ts`** — `is_beta_tester` flag; separate concern.
- **`useFeedQuery.ts`, `useFeedbackMembership.ts`** — read `useAuth().user` but don't drive auth.

### Session handling, redirects, gated routes

- **`AuthGuard`** (`src/App.tsx:235-252`) — only shows a spinner while `loading`, optionally redirects authenticated users away from auth-only pages (`/auth`, `/reset-password`) to `/dna/feed`. **Does not force unauthenticated users to log in.**
- **`OnboardingGuard`** (`src/components/auth/OnboardingGuard.tsx`) — the real gate for `/dna/*`:
  - Queries `profiles` for `onboarding_completed_at, username` (line 23).
  - If no `user` → redirect `/auth` with `{ state: { from: location.pathname } }` (line 42).
  - If `!onboarding_completed_at && !username` AND not on `/onboarding` → redirect `/onboarding` (lines 46-52).
  - If completed AND currently on `/onboarding` → redirect `/dna/connect/discover` (lines 55-57).
  - `useEffect` deps: `[profile, user, authLoading, profileLoading, navigate, location.pathname]` — runs on **every navigation**, so this is the natural insertion point for a D054 forced-onboarding redirect.
- **`PresenceHeartbeat`** at `src/App.tsx:255-258` — uses `usePresenceHeartbeat()` to write presence; depends on session.
- **Sign-out call sites:** `AccountDrawer.tsx:127`, `MobileProfileView.tsx:24`, `MobileSettingsView.tsx:34,122`, `MobileBottomNav.tsx:290`, `UnifiedHeader.tsx:189`, and admin `AdminDashboardLayout.tsx:210` (uses raw `supabase.auth.signOut()` instead of context).
- **Email change:** `src/pages/dna/settings/AccountSettings.tsx:55` calls `supabase.auth.updateUser({ email })`.
- **Password change:** `src/pages/dna/settings/AccountSettings.tsx:96-112` — reauthenticates via `signInWithPassword` then `updateUser({ password })`.

### Auth-flow Supabase calls (all `supabase.auth.*`)

| Call | File:line |
|---|---|
| `signInWithPassword` | `src/contexts/AuthContext.tsx:248`, `src/pages/dna/settings/AccountSettings.tsx:96` |
| `signUp` | `src/contexts/AuthContext.tsx:196`, `src/pages/InviteSignup.tsx:82` |
| `signOut` | `src/contexts/AuthContext.tsx:279`, `src/components/admin/AdminDashboardLayout.tsx:210` |
| `signInWithOAuth` (linkedin_oidc) | `src/pages/Auth.tsx:79` |
| `resetPasswordForEmail` | `src/pages/ResetPassword.tsx:18`, `src/components/_archived/misc/PasswordResetForm.tsx:39` |
| `updateUser({ email/password })` | `src/contexts/AuthContext.tsx:288`, `src/pages/dna/settings/AccountSettings.tsx:55, 112` |
| `getSession` | `src/contexts/AuthContext.tsx:164`, `src/components/admin/AdminRouteGuard.tsx:77`, others |
| `onAuthStateChange` | `src/contexts/AuthContext.tsx:142`, `src/components/admin/AdminRouteGuard.tsx:116` |
| `getUser` | many call sites (post-creation, uploads, DIA, etc.) |

### Tables the auth flow reads/writes

| Table | Read | Write | Where |
|---|---|---|---|
| `profiles` | yes | yes (upsert in onboarding, update in account settings) | `AuthContext.tsx:91`, `OnboardingGuard.tsx:23`, `Auth.tsx:51`, `Onboarding.tsx:155, 183` |
| `invites` | yes (code lookup) | no (RPC `handle_referral_signup` writes) | `InviteSignup.tsx:39-43, 98-101` |
| `profile_completion` | yes | yes (upsert) | `useProfileCompletion.ts:40, 209, 227, 244` |
| `user_roles` (enum `app_role`: `user`/`moderator`/`admin`) | indirect via `is_admin_user` RPC | n/a | `useIsAdmin.ts:18`; declared in `src/integrations/supabase/types.ts:11630` |
| Auth-side: `auth.users` (Supabase managed) | via `supabase.auth.*` | via `supabase.auth.*` | n/a |

There is **no `affirmations` table**, no `roles` enum matching D054 (`returnee | anchor | ally | exploring`), and no `continent` column today.

---

## Feed Flow

### Route entry points

- **`/dna/feed`** → `DnaFeed` lazy-loaded at `src/App.tsx:50`, mounted at `src/App.tsx:439-443` inside `<OnboardingGuard>`.
- **`/dna/debug/feed`** → `DebugUniversalFeed` (`src/App.tsx:445-449`).
- **`/dna/hashtag/:hashtag`** → `HashtagFeed` (`src/App.tsx:451-455`).
- Legacy redirects all funnel to `/dna/feed`: `/dna/discover/feed`, `/dna/network/feed`, `/dna/connect/feed` (`src/App.tsx:434-437`).

### Page component

**`src/pages/dna/Feed.tsx`** (474 lines):
- Reads `useAuth().user` (line 41) and `useProfile()` (line 43) — gates render on `user && profile` (line 146); shows spinner while `profileLoading`.
- Five feed tabs: `all | for_you | network | my_posts | bookmarks` (defined in `FeedTab`, `src/types/feed.ts`). Ranking modes: `top | latest`.
- Center column renders either `<PersonalizedFeed />` (when `activeTab === 'for_you'`) or `<UniversalFeedInfinite viewerId={user.id} tab={activeTab} rankingMode={rankingMode} />` (line 202, 421).
- Left sidebar: `<FeedLeftPanel />`; right sidebar: `<FeedCommunityPulse />`.
- Avatar shown in composer uses `profile.avatar_url`, `profile.display_name`, `profile.username` (lines 292-293).
- Increments DIA session count via `incrementSessionCount()` (line 75).

### Feed list / item components

| Component | File | Purpose |
|---|---|---|
| `UniversalFeedInfinite` | `src/components/feed/UniversalFeedInfinite.tsx` | Wraps `useInfiniteUniversalFeed`, renders items, infinite scroll observer, tracks `feed_view` in `analytics_events` (line 88), checks `connections` table for the "popular posts for newbies" fallback (lines 67-80). |
| `UniversalFeedItemComponent` | `src/components/feed/UniversalFeedItem.tsx` | Router by `post_type` → `PostCard` / `StoryCard` / `EventCard` / `SpaceCard` / `OpportunityFeedCard`. |
| `PostCard` (canonical) | `src/components/posts/PostCard.tsx` | Renders post + author chip using `author_username`, `author_display_name`, `author_avatar_url` from the mapped feed row. Pulls **viewer's own** profile from `useProfile()` (line 58) only for reaction-notification metadata. |
| `PostCard` (alt, comment thread) | `src/components/feed/PostCard.tsx` | Separately fetches author via `supabase.from('profiles').select('*').eq('id', post.author_id)` at lines 58-64. Used in nested/legacy contexts. |
| `StoryCard`, `EventCard`, `SpaceCard`, `OpportunityFeedCard`, `NeedCard` | `src/components/feed/cards/*` | Per-type render. |
| `PersonalizedFeed` | `src/components/feed/PersonalizedFeed.tsx` (+ `src/hooks/usePersonalizedFeed.ts`) | "For You" — currently a stub that calls the same `get_universal_feed` RPC with `p_tab='all', p_ranking_mode='top'` and filters out viewer's own posts (lines 38-67). |
| `MobileFeedTabs`, `FeedTabExplainer`, `MobileProfileCompletionBanner`, `NewPostsIndicator`, `FirstTimeWalkthrough`, `FeedHeroGreeting`, `FeedLeftPanel`, `FeedCommunityPulse` | `src/components/feed/*` and `src/components/onboarding/*` | UI scaffolding around the feed. |
| `MobileBottomNav`, `MobileHeader` | `src/components/mobile/*` | Mobile chrome. |
| `UniversalComposer` | `src/components/composer/UniversalComposer.tsx` (driven by `useUniversalComposer`) | Post / event / story creation surface. |
| `SearchDialog` | `src/components/feed/SearchDialog.tsx` | Search overlay. |

### Data-fetching hooks

| Hook | File | Backend call |
|---|---|---|
| `useInfiniteUniversalFeed` | `src/hooks/useInfiniteUniversalFeed.ts:37` | `supabase.rpc('get_universal_feed', { p_viewer_id, p_tab, p_author_id, p_space_id, p_event_id, p_limit, p_offset, p_ranking_mode, p_hashtag })` (line 65); pages of 20 (line 20); maps via `mapFeedRow` (`src/lib/feed/mapFeedRow.ts`). |
| `useUniversalFeed` | `src/hooks/useUniversalFeed.ts` | Non-infinite variant of same RPC. |
| `usePersonalizedFeed` | `src/hooks/usePersonalizedFeed.ts:35-71` | Same `get_universal_feed` RPC, stub implementation. |
| `useProfile` | `src/hooks/useProfile.ts` | `profilesService.getCurrentUserProfile` → `from('profiles').select('*').eq('id', userId).maybeSingle()` (`src/services/profilesService.ts:92-101`). |
| `useFeedQuery`, `useTrendingInDna`, `usePersonalizedFeed`, `usePinnedPosts`, `usePopularPosts`, `useTrendingStories`, `useTrendingHashtags` | `src/hooks/*` | Aux right-rail / sidebar widgets. |
| `useUniversalComposer` | `src/hooks/useUniversalComposer.ts` | Drives post/event/story creation. |
| `usePostReactions`, `usePostLikes`, `usePostBookmark`, `useReshare`, `usePostShares`, `usePostViewTracker` | `src/hooks/*` | Per-card engagement actions. |

### Exact feed RPC and the joined profile shape

The canonical `get_universal_feed` definition is in **`supabase/migrations/20260508192817_0e10c69b-dcac-4f52-a063-ce71327c1353.sql`** (latest of ~10 redefinitions). Key shape returned per row (lines 60-103):

```sql
SELECT
  p.id, p.author_id,
  prof.username      AS author_username,
  prof.full_name     AS author_full_name,
  prof.avatar_url    AS author_avatar_url,
  prof.headline      AS author_headline,
  p.content, p.title, p.subtitle, p.post_type, p.privacy_level, p.image_url,
  p.link_url, p.link_title, p.link_description, p.link_metadata,
  p.linked_entity_type, p.linked_entity_id, p.space_id, p.event_id,
  p.created_at, p.updated_at,
  COALESCE(likes.like_count, 0)::bigint        AS likes_count,
  COALESCE(comments.comment_count, 0)::bigint  AS comments_count,
  EXISTS(... post_reactions ...)               AS user_has_liked,
  EXISTS(... post_bookmarks ...)               AS user_has_bookmarked,
  p.original_post_id,
  op.author_id        AS original_author_id,
  op_prof.username    AS original_author_username,
  op_prof.full_name   AS original_author_full_name,
  op_prof.avatar_url  AS original_author_avatar_url,
  op_prof.headline    AS original_author_headline,
  op.content          AS original_content,
  op.image_url        AS original_image_url,
  op.created_at       AS original_created_at,
  p.slug
FROM posts p
INNER JOIN profiles prof   ON p.author_id = prof.id
LEFT JOIN  posts    op     ON p.original_post_id = op.id
LEFT JOIN  profiles op_prof ON op.author_id = op_prof.id
LEFT JOIN  ( ... post_reactions ... ) likes    ON p.id = likes.post_id
LEFT JOIN  ( ... post_comments  ... ) comments ON p.id = comments.post_id
```

The four profile fields surfaced per author are: **`username`, `full_name`, `avatar_url`, `headline`** (and the same for the original author on reshares). No role, no country, no continent, no diaspora_status is exposed to the feed today.

The client-side row mapper (`src/lib/feed/mapFeedRow.ts:78-129`) takes those columns and yields `UniversalFeedItem` with `author_username`, `author_display_name`, `author_avatar_url`. Notable: the RPC does NOT return `display_name` — `mapFeedRow` falls back `author_display_name ?? author_full_name ?? 'Unknown User'` (line 85).

Direct (non-RPC) `from('profiles')` reads in the feed surface:
- `src/components/feed/PostCard.tsx:59` — legacy alt-PostCard fetches `select('*')` by author id.
- `src/components/feed/CommentDrawer.tsx:105`, `src/components/feed/CommentSection.tsx:259` — comment author lookups.
- `src/components/feed/FeedRightSidebar.tsx:46`, `src/components/feed/SpotlightCard.tsx:40` — sidebar widgets.

### What is rendered per feed item

From `UniversalFeedItemComponent` (`src/components/feed/UniversalFeedItem.tsx`) and `PostCard` (`src/components/posts/PostCard.tsx`):
- Author: `author_avatar_url`, `author_display_name` (or `author_full_name`), `author_username`.
- Optional: `author_headline` (passed through for reshares).
- Post body: `content`, `title`/`subtitle`, `media_url`/`image_url`, link preview, hashtags.
- Engagement: like count, reactions, comments count, bookmark count, share/reshare counts, `pinned_at`.
- Per-type pivots: event chip, space chip, story metadata, need / opportunity card.

### Tables touched by the feed flow

| Table | Read | Write | Where |
|---|---|---|---|
| `posts` | yes (via RPC and `useFeedLeftPanel` count) | no (composer is a separate path) | RPC, `src/components/feed/FeedLeftPanel.tsx:35` |
| `profiles` | yes (RPC join + `useProfile` + comment author lookups) | no | RPC, `useProfile.ts`, `PostCard.tsx`, `CommentDrawer.tsx`, `CommentSection.tsx`, `SpotlightCard.tsx`, `FeedRightSidebar.tsx` |
| `post_reactions` | yes (via RPC like count + `user_has_liked`) | n/a | RPC |
| `post_bookmarks` | yes (via RPC `user_has_bookmarked`) | n/a | RPC |
| `post_comments` | yes (via RPC comment count) | n/a | RPC |
| `post_likes` | yes | n/a | `src/components/feed/PostCard.tsx:85-100` |
| `post_hashtags`, `hashtags` | yes (hashtag filter) | n/a | RPC |
| `connections` | yes (tab filter for `network` / `for_you`, plus newbie-popular-posts fallback) | n/a | RPC, `UniversalFeedInfinite.tsx:67-80`, `FeedLeftPanel.tsx:32` |
| `event_attendees`, `collaboration_memberships` | yes (Five C's counts in left panel) | n/a | `FeedLeftPanel.tsx:33-34` |
| `events` | yes (Hero greeting count) | n/a | `FeedHeroGreeting.tsx:32` |
| `analytics_events` | n/a | yes (feed_view) | `UniversalFeedInfinite.tsx:88-92` |

---

## Supabase Client Config

**File:** `src/integrations/supabase/client.ts` (35 lines)

```ts
createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'dna-auth-token',
    flowType: 'pkce',
  },
  global: { headers: { 'X-Client-Info': 'dna-platform@1.0.0' } },
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } },
});
```

| Setting | Value | File:line |
|---|---|---|
| Storage backend | `window.localStorage` | `client.ts:18` |
| `storageKey` | **`dna-auth-token`** (custom; default is `sb-<ref>-auth-token`) | `client.ts:19` |
| `flowType` | **`pkce`** | `client.ts:20` |
| `persistSession` | `true` | `client.ts:16` |
| `autoRefreshToken` | `true` | `client.ts:15` |
| `detectSessionInUrl` | `true` (required for the PKCE OAuth + email-link callbacks) | `client.ts:17` |
| `db.schema` | `public` | `client.ts:28` |
| `X-Client-Info` | `dna-platform@1.0.0` | `client.ts:24` |
| Realtime rate | 10 events/sec | `client.ts:32` |

Env var sources are centralized through `@/lib/config`. URL/anon-key are not literal-hardcoded.

`window` is referenced unconditionally — fine for Vite/CSR, would crash under SSR (not a concern here, no SSR).

---

## Gaps Identified for D054 Migration

### 1. Single-tier identity assumption — there is no `role` concept today

**Current state:** Identity is a flat property bag on `profiles`. The closest existing fields are `diaspora_status` (text, free-form), `diaspora_origin`, `user_type`, `user_role` (text, unused by the auth/feed flow), and the `roles[]` text array (admin-only / unrelated). The only enum-backed role is `app_role` (`user | moderator | admin`) at `src/integrations/supabase/types.ts:14793`, used solely for admin gating.

**Existing taxonomies that overlap D054 vocabulary but are NOT the same thing:**
- `CONNECTION_TYPE_OPTIONS` in `src/data/profileOptions.ts:50-58` defines `1st_gen_diaspora | 2nd_gen_diaspora | 3rd_gen_diaspora | continental_african | returnee | ally | mixed_heritage` — written into `profiles.diaspora_status` as free text.
- `DiasporaGeneration` type in `src/types/profileIdentityHub.ts:146-152` has `first | second | third_plus | returnee | continental | ally`.
- `DiasporaEngagementLevel` type in `src/types/profileIdentityHub.ts:154-159` has `exploring | connecting | contributing | leading | transforming`.

None of these are a single `role` enum of `returnee | anchor | ally | exploring`. **`anchor` does not appear anywhere in the codebase** as an identity value (the string only appears as page-anchor and partnership-model references — `src/config/partnerModels.ts:61` `'hbcu-anchor-partner'`). D054's `role` is a brand-new column.

**Files that bake in the single-tier assumption (touch these on migration):**
- `src/contexts/AuthContext.tsx:9-48` — `UserProfile` interface has no `role`, no `continent`. Add the new fields and consider exposing a derived `isDeclared`/`hasRole` helper here.
- `src/integrations/supabase/types.ts:7830-8020` (profiles `Row`) — will be regenerated post-migration; no code change needed, but consumers using `.select('*')` will start seeing the new columns automatically (`AuthContext.tsx:91`, `useProfile.ts` via `profilesService.getCurrentUserProfile`).
- `src/services/profilesService.ts` — `getCurrentUserProfile`, `getOwnProfile`, `updateProfile` all `select('*')`; will pass through new fields. `getProfileByUsername` uses `get_public_profiles` RPC which will need updating to surface `role`.
- `src/components/onboarding/steps/DiasporaOriginStep.tsx` — collects `diaspora_status` as a single text field, no role/affirmation flow. This is the most natural existing step to split into "Role" + "DNA × Place" + (subsequent) "Affirmation".
- `src/data/profileOptions.ts:50-66` — `CONNECTION_TYPE_OPTIONS` / `DIASPORA_STATUS_OPTIONS` will collide with the new `role` enum semantically. Either keep `diaspora_status` as ancestry metadata and add `role` as orthogonal, or deprecate.
- `src/types/profileIdentityHub.ts:146-159` — the `DiasporaGeneration` / `DiasporaEngagementLevel` types overlap conceptually with D054 roles and should be reconciled (or marked legacy).

### 2. Profile-completeness gates — where to add the "force role + DNA×Place on next login" check

**Today, completeness is checked in three places:**

1. **`src/components/auth/OnboardingGuard.tsx:11-74`** — the canonical gate. Uses `!!(profile?.onboarding_completed_at || profile?.username)` (line 46). **This is where the D054 forced-onboarding redirect belongs.** After D054, the predicate should also require `profile.role IS NOT NULL` and `profile.continent IS NOT NULL && profile.country IS NOT NULL` (and, separately, gate "ally" users on an affirmation row). Suggested:
   ```ts
   const hasRole = !!profile?.role;
   const hasDnaPlace = !!profile?.continent && !!profile?.country;
   const hasAffirmation = ... ; // separate query against `affirmations`
   if (hasCompletedOnboarding && !(hasRole && hasDnaPlace)) {
     navigate('/onboarding?step=role', { replace: true });
   }
   ```
   Note: the `.select('onboarding_completed_at, username')` projection at line 23 must be widened to include `role`, `continent`, `country`.
2. **`src/pages/Onboarding.tsx:69-74, 117-211`** — the 5-step wizard. Today, completion = filling in `username` + setting `onboarding_completed_at`. **No `role` field exists in `formData`** (`Onboarding.tsx:38-60`); `useOnboardingForm` state will need to add it. `DiasporaOriginStep` currently writes only to `country_of_origin` and `diaspora_status` — needs splitting/extension for role + continent + ISO-3 country.
3. **`src/hooks/useProfileCompletion.ts`** — drives the in-app completion nudges (e.g. `ProfileCompletionNudge`, `MobileProfileCompletionBanner`). Required steps today are `photo`, `headline`, `location` (lines 99-122). After D054 you'll want a `role` step (required) and a `dna_place` step (required), and probably a separate `affirmation` step for declared roles. `requiredComplete` at line 194 currently passes without any of these.

### 3. Session-state propagation — where a forced-onboarding redirect would slot in

- **`src/contexts/AuthContext.tsx:142-159`** is the central listener. On `onAuthStateChange`, it refetches `profiles.*`. Adding `role`, `continent`, `country` to the implicit `*` select is free; **but** the redirect itself cannot live inside `AuthContext` (no `useNavigate` outside a Routes tree). The right insertion point remains `OnboardingGuard`.
- **`src/App.tsx:235-252`** (`AuthGuard`) does NOT do auth-redirect for unauthenticated users — it only redirects authenticated ones away from auth pages. So D054's forced redirect logic does not belong here either.
- **Post-login destinations to audit** (anywhere `navigate('/dna/feed')` is hard-coded — these will all trigger `OnboardingGuard` and thus the D054 gate, so no change needed, but flag them):
  - `src/pages/Auth.tsx:64` (after sign-in)
  - `src/pages/Auth.tsx:82` (LinkedIn OAuth `redirectTo`)
  - `src/contexts/AuthContext.tsx:194` (signUp `emailRedirectTo`)
  - `src/pages/InviteSignup.tsx:110`
  - `src/pages/Onboarding.tsx:72, 210`
  - `src/App.tsx:248` (`AuthGuard redirectAuth`)
  - `src/App.tsx:397` (`/dna/me` → `/dna/feed`)
  - `src/App.tsx:434, 436, 437` (legacy `/dna/discover/feed`, `/dna/network/feed`, `/dna/connect/feed`)
- **Lazy-loaded `OnboardingGuard`** wraps ~70 routes (see `src/App.tsx:329-731`). A single change to `OnboardingGuard` covers them all.

### 4. Affirmation layer — completely missing

- No `affirmations` table exists in `src/integrations/supabase/types.ts`, no migration creates one (confirmed via grep across `supabase/migrations/`), and the word "affirmation" appears in code only as UX copy for "someone affirmed your post" (e.g. `src/hooks/usePostLikes.ts:116-117`, `src/services/notificationSystemService.ts:87, 308`). That is a like/reaction synonym, not the D054 declaration.
- Implication for D054: introduce a new `affirmations` table + RLS + an "ally requires witness inside kinship line" constraint (likely a CHECK + trigger or a writeable RPC that enforces witness's `role IN ('returnee','anchor')` AND witness shares a country/continent with declarer). There is no existing place in the front-end to wire this — needs:
  - A new onboarding step component (sibling of `DiasporaOriginStep`).
  - A query in `OnboardingGuard` / `useProfileCompletion` to detect "role requires an affirmation but none exists".
  - A new hook (e.g. `useAffirmation(userId)`).

### 5. DNA × Place columns — partially present, not normalized to D054

The `profiles` table already has multiple overlapping place columns (`src/integrations/supabase/types.ts:7851-7861`):
- `country_of_origin` (text), `country_of_origin_id` (uuid FK to `countries`), `country_origin` (text), `origin_country_code` (text), `origin_country_name` (text)
- `current_country` (text), `current_country_code` (text), `current_country_id` (uuid FK), `current_country_name` (text), `current_city`, `current_location`, `current_region`

Country FK targets `countries` table (`supabase/migrations/20251218100001_create_countries_table.sql:11-12`) which has both `country_code_iso2` and `country_code_iso3` already, plus a `region_id → regions → continent_id → continents` chain (`supabase/migrations/20250917235208_eb798a94-50b6-482a-9d6d-f7f09187dd97.sql:5-22`).

**Gaps for D054 v0.0:**
- D054 wants `continent` as **text** on `profiles` and `country` as **ISO 3166-1 alpha-3** on `profiles`. The current data is split across `current_country_code` (likely ISO-2 by name) and `current_country_id` (FK). Picking which is canonical for D054 (a new `continent text` and a new `country char(3)` on `profiles`) is a denormalization choice and should be documented; otherwise there will be three places to keep in sync.
- No code path enforces ISO-3 today; `Onboarding.tsx:142` writes whatever `CountrySelect` returns as `name` (line 82 of `DiasporaOriginStep.tsx`).
- Existing `current_country_code` length is unconstrained in the type — needs a CHECK constraint at the DB level.

### 6. Feed queries that surface `profiles` fields — places needing new columns

**The big one:** `get_universal_feed` (`supabase/migrations/20260508192817_0e10c69b-dcac-4f52-a063-ce71327c1353.sql:60-103`) currently SELECTs only `prof.username, prof.full_name, prof.avatar_url, prof.headline` from `profiles`. If feed items need to render a role badge, a country flag, or an affirmation indicator, this RPC must be redefined to also project:
- `prof.role` (new D054 column)
- `prof.continent` and/or `prof.country` (new D054 columns)
- equivalent fields under `op_prof.*` for the reshare-original author

The RETURNS TABLE signature would gain those columns, and `src/lib/feed/mapFeedRow.ts:20-129` (`FeedRpcRow` interface + `mapFeedRow` projection) plus `src/types/feed.ts` (`UniversalFeedItem`) would need new optional fields.

**Other feed-adjacent queries that join/read `profiles` and may need the new fields:**
- `src/services/profilesService.ts:22-61` — `rpc_public_profiles`, `rpc_public_profile_by_id`, `get_public_profiles` RPCs (definitions in `supabase/migrations/`) — if profiles surface role on public pages, these RPCs need updating too.
- `src/components/feed/PostCard.tsx:55-65`, `src/components/feed/CommentDrawer.tsx:105`, `src/components/feed/CommentSection.tsx:259`, `src/components/feed/FeedRightSidebar.tsx:46`, `src/components/feed/SpotlightCard.tsx:40` — all use `select('*')` from `profiles`, so they'll receive the new fields automatically; rendering changes are downstream.
- `src/components/feed/FeedLeftPanel.tsx:54` reads `current_city` for the viewer's left-rail card — when the user has neither a `headline` nor a `current_city`, nothing is shown. Adding role/continent/country here is a natural fit ("Returnee · Ghana").
- `src/hooks/useTrendingStories.ts:75`, `src/hooks/usePulseBar.ts:59`, `src/hooks/useMentionAutocomplete.ts:29` — secondary surfaces that already pull `profiles` rows; will inherit the new columns through `select('*')` or explicit listings.

### 7. Other items worth flagging

- **`/onboarding/reset-password-complete`** is referenced as the `redirectTo` for password reset (`src/pages/ResetPassword.tsx:19`) but no such route is registered in `src/App.tsx`. Unrelated to D054 but a real bug — a password-reset email link will land on `NotFound`. Worth raising separately.
- **`AdminDashboardLayout.tsx:210`** calls `supabase.auth.signOut()` directly instead of `useAuth().signOut`, so it bypasses the context's local-state clearing. Pre-existing inconsistency; not a D054 blocker.
- **`src/components/feed/PostCard.tsx`** (the legacy alt version under `src/components/feed/`, separate from `src/components/posts/PostCard.tsx`) duplicates author lookups. If D054 wants role badges on every post card, both implementations need to be updated, or the legacy one removed.
- **`src/types/profileIdentityHub.ts`** declares an elaborate "four identity layers" system that has never been wired to the DB schema. D054's three layers can either subsume parts of it or sit alongside it; recommend explicitly marking `profileIdentityHub.ts` as the design-time type system and the new D054 columns as the runtime source of truth, to avoid future drift.
