/**
 * DNA Post Composer — Mode Handler Object Map
 *
 * Replaces all switch/case logic for submission, validation, labels, and defaults.
 * Each mode is a typed entry with everything the composer needs to operate.
 *
 * Sprint 3A: Wire submit functions to existing submission handlers.
 */

import type { ComposerMode, ComposerFormData } from '@/hooks/useUniversalComposer';
import { supabase } from '@/integrations/supabase/client';
import { MateMasie } from '@/components/icons/adinkra';
import {
  createFeedPost,
  createStoryPost,
} from '@/lib/feedWriter';
import { createSpace, type SpaceType } from '@/services/spacesService';
import type { UniversalFeedItem } from '@/types/feed';

// ============================================================
// Types
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SubmitResult {
  success: boolean;
  createdPost?: UniversalFeedItem | null;
  error?: string;
}

export interface ComposerSubmitContext {
  userId: string;
  spaceId?: string;
  eventId?: string;
  communityId?: string;
  relatedSpaceId?: string;
  relatedSpaceName?: string;
  relatedEventId?: string;
  relatedEventTitle?: string;
  relatedOpportunityId?: string;
  resharedContentId?: string;
}

export interface ModeHandler {
  label: string;
  shortLabel: string;
  submitLabel: string;
  submittingLabel: string;
  icon: string;
  accentColor: string;
  accentClass: string;
  hoverClass: string;
  glowClass: string;
  validate: (data: ComposerFormData) => ValidationResult;
  submit: (data: ComposerFormData, context: ComposerSubmitContext) => Promise<SubmitResult>;
  getDefaultValues: () => Partial<ComposerFormData>;
  successMessage: string;
  errorMessage: string;
}

// ============================================================
// Helpers
// ============================================================

function buildUniversalFeedItemForPost(
  post: { post_id: string; author_id: string; content: string; image_url?: string; gallery_urls?: string[] | null; created_at: string; author_username: string; author_full_name: string; author_avatar_url?: string; link_url?: string; link_title?: string; link_description?: string; link_metadata?: Record<string, unknown> | null },
  formData: ComposerFormData,
  context: ComposerSubmitContext
): UniversalFeedItem {
  return {
    post_id: post.post_id,
    author_id: post.author_id,
    author_username: post.author_username,
    author_display_name: post.author_full_name,
    author_avatar_url: post.author_avatar_url || null,
    content: post.content,
    title: null,
    subtitle: null,
    media_url: post.image_url || null,
    gallery_urls: post.gallery_urls ?? null,
    post_type: 'post',
    story_type: null,
    privacy_level: 'public',
    linked_entity_type: null,
    linked_entity_id: null,
    space_id: context.spaceId || null,
    space_title: null,
    event_id: context.eventId || null,
    event_title: null,
    created_at: post.created_at,
    updated_at: post.created_at,
    like_count: 0,
    comment_count: 0,
    share_count: 0,
    reshare_count: 0,
    view_count: 0,
    bookmark_count: 0,
    has_liked: false,
    has_bookmarked: false,
    has_reshared: false,
    pinned_at: null,
    comments_disabled: false,
    link_url: formData.linkUrl || null,
    link_title: formData.linkTitle || null,
    link_description: formData.linkDescription || null,
    link_metadata: formData.linkThumbnail ? {
      embed_type: 'video',
      provider_name: formData.linkProviderName,
      thumbnail_url: formData.linkThumbnail,
      is_video: true,
    } : null,
    original_post_id: null,
    original_author_id: null,
    original_author_username: null,
    original_author_full_name: null,
    original_author_avatar_url: null,
    original_author_headline: null,
    original_content: null,
    original_image_url: null,
    original_created_at: null,
    slug: null,
  };
}

function buildUniversalFeedItemForStory(
  story: { post_id: string; author_id: string; content: string; title?: string; subtitle?: string; image_url?: string; created_at: string; author_username: string; author_full_name: string; author_avatar_url?: string; slug?: string },
  formData: ComposerFormData,
  context: ComposerSubmitContext
): UniversalFeedItem {
  return {
    post_id: story.post_id,
    author_id: story.author_id,
    author_username: story.author_username,
    author_display_name: story.author_full_name,
    author_avatar_url: story.author_avatar_url || null,
    content: story.content,
    title: story.title || null,
    subtitle: story.subtitle || null,
    media_url: story.image_url || null,
    post_type: 'story',
    story_type: formData.storyType || 'update',
    privacy_level: 'public',
    linked_entity_type: null,
    linked_entity_id: null,
    space_id: context.spaceId || null,
    space_title: null,
    event_id: context.eventId || null,
    event_title: null,
    created_at: story.created_at,
    updated_at: story.created_at,
    like_count: 0,
    comment_count: 0,
    share_count: 0,
    reshare_count: 0,
    view_count: 0,
    bookmark_count: 0,
    has_liked: false,
    has_bookmarked: false,
    has_reshared: false,
    pinned_at: null,
    comments_disabled: false,
    link_url: null,
    link_title: null,
    link_description: null,
    link_metadata: null,
    original_post_id: null,
    original_author_id: null,
    original_author_username: null,
    original_author_full_name: null,
    original_author_avatar_url: null,
    original_author_headline: null,
    original_content: null,
    original_image_url: null,
    original_created_at: null,
    slug: story.slug || null,
  };
}

