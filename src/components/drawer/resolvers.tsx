/**
 * Drawer resolvers — the id-to-content map the URL binding needs.
 *
 * Because `?drawer=` holds ids and not React nodes, something has to turn an id
 * back into content. This is that something.
 *
 * Composer migrated at step 5; Account migrates at step 6. Any id not listed
 * here resolves to null and the shell renders nothing.
 *
 * An unknown id resolves to null rather than throwing or rendering a
 * placeholder. A hand-edited URL, a stale bookmark or a shipped-then-removed
 * surface degrades to a closed drawer, never to a broken panel and never to an
 * invented one (BD111: an unknown renders as nothing, not as a placeholder).
 */

import type { DrawerResolvers, ResolvedFrame } from '@/contexts/DrawerContext';
import { ComposerSurface, COMPOSER_SURFACE_ID } from '@/components/drawer/surfaces/ComposerSurface';
import {
  AccountSurface,
  AccountPanel,
  ACCOUNT_PANELS,
  ACCOUNT_SURFACE_ID,
} from '@/components/drawer/surfaces/AccountSurface';

type SurfaceRenderer = () => ResolvedFrame;
type PanelRenderer = () => ResolvedFrame;

/** surfaceId -> surface root content. Populated as surfaces migrate. */
const SURFACE_RENDERERS: Record<string, SurfaceRenderer> = {
  [COMPOSER_SURFACE_ID]: () => ({
    title: 'Share something with the diaspora',
    node: <ComposerSurface />,
    // Restores the 860px the composer set for itself before DR1 stripped its
    // chrome. Writing needs room; a 448px column is not a composing surface.
    width: 'wide',
  }),
  [ACCOUNT_SURFACE_ID]: () => ({ title: 'Account', node: <AccountSurface /> }),
};

/** `${surfaceId}.${panelId}` -> panel content. Populated as surfaces migrate. */
const PANEL_RENDERERS: Record<string, PanelRenderer> = Object.fromEntries(
  Object.entries(ACCOUNT_PANELS).map(([panelId, frame]) => [
    `${ACCOUNT_SURFACE_ID}.${panelId}`,
    () => ({ title: frame().title, node: <AccountPanel panelId={panelId} /> }),
  ]),
);

export const drawerResolvers: DrawerResolvers = {
  surface: (surfaceId) => SURFACE_RENDERERS[surfaceId]?.() ?? null,
  panel: (surfaceId, panelId) => PANEL_RENDERERS[`${surfaceId}.${panelId}`]?.() ?? null,
};

/** Registration helpers, used by each surface as it migrates onto the shell. */
export function registerSurface(surfaceId: string, render: SurfaceRenderer) {
  SURFACE_RENDERERS[surfaceId] = render;
}

export function registerPanel(surfaceId: string, panelId: string, render: PanelRenderer) {
  PANEL_RENDERERS[`${surfaceId}.${panelId}`] = render;
}
