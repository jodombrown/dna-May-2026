/**
 * Need Card for Universal Feed
 * 
 * Displays contribution needs and offers in the feed.
 */

import React from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HandHeart, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { linkifyContent } from '@/utils/linkifyContent';

interface NeedCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
}

export const NeedCard: React.FC<NeedCardProps> = ({ item, currentUserId, onUpdate }) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 hover:border-primary/20 transition-colors border-l-4 border-l-dna-orange">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{item.author_display_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{item.author_display_name || item.author_username}</span>
            <span className="text-muted-foreground text-sm">posted a need</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Need Content */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <HandHeart className="h-6 w-6 text-dna-orange flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium text-lg mb-2">{linkifyContent(item.content)}</p>
            {item.space_title && (
              <p className="text-sm text-muted-foreground">
                In space: <span className="text-foreground">{item.space_title}</span>
              </p>
            )}
          </div>
        </div>

        {item.media_url && (
          <img 
            src={item.media_url} 
            alt="Need" 
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        {/* CTA */}
        <Button 
          className="w-full bg-dna-orange hover:bg-dna-orange/90"
          onClick={() => navigate('/dna/contribute')}
        >
          Offer Help
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
    </Card>
  );
};
