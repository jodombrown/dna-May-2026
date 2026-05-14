import { OptimizedImage } from '@/components/ui/optimized-image';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConveyStoryCard } from './ConveyStoryCard';
import type { UniversalFeedItem } from '@/types/feed';

interface ConveyCategorySectionProps {
  title: string;
  icon: React.ReactNode;
  stories: UniversalFeedItem[];
  color?: string;
  onSeeAll?: () => void;
  layout?: 'grid' | 'horizontal' | 'featured';
  className?: string;
}

// Loading skeleton for stories
const StorySkeleton = ({ variant = 'default' }: { variant?: 'default' | 'compact' }) => (
  <div className={cn(
    "rounded-lg bg-muted animate-pulse",
    variant === 'compact' ? "h-24" : "h-64"
  )} />
);

export function ConveyCategorySection({
  title,
  icon,
  stories,
  color = 'text-foreground',
  onSeeAll,
  layout = 'grid',
  className,
}: ConveyCategorySectionProps) {
  if (stories.length === 0) return null;
  
  return (
    <section className={cn("mb-8", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg bg-muted", color)}>
            {icon}
          </div>
          <h2 className={cn("text-lg font-bold", color)}>{title}</h2>
        </div>
        
        {onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-dna-gold font-medium transition-colors"
          >
            See All
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Content based on layout */}
      {layout === 'horizontal' && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {stories.map((story) => (
            <div key={story.post_id} className="w-[280px] shrink-0">
              <ConveyStoryCard story={story} variant="compact" />
            </div>
          ))}
        </div>
      )}
      
      {layout === 'featured' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories[0] && (
            <ConveyStoryCard story={stories[0]} variant="featured" />
          )}
          <div className="space-y-3">
            {stories.slice(1, 4).map((story) => (
              <ConveyStoryCard key={story.post_id} story={story} variant="compact" />
            ))}
          </div>
        </div>
      )}
      
      {layout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <ConveyStoryCard key={story.post_id} story={story} />
          ))}
        </div>
      )}
    </section>
  );
}

// Popular/Discussion prompt section (like BuzzFeed's "Join the Discussion")
export function ConveyDiscussionPrompt({
  question,
  replyCount,
  onAnswer,
}: {
  question: string;
  replyCount: number;
  onAnswer?: () => void;
}) {
  return (
    <div className="rounded-xl md:rounded-lg bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 p-4 md:p-5 border border-amber-200/50 dark:border-amber-800/30">
      <p className="text-xs font-semibold text-dna-gold uppercase tracking-wide mb-2">
        Join the Discussion
      </p>
      <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 leading-snug">
        {question}
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={onAnswer}
          className="px-4 py-2.5 bg-dna-gold text-white rounded-full text-sm font-medium hover:bg-dna-gold/90 transition-colors active:scale-95"
        >
          Add Your Answer
        </button>
        <span className="text-sm text-muted-foreground">
          {replyCount} replies →
        </span>
      </div>
    </div>
  );
}

// Mini card for sidebar - with proper navigation
export function ConveyMiniCard({ story }: { story: UniversalFeedItem }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Use slug for readable URLs, fallback to post_id
    navigate(`/dna/story/${story.slug || story.post_id}`);
  };
  
  return (
    <div 
      onClick={handleClick}
      className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
    >
      {story.media_url && (
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
          <OptimizedImage
            src={story.media_url}
            alt=""
            imageSize="thumb"
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-snug">
          {story.title || story.content?.substring(0, 60)}...
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {story.author_display_name}
        </p>
      </div>
    </div>
  );
}
