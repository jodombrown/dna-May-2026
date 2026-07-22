import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConveyItemWithDetails, ConveyFilters } from '@/types/conveyTypes';

interface UseConveyFeedOptions extends ConveyFilters {
  page?: number;
  pageSize?: number;
}

/**
 * Fetches stories from the posts table for the CONVEY hub.
 * Stories are posts with post_type in ('story', 'update', 'impact').
 */
export function useConveyFeed(options: UseConveyFeedOptions = {}) {
  const {
    type,
    region,
    focusAreas,
    onlyMySpaces = false,
    authorId,
    page = 1,
    pageSize = 20,
  } = options;

  return useQuery({
    queryKey: ['convey-feed', { type, region, focusAreas, onlyMySpaces, authorId, page, pageSize }],
    queryFn: async () => {
      // Build base query for posts
      let query = supabase
        .from('posts')
        .select(`
          id,
          slug,
          title,
          subtitle,
          content,
          post_type,
          story_type,
          image_url,
          gallery_urls,
          author_id,
          space_id,
          event_id,
          created_at,
          updated_at,
          privacy_level
        `, { count: 'exact' })
        .eq('is_deleted', false)
        .in('post_type', ['story', 'update', 'impact'])
        .order('created_at', { ascending: false });

      // Apply type filter
      if (type) {
        query = query.eq('post_type', type);
      }

      // Restrict to one author (BD139: the filter that "My Stories" needed).
      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      // Apply "only my spaces" filter
      if (onlyMySpaces) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: mySpaces } = await supabase
            .from('space_members')
            .select('space_id')
            .eq('user_id', user.id);

          if (mySpaces && mySpaces.length > 0) {
            const spaceIds = mySpaces.map(sm => sm.space_id);
            query = query.in('space_id', spaceIds);
          } else {
            return { data: [], count: 0 };
          }
        }
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: posts, error, count } = await query;

      if (error) throw error;
      if (!posts || posts.length === 0) {
        return { data: [], count: 0 };
      }

      // Fetch author profiles separately
      const authorIds = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch spaces separately
      const spaceIds = [...new Set(posts.map(p => p.space_id).filter(Boolean))];
      let spaceMap = new Map();
      if (spaceIds.length > 0) {
        const { data: spaces } = await supabase
          .from('spaces')
          .select('id, name, tagline, slug, region')
          .in('id', spaceIds);
        spaceMap = new Map(spaces?.map(s => [s.id, s]) || []);
      }

      // Transform data to match ConveyItemWithDetails interface
      const transformedData: ConveyItemWithDetails[] = posts.map((post) => ({
        id: post.id,
        slug: post.slug || post.id,
        title: post.title || '',
        subtitle: post.subtitle,
        type: post.post_type as 'story' | 'update' | 'impact',
        status: 'published' as const,
        visibility: post.privacy_level === 'public' ? 'public' as const : 'members_only' as const,
        body: post.content,
        content: post.content,
        author_id: post.author_id,
        primary_space_id: post.space_id,
        primary_event_id: post.event_id,
        primary_need_id: null,
        primary_offer_id: null,
        primary_badge_id: null,
        focus_areas: null,
        region: spaceMap.get(post.space_id)?.region || null,
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.created_at,
        image_url: post.image_url,
        gallery_urls: post.gallery_urls,
        story_type: post.story_type,
        author: profileMap.get(post.author_id) || undefined,
        primary_space: spaceMap.get(post.space_id) || undefined,
      }));

      // Apply region filter client-side if specified
      let filteredData = transformedData;
      if (region) {
        filteredData = transformedData.filter(item =>
          item.region === region ||
          item.primary_space?.region === region
        );
      }

      return {
        data: filteredData,
        count: count || 0,
      };
    },
  });
}

/**
 * Fetches stories for a specific space from the posts table.
 */
