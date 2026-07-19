/**
 * The drawer registry (BD135 / BD137).
 *
 * Surfaces and their rows, declared as DATA. The shell reads this; no surface
 * reimplements navigation, and no row invents a behaviour.
 *
 * BD137, founder-locked 2026-07-18, in his words:
 *   "rows stay in the drawer when the thing is small, and go to the existing
 *    page when one already exists, never a rebuilt copy."
 *
 * The four behaviours:
 *   push     panel inside this surface           chevron; Back appears
 *   navigate route + dismiss the drawer          chevron; no Back, you have left
 *   swap     suspend this surface, open sibling  chevron; Back returns to origin
 *   leaf     terminal content or a control       no chevron
 *
 * ── The type is the enforcement ────────────────────────────────────────────
 * `navigate` CANNOT be constructed without a `route`. That is deliberate. DR0
 * found `My stories` pointing at `/dna/convey?tab=my_stories` where the string
 * `my_stories` existed in exactly one file in the codebase — the row's own
 * definition. Nothing on Convey ever read it, so members were landed silently
 * on the wrong screen.
 *
 * A route string alone does not prevent that, so any row carrying a query
 * param must also declare `paramContract`: the param the destination is
 * REQUIRED to honour. `registry.test.ts` reads the destination's source and
 * fails if it does not. A row may not claim a destination it does not have
 * (BD111 one layer up: never fabricate a field to make a record look complete).
 */

import { ROUTES } from '@/config/routes';

export type RowBehaviour =
  /** Opens a panel inside this surface. */
  | { kind: 'push'; panelId: string }
  /**
   * Goes to an existing route and dismisses the drawer.
   * `route` is mandatory. If a destination cannot be named, the row is not
   * `navigate` — that is the whole point of BD137.
   */
  | {
      kind: 'navigate';
      route: string;
      /** Required when `route` carries a query param. Verified against the destination's source. */
      paramContract?: { param: string; value: string; destinationFile: string };
    }
  /** Suspends this surface and opens a sibling. Back returns to the origin. */
  | { kind: 'swap'; surfaceId: string }
  /** Terminal: runs an action, renders content, or ends the chain. */
  | { kind: 'leaf'; action: string };

export interface DrawerRow {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  behaviour: RowBehaviour;
  /** Rendered only when this capability is present. Absent = always rendered. */
  capability?: string;
}

export interface DrawerSurface {
  surfaceId: string;
  title: string;
  rows: DrawerRow[];
}

/**
 * The Account surface. Transcribed from DR0's 21-row live classification of
 * `AccountDrawer.tsx`, which was read against a freshly-fetched origin/main.
 */
