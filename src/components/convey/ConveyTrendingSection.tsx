import { useNavigate } from 'react-router-dom';
import { TrendingUp, MessageCircle, Eye, ChevronRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTrendingStories, type TrendingStory } from '@/hooks/useTrendingStories';

interface ConveyTrendingSectionProps {
  onSeeAll?: () => void;
}

// Individual trending card
const TrendingCard = ({ 
  story, 
  rank, 
  isHero = false,
}: { 
  story: TrendingStory; 
  rank: number;
  isHero?: boolean;
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Use slug for readable URLs, fallback to id
    navigate(`/dna/story/${story.slug || story.id}`);
  };
  
  const getAuthorInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DN';
  };

  const getStoryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      impact: 'Impact Story',
      update: 'Update',
      spotlight: 'Spotlight',
      photo_essay: 'Photo Essay',
    };
    return labels[type] || 'Story';
  };
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden",
        "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        isHero ? "col-span-2 row-span-1 md:row-span-2 min-h-[240px] md:min-h-[400px]" : "min-h-[160px] md:min-h-[200px]"
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/40">
        {story.image_url && (
          <img 
            src={story.image_url} 
            alt={story.title} 
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>
      
      {/* Rank Number */}
      <div className={cn(
        "absolute top-3 left-3 font-black text-white/30",
        isHero ? "text-7xl md:text-8xl" : "text-4xl md:text-5xl"
      )}>
        {rank}
      </div>

      {/* Trending Score Badge */}
      {isHero && story.trending_score > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded-full">
          <Flame className="h-3 w-3" />
          <span className="text-xs font-bold">{Math.round(story.trending_score)}</span>
        </div>
      )}
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
        {/* Story Type Badge */}
        <Badge 
          variant="secondary" 
          className="w-fit mb-2 bg-primary/90 text-primary-foreground border-0 text-xs"
        >
          {getStoryTypeLabel(story.story_type)}
        </Badge>
        
        {/* Title - improved readability */}
        <h3 className={cn(
          "font-bold text-white leading-snug mb-2 group-hover:text-primary transition-colors",
          isHero ? "text-lg md:text-xl lg:text-2xl line-clamp-3" : "text-sm md:text-base line-clamp-2"
        )}>
          {story.title || story.content?.substring(0, isHero ? 120 : 60)}
          {!story.title && (story.content?.length || 0) > (isHero ? 120 : 60) && '...'}
        </h3>
        
        {/* Author + Engagement Row */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 md:h-7 md:w-7 border border-white/20">
              <AvatarImage src={story.author_avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-white text-xs">
                {getAuthorInitials(story.author_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs md:text-sm text-white/80 font-medium truncate max-w-[80px] md:max-w-[120px]">
              {story.author_name}
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 text-white/70">
            {story.reaction_count > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs md:text-sm">❤️</span>
                <span className="text-xs">{story.reaction_count}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-xs">{story.comment_count}</span>
            </div>
            {isHero && (
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="text-xs">{story.view_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const TrendingSkeleton = ({ isHero = false }: { isHero?: boolean }) => (
  <div className={cn(
    "rounded-lg bg-muted animate-pulse",
    isHero ? "col-span-2 row-span-1 md:row-span-2 min-h-[240px] md:min-h-[400px]" : "min-h-[160px] md:min-h-[200px]"
  )} />
);

export function ConveyTrendingSection({ onSeeAll }: ConveyTrendingSectionProps) {
  const { data: trendingStories, isLoading } = useTrendingStories(5);
  
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
          </div>
          <h2 className="text-lg font-bold">Trending</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TrendingSkeleton isHero />
          <TrendingSkeleton />
          <TrendingSkeleton />
        </div>
      </section>
    );
  }
  
  if (!trendingStories || trendingStories.length === 0) {
    // Show empty state or fallback
    return null;
  }
  
  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          </div>
          <h2 className="text-lg font-bold">Trending</h2>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            48H
          </Badge>
        </div>
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            See All Trending
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* BuzzFeed-style Grid: Hero + smaller cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {trendingStories[0] && (
          <TrendingCard 
            story={trendingStories[0]} 
            rank={1} 
            isHero 
          />
        )}
        {trendingStories.slice(1, 4).map((story, i) => (
          <TrendingCard 
            key={story.id} 
            story={story} 
            rank={i + 2} 
          />
        ))}
      </div>
    </section>
  );
}
