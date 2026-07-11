/**
 * DNA Post Composer — Core Service
 *
 * Handles all Composer operations: submission routing, draft management,
 * and attribution tracking across all Five C's.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  ComposerMode,
  CModule,
  MODE_TO_PRIMARY_C,
  type ComposerBaseFields,
  type ComposerSubmission,
  type ComposerAttribution,
  type PostModeFields,
  type StoryModeFields,
  type EventModeFields,
  type SpaceModeFields,
  type OpportunityModeFields,
} from '@/types/composer';
import { extractHashtags } from '@/utils/hashtagUtils';

export const composerService = {
  // ============================================
  // SUBMISSION — Routes to correct table
  // ============================================

  async submit(
    submission: ComposerSubmission
  ): Promise<{ id: string; type: ComposerMode }> {
    const handlers: Record<ComposerMode, () => Promise<string>> = {
      [ComposerMode.POST]: () =>
        this.submitPost(
          submission.base,
          submission.modeFields as PostModeFields
        ),
      [ComposerMode.STORY]: () =>
        this.submitStory(
          submission.base,
          submission.modeFields as StoryModeFields
        ),
      [ComposerMode.EVENT]: () =>
        this.submitEvent(
          submission.base,
          submission.modeFields as EventModeFields
        ),
      [ComposerMode.SPACE]: () =>
        this.submitSpace(
          submission.base,
          submission.modeFields as SpaceModeFields
        ),
      [ComposerMode.OPPORTUNITY]: () =>
        this.submitOpportunity(
          submission.base,
          submission.modeFields as OpportunityModeFields
        ),
    };

    const contentId = await handlers[submission.mode]();

    return { id: contentId, type: submission.mode };
  },

  // ============================================
  // SECONDARY C-MODULE DETECTION
  // ============================================

  detectSecondaryCModules(
    mode: ComposerMode,
    base: ComposerBaseFields,
    modeFields: Record<string, unknown>
  ): CModule[] {
    const secondaryCs: CModule[] = [];
    const primaryC = MODE_TO_PRIMARY_C[mode];

    // If posting in a space context, add COLLABORATE
    if (base.audienceTargetId && primaryC !== CModule.COLLABORATE) {
      secondaryCs.push(CModule.COLLABORATE);
    }

    // If event has a related space, add COLLABORATE
    if (mode === ComposerMode.EVENT && modeFields.relatedSpaceId) {
      secondaryCs.push(CModule.COLLABORATE);
    }

    // If opportunity has a related space, add COLLABORATE
    if (mode === ComposerMode.OPPORTUNITY && modeFields.relatedSpaceId) {
      secondaryCs.push(CModule.COLLABORATE);
    }

    // If story has an event CTA, add CONVENE
    if (mode === ComposerMode.STORY) {
      const storyFields = modeFields as Partial<StoryModeFields>;
      if (storyFields.callToAction?.type === 'attend_event') {
        secondaryCs.push(CModule.CONVENE);
      }
      if (storyFields.callToAction?.type === 'join_space') {
        secondaryCs.push(CModule.COLLABORATE);
      }
      if (storyFields.callToAction?.type === 'view_opportunity') {
        secondaryCs.push(CModule.CONTRIBUTE);
      }
    }

    // If there are mentions, add CONNECT
    if (base.mentions.length > 0 && primaryC !== CModule.CONNECT) {
      secondaryCs.push(CModule.CONNECT);
    }

    return [...new Set(secondaryCs)];
  },

  // ============================================
  // MODE-SPECIFIC SUBMISSION HANDLERS
  // ============================================

  async submitPost(
    base: ComposerBaseFields,
    fields: PostModeFields
  ): Promise<string> {
    // Extract tags from content hashtags + base tags
    const contentTags = extractHashtags(base.body);
    const baseTags = base.tags.map((t) => t.label.toLowerCase());
    const allTags = [...new Set([...contentTags, ...baseTags])];

    // Also add creator's professional_sectors as fallback tags
    const { data: profile } = await supabase
      .from('profiles')
      .select('professional_sectors')
      .single();
    const sectorTags = (profile?.professional_sectors as string[] | null) ?? [];
    const finalTags = allTags.length > 0 ? allTags : sectorTags;

    // posts table exists in generated types but insert shape is strict —
    // extra fields like composer_mode are provisional columns not yet in types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('posts') as any)
      .insert({
        content: base.body,
        image_url: base.media[0]?.url ?? null,
        privacy_level: base.audience,
        context: base.context ?? null,
        composer_mode: 'post',
        tags: finalTags,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Failed to create post');
    return data.id;
  },

  async submitStory(
    base: ComposerBaseFields,
    fields: StoryModeFields
  ): Promise<string> {
    // Extract tags from content + story topics
    const contentTags = extractHashtags(base.body);
    const baseTags = base.tags.map((t) => t.label.toLowerCase());
    const allTags = [...new Set([...contentTags, ...baseTags])];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('posts') as any)
      .insert({
        content: base.body,
        title: fields.title,
        subtitle: fields.subtitle ?? null,
        image_url: fields.coverImage?.url ?? base.media[0]?.url ?? null,
        post_type: 'story',
        privacy_level: base.audience,
        composer_mode: 'story',
        tags: allTags,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Failed to create story');
    return data.id;
  },

  async submitEvent(
    base: ComposerBaseFields,
    fields: EventModeFields
  ): Promise<string> {
    const { data: authData } = await supabase.auth.getSession();

    const eventPayload = {
      title: fields.title,
      description: base.body,
      event_type: 'meetup',
      format: fields.eventType,
      start_time: fields.startDateTime.toISOString(),
      end_time: fields.endDateTime.toISOString(),
      timezone: fields.timezone,
      timezone_displays: fields.timezoneDisplay,
      location_name: fields.physicalLocation?.venueName ?? fields.physicalLocation?.address,
      location_city: fields.physicalLocation?.city,
      location_country: fields.physicalLocation?.country,
      location_lat: fields.physicalLocation?.coordinates?.lat,
      location_lng: fields.physicalLocation?.coordinates?.lng,
      meeting_url: fields.virtualLink,
      max_attendees: fields.capacity,
      co_hosts: fields.coHosts,
      related_space_id: fields.relatedSpaceId,
      rsvp_questions: fields.rsvpQuestions ?? [],
      cover_image_url: fields.coverImage?.url ?? base.media[0]?.url ?? null,
      is_public: base.audience === 'public',
      requires_approval: false,
      allow_guests: true,
      composer_mode: 'event',
    };

    const response = await supabase.functions.invoke('create-event', {
      body: eventPayload,
      headers: {
        Authorization: `Bearer ${authData.session?.access_token}`,
      },
    });

    if (response.error) {
      throw new Error('Failed to create event');
    }

    if (response.data && !response.data.success) {
      throw new Error(response.data.error || 'Failed to create event');
    }

    return response.data?.event_id ?? response.data?.id ?? '';
  },

  async submitSpace(
    base: ComposerBaseFields,
    fields: SpaceModeFields
  ): Promise<string> {
    // collaboration_spaces table retired; creating a space from the composer is
    // out of scope (canonical space creation lives under /dna/collaborate).
    throw new Error('Space creation is not available.');
  },

  async submitOpportunity(
    base: ComposerBaseFields,
    fields: OpportunityModeFields
  ): Promise<string> {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase.from('opportunities')
      .insert([{
        created_by: userId,
        title: fields.title,
        description: base.body,
        direction: fields.direction,
        category: fields.category,
        compensation_type: fields.compensation,
        compensation_details: (fields.compensationDetails ?? {}) as unknown as Json,
        location_relevance: fields.locationRelevance,
        specific_region: fields.specificRegion,
        specific_country: fields.specificCountry,
        duration: fields.duration,
        deadline: fields.deadline?.toISOString(),
        requirements: fields.requirements,
        related_space_id: fields.relatedSpaceId,
        budget_range: (fields.budgetRange ?? null) as unknown as Json,
        tags: base.tags.map((t) => t.label),
        audience: base.audience,
        media: base.media as unknown as Json,
        give_what: fields.giveWhat ?? null,
        give_to: fields.giveTo ?? null,
        intended_impact: fields.intendedImpact ?? null,
      }])
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Failed to create opportunity');
    return data.id;
  },
};
