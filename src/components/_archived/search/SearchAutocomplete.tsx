import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Users, Calendar, Building2, MessageSquare, Clock, TrendingUp, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { MateMasie } from '@/components/icons/adinkra';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'profile' | 'community' | 'event' | 'post' | 'suggestion' | 'recent';
  icon: React.ReactNode;
  subtitle?: string;
  count?: number;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for people, events, communities...",
  className = "",
  disabled = false,
  recentSearches = [],
  onClearRecent
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedValue = useDebounce(value, 300);

  // Popular search terms
  const popularSearches = [
    'Technology professionals',
    'Investment opportunities', 
    'African entrepreneurs',
    'Renewable energy',
    'Fintech startups',
    'Healthcare innovation',
    'Educational initiatives',
    'Cultural events'
  ];

  // Fetch AI-powered suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Call AI search for smart suggestions
      const { data: aiSuggestions } = await supabase.functions.invoke('ai-search', {
        body: { query, userId: null, suggestionsOnly: true }
      });

      // Get real-time database matches
      const [profilesResult, communitiesResult, eventsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, display_name, professional_role')
          .or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%,professional_role.ilike.%${query}%`)
          .eq('is_public', true)
          .limit(3),
        
        supabase
          .from('communities')
          .select('id, name, category')
          .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(3),
          
        supabase
          .from('events')
          .select('id, title, event_type')
          .or(`title.ilike.%${query}%,event_type.ilike.%${query}%`)
          .eq('is_cancelled', false)
          .gte('start_time', new Date().toISOString())
          .limit(3)
      ]);

      const newSuggestions: SearchSuggestion[] = [];

      // Add AI-powered suggestions first
      if (aiSuggestions?.suggestions) {
        aiSuggestions.suggestions.slice(0, 3).forEach((suggestion: string) => {
          newSuggestions.push({
            id: `ai-${suggestion}`,
            text: suggestion,
            type: 'suggestion',
            icon: <MateMasie className="w-4 h-4 text-dna-emerald" />,
            subtitle: 'AI suggestion'
          });
        });
      }

      // Add profile matches
      if (profilesResult.data) {
        profilesResult.data.forEach(profile => {
          newSuggestions.push({
            id: `profile-${profile.id}`,
            text: profile.display_name || profile.full_name || 'Unknown',
            type: 'profile',
            icon: <Users className="w-4 h-4 text-blue-600" />,
            subtitle: profile.professional_role || 'DNA Member'
          });
        });
      }

      // Add community matches
      if (communitiesResult.data) {
        communitiesResult.data.forEach(community => {
          newSuggestions.push({
            id: `community-${community.id}`,
            text: community.name,
            type: 'community',
            icon: <Building2 className="w-4 h-4 text-green-600" />,
            subtitle: `${community.category} community`
          });
        });
      }

      // Add event matches
      if (eventsResult.data) {
        eventsResult.data.forEach(event => {
          newSuggestions.push({
            id: `event-${event.id}`,
            text: event.title,
            type: 'event',
            icon: <Calendar className="w-4 h-4 text-copper-600" />,
            subtitle: `${event.event_type} event`
          });
        });
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      // Fallback to simple text suggestions
      const fallbackSuggestions = popularSearches
        .filter(term => term.toLowerCase().includes(query.toLowerCase()))
        .map(term => ({
          id: `fallback-${term}`,
          text: term,
          type: 'suggestion' as const,
          icon: <Search className="w-4 h-4 text-neutral-500" />,
          subtitle: 'Popular search'
        }));
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  // Effect for debounced search
  useEffect(() => {
    if (debouncedValue) {
      fetchSuggestions(debouncedValue);
    } else if (isOpen) {
      // Show recent searches and popular terms when input is empty
      const recentSuggestions: SearchSuggestion[] = recentSearches.map(search => ({
        id: `recent-${search}`,
        text: search,
        type: 'recent',
        icon: <Clock className="w-4 h-4 text-neutral-400" />,
        subtitle: 'Recent search'
      }));

      const popularSuggestions: SearchSuggestion[] = popularSearches.slice(0, 5).map(search => ({
        id: `popular-${search}`,
        text: search,
        type: 'suggestion',
        icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
        subtitle: 'Popular search'
      }));

      setSuggestions([...recentSuggestions, ...popularSuggestions]);
    }
  }, [debouncedValue, isOpen, recentSearches]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else if (value.trim()) {
          onSearch(value);
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

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-4 py-3 text-base border-neutral-200 focus:border-dna-emerald focus:ring-dna-emerald"
          disabled={disabled}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-dna-emerald border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg border-neutral-200">
          <CardContent className="p-0">
            {/* Recent Searches Header */}
            {!value && recentSearches.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b bg-neutral-50">
                <span className="text-sm font-medium text-neutral-700">Recent Searches</span>
                {onClearRecent && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClearRecent}
                    className="text-neutral-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Suggestions List */}
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    index === highlightedIndex 
                      ? 'bg-dna-emerald/10 border-l-2 border-dna-emerald' 
                      : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex-shrink-0">
                    {suggestion.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-neutral-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>

                  {suggestion.type === 'suggestion' && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.subtitle}
                    </Badge>
                  )}

                  {suggestion.count && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Popular Searches Footer */}
            {!value && suggestions.length > 0 && (
              <div className="border-t bg-neutral-50 p-3">
                <span className="text-sm text-neutral-700">
                  💡 Try searching with natural language: "Find renewable energy investors in Nigeria"
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchAutocomplete;