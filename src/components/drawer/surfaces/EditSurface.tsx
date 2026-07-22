/**
 * EditSurface — editing an existing post, as a drawer surface (BD165).
 *
 * The mirror of ComposerSurface, but for the EDIT direction. The surface id
 * ('edit') lives in the URL (?drawer=edit) so back-button and refresh survive;
 * WHICH post is being edited rides in EditContext, exactly as the composer's
 * mode/context does. The id is deliberately NOT in the URL — stackUrl's
 * single-param invariant forbids a second param and ids can carry the * / .
 * separators.
 *
 * Consequence, intended: a refresh mid-edit reopens the 'edit' surface with no
 * post in context. The surface then CLOSES ITSELF GRACEFULLY rather than render
 * a blank panel — matching the shell's "unknown renders as nothing" doctrine
 * (BD111). See EditSurfaceEmpty below.
 *
 * SCOPE (BD165): posts-backed verbs only — post/status/connect/story — plus
 * reshare commentary. Space/need/event editing is DEFERRED and its affordance
 * is HIDDEN upstream (PostMenuOwn), never shown-then-refused. There is no verb
 * rail, no mode selector, no success screen: editing never changes a post's
 * type.
 */

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logHighError, getErrorMessage } from '@/lib/errorLogger';
import { ComposerFields } from '@/components/composer/ComposerFields';
import { seedToFormData } from '@/components/composer/composerFormData';
import { modeConfig, type ComposerMode } from '@/config/composerModes';
import { useEdit, type EditState } from '@/contexts/EditContext';

export const EDIT_SURFACE_ID = 'edit';

/**
 * Map the four posts-backed post_types onto the two composer modes that own
 * their fields. post/status/connect share the connect field set; story has its
 * own. Editing never crosses this line — a status stays a status.
 */
function postTypeToComposerMode(postType: string): ComposerMode {
  return postType === 'story' ? 'story' : 'connect';
}

export function EditSurface() {
  const edit = useEdit();

  // Refresh case: the 'edit' surface is in the URL but no post is in context.
  // Render nothing and self-close, rather than a blank panel.
  if (!edit.state) return <EditSurfaceEmpty onEmpty={edit.close} />;

  // Keyed on the post id so opening a different post remounts fresh local
  // state instead of stranding the previous post's edits.
  const key =
    edit.state.plan.target === 'commentary'
      ? edit.state.plan.postId
      : edit.state.plan.target === 'posts'
        ? edit.state.plan.recordId
        : 'unknown';

  return <EditSurfaceBody key={key} state={edit.state} onDone={edit.close} />;
}

/** No post in context — strip the surface from the URL and render nothing. */
function EditSurfaceEmpty({ onEmpty }: { onEmpty: () => void }) {
  React.useEffect(() => {
    onEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function EditSurfaceBody({ state, onDone }: { state: EditState; onDone: () => void }) {
  const { plan, seed, fetchedUpdatedAt } = state;
  const queryClient = useQueryClient();

  const isCommentary = plan.target === 'commentary';
  const composerMode = React.useMemo<ComposerMode>(
    () => (plan.target === 'posts' ? postTypeToComposerMode(plan.postType) : 'connect'),
    [plan],
  );

  const [body, setBody] = React.useState(seed.body);
  const [fields, setFields] = React.useState<Record<string, string>>(seed.fields);
  const [mediaUrl, setMediaUrl] = React.useState<string | undefined>(seed.mediaUrl);
  const [galleryUrls, setGalleryUrls] = React.useState<string[]>(seed.galleryUrls);
  const [roles, setRoles] = React.useState<string[]>(seed.roles);
  const [isSaving, setIsSaving] = React.useState(false);

  // Nothing DIA-filled in an edit — every field is already the author's.
  const noDia = React.useMemo(() => new Set<string>(), []);

  const editField = React.useCallback((k: string, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
  }, []);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      let patch: Record<string, unknown>;
      let postId: string;

      if (plan.target === 'commentary') {
        // Reshare edits the commentary only.
        patch = { share_commentary: body };
        postId = plan.postId;
      } else if (plan.target === 'posts') {
        postId = plan.recordId;
        const fd = seedToFormData(composerMode, { body, fields, mediaUrl, galleryUrls, roles });
        if (!fd) {
          setIsSaving(false);
          return;
        }
        if (composerMode === 'story') {
          patch = {
            content: fd.content,
            title: fd.title ?? null,
            image_url: fd.mediaUrl ?? null,
            gallery_urls: fd.galleryUrls ?? [],
          };
        } else {
          // connect/post/status: preserve the WHOLE original metadata blob and
          // change only the edited keys, so an unrendered key (e.g. sector) is
          // never dropped — the BD111 fabrication vector must hold.
          patch = {
            content: fd.content,
            image_url: fd.mediaUrl ?? null,
            gallery_urls: fd.galleryUrls ?? [],
            metadata: { ...(seed.metadataPassthrough ?? {}), intent: fd.intent, where: fd.where },
          };
        }
      } else {
        // Defence: the affordance is hidden for every other target.
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.rpc('rpc_update_post' as any, {
        p_post_id: postId,
        p_expected_updated_at: fetchedUpdatedAt,
        p_patch: patch,
      });

      if (error) {
        if ((error as { code?: string }).code === '40001') {
          toast({
            variant: 'destructive',
            description: 'This post changed since you opened it. Reload before saving.',
          });
        } else {
          logHighError(error, 'post_creation', 'Failed to edit post', { postId, target: plan.target });
          toast({ variant: 'destructive', description: getErrorMessage(error) });
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['universal-feed-infinite'] });
      toast({ description: 'Post updated' });
      onDone();
    } finally {
      setIsSaving(false);
    }
  }, [plan, composerMode, body, fields, mediaUrl, galleryUrls, roles, seed, fetchedUpdatedAt, queryClient, onDone]);

  const canSave = body.trim().length > 0 && !isSaving;

  return (
    <>
      <div className="space-y-3 px-4 py-4 sm:px-6">
        {isCommentary ? (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add your commentary"
            autoFocus
            rows={5}
            className="resize-y text-body leading-relaxed"
          />
        ) : (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={modeConfig(composerMode).placeholder}
              autoFocus
              rows={5}
              className="resize-y text-body leading-relaxed"
            />
            <ComposerFields
              mode={composerMode}
              values={fields}
              diaFilled={noDia}
              onChange={editField}
              roles={roles}
              onRolesChange={setRoles}
              mediaUrl={mediaUrl}
              onMediaChange={setMediaUrl}
              galleryUrls={galleryUrls}
              onGalleryChange={setGalleryUrls}
            />
          </>
        )}
      </div>

      <div
        className="border-t bg-background px-4 pt-3 sm:px-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onDone} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="font-semibold">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
