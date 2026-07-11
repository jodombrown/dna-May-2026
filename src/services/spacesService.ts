/**
 * Spaces — creation service
 *
 * The ONE code path that creates a Space. Used by the canonical page
 * (/dna/collaborate/spaces/new) and by the Universal Composer's Collaborate
 * verb (BD087 reversal: Space composes inline; the member never leaves the
 * composer).
 *
 * The spaces INSERT trigger (add_creator_as_member) seats the creator as an
 * active `lead` in space_members — callers must NOT insert that membership
 * themselves.
 */

import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/utils/slugify';
import type { SpaceVisibility } from '@/types/collaborate';

/** DB-constrained values: spaces_space_type_check. */
export type SpaceType = 'project' | 'working_group' | 'initiative' | 'program';

export interface CreateSpaceInput {
  name: string;
  createdBy: string;
  spaceType: SpaceType;
  visibility?: SpaceVisibility;
  tagline?: string | null;
  description?: string | null;
  /** Roles the founder is recruiting for — stored as focus areas until a roles column lands. */
  focusAreas?: string[] | null;
}

export interface CreatedSpace {
  id: string;
  slug: string;
}

/**
 * Build a slug that is free of collisions with spaces the caller can see.
 * A trailing unique suffix on insert conflict (below) covers private spaces
 * hidden by RLS that a SELECT can't detect.
 */
async function buildUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'space';
  const { data } = await supabase
    .from('spaces')
    .select('slug')
    .or(`slug.eq.${base},slug.like.${base}-%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export async function createSpace(input: CreateSpaceInput): Promise<CreatedSpace> {
  let slug = await buildUniqueSlug(input.name.trim());

  const payload = {
    name: input.name.trim(),
    tagline: input.tagline?.trim() || null,
    description: input.description?.trim() || null,
    space_type: input.spaceType,
    visibility: input.visibility ?? 'community',
    status: 'idea',
    created_by: input.createdBy,
    focus_areas: input.focusAreas?.length ? input.focusAreas : null,
  };

  // The INSERT trigger seats the creator as an active lead — do not insert
  // the creator membership from here.
  let { data, error } = await supabase
    .from('spaces')
    .insert({ ...payload, slug })
    .select('id, slug')
    .single();

  // Retry once with a unique suffix if the slug collided with a space
  // RLS hid from the pre-check (unique_violation).
  if (error && error.code === '23505') {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    ({ data, error } = await supabase
      .from('spaces')
      .insert({ ...payload, slug })
      .select('id, slug')
      .single());
  }

  if (error || !data) throw error || new Error('Could not create the space.');
  return { id: data.id, slug: data.slug };
}