export function useSpaceConveyItems(
  spaceId: string | undefined,
  options: { type?: string; limit?: number; offset?: number } = {}
) {
  const { type, limit = 20, offset = 0 } = options;

  return useQuery({
    queryKey: ['space-convey-items', spaceId, { type, limit, offset }],
    queryFn: async () => {
      if (!spaceId) return [];

      let query = supabase
        .from('posts')
        .select(`
          id,
          slug,
          title,
          subtitle,
          content,
          post_type,
          story_type,
          image_url,
          gallery_urls,
          author_id,
          space_id,
          event_id,
          created_at,
          updated_at
        `)
        .eq('is_deleted', false)
        .eq('space_id', spaceId)
        .in('post_type', ['story', 'update', 'impact'])
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('post_type', type);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: posts, error } = await query;

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Fetch author profiles
      const authorIds = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return posts.map((post) => ({
        id: post.id,
        slug: post.slug || post.id,
        title: post.title || '',
        subtitle: post.subtitle,
        type: post.post_type as 'story' | 'update' | 'impact',
        status: 'published' as const,
        visibility: 'public' as const,
        body: post.content,
        content: post.content,
        author_id: post.author_id,
        primary_space_id: post.space_id,
        primary_event_id: post.event_id,
        primary_need_id: null,
        primary_offer_id: null,
        primary_badge_id: null,
        focus_areas: null,
        region: null,
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.created_at,
        image_url: post.image_url,
        gallery_urls: post.gallery_urls,
        story_type: post.story_type,
        author: profileMap.get(post.author_id),
      })) as ConveyItemWithDetails[];
    },
    enabled: !!spaceId,
  });
}

/**
 * Fetches stories for a specific event from the posts table.
 */
export function useEventConveyItems(
  eventId: string | undefined,
  options: { limit?: number } = {}
) {
  const { limit = 5 } = options;

  return useQuery({
    queryKey: ['event-convey-items', eventId, { limit }],
    queryFn: async () => {
      if (!eventId) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          slug,
          title,
          subtitle,
          content,
          post_type,
          story_type,
          image_url,
          gallery_urls,
          author_id,
          space_id,
          event_id,
          created_at,
          updated_at
        `)
        .eq('is_deleted', false)
        .eq('event_id', eventId)
        .in('post_type', ['story', 'update', 'impact'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Fetch author profiles
      const authorIds = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return posts.map((post) => ({
        id: post.id,
        slug: post.slug || post.id,
        title: post.title || '',
        subtitle: post.subtitle,
        type: post.post_type as 'story' | 'update' | 'impact',
        status: 'published' as const,
        visibility: 'public' as const,
        body: post.content,
        content: post.content,
        author_id: post.author_id,
        primary_space_id: post.space_id,
        primary_event_id: post.event_id,
        primary_need_id: null,
        primary_offer_id: null,
        primary_badge_id: null,
        focus_areas: null,
        region: null,
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.created_at,
        image_url: post.image_url,
        gallery_urls: post.gallery_urls,
        story_type: post.story_type,
        author: profileMap.get(post.author_id),
      })) as ConveyItemWithDetails[];
    },
    enabled: !!eventId,
  });
}

/**
 * Fetches a single story by slug from the posts table.
 */
export function useConveyItemBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['convey-item', slug],
    queryFn: async () => {
      if (!slug) return null;

      // Check if slug looks like a UUID (for backward compatibility)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      let query = supabase
        .from('posts')
        .select(`
          id,
          slug,
          title,
          subtitle,
          content,
          post_type,
          story_type,
          image_url,
          gallery_urls,
          author_id,
          space_id,
          event_id,
          created_at,
          updated_at,
          privacy_level
        `)
        .eq('is_deleted', false)
        .in('post_type', ['story', 'update', 'impact']);

      // Query by slug or UUID
      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data: post, error } = await query.single();

      if (error) throw error;
      if (!post) return null;

      // Fetch author profile
      let author = null;
      if (post.author_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', post.author_id)
          .single();
        author = profile;
      }

      // Fetch space if exists
      let space = null;
      if (post.space_id) {
        const { data: spaceData } = await supabase
          .from('spaces')
          .select('id, name, tagline, slug, region')
          .eq('id', post.space_id)
          .single();
        space = spaceData;
      }

      // Fetch event if exists
      let event = null;
      if (post.event_id) {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, title, start_time, format')
          .eq('id', post.event_id)
          .single();
        event = eventData;
      }

      // Transform to ConveyItemWithDetails format
      return {
        id: post.id,
        slug: post.slug || post.id,
        title: post.title || '',
        subtitle: post.subtitle,
        type: post.post_type as 'story' | 'update' | 'impact',
        status: 'published' as const,
        visibility: post.privacy_level === 'public' ? 'public' as const : 'members_only' as const,
        body: post.content,
        content: post.content,
        author_id: post.author_id,
        primary_space_id: post.space_id,
        primary_event_id: post.event_id,
        primary_need_id: null,
        primary_offer_id: null,
        primary_badge_id: null,
        focus_areas: null,
        region: space?.region || null,
        created_at: post.created_at,
        updated_at: post.updated_at,
        published_at: post.created_at,
        image_url: post.image_url,
        gallery_urls: post.gallery_urls,
        story_type: post.story_type,
        author,
        primary_space: space,
        primary_event: event,
      } as ConveyItemWithDetails;
    },
    enabled: !!slug,
  });
}
