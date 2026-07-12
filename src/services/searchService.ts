import { supabase } from '@/integrations/supabase/client';

// Metadata types for different search result types
export interface ProfileMetadata {
  location?: string | null;
  role?: string | null;
}

export interface CommunityMetadata {
  category?: string | null;
  member_count?: number | null;
}

export interface EventMetadata {
  location?: string | null;
  date_time?: string | null;
  event_type?: string | null;
}

export interface PostMetadata {
  post_type?: string | null;
  author?: string | null;
  community?: string | null;
}

export type SearchMetadata = ProfileMetadata | CommunityMetadata | EventMetadata | PostMetadata;

export interface SearchResult {
  id: string;
  type: 'profile' | 'community' | 'event' | 'post';
  title: string;
  description?: string;
  avatar_url?: string;
  image_url?: string;
  created_at?: string;
  metadata?: SearchMetadata;
}

export interface GlobalSearchResult {
  query: string;
  searchType: string;
  results: Array<{
    title: string;
    description: string;
    url?: string;
    source: string;
    relevanceScore: number;
    type?: string;
  }>;
  suggestions: string[];
  totalResults: number;
  sources?: {
    database: number;
    web: number;
  };
}

// Global web search using Perplexity AI
export const globalSearch = async (query: string, searchType: string = 'web'): Promise<GlobalSearchResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('global-search', {
      body: { query, searchType }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('Failed to perform global search');
  }
};

export interface AISearchResult {
  intent: {
    query: string;
    semanticIntent?: string;
    confidence?: number;
    filters: {
      types: string[];
      location?: string;
      timeframe?: string;
      skills?: string[];
      categories?: string[];
      userIntent?: string;
    };
    expandedTerms: string[];
    suggestions: string[];
  };
  results: {
    profiles: SearchResult[];
    communities: SearchResult[];
    events: SearchResult[];
    posts: SearchResult[];
  };
  suggestions: string[];
}

export interface SearchFilters {
  types: string[];
  location?: string | {
    country?: string;
    city?: string;
    radius?: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  experienceLevel?: string[];
  availability?: string[];
  languages?: string[];
  sortBy?: string;
}

// AI-powered semantic search
export const aiSearch = async (query: string, userId?: string): Promise<AISearchResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-search', {
      body: { query, userId }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // Fallback to regular search
    const results = await searchContent(query);
    return {
      intent: {
        query,
        filters: { types: ['profile', 'community', 'event', 'post'] },
        expandedTerms: [query],
        suggestions: [`Find ${query} professionals`, `${query} communities`, `${query} events`]
      },
      results: {
        profiles: results.filter(r => r.type === 'profile'),
        communities: results.filter(r => r.type === 'community'),
        events: results.filter(r => r.type === 'event'),
        posts: results.filter(r => r.type === 'post')
      },
      suggestions: [`Find ${query} professionals`, `${query} communities`, `${query} events`]
    };
  }
};

export const searchContent = async (query: string, filters?: SearchFilters): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];
  
  if (!query.trim()) {
    return results;
  }

  const searchTerm = `%${query.toLowerCase()}%`;
  
  // Search profiles
  if (!filters?.types.length || filters.types.includes('profile')) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, bio, avatar_url, location, professional_role, created_at')
      .or(`full_name.ilike.${searchTerm},display_name.ilike.${searchTerm},bio.ilike.${searchTerm},professional_role.ilike.${searchTerm}`)
      .eq('is_public', true)
      .limit(10);

    if (!profilesError && profiles) {
      results.push(...profiles.map(profile => ({
        id: profile.id,
        type: 'profile' as const,
        title: profile.display_name || profile.full_name || 'Unknown User',
        description: profile.bio || profile.professional_role || 'DNA Community Member',
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        metadata: {
          location: profile.location,
          role: profile.professional_role
        }
      })));
    }
  }

  // Search communities
  if (!filters?.types.length || filters.types.includes('community')) {
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, description, category, image_url, member_count, created_at')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(10);

    if (!communitiesError && communities) {
      results.push(...communities.map(community => ({
        id: community.id,
        type: 'community' as const,
        title: community.name,
        description: community.description || `${community.category} community`,
        image_url: community.image_url,
        created_at: community.created_at,
        metadata: {
          category: community.category,
          member_count: community.member_count
        }
      })));
    }
  }

  // Search events
  if (!filters?.types.length || filters.types.includes('event')) {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, description, location_name, location_city, start_time, cover_image_url, created_at, event_type, is_cancelled')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location_name.ilike.${searchTerm},location_city.ilike.${searchTerm}`)
      .limit(10);

    if (!eventsError && events) {
      results.push(...events.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description || `${event.event_type} event`,
        image_url: event.cover_image_url,
        created_at: event.created_at,
        metadata: {
          location: event.location_name || event.location_city,
          date_time: event.start_time,
          event_type: event.event_type
        }
      })));
    }
  }

  // Search posts
  if (!filters?.types.length || filters.types.includes('post')) {
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id, title, content, created_at, post_type, author_id, community_id')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(10);

    if (!postsError && posts) {
      // Get author and community details separately
      const authorIds = [...new Set(posts.map(post => post.author_id))];
      const communityIds = [...new Set(posts.map(post => post.community_id))];

      const [authorsResult, communitiesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, display_name')
          .in('id', authorIds),
        supabase
          .from('communities')
          .select('id, name')
          .in('id', communityIds)
      ]);

      const authors = authorsResult.data || [];
      const communities = communitiesResult.data || [];

      results.push(...posts.map(post => {
        const author = authors.find(a => a.id === post.author_id);
        const community = communities.find(c => c.id === post.community_id);
        
        return {
          id: post.id,
          type: 'post' as const,
          title: post.title || 'Community Post',
          description: post.content?.substring(0, 150) + (post.content?.length > 150 ? '...' : ''),
          created_at: post.created_at,
          metadata: {
            post_type: post.post_type,
            author: author?.display_name || author?.full_name,
            community: community?.name
          }
        };
      }));
    }
  }

  return results.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
};

export const getPopularSearches = async (): Promise<string[]> => {
  // This could be enhanced with actual analytics data
  return [
    'Technology',
    'Investment opportunities',
    'Cultural events',
    'Networking',
    'Startup',
    'African diaspora',
    'Collaboration',
    'Mentorship'
  ];
};