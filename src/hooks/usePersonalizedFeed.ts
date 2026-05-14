/**
 * Hook for personalized "For You" feed
 * Uses ML-based scoring to show most relevant content
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PersonalizedPost {
  id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url: string | null;
  title: string | null;
  subtitle: string | null;
  content: string;
  post_type: string;
  privacy_level: string;
  image_url: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  space_id: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  user_has_bookmarked: boolean;
  personalization_score: number;
}

export const usePersonalizedFeed = (limit: number = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personalized-feed', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      // Personalized feed RPC not yet implemented - fall back to universal feed
      const { data, error } = await (supabase.rpc as any)('get_universal_feed', {
        p_viewer_id: user.id,
        p_tab: 'all',
        p_author_id: null,
        p_space_id: null,
        p_event_id: null,
        p_limit: limit,
        p_offset: 0,
        p_ranking_mode: 'top',
      });

      if (error) {
        throw error;
      }

      // Map universal feed response to personalized format
      // Exclude the viewer's own posts from "For You"
      return ((data as any[]) || [])
        .filter((item) => item.author_id !== user.id)
        .map((item) => ({
          ...item,
          personalization_score: 1.0, // Default score until ML is implemented
        })) as PersonalizedPost[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - personalized feed changes less frequently
  });
};
