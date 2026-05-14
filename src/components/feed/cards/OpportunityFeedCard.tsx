/**
 * Opportunity Card for Universal Feed
 * 
 * Displays needs and offers in the feed with copper bevel.
 * Uses FeedCardBase for consistent DNA Design System styling.
 * Features the Four Currencies metadata grid.
 */

import React from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, DollarSign, Clock, Users, BookOpen, MapPin, Calendar, Heart, MessageCircle, Share2, Bookmark, HandHeart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { linkifyContent } from '@/utils/linkifyContent';
import { cn } from '@/lib/utils';
import { Adinkrahene } from '@/components/icons/adinkra';

interface OpportunityFeedCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
}

const currencyConfig = {
  money: { icon: DollarSign, label: 'Money', emoji: '💰' },
  time: { icon: Clock, label: 'Time', emoji: '⏰' },
  network: { icon: Users, label: 'Network', emoji: '🤝' },
  knowledge: { icon: BookOpen, label: 'Knowledge', emoji: '📚' },
};

const categoryConfig: Record<string, { icon: string; label: string }> = {
  business: { icon: '💼', label: 'Business' },
  technology: { icon: '💻', label: 'Technology' },
  education: { icon: '📖', label: 'Education' },
  creative: { icon: '🎨', label: 'Creative' },
  legal: { icon: '⚖️', label: 'Legal' },
  finance: { icon: '📊', label: 'Finance' },
  marketing: { icon: '📢', label: 'Marketing' },
  operations: { icon: '⚙️', label: 'Operations' },
  other: { icon: '📌', label: 'Other' },
};

export const OpportunityFeedCard: React.FC<OpportunityFeedCardProps> = ({ 
  item, 
  currentUserId, 
  onUpdate 
}) => {
  const navigate = useNavigate();
  
  // Determine if need or offer based on post_type or metadata
  const isNeed = item.post_type === 'need' || (item as any).opportunity_type === 'need';
  const opportunityType = isNeed ? 'need' : 'offer';
  
  // Extract currencies from item metadata
  const currencies: string[] = (item as any).currencies || (item as any).currency_types || [];
  const category = (item as any).category || 'other';
  const location = (item as any).location_type || (item as any).location || 'remote';
  const urgency = (item as any).urgency;
  const deadline = (item as any).deadline;
  
  const categoryInfo = categoryConfig[category] || categoryConfig.other;

  return (
    <FeedCardBase 
      bevelType="opportunity"
      onClick={() => navigate(`/opportunities/${item.post_id}`)}
    >
      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs font-medium',
            isNeed 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          )}
        >
          {isNeed ? (
            <>
              <HandHeart className="h-3 w-3 mr-1" />
              NEED
            </>
          ) : (
            <>
              <Adinkrahene className="h-3 w-3 mr-1" />
              OFFER
            </>
          )}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {categoryInfo.icon} {categoryInfo.label}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2">
        {isNeed ? 'Seeking: ' : 'Offering: '}
        {item.title || item.content?.slice(0, 50)}
      </h3>

      {/* Description */}
      {item.content && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {linkifyContent(item.content)}
        </p>
      )}

      {/* Four Currencies Grid */}
      {currencies.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {currencies.map((currency) => {
            const config = currencyConfig[currency as keyof typeof currencyConfig];
            if (!config) return null;
            return (
              <div 
                key={currency}
                className="flex items-center gap-2 p-2 rounded-lg bg-dna-bevel-opportunity/10 border border-dna-bevel-opportunity/20"
              >
                <span className="text-lg">{config.emoji}</span>
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span className="capitalize">{location}</span>
        </div>
        {urgency && (
          <Badge 
            variant={urgency === 'urgent' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {urgency === 'urgent' ? '🔥 Urgent' : urgency === 'this-month' ? 'This Month' : 'Flexible'}
          </Badge>
        )}
        {deadline && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Due {new Date(deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{item.author_display_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{item.author_display_name || item.author_username}</span>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button 
        className="w-full bg-dna-bevel-opportunity hover:bg-dna-bevel-opportunity/90 text-white"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/opportunities/${item.post_id}`);
        }}
      >
        {isNeed ? 'Express Interest' : 'Learn More'}
      </Button>

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
