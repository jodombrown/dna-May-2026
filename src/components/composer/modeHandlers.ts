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
  createStandardPost,
  createStoryPost,
  createCommunityFeedPost,
} from '@/lib/feedWriter';
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

// ============================================================
// Mode Handlers
// ============================================================

export const MODE_HANDLERS: Record<ComposerMode, ModeHandler> = {
  post: {
    label: 'Share a Post',
    shortLabel: 'Share',
    submitLabel: 'Share',
    submittingLabel: 'Sharing...',
    icon: 'MessageSquare',
    accentColor: '#4A8D77',
    accentClass: 'bg-[#4A8D77]',
    hoverClass: 'hover:bg-[#3d7a66]',
    glowClass: 'shadow-[0_0_12px_rgba(74,141,119,0.4)]',
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Write something to share';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const post = await createStandardPost({
        authorId: context.userId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        galleryUrls: data.galleryUrls,
        spaceId: context.spaceId,
        eventId: context.eventId,
        linkUrl: data.linkUrl,
        linkTitle: data.linkTitle,
        linkDescription: data.linkDescription,
        linkThumbnail: data.linkThumbnail,
        linkProviderName: data.linkProviderName,
      });

      const createdPost = buildUniversalFeedItemForPost(post, data, context);
      return { success: true, createdPost };
    },
    getDefaultValues: () => ({ content: '', mediaUrl: undefined, galleryUrls: [] }),
    successMessage: 'Post shared!',
    errorMessage: "We couldn't publish this post. Your text is safe\u2014please try again.",
  },

  story: {
    label: 'Tell a Story',
    shortLabel: 'Tell',
    submitLabel: 'Publish',
    submittingLabel: 'Publishing...',
    icon: 'BookOpen',
    accentColor: '#2A7A8C',
    accentClass: 'bg-[#2A7A8C]',
    hoverClass: 'hover:bg-[#236879]',
    glowClass: 'shadow-[0_0_12px_rgba(42,122,140,0.4)]',
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.title || data.title.trim().length === 0) {
        errors.title = 'Give your story a title';
      }
      if (!data.content || data.content.trim().length < 400) {
        errors.content = 'Stories need at least 400 characters';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      const story = await createStoryPost({
        authorId: context.userId,
        storyTitle: data.title,
        storyBody: data.content,
        storySubtitle: data.subtitle,
        storyType: data.storyType || 'update',
        imageUrl: data.heroImage || data.mediaUrl,
        galleryUrls: data.galleryUrls,
        spaceId: context.spaceId,
        eventId: context.eventId,
      });

      const createdPost = buildUniversalFeedItemForStory(story, data, context);
      return { success: true, createdPost };
    },
    getDefaultValues: () => ({ title: '', content: '', subtitle: '', heroImage: undefined, storyType: undefined, galleryUrls: [] }),
    successMessage: 'Story published!',
    errorMessage: "We couldn't publish this Story. Your content is safe\u2014please try again.",
  },

  event: {
    label: 'Host an Event',
    shortLabel: 'Host',
    submitLabel: 'Create Event',
    submittingLabel: 'Creating...',
    icon: 'Calendar',
    accentColor: '#C4942A',
    accentClass: 'bg-[#C4942A]',
    hoverClass: 'hover:bg-[#a87e24]',
    glowClass: 'shadow-[0_0_12px_rgba(196,148,42,0.4)]',
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.title || data.title.trim().length < 10) {
        errors.title = 'Event title must be at least 10 characters';
      }
      if (!data.eventDate) {
        errors.eventDate = 'When does it start?';
      }
      if (!data.eventEndDate && !data.eventEndTime) {
        errors.eventEndDate = 'When does it end?';
      }
      if (data.eventDate && data.eventEndDate) {
        const startStr = data.eventTime
          ? `${data.eventDate}T${data.eventTime}:00`
          : `${data.eventDate}T12:00:00`;
        const endStr = data.eventEndTime
          ? `${data.eventEndDate}T${data.eventEndTime}:00`
          : `${data.eventEndDate}T13:00:00`;
        if (new Date(startStr) >= new Date(endStr)) {
          errors.eventEndDate = 'End time must be after start time';
        }
      }
      if (data.eventDate) {
        const startStr = data.eventTime
          ? `${data.eventDate}T${data.eventTime}:00`
          : `${data.eventDate}T23:59:00`;
        if (new Date(startStr) <= new Date()) {
          errors.eventDate = 'Event must be in the future';
        }
      }
      if (!data.content || data.content.trim().length < 50) {
        errors.content = 'Tell people what to expect (at least 50 characters)';
      }
      const format = data.format || 'in_person';
      if ((format === 'in_person' || format === 'hybrid') && !data.location) {
        errors.location = 'Where is it happening?';
      }
      if ((format === 'virtual' || format === 'hybrid') && !data.meetingUrl) {
        errors.meetingUrl = 'Add a meeting link';
      }
      if (data.maxAttendees !== undefined && data.maxAttendees !== null) {
        if (!Number.isInteger(data.maxAttendees) || data.maxAttendees < 1) {
          errors.maxAttendees = 'Capacity must be at least 1';
        } else if (data.maxAttendees > 100000) {
          errors.maxAttendees = 'Capacity is too large (max 100,000)';
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

      const eventPayload = {
        title: data.title || '',
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
    label: 'Start a Space',
    shortLabel: 'Start',
    submitLabel: 'Launch Space',
    submittingLabel: 'Launching...',
    icon: 'MateMasie',
    accentColor: '#2D5A3D',
    accentClass: 'bg-[#2D5A3D]',
    hoverClass: 'hover:bg-[#244a32]',
    glowClass: 'shadow-[0_0_12px_rgba(45,90,61,0.4)]',
    // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
    validate: () => ({ isValid: true, errors: {} }),
    submit: async () => {
      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({
      title: '', content: '', spaceCategory: undefined,
      visibility: 'public', mediaUrl: undefined,
    }),
    successMessage: 'Spaces are being rebuilt \u2014 coming soon.',
    errorMessage: 'Spaces are being rebuilt \u2014 coming soon.',
  },

  need: {
    label: 'Post an Opportunity',
    shortLabel: 'Post',
    submitLabel: 'Post Opportunity',
    submittingLabel: 'Posting...',
    icon: 'Lightbulb',
    accentColor: '#B87333',
    accentClass: 'bg-[#B87333]',
    hoverClass: 'hover:bg-[#9e632c]',
    glowClass: 'shadow-[0_0_12px_rgba(184,115,51,0.4)]',
    // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
    validate: () => ({ isValid: true, errors: {} }),
    submit: async () => {
      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({
      title: '', content: '', needType: undefined,
      targetAmount: undefined, currency: undefined, neededBy: undefined,
    }),
    successMessage: 'Opportunities are being rebuilt \u2014 coming soon.',
    errorMessage: 'Opportunities are being rebuilt \u2014 coming soon.',
  },

  community: {
    label: 'Community Post',
    shortLabel: 'Community',
    submitLabel: 'Share to Community',
    submittingLabel: 'Sharing...',
    icon: 'Users',
    accentColor: '#4A8D77',
    accentClass: 'bg-[#4A8D77]',
    hoverClass: 'hover:bg-[#3d7a66]',
    glowClass: 'shadow-[0_0_12px_rgba(74,141,119,0.4)]',
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.content || data.content.trim().length === 0) {
        errors.content = 'Write something to share';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    submit: async (data, context) => {
      if (!context.communityId) {
        return { success: false, error: 'Community ID required for community posts' };
      }

      const { data: communityPostData, error: communityError } = await supabase
        .from('community_posts')
        .insert({
          title: data.title,
          content: data.content,
          author_id: context.userId,
          community_id: context.communityId,
          media_url: data.mediaUrl,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      await createCommunityFeedPost({
        communityPostId: communityPostData.id,
        content: data.content,
        authorId: context.userId,
        communityId: context.communityId,
        mediaUrl: data.mediaUrl,
      });

      return { success: true, createdPost: null };
    },
    getDefaultValues: () => ({ title: '', content: '', mediaUrl: undefined }),
    successMessage: 'Shared to community!',
    errorMessage: "We couldn't share to this Community. Your post is safe\u2014please try again.",
  },
};

/**
 * Get the handler for a specific mode
 */
export function getModeHandler(mode: ComposerMode): ModeHandler {
  return MODE_HANDLERS[mode];
}
