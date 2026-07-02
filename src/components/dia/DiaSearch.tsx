import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, Calendar, FolderKanban, Hash, ExternalLink, Loader2, AlertCircle, ArrowUpRight, BookOpen, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { NetworkMatchType } from '@/config/dia-pillar-config';
import DiaProfileCard from './DiaProfileCard';
import DiaStoryCard from './DiaStoryCard';
import DiaHashtagChip from './DiaHashtagChip';
import DiaOpportunityCard from './DiaOpportunityCard';
import type { ContributionNeedType } from '@/types/contributeTypes';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaResponse {
  success: boolean;
  data: {
    answer: string;
    citations: string[];
    network_matches: {
      profiles: Array<{
        id: string;
        full_name: string;
        headline: string;
        avatar_url: string;
        relevance: string;
        location?: string;
        skills?: string[];
      }>;
      events: Array<{
        id: string;
        title: string;
        start_date: string;
        relevance: string;
      }>;
      projects: Array<{
        id: string;
        name: string;
        status: string;
        relevance: string;
      }>;
      hashtags: Array<{
        id: string;
        name: string;
        post_count: number;
        trending?: boolean;
      }>;
      stories?: Array<{
        id: string;
        title: string;
        excerpt: string;
        author: {
          id: string;
          name: string;
          avatar_url?: string;
        };
        published_at: string;
        view_count: number;
        like_count: number;
        hashtags: string[];
        cover_image?: string;
      }>;
      opportunities?: Array<{
        id: string;
        title: string;
        type: ContributionNeedType;
        space_name?: string;
        region?: string;
        focus_areas?: string[];
        relevance: string;
        match_score?: number;
      }>;
    };
    cached: boolean;
  };
  usage: {
    queries_used: number;
    queries_limit: number;
    queries_remaining: number;
  };
  response_time_ms: number;
  error?: string;
  message?: string;
  limit?: number;
  used?: number;
  resets_at?: string;
}

interface DiaSearchProps {
  source?: string;
  placeholder?: string;
  compact?: boolean;
  suggestions?: string[];
  initialQuery?: string;
  autoSearch?: boolean;
  networkMatchPriority?: NetworkMatchType[];
  maxResults?: {
    profiles: number;
    stories: number;
    projects: number;
    hashtags: number;
    events: number;
    opportunities: number;
  };
}

