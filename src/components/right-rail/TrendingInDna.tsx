/**
 * TrendingInDna — clickable trending hashtags with follow toggle.
 * Click → navigate to hashtag feed.
 * Long press / star icon → toggle_trend_follow.
 */
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToggleTrendFollow, useTrendingInDna } from '@/hooks/useTrendingInDna';
import { cn } from '@/lib/utils';
import type { TrendingHashtag } from '@/types/right-rail';

const RANGE_OPTIONS: { value: '24h' | '7d' | '30d'; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const EVERGREEN_TOPICS = [
  'africarising',
  'diaspora',
  'investment',
  'growth',
  'infrastructure',
  'fintech',
];

export const TrendingInDna: React.FC = () => {
  const [range, setRange] = React.useState<'24h' | '7d' | '30d'>('24h');
  const { data: trending, isLoading } = useTrendingInDna(range, 8);

  return (
    <section
      aria-label="Trending in DNA"
      className="bg-card rounded-dna-xl shadow-dna-1 p-3.5 space-y-3"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-[hsl(var(--dna-copper)/0.12)]">
            <TrendingUp className="h-3.5 w-3.5 text-dna-copper" />
          </div>
          <h3 className="font-heritage text-sm font-semibold text-foreground">
            Trending in DNA
          </h3>
        </div>
        <div role="radiogroup" className="inline-flex rounded-full bg-muted p-0.5 text-[11px] font-medium">
          {RANGE_OPTIONS.map((o) => {
            const active = range === o.value;
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={active}
                onClick={() => setRange(o.value)}
                className={cn(
                  'px-2 py-0.5 rounded-full transition-colors',
                  active
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>
      ) : trending && trending.length > 0 ? (
        <ul className="space-y-1">
          {trending.map((tag, idx) => (
            <TrendRow key={tag.hashtag} tag={tag} rank={idx + 1} />
          ))}
        </ul>
      ) : (
        <EvergreenTopics />
      )}
    </section>
  );
};

const EvergreenTopics: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        Suggested topics
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EVERGREEN_TOPICS.map((tag) => (
          <button
            key={tag}
            onClick={() => navigate(`/dna/hashtag/${tag}`)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--dna-copper)/0.10)] text-dna-copper text-xs font-medium hover:bg-[hsl(var(--dna-copper)/0.18)] transition-colors min-h-[28px]"
          >
            <Hash className="h-3 w-3" />
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

const TrendRow: React.FC<{ tag: TrendingHashtag; rank: number }> = ({ tag, rank }) => {
  const navigate = useNavigate();
  const toggle = useToggleTrendFollow();
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavigate = () => navigate(`/dna/hashtag/${tag.hashtag}`);

  const handlePointerDown = () => {
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      toggle.mutate(tag.hashtag);
    }, 500);
  };
  const handlePointerUpOrLeave = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      handleNavigate();
    }
  };

  return (
    <li className="flex items-center justify-between gap-2 group">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={() => {
          if (longPressRef.current) {
            clearTimeout(longPressRef.current);
            longPressRef.current = null;
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          toggle.mutate(tag.hashtag);
        }}
        className="flex items-center gap-2 flex-1 min-w-0 text-left rounded-md px-1.5 py-1 hover:bg-muted/60 transition-colors min-h-[36px]"
      >
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-3">
          {rank}
        </span>
        <Hash className="h-3 w-3 text-dna-copper shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">
          {tag.hashtag}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto tabular-nums shrink-0">
          {tag.post_count} · {tag.unique_authors} ppl
        </span>
      </button>
      <button
        aria-label={tag.is_followed ? 'Unfollow trend' : 'Follow trend'}
        onClick={() => toggle.mutate(tag.hashtag)}
        className={cn(
          'p-1.5 rounded-full transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center',
          tag.is_followed
            ? 'text-dna-gold hover:bg-[hsl(var(--dna-gold)/0.10)]'
            : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-dna-gold hover:bg-muted'
        )}
      >
        <Star className={cn('h-3.5 w-3.5', tag.is_followed && 'fill-current')} />
      </button>
    </li>
  );
};
