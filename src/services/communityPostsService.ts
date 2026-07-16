import { supabase } from '@/integrations/supabase/client';
import { createCommunityFeedPost } from '@/lib/feedWriter';

// Helper function to trigger DIA prompt (calls 'dia-trigger-prompt' edge function)
const triggerDiaPrompt = async (userId: string, eventType: string) => {
  try {
    await supabase.functions.invoke('dia-trigger-prompt', {
      body: { user_id: userId, event_type: eventType }
    });
  } catch (error) {
    // Silently fail - non-blocking
  }
};

export interface CommunityPost {
  id: string;
  title?: string;
  content: string;
  author_id: string;
  community_id: string;
  post_type: string;
  is_pinned: boolean;
  media_url?: string;
  event_date?: string;
  event_location?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    full_name: string;
    display_name?: string;
    avatar_url?: string;
  };
  community?: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface CreateCommunityPostData {
  title?: string;
  content: string;
  community_id: string;
  post_type?: string;
  media_url?: string;
  event_date?: string;
  event_location?: string;
}

export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
  // First get the posts
  const { data: posts, error: postsError } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (postsError) {
    throw postsError;
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  // Get unique author and community IDs
  const authorIds = [...new Set(posts.map(post => post.author_id))];
  const communityIds = [...new Set(posts.map(post => post.community_id))];

  // Fetch authors and communities separately
  const [authorsResult, communitiesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .in('id', authorIds),
    supabase
      .from('communities')
      .select('id, name, category')
      .in('id', communityIds)
  ]);

  const authors = authorsResult.data || [];
  const communities = communitiesResult.data || [];

  // Combine the data
  const postsWithDetails = posts.map(post => ({
    ...post,
    author: authors.find(author => author.id === post.author_id),
    community: communities.find(community => community.id === post.community_id)
  }));

  return postsWithDetails as CommunityPost[];
};

export const createCommunityPost = async (postData: CreateCommunityPostData): Promise<CommunityPost> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: newPost, error } = await supabase
    .from('community_posts')
    .insert({
      ...postData,
      author_id: user.id,
      post_type: postData.post_type || 'update'
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  // Create feed post for community post using feedWriter
  try {
    await createCommunityFeedPost({
      communityPostId: newPost.id,
      content: postData.content,
      authorId: user.id,
      communityId: postData.community_id,
      mediaUrl: postData.media_url,
    });
  } catch (feedError) {
    // Don't fail the request if feed post creation fails
  }

  // Trigger DIA prompt for community post creation
  triggerDiaPrompt(user.id, 'community_post_created');

  // Fetch author and community details
  const [authorResult, communityResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .eq('id', newPost.author_id)
      .single(),
    supabase
      .from('communities')
      .select('id, name, category')
      .eq('id', newPost.community_id)
      .single()
  ]);

  return {
    ...newPost,
    author: authorResult.data,
    community: communityResult.data
  } as CommunityPost;
};

export const getUserCommunities = async (userId: string) => {
  const { data, error } = await supabase
    .from('community_memberships')
    .select('community_id')
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const communityIds = data.map(membership => membership.community_id);

  const { data: communities, error: communitiesError } = await supabase
    .from('communities')
    .select('id, name, category')
    .in('id', communityIds);

  if (communitiesError) {
    throw communitiesError;
  }

  return communities || [];
};