// Loading skeleton component
function DiaSearchSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-in fade-in-0">
      {/* Progress text */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <MateMasie className="h-4 w-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <p className="text-muted-foreground mt-4 animate-pulse">DIA is researching...</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Searching global sources and your network</p>
      </div>

      {/* Answer skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </CardContent>
      </Card>

      {/* Network matches skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty state component
function DiaEmptyState({
  suggestions,
  onSuggestionClick
}: {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div className="mt-8 text-center py-12">
      <MateMasie className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Ask DIA Anything About Africa
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Get AI-powered intelligence about African markets, opportunities,
        and connect with your network members who share your interests.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 px-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-2 text-sm bg-muted hover:bg-emerald-600 hover:text-white rounded-full transition-colors min-h-[44px]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// No results state
function DiaNoResults({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) {
  const suggestions = [
    "Fintech founders in West Africa",
    "Diaspora investors in renewable energy",
    "Tech professionals from Nigeria in London"
  ];

  return (
    <div className="mt-8 text-center py-12">
      <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        No results found for your query
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Try being more specific or explore these suggestions:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-2 text-sm bg-muted hover:bg-emerald-600 hover:text-white rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DiaSearch({
  source = 'dashboard',
  placeholder = 'Ask DIA about African opportunities, markets, or trends...',
  compact = false,
  suggestions,
  initialQuery = '',
  autoSearch = false,
  networkMatchPriority = ['profiles', 'stories', 'projects', 'opportunities', 'hashtags', 'events'],
  maxResults = { profiles: 3, stories: 2, projects: 2, hashtags: 3, events: 2, opportunities: 2 }
}: DiaSearchProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const hasAutoSearched = React.useRef(false);
  const [showAllSources, setShowAllSources] = useState(false);

  // Update query when initialQuery changes
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const [response, setResponse] = useState<DiaResponse | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ limit: number; used: number; resets_at: string } | null>(null);

  // Auto-search when triggered from history or insights
  React.useEffect(() => {
    if (autoSearch && initialQuery && !hasAutoSearched.current && !rateLimited) {
      hasAutoSearched.current = true;
      searchMutation.mutate(initialQuery);
    }
  }, [autoSearch, initialQuery, rateLimited]);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('dia-search', {
        body: { query: searchQuery, source },
      });

      if (res.error) {
        // Handle structured errors from edge function
        if (res.error.message) {
          try {
            const errorData = JSON.parse(res.error.message);
            throw errorData;
          } catch {
            throw res.error;
          }
        }
        throw res.error;
      }

      // Check for rate limit in response
      if (res.data?.error === 'Monthly query limit reached') {
        setRateLimited(true);
        setRateLimitInfo({
          limit: res.data.limit,
          used: res.data.used,
          resets_at: res.data.resets_at
        });
        throw new Error('Monthly query limit reached');
      }

      return res.data as DiaResponse;
    },
    onSuccess: (data) => {
      setResponse(data);
      setRateLimited(false);
      if (data.data.cached) {
        toast.info('Retrieved from cache', { duration: 2000 });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || 'Search failed';

      if (errorMessage.includes('Monthly query limit') || errorMessage.includes('limit reached')) {
        setRateLimited(true);
        toast.error("Monthly Query Limit Reached", {
          description: "You've used all your DIA queries this month."
        });
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Not authenticated')) {
        toast.error('Please sign in to use DIA');
      } else if (errorMessage.includes('Query too long')) {
        toast.error('Query too long', {
          description: 'Maximum 500 characters allowed'
        });
      } else {
        toast.error('Search failed', {
          description: 'Please try again.'
        });
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery && !rateLimited) {
      searchMutation.mutate(trimmedQuery);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (rateLimited) return;
    setQuery(suggestion);
    searchMutation.mutate(suggestion);
  };

  const handleProfileClick = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/dna/collaborate/spaces/${projectId}`);
  };

  const handleHashtagClick = (hashtagName: string) => {
    navigate(`/dna/hashtag/${encodeURIComponent(hashtagName)}`);
  };

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const hasNetworkMatches = response?.data?.network_matches && (
    response.data.network_matches.profiles.length > 0 ||
    response.data.network_matches.events.length > 0 ||
    response.data.network_matches.projects.length > 0 ||
    response.data.network_matches.hashtags.length > 0 ||
    (response.data.network_matches.stories?.length || 0) > 0 ||
    (response.data.network_matches.opportunities?.length || 0) > 0
  );

  const isInputDisabled = searchMutation.isPending || rateLimited;

  // Get favicon URL from citation
  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch {
      return '';
    }
  };

  // Get display name from URL
  const getSourceName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Source';
    }
  };

  // Render network matches based on priority
  const renderNetworkMatches = () => {
    if (!response?.data?.network_matches) return null;

    const { profiles, events, projects, hashtags, stories = [], opportunities = [] } = response.data.network_matches;
    const sections: React.ReactNode[] = [];

    for (const matchType of networkMatchPriority) {
      switch (matchType) {
        case 'profiles':
          // Filter out the current user from network matches
          const filteredProfiles = profiles.filter(profile => profile.id !== user?.id);
          if (filteredProfiles.length > 0) {
            const limitedProfiles = filteredProfiles.slice(0, maxResults.profiles);
            sections.push(
              <div key="profiles">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Connected Professionals
                </p>
                <div className={cn(
                  "grid gap-3",
                  compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                  {limitedProfiles.map((profile) => (
                    <DiaProfileCard
                      key={profile.id}
                      id={profile.id}
                      full_name={profile.full_name}
                      headline={profile.headline}
                      avatar_url={profile.avatar_url}
                      location={profile.location}
                      relevance={profile.relevance}
                      skills={profile.skills}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            );
          }
          break;

        case 'stories':
          if (stories.length > 0) {
            const limitedStories = stories.slice(0, maxResults.stories);
            sections.push(
              <div key="stories">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Related Stories
                </p>
                <div className={cn(
                  "grid gap-3",
                  compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {limitedStories.map((story) => (
                    <DiaStoryCard
                      key={story.id}
                      id={story.id}
                      title={story.title}
                      excerpt={story.excerpt}
                      author={story.author}
                      published_at={story.published_at}
                      view_count={story.view_count}
                      like_count={story.like_count}
                      hashtags={story.hashtags}
                      cover_image={story.cover_image}
                      compact={compact}
                      onHashtagClick={handleHashtagClick}
                    />
                  ))}
                </div>
              </div>
            );
          }
          break;

        case 'hashtags':
          if (hashtags.length > 0) {
            const limitedHashtags = hashtags.slice(0, maxResults.hashtags);
            sections.push(
              <div key="hashtags">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Related Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {limitedHashtags.map((hashtag) => (
                    <DiaHashtagChip
                      key={hashtag.id}
                      name={hashtag.name}
                      post_count={hashtag.post_count}
                      trending={hashtag.trending}
                      onClick={handleHashtagClick}
                    />
                  ))}
                </div>
              </div>
            );
          }
          break;

        case 'events':
          if (events.length > 0) {
            const limitedEvents = events.slice(0, maxResults.events);
            sections.push(
              <div key="events">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Related Events
                </p>
                <div className="space-y-2">
                  {limitedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left group"
                    >
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                          {event.title}
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.relevance}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          break;

        case 'projects':
          if (projects.length > 0) {
            const limitedProjects = projects.slice(0, maxResults.projects);
            sections.push(
              <div key="projects">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Active Spaces
                </p>
                <div className="space-y-2">
                  {limitedProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left group"
                    >
                      <p className="font-medium text-sm flex items-center gap-1">
                        {project.name}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        {project.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          break;

        case 'opportunities':
          if (opportunities.length > 0) {
            const limitedOpportunities = opportunities.slice(0, maxResults.opportunities);
            sections.push(
              <div key="opportunities">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Contribution Opportunities
                </p>
                <div className={cn(
                  "grid gap-3",
                  compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                  {limitedOpportunities.map((opportunity) => (
                    <DiaOpportunityCard
                      key={opportunity.id}
                      id={opportunity.id}
                      title={opportunity.title}
                      type={opportunity.type}
                      spaceName={opportunity.space_name}
                      region={opportunity.region}
                      focusAreas={opportunity.focus_areas}
                      relevance={opportunity.relevance}
                      matchScore={opportunity.match_score}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            );
          }
          break;
      }
    }

    return sections.length > 0 ? (
      <div className="space-y-6">{sections}</div>
    ) : null;
  };

  const defaultSuggestions = suggestions || [
    'Fintech opportunities in Nigeria',
    'Renewable energy investments in Kenya',
    'Tech hubs in Ghana',
    'Agricultural innovations in Ethiopia',
  ];

  const citations = response?.data?.citations || [];
  const visibleCitations = showAllSources ? citations : citations.slice(0, 5);
  const hasMoreSources = citations.length > 5;

  return (
    <div className={`w-full ${compact ? 'max-w-xl' : 'max-w-4xl'} mx-auto px-1 sm:px-0`}>
      {/* Rate Limit Banner */}
      {rateLimited && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Monthly Query Limit Reached</p>
              <p className="text-sm text-amber-700">
                You've used all {rateLimitInfo?.limit || 10} DIA queries this month.
                {rateLimitInfo?.resets_at && (
                  <> Resets on {new Date(rateLimitInfo.resets_at).toLocaleDateString()}.</>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 w-full sm:w-auto">
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
          <div className="relative flex-1">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <MateMasie className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={compact ? "Ask DIA..." : placeholder}
              className="pl-10 sm:pl-12 pr-4 sm:pr-28 py-4 sm:py-6 text-base sm:text-lg rounded-xl border-2 border-border focus:border-emerald-500 transition-colors bg-background w-full"
              disabled={isInputDisabled}
              maxLength={500}
            />
            {/* Desktop button inside input */}
            <Button
              type="submit"
              disabled={!query.trim() || isInputDisabled}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Ask DIA</span>
            </Button>
          </div>
          {/* Mobile button below input */}
          <Button
            type="submit"
            disabled={!query.trim() || isInputDisabled}
            className="sm:hidden w-full bg-emerald-600 hover:bg-emerald-700 py-3"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Ask DIA</span>
          </Button>
        </div>

        {/* Usage indicator */}
        {response?.usage && !rateLimited && (
          <div className="text-center sm:text-right sm:absolute sm:right-2 sm:-bottom-6 text-xs text-muted-foreground mt-2 sm:mt-0">
            {response.usage.queries_remaining} queries remaining this month
          </div>
        )}
      </form>

      {/* Loading State */}
      {searchMutation.isPending && <DiaSearchSkeleton />}

      {/* Response */}
      {response?.data && !rateLimited && !searchMutation.isPending && (
        <div className="mt-8 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          {/* Main Answer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MateMasie className="h-5 w-5 text-emerald-600" />
                  DIA
                </CardTitle>
                <div className="flex items-center gap-2">
                  {response.data.cached && (
                    <Badge variant="secondary" className="text-xs">Cached</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {response.response_time_ms}ms
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {response.data.answer}
                </p>
              </div>

              {/* Citations with favicons */}
              {citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleCitations.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors group"
                      >
                        <img
                          src={getFaviconUrl(citation)}
                          alt=""
                          className="h-4 w-4 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="truncate max-w-[120px]">{getSourceName(citation)}</span>
                        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                  {hasMoreSources && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllSources(!showAllSources)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {showAllSources ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show {citations.length - 5} more sources
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Matches */}
          {hasNetworkMatches && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                  In Your DNA Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderNetworkMatches()}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!response && !searchMutation.isPending && !rateLimited && (
        <DiaEmptyState
          suggestions={defaultSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
    </div>
  );
}

export default DiaSearch;