/**
 * Composer "Type" labels → DB space_type (spaces_space_type_check allows
 * project | working_group | initiative | program). Labels the constraint
 * doesn't know fold into their nearest kin.
 */
function toSpaceType(label?: string): SpaceType {
  switch ((label ?? '').toLowerCase()) {
    case 'project':
    case 'venture':
      return 'project';
    case 'working group':
    case 'working_group':
      return 'working_group';
    case 'program':
      return 'program';
    case 'initiative':
    case 'campaign':
    default:
      return 'initiative';
  }
}

// ============================================================
// Mode Handlers
// ============================================================

export const MODE_HANDLERS: Record<ComposerMode, ModeHandler> = {
  connect: {
    label: 'Make a Connection',
    shortLabel: 'Connect',
    submitLabel: 'Post',
    submittingLabel: 'Posting...',
    icon: 'UserPlus',
    accentColor: '#4A8D77',
    accentClass: 'bg-bevel-connect',
    hoverClass: 'hover:bg-bevel-connect/90',
    glowClass: 'shadow-[0_0_12px_rgba(74,141,119,0.4)]',
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Write something to share';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    // Connect has no separate entity table — the post IS the artifact
    // (BD081). The ask's facets ride in posts.metadata and are surfaced by
    // get_universal_feed, so the card can render the pill and context line.
    submit: async (data, context) => {
      const metadata: Record<string, string> = {};
      if (data.intent?.trim()) metadata.intent = data.intent.trim();
      if (data.where?.trim()) metadata.where = data.where.trim();
      if (data.sector?.trim()) metadata.sector = data.sector.trim();

      const cleanedGallery = (data.galleryUrls ?? []).filter(
        (u): u is string => typeof u === 'string' && u.length > 0
      );

      const { data: row, error } = await supabase
        .from('posts')
        .insert({
          author_id: context.userId,
          content: data.content.trim(),
          post_type: 'connect',
          image_url: data.mediaUrl || null,
          gallery_urls: cleanedGallery.length ? cleanedGallery : null,
          space_id: context.spaceId || null,
          event_id: context.eventId || null,
          privacy_level: 'public',
          metadata,
        })
        .select('id, author_id, content, image_url, gallery_urls, created_at')
        .single();

      if (error || !row) {
        return { success: false, error: error?.message || 'Failed to post connection ask' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', context.userId)
        .single();

      const createdPost: UniversalFeedItem = {
        ...buildUniversalFeedItemForPost(
          {
            post_id: row.id,
            author_id: row.author_id,
            content: row.content ?? '',
            image_url: row.image_url || undefined,
            gallery_urls: row.gallery_urls ?? null,
            created_at: row.created_at,
            author_username: profile?.username || '',
            author_full_name: profile?.full_name || '',
            author_avatar_url: profile?.avatar_url || undefined,
          },
          data,
          context
        ),
        post_type: 'connect',
        metadata,
        intent: metadata.intent ?? null,
        where: metadata.where ?? null,
        sector: metadata.sector ?? null,
        direction: 'seeking',
      };

      return { success: true, createdPost };
    },
    getDefaultValues: () => ({
      content: '', mediaUrl: undefined, galleryUrls: [],
      intent: '', where: '',
    }),
    successMessage: 'Shared!',
    errorMessage: "We couldn't publish this. Your text is safe\u2014please try again.",
  },

  story: {
    label: 'Tell a Story',
    shortLabel: 'Tell',
    submitLabel: 'Post',
    submittingLabel: 'Posting...',
    icon: 'BookOpen',
    accentColor: '#2A7A8C',
    accentClass: 'bg-[#2A7A8C]',
    hoverClass: 'hover:bg-[#236879]',
    glowClass: 'shadow-[0_0_12px_rgba(42,122,140,0.4)]',
    // BD085 rebuild: the body is the only gate. A thought shared with the
    // diaspora is a story, however short; the headline is optional.
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Write something to share';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const title =
        (data.title && data.title.trim()) ||
        data.content.trim().split('\n')[0].slice(0, 80);
      const story = await createStoryPost({
        authorId: context.userId,
        storyTitle: title,
        storyBody: data.content,
        storySubtitle: data.subtitle,
        storyType: data.storyType || 'update',
        imageUrl: data.heroImage || data.mediaUrl,
        galleryUrls: data.galleryUrls,
        spaceId: context.spaceId,
        eventId: context.eventId,
      });

      const createdPost = buildUniversalFeedItemForStory(story, { ...data, title }, context);
      return { success: true, createdPost };
    },
    getDefaultValues: () => ({ title: '', content: '', subtitle: '', heroImage: undefined, storyType: undefined, galleryUrls: [] }),
    successMessage: 'Story published!',
    errorMessage: "We couldn't publish this Story. Your content is safe\u2014please try again.",
  },

  event: {
    label: 'Host an Event',
    shortLabel: 'Host',
    submitLabel: 'Publish event',
    submittingLabel: 'Publishing...',
    icon: 'Calendar',
    accentColor: '#C4942A',
    accentClass: 'bg-[#C4942A]',
    hoverClass: 'hover:bg-[#a87e24]',
    glowClass: 'shadow-[0_0_12px_rgba(196,148,42,0.4)]',
    // BD085 rebuild: the body gates the button; the date gates the substrate.
    // The composer parses the natural-language "When" into eventDate/eventTime
    // before submit — if nothing parseable arrived, say so plainly.
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Tell people what to expect';
      }
      if (!data.eventDate) {
        errors.eventDate = 'Add a date DIA can read — e.g. "Mar 15, 6:00pm"';
      } else {
        const startStr = data.eventTime
          ? `${data.eventDate}T${data.eventTime}:00`
          : `${data.eventDate}T23:59:00`;
        if (new Date(startStr) <= new Date()) {
          errors.eventDate = 'Event must be in the future';
        }
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const startTime = data.eventDate && data.eventTime
        ? `${data.eventDate}T${data.eventTime}:00`
        : data.eventDate
          ? `${data.eventDate}T12:00:00`
          : new Date().toISOString();

      const endTime = data.eventEndDate && data.eventEndTime
        ? `${data.eventEndDate}T${data.eventEndTime}:00`
        : data.eventEndDate
          ? `${data.eventEndDate}T13:00:00`
          : new Date(new Date(startTime).getTime() + 3600000).toISOString();

      const locationParts = (data.location || '').split(',').map(p => p.trim());
      const isVirtual = data.format === 'virtual';
      const isHybrid = data.format === 'hybrid';
      const isInPerson = data.format === 'in_person' || !data.format;

      let locationCity: string | undefined;
      let locationCountry: string | undefined;
      if ((isInPerson || isHybrid) && locationParts.length >= 2) {
        locationCountry = locationParts[locationParts.length - 1];
        locationCity = locationParts[locationParts.length - 2];
      } else if ((isInPerson || isHybrid) && locationParts.length === 1) {
        locationCity = locationParts[0];
        locationCountry = 'Unknown';
      }

      const title =
        (data.title && data.title.trim()) ||
        data.content.trim().split('\n')[0].slice(0, 80);

      const eventPayload = {
        title,
        description: data.content,
        event_type: data.eventType || 'meetup',
        format: data.format || 'in_person',
        start_time: startTime,
        end_time: endTime,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        location_name: (isInPerson || isHybrid) ? data.location : undefined,
        location_city: locationCity,
        location_country: locationCountry,
        meeting_url: (isVirtual || isHybrid) ? data.meetingUrl : undefined,
        max_attendees: data.maxAttendees,
        is_public: true,
        requires_approval: false,
        allow_guests: true,
        cover_image_url: data.mediaUrl,
        subtitle: data.subtitle || undefined,
        agenda: data.agenda || [],
        dress_code: data.dressCode || undefined,
        tags: data.tags || [],
      };

      const { data: authData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('create-event', {
        body: eventPayload,
        headers: {
          Authorization: `Bearer ${authData.session?.access_token}`,
        },
      });

      if (response.error) {
        const errorContext = response.error.context;
        let errorMessage = 'Failed to create event';
        try {
          if (errorContext && typeof errorContext.json === 'function') {
            const errorBody = await errorContext.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch {
          // Use default message if parsing fails
        }
        return { success: false, error: errorMessage };
      }

      if (response.data && !response.data.success) {
        return { success: false, error: response.data.error || 'Failed to create event' };
      }

      // Post envelope: the events INSERT trigger (create_event_feed_post)
      // already writes posts(post_type='event', linked_entity, author =
      // organizer). Writing it here too would double-post.

      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({
      title: '', content: '', eventDate: undefined, eventTime: undefined,
      eventEndDate: undefined, eventEndTime: undefined, eventType: undefined,
      format: undefined, location: '', meetingUrl: '', mediaUrl: undefined,
      maxAttendees: undefined, subtitle: '', agenda: [], dressCode: undefined, tags: [],
      timezone: undefined,
    }),
    successMessage: 'Event created!',
    errorMessage: "We couldn't create this Event. Your details are safe\u2014please try again.",
  },

  space: {
    label: 'Start a Collaboration',
    shortLabel: 'Start',
    submitLabel: 'Create Space',
    submittingLabel: 'Creating...',
    icon: 'MateMasie',
    accentColor: '#2D5A3D',
    accentClass: 'bg-bevel-space',
    hoverClass: 'hover:bg-bevel-space/90',
    glowClass: 'shadow-[0_0_12px_rgba(45,90,61,0.4)]',
    // SPACE COMPOSES INLINE (BD087 reversal). Same substrate service the
    // canonical /dna/collaborate creation page uses; the INSERT trigger seats
    // the author as lead. Then the post envelope shares it to the feed.
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Say what you are building';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const name =
        (data.title && data.title.trim()) ||
        data.content.trim().split('\n')[0].slice(0, 80);

      const roles = (data.skillsNeeded ?? []).map((r) => r.trim()).filter(Boolean);

      const created = await createSpace({
        name,
        createdBy: context.userId,
        spaceType: toSpaceType(data.spaceCategory),
        visibility: 'public',
        description: data.content,
        focusAreas: roles,
      });

      // Post envelope \u2014 the Space is shared to the feed as post_type='space'.
      await createFeedPost({
        authorId: context.userId,
        postType: 'space',
        content: data.content,
        linkedEntityType: 'space',
        linkedEntityId: created.id,
        spaceId: created.id,
        mediaUrl: data.mediaUrl,
      });

      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({
      title: '', content: '', spaceCategory: undefined,
      visibility: 'public', mediaUrl: undefined, skillsNeeded: [],
    }),
    successMessage: 'Space created and shared to your feed.',
    errorMessage: "We couldn't create this Space. Your details are safe\u2014please try again.",
  },

  need: {
    label: 'Offer or Ask',
    shortLabel: 'Contribute',
    submitLabel: 'Post',
    submittingLabel: 'Posting...',
    icon: 'Gift',
    accentColor: '#B87333',
    accentClass: 'bg-bevel-opportunity',
    hoverClass: 'hover:bg-bevel-opportunity/90',
    glowClass: 'shadow-[0_0_12px_rgba(184,115,51,0.4)]',
    // BD084: the give \u2192 to \u2192 impact triple. The impact is what makes someone
    // act \u2014 DIA extracts it, the fields invite it, but only the body gates
    // the button (BD085 rebuild).
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Say what you can give, or what you need';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const direction = data.direction ?? 'need';
      const title =
        (data.giveWhat && data.giveWhat.trim()) ||
        data.content.trim().slice(0, 80) ||
        'Opportunity';

      // The columns exist (BD084 verified, 17/17). Write the triple.
      const { data: row, error } = await supabase
        .from('opportunities')
        .insert([{
          created_by: context.userId,
          title,
          description: data.content,
          direction,
          category: data.category ?? null,
          give_what: data.giveWhat ?? null,
          give_to: data.giveTo ?? null,
          intended_impact: data.intendedImpact ?? null,
          related_space_id: context.relatedSpaceId ?? null,
          audience: 'public',
        }])
        .select('id')
        .single();

      if (error || !row) {
        return { success: false, error: error?.message || 'Failed to post opportunity' };
      }

      // Post envelope (BD085 submit table): the opportunity also lands in the
      // feed as post_type='need' with the linked entity. Non-fatal \u2014 the
      // opportunity exists even if the envelope write fails.
      try {
        await createFeedPost({
          authorId: context.userId,
          postType: 'need',
          content: data.content,
          linkedEntityType: 'need',
          linkedEntityId: row.id,
          spaceId: context.spaceId,
          mediaUrl: data.mediaUrl,
        });
      } catch {
        // Envelope is best-effort; the substrate write already succeeded.
      }

      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({
      content: '', direction: 'need', category: undefined,
      giveWhat: '', giveTo: '', intendedImpact: '',
    }),
    successMessage: 'Opportunity posted!',
    errorMessage: "We couldn't post this. Your details are safe\u2014please try again.",
  },
};

/**
 * Get the handler for a specific mode
 */
export function getModeHandler(mode: ComposerMode): ModeHandler {
  return MODE_HANDLERS[mode];
}
