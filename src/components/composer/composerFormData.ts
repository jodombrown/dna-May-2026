/**
 * composerFormData — the ONE pure mapping from composer state to ComposerFormData
 *
 * This is the forward half of the composer's create direction, lifted out of
 * <UniversalComposer> so the component and the edit round-trip tests share a
 * single implementation. UniversalComposer.buildFormData() is now a thin wrapper
 * over seedToFormData(); the tests feed an edit seed (record -> hydrate) back
 * through the same function to prove the inverse matches the forward exactly.
 *
 * Keep this in lockstep with each handler's `submit` in modeHandlers.ts. A
 * column the composer writes on create must map here; anything else is a field
 * an edit would silently drop.
 */

import type { ComposerMode, ComposerFormData } from '@/hooks/useUniversalComposer';

/**
 * The subset of composer state seedToFormData reads. `ComposerEditSeed` (the
 * edit hydration output) is assignable to this, which is what makes the
 * round-trip test possible without duplicating the mapping.
 */
export interface SeedToFormDataInput {
  body: string;
  fields: Record<string, string>;
  mediaUrl?: string;
  galleryUrls: string[];
  roles: string[];
}

/**
 * Build the ComposerFormData a verb submits from raw composer state. Returns
 * null for `event`, which never routes through handler.submit (EventForm owns
 * event authoring end to end).
 */
export function seedToFormData(
  mode: ComposerMode,
  input: SeedToFormDataInput
): ComposerFormData | null {
  const { body, fields, mediaUrl, galleryUrls, roles } = input;
  const cleanedGallery = galleryUrls.filter((u) => typeof u === 'string' && u.length > 0);
  const base: ComposerFormData = { content: body, mediaUrl, galleryUrls: cleanedGallery };

  switch (mode) {
    case 'story':
      // Hero → posts.image_url, gallery → posts.gallery_urls.
      return { ...base, title: fields.title?.trim() || undefined, heroImage: mediaUrl };

    case 'connect':
      return {
        ...base,
        intent: fields.intent?.trim() || undefined,
        where: fields.where?.trim() || undefined,
      };

    case 'need':
      return {
        ...base,
        direction: fields.direction === 'need' ? 'need' : 'offer',
        category: fields.kind || undefined,
        giveWhat: fields.give || undefined,
        giveTo: fields.to || undefined,
        intendedImpact: fields.impact || undefined,
      };

    case 'space':
      // roles[] → space_roles rows (handler inserts them after createSpace).
      return {
        ...base,
        title: fields.title?.trim() || undefined,
        spaceCategory: fields.type || undefined,
        skillsNeeded: roles,
      };

    case 'event':
      // Events submit through EventForm/useEventForm — never through here.
      return null;
  }
}
