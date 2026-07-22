/**
 * Account as a drawer surface (DR1 step 6) — the STACK-MODE reference.
 *
 * Composer proved the shell handles a single flat surface. Account proves it
 * handles a pushed stack, which is the harder case and the one that was broken.
 *
 * ── What this fixes, all of it in the shell rather than here ──────────────
 * DR0 defect 1  desktop background was focusable behind an open drawer
 * DR0 defect 3  desktop had no scrim, no focus trap, no focus restore
 * DR0 defect 9  mobile sheet ran under the iOS Safari toolbar (no bottom inset)
 * DR0 defect 13 desktop panel never received focus on open
 *
 * None of those are addressed in this file. That is the point: they were
 * per-surface bugs because chrome was per-surface. The shell owns chrome now,
 * so it owns the fixes, and every future surface inherits them.
 *
 * ── Panels are addressed by id ────────────────────────────────────────────
 * `IdentitySheet`'s stack held React nodes. A React node cannot live in a URL,
 * so a pushed panel could not be deep-linked, could not survive a refresh, and
 * could not be closed by browser back.
 *
 * `DrawerIdentityShim` below keeps the exact `useIdentitySheet()` call shape
 * that `AccountDrawerBody` and every `SettingsRow` already use, but routes it to
 * the shell and resolves content from `ACCOUNT_PANELS` by id. The `node`
 * argument is deliberately IGNORED — the id is the source of truth, and
 * `accountSurface.test.tsx` fails if any pushed id is unregistered, so an
 * ignored node can never become a silently missing panel.
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { IdentitySheetContext, SheetErrorPanel } from '@/components/ui/settings-kit';
import { AccountDrawerBody } from '@/components/navigation/AccountDrawer';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAccountActions } from '@/contexts/AccountActionsContext';
import type { ResolvedFrame } from '@/contexts/DrawerContext';

export const ACCOUNT_SURFACE_ID = 'account';

const AccountSettings = React.lazy(() => import('@/pages/dna/settings/AccountSettings'));
const PrivacySettings = React.lazy(() => import('@/pages/dna/settings/PrivacySettings'));
const NotificationSettings = React.lazy(() => import('@/pages/dna/settings/NotificationSettings'));
const PreferencesSettings = React.lazy(() => import('@/pages/dna/settings/PreferencesSettings'));
const MyHashtagsSettings = React.lazy(() => import('@/pages/dna/settings/MyHashtagsSettings'));
const MyReportsSettings = React.lazy(() => import('@/pages/dna/settings/MyReportsSettings'));
const BlockedUsersSettings = React.lazy(() => import('@/pages/dna/settings/BlockedUsersSettings'));
const ProfileEdit = React.lazy(() => import('@/pages/ProfileEdit'));

const PanelFallback = () => (
  <div className="flex items-center justify-center py-16 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

const wrap = (node: React.ReactNode, surface = 'This section') => (
  <SheetErrorPanel surface={surface}>
    <React.Suspense fallback={<PanelFallback />}>{node}</React.Suspense>
  </SheetErrorPanel>
);

/**
 * panelId -> content. The ids here ARE the ids that appear in the URL, so
 * renaming one breaks a shared link. Treat them as a public contract.
 */
export const ACCOUNT_PANELS: Record<string, () => ResolvedFrame> = {
  profile: () => ({ title: 'Profile', node: wrap(<ProfileEdit />) }),
  account: () => ({ title: 'Sign-in and security', node: wrap(<AccountSettings />) }),
  privacy: () => ({ title: 'Privacy', node: wrap(<PrivacySettings />) }),
  notifications: () => ({ title: 'Notifications', node: wrap(<NotificationSettings />) }),
  preferences: () => ({ title: 'Preferences', node: wrap(<PreferencesSettings />) }),
  hashtags: () => ({ title: 'My hashtags', node: wrap(<MyHashtagsSettings />) }),
  reports: () => ({ title: 'My reports', node: wrap(<MyReportsSettings />) }),
  blocked: () => ({ title: 'Blocked users', node: wrap(<BlockedUsersSettings />) }),
};

/**
 * Supplies the `useIdentitySheet()` contract, backed by the shell.
 *
 * `pop` maps to the shell's `back`, which is browser back, so a pushed panel is
 * dismissed by the hardware button, the header chevron and a swipe alike — with
 * no per-surface wiring and no way for them to disagree.
 */
function DrawerIdentityShim({ children }: { children: React.ReactNode }) {
  const { pushPanel, back, close } = useDrawer();

  const value = React.useMemo(
    () => ({
      push: (frame: { id: string; title: string; node: React.ReactNode }) => pushPanel(frame.id),
      pop: back,
      close,
    }),
    [pushPanel, back, close],
  );

  return <IdentitySheetContext.Provider value={value}>{children}</IdentitySheetContext.Provider>;
}

export function AccountSurface() {
  const handlers = useAccountActions();
  return (
    <DrawerIdentityShim>
      <AccountDrawerBody handlers={handlers} />
    </DrawerIdentityShim>
  );
}

export function AccountPanel({ panelId }: { panelId: string }) {
  const frame = ACCOUNT_PANELS[panelId];
  // An unregistered id renders nothing, never a placeholder (BD111).
  if (!frame) return null;
  return <DrawerIdentityShim>{frame().node}</DrawerIdentityShim>;
}
