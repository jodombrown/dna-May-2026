import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, MapPin, Briefcase, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

interface SearchResult {
  id: string;
  type: 'person' | 'sector' | 'location';
  label: string;
  subtitle?: string;
  avatar_url?: string;
  count?: number;
  value: string; // for filtering
}

interface SearchTypeaheadProps {
  onFilterBySector?: (sector: string) => void;
  onFilterByLocation?: (location: string) => void;
  onFullSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchTypeahead({
  onFilterBySector,
  onFilterByLocation,
  onFullSearch,
  placeholder = 'Search members, sectors, locations...',
  className,
}: SearchTypeaheadProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2 || !user) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchLower = searchQuery.toLowerCase();
      const suggestions: SearchResult[] = [];

      // Query people, sectors, locations in parallel
      const [peopleResult, sectorResult, locationResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, headline')
          .eq('is_public', true)
          .neq('id', user.id)
          .or(`full_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(3),
        supabase
          .from('profiles')
          .select('industries')
          .eq('is_public', true)
          .not('industries', 'is', null),
        supabase
          .from('profiles')
          .select('location')
          .eq('is_public', true)
          .not('location', 'is', null),
      ]);

      // People results
      if (peopleResult.data) {
        peopleResult.data.forEach((p) => {
          suggestions.push({
            id: `person-${p.id}`,
            type: 'person',
            label: p.full_name || p.username || 'Member',
            subtitle: p.headline || undefined,
            avatar_url: p.avatar_url || undefined,
            value: p.id,
          });
        });
      }

      // Sector results - aggregate and count
      if (sectorResult.data) {
        const sectorCounts: Record<string, number> = {};
        sectorResult.data.forEach((p) => {
          const industries = p.industries as string[] | null;
          if (industries) {
            industries.forEach((ind: string) => {
              const normalized = ind.trim();
              if (normalized.toLowerCase().includes(searchLower)) {
                sectorCounts[normalized] = (sectorCounts[normalized] || 0) + 1;
              }
            });
          }
        });

        Object.entries(sectorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .forEach(([sector, count]) => {
            suggestions.push({
              id: `sector-${sector}`,
              type: 'sector',
              label: sector,
              subtitle: `${count} professional${count !== 1 ? 's' : ''}`,
              count,
              value: sector,
            });
          });
      }

      // Location results - aggregate and count
      if (locationResult.data) {
        const locationCounts: Record<string, number> = {};
        locationResult.data.forEach((p) => {
          const loc = (p.location as string)?.trim();
          if (loc && loc.toLowerCase().includes(searchLower)) {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          }
        });

        Object.entries(locationCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .forEach(([location, count]) => {
            suggestions.push({
              id: `location-${location}`,
              type: 'location',
              label: location,
              subtitle: `${count} member${count !== 1 ? 's' : ''}`,
              count,
              value: location,
            });
          });
      }

      setResults(suggestions);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'person') {
      // Find username from results data
      navigate(`/dna/${result.value}`);
    } else if (result.type === 'sector') {
      onFilterBySector?.(result.value);
    } else if (result.type === 'location') {
      onFilterByLocation?.(result.value);
    }
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        onFullSearch?.(query);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        } else if (query.trim()) {
          onFullSearch?.(query);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Group results by type
  const people = results.filter((r) => r.type === 'person');
  const sectors = results.filter((r) => r.type === 'sector');
  const locations = results.filter((r) => r.type === 'location');

  const getGlobalIndex = (type: string, localIndex: number) => {
    if (type === 'person') return localIndex;
    if (type === 'sector') return people.length + localIndex;
    return people.length + sectors.length + localIndex;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-9 bg-muted/50 border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all"
          aria-label="Search members"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto">
          {/* People */}
          {people.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Users className="h-3 w-3" /> People
              </div>
              {people.map((result, i) => (
                <div
                  key={result.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    highlightedIndex === getGlobalIndex('person', i)
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setHighlightedIndex(getGlobalIndex('person', i))}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {result.label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.label}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sectors */}
          {sectors.length > 0 && (
            <div className={people.length > 0 ? 'border-t border-border/50' : ''}>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> Sectors
              </div>
              {sectors.map((result, i) => (
                <div
                  key={result.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    highlightedIndex === getGlobalIndex('sector', i)
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setHighlightedIndex(getGlobalIndex('sector', i))}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{result.label}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {result.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div className={(people.length > 0 || sectors.length > 0) ? 'border-t border-border/50' : ''}>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Locations
              </div>
              {locations.map((result, i) => (
                <div
                  key={result.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    highlightedIndex === getGlobalIndex('location', i)
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setHighlightedIndex(getGlobalIndex('location', i))}
                >
                  <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{result.label}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {result.count}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* See all results */}
          {query.trim() && (
            <div
              className="border-t border-border/50 px-3 py-2.5 text-sm text-primary cursor-pointer hover:bg-muted/50 flex items-center gap-2"
              onClick={() => {
                onFullSearch?.(query);
                setIsOpen(false);
              }}
            >
              <Sankofa className="h-3.5 w-3.5" />
              See all results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchTypeahead;
