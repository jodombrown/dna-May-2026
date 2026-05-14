/**
 * DNA | Profile — Recent Posts Preview
 * Shows 3 most recent CONVEY posts as small preview cards.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ProfileRecentPostsProps {
  userId: string;
  username?: string;
}

export const ProfileRecentPosts: React.FC<ProfileRecentPostsProps> = ({ userId, username }) => {
  const navigate = useNavigate();

  const { data: posts } = useQuery({
    queryKey: ['profile-recent-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, post_type, story_type, created_at, slug')
        .eq('author_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!posts || posts.length === 0) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'story': return 'bg-copper-100 text-copper-800 dark:bg-copper-900 dark:text-copper-200';
      case 'update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'impact': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
            onClick={() => navigate(`/dna/story/${post.slug || post.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{post.title || 'Untitled'}</span>
                <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${getTypeColor(post.story_type || post.post_type || 'post')}`}>
                  {post.story_type || post.post_type || 'post'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-2 shrink-0" />
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-dna-emerald hover:text-dna-emerald/80 text-xs"
        onClick={() => navigate(username ? `/dna/${username}` : '/dna/convey')}
      >
        See all posts <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
};
