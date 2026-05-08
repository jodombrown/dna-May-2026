import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useRealtimeReactions } from '@/hooks/useRealtimeReactions';
import type { RealtimeReactionPayload, RealtimeLikePayload } from '@/hooks/useRealtimeReactions';

interface PostEngagement {
  [postId: string]: {
    likeCount: number;
    commentCount: number;
    reactions: RealtimeReactionPayload[];
    userHasLiked: boolean;
    userReactions: string[];
  };
}

interface SocialFeedContextType {
  engagement: PostEngagement;
  updatePostLike: (postId: string, isLiked: boolean, userId: string) => void;
  updatePostReaction: (postId: string, emoji: string, userId: string, action: 'add' | 'remove') => void;
  updateCommentCount: (postId: string, delta: number) => void;
  initializePost: (postId: string, initialData: Partial<PostEngagement[string]>) => void;
}

const SocialFeedContext = createContext<SocialFeedContextType | undefined>(undefined);

export const useSocialFeed = () => {
  const context = useContext(SocialFeedContext);
  if (!context) {
    throw new Error('useSocialFeed must be used within SocialFeedProvider');
  }
  return context;
};

interface SocialFeedProviderProps {
  children: ReactNode;
}

export const SocialFeedProvider: React.FC<SocialFeedProviderProps> = ({ children }) => {
  const [engagement, setEngagement] = useState<PostEngagement>({});

  // Initialize post engagement data
  const initializePost = useCallback((postId: string, initialData: Partial<PostEngagement[string]>) => {
    setEngagement(prev => ({
      ...prev,
      [postId]: {
        likeCount: 0,
        commentCount: 0,
        reactions: [],
        userHasLiked: false,
        userReactions: [],
        ...initialData
      }
    }));
  }, []);

  // Update post like status
  const updatePostLike = useCallback((postId: string, isLiked: boolean, userId: string) => {
    setEngagement(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        userHasLiked: isLiked,
        likeCount: Math.max(0, (prev[postId]?.likeCount || 0) + (isLiked ? 1 : -1))
      }
    }));
  }, []);

  // Update post reaction
  const updatePostReaction = useCallback((postId: string, emoji: string, userId: string, action: 'add' | 'remove') => {
    setEngagement(prev => {
      const currentPost = prev[postId] || { likeCount: 0, commentCount: 0, reactions: [], userHasLiked: false, userReactions: [] };
      
      if (action === 'add') {
        return {
          ...prev,
          [postId]: {
            ...currentPost,
            userReactions: [...(currentPost.userReactions || []), emoji],
            reactions: [...(currentPost.reactions || []), { 
              post_id: postId, 
              user_id: userId, 
              emoji, 
              id: `temp-${Date.now()}`, 
              created_at: new Date().toISOString() 
            }]
          }
        };
      } else {
        return {
          ...prev,
          [postId]: {
            ...currentPost,
            userReactions: (currentPost.userReactions || []).filter(r => r !== emoji),
            reactions: (currentPost.reactions || []).filter(r => !(r.emoji === emoji && r.user_id === userId))
          }
        };
      }
    });
  }, []);

  // Update comment count
  const updateCommentCount = useCallback((postId: string, delta: number) => {
    setEngagement(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        commentCount: Math.max(0, (prev[postId]?.commentCount || 0) + delta)
      }
    }));
  }, []);

  // Handle realtime reaction updates
  const handleReactionUpdate = useCallback((payload: RealtimeReactionPayload, event: 'INSERT' | 'DELETE') => {
    setEngagement(prev => {
      const currentPost = prev[payload.post_id] || { likeCount: 0, commentCount: 0, reactions: [], userHasLiked: false, userReactions: [] };
      
      if (event === 'INSERT') {
        return {
          ...prev,
          [payload.post_id]: {
            ...currentPost,
            reactions: [...(currentPost.reactions || []), payload]
          }
        };
      } else {
        return {
          ...prev,
          [payload.post_id]: {
            ...currentPost,
            reactions: (currentPost.reactions || []).filter(r => r.id !== payload.id)
          }
        };
      }
    });
  }, []);

  // Handle realtime like updates
  const handleLikeUpdate = useCallback((payload: RealtimeLikePayload, event: 'INSERT' | 'DELETE') => {
    setEngagement(prev => {
      const currentPost = prev[payload.post_id] || { likeCount: 0, commentCount: 0, reactions: [], userHasLiked: false, userReactions: [] };
      
      return {
        ...prev,
        [payload.post_id]: {
          ...currentPost,
          likeCount: Math.max(0, (currentPost.likeCount || 0) + (event === 'INSERT' ? 1 : -1))
        }
      };
    });
  }, []);

  // Scope realtime to the posts this provider is currently tracking.
  // Without this scope every reaction platform-wide invalidated every session.
  const trackedPostIds = useMemo(() => Object.keys(engagement), [engagement]);

  useRealtimeReactions({
    postIds: trackedPostIds,
    onReactionUpdate: handleReactionUpdate,
    onLikeUpdate: handleLikeUpdate
  });

  return (
    <SocialFeedContext.Provider value={{
      engagement,
      updatePostLike,
      updatePostReaction,
      updateCommentCount,
      initializePost
    }}>
      {children}
    </SocialFeedContext.Provider>
  );
};