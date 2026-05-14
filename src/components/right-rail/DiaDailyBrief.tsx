/**
 * DiaDailyBrief — three personalized DIA cards with view tracking,
 * dismiss / not-interested / why-this, and CTA navigation.
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MoreHorizontal, RefreshCw, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDiaDailyBrief, useRecordBriefInteraction } from '@/hooks/useDiaDailyBrief';
import { MODULE_VISUALS } from './moduleVisuals';
import type { DiaBriefCard } from '@/types/right-rail';
import { MateMasie } from '@/components/icons/adinkra';

// Evergreen fallback cards — guarantee the brief is never empty.
const EVERGREEN_CARDS: DiaBriefCard[] = [
  {
    id: 'evergreen-connect',
    position: 1,
    c_module: 'connect',
    signal_type: 'network_growth',
    title: 'Grow your network in DNA',
    body: 'Discover diaspora professionals aligned with your sector and heritage.',
    cta_label: 'Find people',
    cta_route: '/dna/connect/discover',
    target_entity_type: null,
    target_entity_id: null,
    reasoning: 'A strong network multiplies every other action you take on DNA.',
    is_fallback: true,
  },
  {
    id: 'evergreen-convene',
    position: 2,
    c_module: 'convene',
    signal_type: 'evergreen_events',
    title: 'Upcoming gatherings in DNA',
    body: 'Browse events where the diaspora is showing up this month.',
    cta_label: 'See events',
    cta_route: '/dna/convene',
    target_entity_type: null,
    target_entity_id: null,
    reasoning: 'Showing up is how connections become collaborations.',
    is_fallback: true,
  },
  {
    id: 'evergreen-contribute',
    position: 3,
    c_module: 'contribute',
    signal_type: 'opportunity_match',
    title: 'Browse opportunities',
    body: 'See where your time, capital, or expertise can move the needle today.',
    cta_label: 'See opportunities',
    cta_route: '/dna/contribute',
    target_entity_type: null,
    target_entity_id: null,
    reasoning: 'Contribution is the engine of diaspora impact.',
    is_fallback: true,
  },
];

function withEvergreenFallback(cards: DiaBriefCard[] | undefined): DiaBriefCard[] {
  const real = cards ?? [];
  if (real.length >= 3) return real;
  const usedModules = new Set(real.map((c) => c.c_module));
  const filler = EVERGREEN_CARDS.filter((c) => !usedModules.has(c.c_module));
  return [...real, ...filler].slice(0, 3);
}
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export const DiaDailyBrief: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cards, isLoading, isFetching } = useDiaDailyBrief();
  const displayCards = withEvergreenFallback(cards);

  return (
    <section
      aria-label="DIA Daily Brief"
      className="bg-card rounded-dna-xl shadow-dna-1 p-3.5 space-y-3"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-full bg-[hsl(var(--dna-gold)/0.12)]">
            <MateMasie className="h-3.5 w-3.5 text-dna-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heritage text-sm font-semibold text-foreground">
              DIA Brief
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Today&apos;s three signals for you
            </p>
          </div>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['dia-daily-brief', user?.id ?? null] })}
          aria-label="Refresh brief"
          className="p-1 rounded-full hover:bg-muted text-muted-foreground"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-dna-md" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {displayCards.map((card) => (
            <BriefCardItem key={card.id} card={card} />
          ))}
        </ul>
      )}
    </section>
  );
};

// ── Card item ────────────────────────────────────────────────────────

const BriefCardItem: React.FC<{ card: DiaBriefCard }> = ({ card }) => {
  const navigate = useNavigate();
  const visual = MODULE_VISUALS[card.c_module];
  const record = useRecordBriefInteraction();
  const ref = useRef<HTMLLIElement>(null);
  const viewedRef = useRef(false);
  const isEvergreen = card.id.startsWith('evergreen-');

  // Mark "viewed" when card is first observed
  useEffect(() => {
    if (!ref.current || viewedRef.current || isEvergreen) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            record.mutate({ cardId: card.id, type: 'viewed' });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.6 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, isEvergreen]);

  const handleClick = () => {
    if (!isEvergreen) record.mutate({ cardId: card.id, type: 'clicked' });
    navigate(card.cta_route);
  };

  return (
    <li
      ref={ref}
      className="group relative rounded-dna-md border border-border/60 bg-background hover:bg-muted/40 transition-colors border-l-[3px]"
      style={{ borderLeftColor: `hsl(${visual.hsl})` }}
    >
      <div className="p-3 pr-8">
        {/* Module badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: `hsl(${visual.hsl} / 0.12)`,
              color: `hsl(${visual.hsl})`,
            }}
          >
            <visual.Icon className="h-2.5 w-2.5" />
            {visual.label}
          </span>
          {card.is_fallback && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Evergreen
            </span>
          )}
        </div>

        <button
          onClick={handleClick}
          className="text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dna-emerald rounded-sm"
        >
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {card.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {card.body}
          </p>
          <span className="inline-flex items-center gap-0.5 mt-2 text-xs font-medium text-dna-emerald group-hover:underline">
            {card.cta_label}
            <ChevronRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      {/* Overflow menu — hidden for client-side evergreen cards */}
      {!isEvergreen && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5">
          <Popover
            onOpenChange={(o) => {
              if (o) record.mutate({ cardId: card.id, type: 'why_this_opened' });
            }}
          >
            <PopoverTrigger asChild>
              <button
                aria-label="Why this card"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <MateMasie className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-60 text-xs p-3">
              <p className="font-semibold mb-1">Why DIA surfaced this</p>
              <p className="text-muted-foreground">{card.reasoning}</p>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Card options"
              className="p-1 rounded-full text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                onClick={() => record.mutate({ cardId: card.id, type: 'saved' })}
              >
                Save for later
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => record.mutate({ cardId: card.id, type: 'not_interested' })}
              >
                Not interested
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => record.mutate({ cardId: card.id, type: 'dismissed' })}
              >
                <X className="h-3 w-3 mr-1.5" />
                Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </li>
  );
};
