import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseHelpers';
import { ConveyItemType } from '@/types/conveyTypes';
import { useToast } from '@/hooks/use-toast';

interface CreateConveyItemData {
  type: ConveyItemType;
  title: string;
  subtitle?: string;
  body: string;
  visibility?: 'public' | 'members_only' | 'space_members_only';
  status?: 'draft' | 'published' | 'archived';
  space_id?: string;
  event_id?: string;
  image_url?: string;
  gallery_urls?: string[];
  story_type?: string;
}

/**
 * Creates a new story/update/impact post in the posts table.
 * This is the primary way to create CONVEY content.
 */
export function useCreateConveyItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateConveyItemData) => {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      // Add timestamp for uniqueness
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const postData = {
        author_id: user.user.id,
        title: data.title,
        subtitle: data.subtitle || null,
        content: data.body,
        post_type: data.type, // 'story', 'update', or 'impact'
        story_type: data.story_type || 'update',
        privacy_level: data.visibility === 'members_only' ? 'connections' : 'public',
        space_id: data.space_id || null,
        event_id: data.event_id || null,
        image_url: data.image_url || null,
        gallery_urls: data.gallery_urls || null,
        slug: uniqueSlug,
        is_deleted: false,
      };

      const { data: post, error } = await supabaseClient
        .from('posts')
        .insert(postData)
        .select(`
          id,
          slug,
          title,
          subtitle,
          content,
          post_type,
          story_type,
          privacy_level,
          space_id,
          event_id,
          created_at,
          author_id
        `)
        .single();

      if (error) throw error;

      // Return in a format compatible with existing consumers
      return {
        ...post,
        type: post.post_type,
        body: post.content,
        status: 'published',
        published_at: post.created_at,
        primary_space_id: post.space_id,
        primary_event_id: post.event_id,
      };
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['convey-feed'] });
      queryClient.invalidateQueries({ queryKey: ['space-convey-items'] });
      queryClient.invalidateQueries({ queryKey: ['event-convey-items'] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });

      toast({
        title: 'Story published',
        description: 'Your story is now live.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create story.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Checks for an existing draft impact story for a specific space/need combination.
 * Note: Drafts are not currently supported in the posts-based architecture,
 * so this now checks for any existing impact stories.
 */
export function useCheckExistingImpactDraft() {
  return useMutation({
    mutationFn: async ({ spaceId, needId }: { spaceId: string; needId: string }) => {
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check for existing impact stories linked to this space
      // Note: Posts table doesn't have need_id, so we check by space_id only
      const { data, error } = await supabaseClient
        .from('posts')
        .select('id, slug')
        .eq('post_type', 'impact')
        .eq('space_id', spaceId)
        .eq('author_id', user.user.id)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
