/**
 * EditContext — one edit state for the whole app, bound to the drawer (BD165).
 *
 * The exact mirror of ComposerContext. The composer opens empty and gets its
 * "what" (mode + context) from context state; the edit surface opens empty and
 * gets its "which post" from EditContext. The URL carries the surface id
 * ('edit'); the context carries the payload — the post id is NOT in the URL
 * (stackUrl's single-param invariant, and ids can carry the * / . separators).
 *
 * openEdit is the one place a feed item becomes an editable seed: it runs the
 * pure resolvePostForEdit, fetches the posts row for posts/commentary targets,
 * runs the matching hydrate, and only then opens the surface. Every other
 * target does nothing here — the affordance is already hidden upstream, and
 * this is defence in depth (BD165: never open an edit that leads to a dead end).
 */

import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logHighError, getErrorMessage } from '@/lib/errorLogger';
import { useDrawerSafe } from '@/contexts/DrawerContext';
import { EDIT_SURFACE_ID } from '@/components/drawer/surfaces/EditSurface';
import { resolvePostForEdit, type PostEditPlan } from '@/lib/postEditResolver';
import { MODE_HANDLERS, type ComposerEditSeed } from '@/components/composer/modeHandlers';

/** The item shape resolvePostForEdit reads — the card already holds all of it. */
type EditableItem = Parameters<typeof resolvePostForEdit>[0];

/** What the edit surface renders from: the plan, the seed, and the row's
 *  updated_at for optimistic concurrency (rpc_update_post raises 40001 on a
 *  stale value). */
export interface EditState {
  plan: PostEditPlan;
  seed: ComposerEditSeed;
  fetchedUpdatedAt: string;
}

interface EditApi {
  isOpen: boolean;
  state: EditState | null;
  openEdit: (item: EditableItem) => Promise<void>;
  close: () => void;
}

const EditCtx = React.createContext<EditApi | null>(null);

/** The columns the seed needs. rpc_update_post's allowlist is a superset. */
const POST_EDIT_COLUMNS =
  'id, content, title, subtitle, image_url, gallery_urls, metadata, share_commentary, post_type, updated_at';

export function EditProvider({ children }: { children: React.ReactNode }) {
  const drawer = useDrawerSafe();
  const [state, setState] = React.useState<EditState | null>(null);

  const drawerSurfaceId = drawer?.stack.at(-1)?.surfaceId ?? null;

  const openEdit = React.useCallback(
    async (item: EditableItem) => {
      const plan = resolvePostForEdit(item);

      // posts and commentary both target the posts row; every other target is
      // deferred and its affordance is hidden. Do nothing (defence).
      if (plan.target !== 'posts' && plan.target !== 'commentary') return;

      const recordId = plan.target === 'posts' ? plan.recordId : plan.postId;

      const { data: row, error } = await supabase
        .from('posts')
        .select(POST_EDIT_COLUMNS)
        .eq('id', recordId)
        .single();

      if (error || !row) {
        logHighError(error, 'post_creation', 'Failed to load post for edit', { recordId });
        toast({ variant: 'destructive', description: getErrorMessage(error) });
        return; // Do NOT open the surface on a failed fetch.
      }

      let seed: ComposerEditSeed;
      if (plan.target === 'commentary') {
        // Reshare seeds the body from share_commentary; no ComposerFields.
        seed = {
          body: (row as { share_commentary?: string | null }).share_commentary ?? '',
          fields: {},
          mediaUrl: undefined,
          galleryUrls: [],
          roles: [],
          metadataPassthrough: null,
        };
      } else {
        // post/status/connect share the connect hydrate; story has its own.
        const mode = plan.postType === 'story' ? 'story' : 'connect';
        const hydrate = MODE_HANDLERS[mode].hydrate;
        if (!hydrate) return; // Unreachable for connect/story, but typed optional.
        seed = hydrate(row);
      }

      setState({ plan, seed, fetchedUpdatedAt: (row as { updated_at: string }).updated_at });
      drawer?.openSurface(EDIT_SURFACE_ID);
    },
    [drawer],
  );

  const close = React.useCallback(() => {
    setState(null);
    if (drawerSurfaceId === EDIT_SURFACE_ID) drawer?.close();
  }, [drawer, drawerSurfaceId]);

  /**
   * Openness is DERIVED from the shell, never mirrored into it — the composer's
   * race note applies verbatim (BD109): syncing with an effect closes the
   * surface mid-open because openSurface writes the URL a frame later. With no
   * drawer above it, fall back to local state so the context stays usable in
   * tests and isolation.
   */
  const isOpen = drawer ? drawerSurfaceId === EDIT_SURFACE_ID : state !== null;

  const value = React.useMemo<EditApi>(
    () => ({ isOpen, state, openEdit, close }),
    [isOpen, state, openEdit, close],
  );

  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>;
}

export function useEdit(): EditApi {
  const ctx = React.useContext(EditCtx);
  if (!ctx) throw new Error('useEdit must be used inside <EditProvider />');
  return ctx;
}
