import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEventSearch, useTrendingEvents, type EventSearchFilters } from '@/hooks/convene/useEventSearch';
import { formatEventDateTime } from '@/lib/events/eventTime';
import { getEventStatus } from '@/utils/convene/getEventStatus';
import { ConveneEventBadge } from '@/components/convene/ConveneEventBadge';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'dna-convene-recent-searches';
const MAX_RECENT = 5;

const FILTER_CHIPS = [
  { key: 'format', value: 'virtual', label: 'Virtual' },
  { key: 'format', value: 'in_person', label: 'In-Person' },
  { key: 'timeRange', value: 'today', label: 'Today' },
  { key: 'timeRange', value: 'this_week', label: 'This Week' },
  { key: 'timeRange', value: 'this_month', label: 'This Month' },
] as const;

interface ConveneSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConveneSearchOverlay({ isOpen, onClose }: ConveneSearchOverlayProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EventSearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setFilters({});
    }
  }, [isOpen]);

  const { data: searchResults = [], isLoading: isSearching } = useEventSearch(searchTerm, filters);
  const { data: trendingEvents = [] } = useTrendingEvents();

  const hasActiveSearch = searchTerm.trim().length > 0 || Object.values(filters).some(v => v);

  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeRecentSearch = (term: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleEventClick = (eventId: string, slug: string | null) => {
    if (searchTerm.trim()) saveRecentSearch(searchTerm.trim());
    onClose();
    navigate(`/dna/convene/events/${slug || eventId}`);
  };

  const toggleFilter = (key: keyof EventSearchFilters, value: string) => {
    setFilters(prev => {
      const current = prev[key];
      if (current === value) {
        return { ...prev, [key]: null };
      }
      // Clear conflicting: if setting format, keep timeRange and vice versa
      return { ...prev, [key]: value };
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        {/* Search Header */}
        <div className="border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  saveRecentSearch(searchTerm.trim());
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--module-convene))]/30 border-0"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border">
          {FILTER_CHIPS.map(chip => {
            const isActive = filters[chip.key as keyof EventSearchFilters] === chip.value;
            return (
              <button
                key={`${chip.key}-${chip.value}`}
                onClick={() => toggleFilter(chip.key as keyof EventSearchFilters, chip.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-[hsl(var(--module-convene))] text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {hasActiveSearch ? (
            /* Search Results */
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}${searchTerm ? ` for "${searchTerm}"` : ''}`}
              </p>
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map(event => (
                    <SearchResultCard
                      key={event.id}
                      event={event}
                      onClick={() => handleEventClick(event.id, event.slug)}
                    />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-12">
                  <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No events found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term or browse categories
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* Empty State: Recent Searches + Trending */
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Recent Searches</h3>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map(term => (
                      <div
                        key={term}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                        onClick={() => setSearchTerm(term)}
                      >
                        <span className="text-sm">{term}</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trendingEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Upcoming Events</h3>
                  </div>
                  <div className="space-y-2">
                    {trendingEvents.map(event => (
                      <SearchResultCard
                        key={event.id}
                        event={event}
                        onClick={() => handleEventClick(event.id, event.slug)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Compact search result card ─────────────────────── */

interface SearchResultCardProps {
  event: EventPlaceInput & {
    id: string;
    title: string;
    slug: string | null;
    start_time: string;
    end_time: string;
    time_confirmed: boolean | null;
    cover_image_url: string | null;
    event_type: string;
    format: string;
    max_attendees: number | null;
    attendee_count: number;
    organizer?: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
  onClick: () => void;
}

function SearchResultCard({ event, onClick }: SearchResultCardProps) {
  const status = getEventStatus({
    start_time: event.start_time,
    end_time: event.end_time,
    max_attendees: event.max_attendees,
    attendee_count: event.attendee_count,
  });

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--module-convene))]/20 to-[hsl(var(--module-convene))]/5 flex items-center justify-center">
            <span className="text-lg">📅</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatEventDateTime(event, 'compact')}
        </p>
        {(formatEventPlace(event, 'compact') || event.location_name) && (
          <p className="text-xs text-muted-foreground">
            {event.format === 'virtual' ? '🌐' : '📍'}{' '}
            {formatEventPlace(event, 'compact') || event.location_name}
          </p>
        )}
      </div>

      {/* Status Badge */}
      {status && status.type !== 'free' && (
        <ConveneEventBadge status={status} />
      )}
    </div>
  );
}
