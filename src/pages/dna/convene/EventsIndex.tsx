import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CalendarCheck, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_PLACE_COLUMNS } from '@/lib/events/formatPlace';
import { ConveneEventCard } from '@/components/convene/ConveneEventCard';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';

const EventsIndex = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const composer = useUniversalComposer();
  
  // Initialize filters from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [formatFilter, setFormatFilter] = useState(searchParams.get('format') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [timeFilter, setTimeFilter] = useState(searchParams.get('time_range') || 'upcoming');
  const [countryFilter, setCountryFilter] = useState(searchParams.get('country') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (formatFilter !== 'all') params.set('format', formatFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (timeFilter !== 'upcoming') params.set('time_range', timeFilter);
    if (countryFilter) params.set('country', countryFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    setSearchParams(params, { replace: true });
  }, [searchTerm, formatFilter, typeFilter, timeFilter, countryFilter, categoryFilter, setSearchParams]);

  // Fetch events with filters
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-index', searchTerm, formatFilter, typeFilter, timeFilter, countryFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published');

      // Time filter
      const now = new Date().toISOString();
      if (timeFilter === 'upcoming') {
        query = query.gte('start_time', now);
      } else if (timeFilter === 'today') {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        query = query
          .gte('start_time', now)
          .lte('start_time', endOfDay.toISOString());
      } else if (timeFilter === 'this_week') {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        query = query
          .gte('start_time', now)
          .lte('start_time', weekFromNow.toISOString());
      } else if (timeFilter === 'this_month') {
        const monthFromNow = new Date();
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        query = query
          .gte('start_time', now)
          .lte('start_time', monthFromNow.toISOString());
      }

      // Format filter
      if (formatFilter !== 'all') {
        query = query.eq('format', formatFilter as 'in_person' | 'virtual' | 'hybrid');
      }

      // Type filter
      if (typeFilter !== 'all') {
        query = query.eq('event_type', typeFilter as 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'social' | 'other');
      }

      // Country filter
      if (countryFilter) {
        query = query.eq(EVENT_PLACE_COLUMNS.country, countryFilter);
      }

      // Category filter
      if (categoryFilter) {
        query = query.contains('tags', [categoryFilter]);
      }

      // Search
      if (searchTerm.trim()) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location_city.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query
        .order('start_time', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFormatFilter('all');
    setTypeFilter('all');
    setTimeFilter('upcoming');
    setCountryFilter('');
    setCategoryFilter('');
  };

  const activeFilterCount = [
    searchTerm,
    formatFilter !== 'all' ? formatFilter : null,
    typeFilter !== 'all' ? typeFilter : null,
    timeFilter !== 'upcoming' ? timeFilter : null,
    countryFilter,
    categoryFilter
  ].filter(Boolean).length;

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-h1 font-serif text-foreground">All Events</h1>
            <p className="text-muted-foreground">
              Discover and join convenings across the diaspora network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/dna/convene/my-events')}>
              <CalendarCheck className="w-4 h-4 mr-2" />
              My Events
            </Button>
            <Button onClick={() => composer.open('event')}>
              <Calendar className="w-4 h-4 mr-2" />
              Host an Event
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Time Range */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Format */}
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="in_person">In-Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            {/* Event Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{activeFilterCount} active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {formatFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {formatFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFormatFilter('all')} />
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {typeFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter('all')} />
                </Badge>
              )}
              {timeFilter !== 'upcoming' && (
                <Badge variant="secondary" className="gap-1">
                  {timeFilter.replace('_', ' ')}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setTimeFilter('upcoming')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or be the first to host an event.
            </p>
            <Button onClick={() => composer.open('event')}>
              Host an Event
            </Button>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event: any) => (
                <ConveneEventCard
                  key={event.id}
                  event={event}
                  showRsvp
                  onRsvp={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
                  onClick={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
                />
              ))}
            </div>
          </>
        )}
        <UniversalComposer
          isOpen={composer.isOpen}
          mode={composer.mode}
          context={composer.context}
          isSubmitting={composer.isSubmitting}
          onClose={composer.close}
          onModeChange={composer.switchMode}
          successData={composer.successData}
          onSubmit={composer.submit}
          onDismissSuccess={composer.dismissSuccess}
        />
      </div>
    </div>
  );
};

export default EventsIndex;