export const ACCOUNT_SURFACE: DrawerSurface = {
  surfaceId: 'account',
  title: 'Account',
  rows: [
    // ── YOU ──────────────────────────────────────────────────────────────
    {
      id: 'identity-card',
      label: 'Identity card',
      group: 'you',
      behaviour: { kind: 'push', panelId: 'profile-edit' },
    },
    {
      id: 'view-public-profile',
      label: 'View public profile',
      group: 'you',
      // Resolved per-member at the call site from profileRoute(profile).
      behaviour: { kind: 'navigate', route: '/dna/:username' },
    },
    {
      id: 'share-profile',
      label: 'Share profile',
      group: 'you',
      behaviour: { kind: 'push', panelId: 'share' },
    },

    // ── MY WORK ──────────────────────────────────────────────────────────
    // All five are `navigate`, as BD135 predicted and DR0 confirmed by live read.
    {
      id: 'my-posts',
      label: 'My posts & updates',
      group: 'my-work',
      behaviour: {
        kind: 'navigate',
        route: '/dna/feed?tab=my_posts',
        paramContract: { param: 'tab', value: 'my_posts', destinationFile: 'src/pages/dna/Feed.tsx' },
      },
    },
    {
      id: 'saved-items',
      label: 'Saved items',
      group: 'my-work',
      behaviour: {
        kind: 'navigate',
        route: '/dna/feed?tab=bookmarks',
        paramContract: { param: 'tab', value: 'bookmarks', destinationFile: 'src/pages/dna/Feed.tsx' },
      },
    },
    {
      id: 'my-spaces',
      label: 'My spaces',
      group: 'my-work',
      behaviour: { kind: 'navigate', route: '/dna/collaborate' },
    },
    {
      id: 'my-events',
      label: 'My events',
      group: 'my-work',
      behaviour: { kind: 'navigate', route: '/dna/convene/events' },
    },
    {
      id: 'my-stories',
      label: 'My stories',
      group: 'my-work',
      // Restored at step 7 with a REAL destination (BD139). It pointed at
      // /dna/convey?tab=my_stories, a param nothing read. Two other surfaces
      // made the same promise and a stat card displayed the count. The route
      // now exists, so no paramContract is needed: the registry gate checks
      // /dna/convey/my-stories against App.tsx and fails if it disappears.
      behaviour: { kind: 'navigate', route: '/dna/convey/my-stories' },
    },

    // ── ACCOUNT ──────────────────────────────────────────────────────────
    {
      id: 'profile',
      label: 'Profile',
      sublabel: 'Name, headline, avatar, bio',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'profile-edit' },
    },
    {
      id: 'sign-in-and-security',
      // Copy lock, founder-approved 2026-07-18. Was `Account`, which sat
      // confusingly adjacent to `Profile` and to the surface's own title.
      label: 'Sign-in and security',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'account-settings' },
    },
    {
      id: 'privacy',
      label: 'Privacy',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'privacy-settings' },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'notification-settings' },
    },
    {
      id: 'preferences',
      label: 'Preferences',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'preferences-settings' },
    },
    {
      id: 'my-hashtags',
      label: 'My hashtags',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'my-hashtags' },
    },
    {
      id: 'my-reports',
      label: 'My reports',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'my-reports' },
    },
    {
      id: 'blocked-users',
      label: 'Blocked users',
      group: 'account',
      behaviour: { kind: 'push', panelId: 'blocked-users' },
    },

    // ── SUPPORT ──────────────────────────────────────────────────────────
    // DR0 classified these as `leaf`, but they were not leaves: each closed
    // Account and opened a different surface, which is the unnamed behaviour
    // BD137 named `swap`. The member now stays in the drawer and Back returns
    // them to Account.
    {
      id: 'platform-tour',
      label: 'Take platform tour',
      group: 'support',
      behaviour: { kind: 'swap', surfaceId: 'onboarding-tour' },
    },
    {
      id: 'alpha-test-guide',
      label: 'Alpha test guide',
      group: 'support',
      behaviour: { kind: 'swap', surfaceId: 'alpha-test-guide' },
      // DR0 defect 6: the AccountDrawer-mounted copy bypassed this flag entirely.
      capability: 'alpha_test',
    },
    {
      id: 'help-and-feedback',
      label: 'Help & feedback',
      group: 'support',
      behaviour: { kind: 'swap', surfaceId: 'feedback' },
    },
    {
      id: 'about-dna',
      label: 'About DNA',
      group: 'support',
      behaviour: { kind: 'navigate', route: ROUTES.about },
    },
    {
      id: 'platform-admin',
      label: 'Platform admin',
      group: 'support',
      // BD135: a capability, never a hardcoded handle, so granting it later is a
      // database row rather than a deploy. DR0 found /dna/admin duplicating
      // /admin; that collapses at step 7 and this row points at the survivor.
      behaviour: { kind: 'navigate', route: '/admin' },
      capability: 'platform_admin',
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      group: 'support',
      behaviour: { kind: 'leaf', action: 'sign-out' },
    },
  ],
};

export const DRAWER_SURFACES: DrawerSurface[] = [ACCOUNT_SURFACE];

export function getSurface(surfaceId: string): DrawerSurface | undefined {
  return DRAWER_SURFACES.find((s) => s.surfaceId === surfaceId);
}
