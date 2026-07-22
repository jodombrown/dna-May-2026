/**
 * DNA | FEED - Feed Writer Utilities
 * 
 * Central helpers for creating feed-compatible posts from all 5C actions.
 * Every surface-worthy action (event, space, need, story, community post) 
 * creates a corresponding post that appears in the universal feed.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FeedItemType, LinkedEntityType } from '@/types/feed';
import type { PostWithAuthor } from '@/types/posts';
import { logHighError } from '@/lib/errorLogger';
import { normalizeProseContent } from '@/utils/renderProse';


interface CreateFeedPostOptions {
  authorId: string;
  postType: FeedItemType;
  content: string;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  spaceId?: string;
  eventId?: string;
  mediaUrl?: string;
  privacyLevel?: 'public' | 'connections';
}

/**
 * Base function to create any feed post
 */
export async function createFeedPost(options: CreateFeedPostOptions) {
  const { error } = await supabase.from('posts').insert({
    author_id: options.authorId,
    post_type: options.postType,
    content: options.content,
    linked_entity_type: options.linkedEntityType || null,
    linked_entity_id: options.linkedEntityId || null,
    space_id: options.spaceId || null,
    event_id: options.eventId || null,
    image_url: options.mediaUrl || null,
    privacy_level: options.privacyLevel || 'public',
  });

  if (error) {
    throw error;
  }
}

/**
 * Create feed post for a new event
 */
export async function createEventPost(params: {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  authorId: string;
  spaceId?: string;
  imageUrl?: string;
}) {
  const content = `Created an event: ${params.eventTitle}`;
  
  await createFeedPost({
    authorId: params.authorId,
    postType: 'event',
    content,
    linkedEntityType: 'event',
    linkedEntityId: params.eventId,
    eventId: params.eventId,
    spaceId: params.spaceId,
    mediaUrl: params.imageUrl,
  });
}

/**
 * Create feed post for a new space/project
 */
export async function createSpacePost(params: {
  spaceId: string;
  spaceTitle: string;
  spaceDescription?: string;
  authorId: string;
  imageUrl?: string;
}) {
  const content = `Created a new space: ${params.spaceTitle}`;
  
  await createFeedPost({
    authorId: params.authorId,
    postType: 'space',
    content,
    linkedEntityType: 'space',
    linkedEntityId: params.spaceId,
    spaceId: params.spaceId,
    mediaUrl: params.imageUrl,
  });
}

/**
 * Create feed post for a contribution need or offer
 */
export async function createNeedPost(params: {
  needId: string;
  needTitle: string;
  needDescription?: string;
  needType: 'funding' | 'expertise' | 'resources' | 'volunteers' | 'partnership';
  authorId: string;
  spaceId: string;
}) {
  const typeLabel = params.needType === 'funding' ? 'funding' : 
                    params.needType === 'expertise' ? 'expertise' :
                    params.needType === 'volunteers' ? 'volunteers' :
                    params.needType === 'partnership' ? 'partnership' :
                    'resources';
  
  const content = `Looking for ${typeLabel}: ${params.needTitle}`;
  
  await createFeedPost({
    authorId: params.authorId,
    postType: 'need',
    content,
    linkedEntityType: 'need',
    linkedEntityId: params.needId,
    spaceId: params.spaceId,
  });
}

/**
 * Create feed post for a published story/article
 * NOW RETURNS the created post for optimistic injection
 */
export async function createStoryPost(params: {
  storyTitle: string;
  storyBody: string;
  storySubtitle?: string;
  storyType?: 'impact' | 'update' | 'spotlight' | 'photo_essay';
  authorId: string;
  spaceId?: string;
  eventId?: string;
  imageUrl?: string;
  galleryUrls?: string[];
}): Promise<any> {
  const { authorId, storyTitle, storyBody, storySubtitle, storyType, spaceId, eventId, imageUrl, galleryUrls } = params;

  try {
    // Insert story post with title and story_type
    const insertPayload = {
      author_id: authorId,
      title: storyTitle,
      subtitle: storySubtitle || null,
      content: storyBody,
      post_type: 'story',
      story_type: storyType || 'update',
      image_url: imageUrl || null,
      gallery_urls: galleryUrls || null,
      space_id: spaceId || null,
      event_id: eventId || null,
      privacy_level: 'public' as const,
      linked_entity_type: null,
      linked_entity_id: null,
    };

    // Debug logging removed for production

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select('id, author_id, title, subtitle, content, post_type, story_type, image_url, gallery_urls, created_at')
      .single();

    if (postError) {
      logHighError(postError, 'composer', 'createStoryPost failed', { params, insertPayload });
      throw postError;
    }

    if (!postData) {
      throw new Error('No data returned from insert');
    }

    // Fetch author profile separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', authorId)
      .single();

    if (profileError) {
      // Profile fetch failed - continue without author data
    }

    // Map to post shape for return
    const mapped = {
      post_id: postData.id,
      author_id: postData.author_id,
      title: postData.title,
      subtitle: postData.subtitle || undefined,
      content: postData.content,
      post_type: 'story',
      privacy_level: 'public',
      image_url: postData.image_url || undefined,
      created_at: postData.created_at,
      likes_count: 0,
      comments_count: 0,
      author_username: profileData?.username || '',
      author_full_name: profileData?.full_name || '',
      author_avatar_url: profileData?.avatar_url || undefined,
      user_has_liked: false,
      is_connection: false,
    };

    return mapped;
  } catch (err) {
    logHighError(err, 'composer', 'createStoryPost threw', params);
    throw err;
  }
}

