/**
 * Space Card for Universal Feed
 * 
 * Displays space/project announcements in the feed with purple bevel.
 * Uses FeedCardBase for consistent DNA Design System styling.
 */

import React from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Heart, MessageCircle, Share2, Bookmark, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { linkifyContent } from '@/utils/linkifyContent';
import { cn } from '@/lib/utils';
import { FuntunfunefuDenkyemfunefu } from '@/components/icons/adinkra';

interface SpaceCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
}

const spaceTypeConfig = {
  startup: { icon: '🚀', label: 'Startup', color: 'bg-copper-100 text-copper-700' },
  community: { icon: '🌍', label: 'Community', color: 'bg-green-100 text-green-700' },
  creative: { icon: '🎨', label: 'Creative', color: 'bg-copper-100 text-copper-700' },
  mentorship: { icon: '🎓', label: 'Mentorship', color: 'bg-blue-100 text-blue-700' },
  default: { icon: '📁', label: 'Project', color: 'bg-neutral-100 text-neutral-700' },
};

export const SpaceCard: React.FC<SpaceCardProps> = ({ item, currentUserId, onUpdate }) => {
  const navigate = useNavigate();
  const spaceType = (item as any).space_type || 'default';
  const config = spaceTypeConfig[spaceType as keyof typeof spaceTypeConfig] || spaceTypeConfig.default;
  const visibility = (item as any).visibility || 'public';

  return (
    <FeedCardBase 
      bevelType="space"
      onClick={() => item.space_id && navigate(`/dna/collaborate/spaces/${item.space_id}`)}
    >
      {/* Header with Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className={cn('text-xs font-medium', config.color)}>
          <FuntunfunefuDenkyemfunefu className="h-3 w-3 mr-1" />
          SPACE · {config.label}
        </Badge>
        {visibility === 'private' && (
          <Badge variant="secondary" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Badge>
        )}
      </div>

      {/* Author Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{item.author_display_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{item.author_display_name || item.author_username}</span>
            <span className="text-muted-foreground text-sm">created a space</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Space Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">{item.space_title || item.title}</h3>
          {item.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">{linkifyContent(item.content)}</p>
          )}
        </div>

        {item.media_url && (
          <img
            src={item.media_url}
            alt={item.space_title || 'Space'}
            className="w-full h-32 sm:h-48 object-cover rounded-lg"
          />
        )}

        {/* Space Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{item.view_count || 0} members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="capitalize">{visibility}</span>
          </div>
        </div>

        {/* CTA */}
        <Button 
          className="w-full bg-dna-bevel-space hover:bg-dna-bevel-space/90"
          onClick={(e) => {
            e.stopPropagation();
            item.space_id && navigate(`/dna/collaborate/spaces/${item.space_id}`);
          }}
        >
          View Space
        </Button>
      </div>

      {/* Engagement Footer */}
      <div className="flex items-center gap-4 pt-4 mt-4 border-t">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Heart className={`h-4 w-4 ${item.has_liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{item.like_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>{item.comment_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span>{item.share_count}</span>
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto">
          <Bookmark className={`h-4 w-4 ${item.has_bookmarked ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </FeedCardBase>
  );
};