/**
 * Create feed post for a community post
 * (Bridges community_posts into the universal feed)
 */
export async function createCommunityFeedPost(params: {
  communityPostId: string;
  content: string;
  authorId: string;
  communityId: string;
  mediaUrl?: string;
}) {
  await createFeedPost({
    authorId: params.authorId,
    postType: 'community_post',
    content: params.content,
    linkedEntityType: 'community_post',
    linkedEntityId: params.communityPostId,
    spaceId: params.communityId, // Communities map to space_id context
    mediaUrl: params.mediaUrl,
  });
}

/**
 * Create a reshare post with proper original_post_id reference
 */
export async function createResharePost(params: {
  originalPostId: string;
  authorId: string;
  commentary?: string;
}) {
  const { error } = await supabase.from('posts').insert({
    author_id: params.authorId,
    content: params.commentary || '',
    post_type: 'reshare',
    privacy_level: 'public',
    original_post_id: params.originalPostId,
    share_commentary: params.commentary || null,
  });

  if (error) {
    throw error;
  }
}

/**
 * Create a standard text/media post and return it
 */
export async function createStandardPost(params: {
  authorId: string;
  content: string;
  mediaUrl?: string;
  galleryUrls?: string[];
  privacyLevel?: 'public' | 'connections';
  spaceId?: string;
  eventId?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkThumbnail?: string;
  linkProviderName?: string;
}): Promise<PostWithAuthor> {
  const { authorId, content, mediaUrl, galleryUrls, spaceId, eventId, privacyLevel, linkUrl, linkTitle, linkDescription, linkThumbnail, linkProviderName } = params;

  try {
    // Build link_metadata object for video/link embeds
    const linkMetadata = linkUrl ? {
      embed_type: 'video',
      provider_name: linkProviderName || undefined,
      thumbnail_url: linkThumbnail || undefined,
      is_video: true,
    } : null;

    const cleanedGallery = Array.isArray(galleryUrls)
      ? galleryUrls.filter((u): u is string => typeof u === 'string' && u.length > 0)
      : [];

    // Insert the post with correct post_type value
    const insertPayload = {
      author_id: authorId,
      content: content.trim(),
      post_type: 'post', // Valid post_type per database constraint
      image_url: mediaUrl || null,
      gallery_urls: cleanedGallery.length ? cleanedGallery : null,
      space_id: spaceId || null,
      event_id: eventId || null,
      privacy_level: privacyLevel || 'public',
      link_url: linkUrl || null,
      link_title: linkTitle || null,
      link_description: linkDescription || null,
      link_metadata: linkMetadata,
    };

    // Debug logging removed for production

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select('id, author_id, content, post_type, image_url, gallery_urls, created_at, link_url, link_title, link_description, link_metadata')
      .single();

    if (postError) {
      logHighError(postError, 'composer', 'createStandardPost failed', { params, insertPayload });
      throw postError;
    }

    if (!postData) {
      throw new Error('No data returned from insert');
    }

    // Fetch author profile separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', authorId)
      .single();

    if (profileError) {
      // Profile fetch failed - continue without author data
    }

    // Map to PostWithAuthor shape
    const mapped: PostWithAuthor = {
      post_id: postData.id,
      author_id: postData.author_id,
      content: postData.content,
      post_type: 'text' as any,
      privacy_level: 'public',
      image_url: postData.image_url || undefined,
      gallery_urls: (postData as { gallery_urls?: string[] | null }).gallery_urls ?? null,
      created_at: postData.created_at,
      likes_count: 0,
      comments_count: 0,
      author_username: profileData?.username || '',
      author_full_name: profileData?.full_name || '',
      author_avatar_url: profileData?.avatar_url || undefined,
      user_has_liked: false,
      is_connection: false,
      link_url: postData.link_url || undefined,
      link_title: postData.link_title || undefined,
      link_description: postData.link_description || undefined,
      link_metadata: postData.link_metadata as any,
    };

    return mapped;
  } catch (err) {
    logHighError(err, 'composer', 'createStandardPost threw', params);
    throw err;
  }
}
