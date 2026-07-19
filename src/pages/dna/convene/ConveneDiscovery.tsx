/**
 * DNA | CONVENE — Discovery Hub (Redesigned)
 * Editorial discovery experience with Arrival Energy.
 * Hero → Pill Filter Bar → Named Discovery Lanes → Explore Cities
 *
 * Mobile-first: single column, horizontal-scroll lanes.
 * Desktop: max-w-6xl centered, grid lanes.
 */

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CalendarCheck, Plus, Search, Map, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMobile';

import { ConveneLocationSelector } from '@/components/convene/ConveneLocationSelector';
import { ConveneCitiesSection } from '@/components/convene/ConveneCitiesSection';
import { ConveneHeroEvent } from '@/components/convene/ConveneHeroEvent';
import { DiscoveryLane } from '@/components/convene/DiscoveryLane';
import { HappeningNowSection } from '@/components/convene/HappeningNowSection';
import { ConveneDIADiscoveryCard } from '@/components/convene/ConveneDIADiscoveryCard';
import { DIAHubSection } from '@/components/dia/DIAHubSection';
import { UpcomingEventsSection } from '@/components/convene/UpcomingEventsSection';
import { ConveneShell } from '@/components/convene/ConveneShell';
// ConveneTabExplainer removed on mobile - segmented tab labels are self-explanatory
import { useConveneCities, useUserCity } from '@/hooks/convene/useConveneCities';
import {
  useHeroEvent,
  useWeekendEvents,
  useNetworkEvents,
  useDiasporaEvents,
  useUndatedEvents,
} from '@/hooks/convene/useConveneDiscoveryLanes';
import { useUniversalComposer } from '@/contexts/ComposerContext';
import { ConveneSearchOverlay } from '@/components/convene/ConveneSearchOverlay';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_PLACE_SELECT, pickEventPlace } from '@/lib/events/formatPlace';
import { EVENT_TIME_SELECT } from '@/lib/events/eventTime';
import type { MapEventData } from '@/components/convene/ConveneEventPin';

const LazyMapView = lazy(() => import('@/components/convene/ConveneMapView'));

/* ──────────────────────────────────────────────
   Pill Filter Bar (Desktop only now)
   ────────────────────────────────────────────── */
const PILLS = [
  { id: 'all', label: 'All' },
  { id: 'near_me', label: 'Near Me' },
  { id: 'this_week', label: 'This Week' },
  { id: 'online', label: 'Online' },
  { id: 'free', label: 'Free' },
  { id: 'network', label: 'My Network' },
] as const;

function PillFilterBar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {PILLS.map((pill) => {
        const isActive = active === pill.id;
        return (
          <button
            key={pill.id}
            onClick={() => onSelect(pill.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-dna-copper text-white border-dna-copper shadow-sm'
                : 'bg-background text-foreground border-border hover:border-dna-copper/40 hover:bg-dna-copper/5',
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Section Divider — thin Copper line
   ────────────────────────────────────────────── */
function CopperDivider() {
  return <div className="h-px bg-dna-copper/20" />;
}

/* ══════════════════════════════════════════════
   CONVENE DISCOVERY HUB
   ══════════════════════════════════════════════ */
export function ConveneDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const composer = useUniversalComposer();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const selectedCity = searchParams.get('city');
  const activePill = searchParams.get('pill') || 'all';
  const viewMode = (searchParams.get('view') as 'list' | 'map') || 'list';
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Discovery shows upcoming lanes plus the undated ("Dates not yet
  // announced") lane, so the city picker draws from that same scope —
  // an undated Accra event still puts Accra in the picker.
  const { data: cities = [] } = useConveneCities('upcoming');
  const { data: userLocation } = useUserCity();

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'all') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  };

  const handlePillChange = (pill: string) => {
    updateFilters({ pill: pill === 'all' ? null : pill });
  };

  // ── Discovery Lane Queries ──────────────────────
  const { data: heroEvent } = useHeroEvent(selectedCity);
  const { data: weekendEvents = [] } = useWeekendEvents(selectedCity);
  const { data: networkEvents = [] } = useNetworkEvents();

  const shownIds = useMemo(() => {
    const ids: string[] = [];
    if (heroEvent) ids.push(heroEvent.id);
    weekendEvents.forEach((e) => ids.push(e.id));
    networkEvents.forEach((e) => ids.push(e.id));
    return ids;
  }, [heroEvent, weekendEvents, networkEvents]);

  const { data: diasporaEvents = [] } = useDiasporaEvents(shownIds);
  const { data: undatedEvents = [] } = useUndatedEvents();

  // ── Filtered events for pill-specific queries ──
  const { data: filteredEvents = [] } = useQuery({
    queryKey: ['convene-pill-filtered', selectedCity, activePill],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          id, title, slug, ${EVENT_TIME_SELECT}, ${EVENT_PLACE_SELECT},
          description, short_description,
          cover_image_url, event_type, format, is_cancelled, max_attendees,
          organizer_id, is_curated, curated_source, curated_source_url,
          event_attendees(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      if (selectedCity) query = query.ilike('location_city', selectedCity);

      // Pill-specific filters
      if (activePill === 'online') {
        query = query.eq('format', 'virtual');
      } else if (activePill === 'this_week') {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        query = query.lte('start_time', weekEnd.toISOString());
      } else if (activePill === 'near_me' && userLocation?.city) {
        query = query.ilike('location_city', userLocation.city);
      }

      const { data, error } = await query;
      if (error) return [];

      // Attach organizers
      const organizerIds = [
        ...new Set(
          (data || [])
            .map((e) => e.organizer_id)
            .filter((id): id is string => !!id),
        ),
      ];
      let organizerMap: Record<
        string,
        { id: string; full_name: string; avatar_url: string | null; username: string | null }
      > = {};
      if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', organizerIds);
        if (profiles) {
          organizerMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
        }
      }
      return (data || []).map((e) => ({
        ...e,
        organizer: organizerMap[e.organizer_id ?? ''] ?? null,
      }));
    },
    enabled: activePill !== 'all' && activePill !== 'network',
    staleTime: 60_000,
  });

  // ── Map events ─────────────────────────────────
  const mapEvents = useMemo((): MapEventData[] => {
    const seen = new Set<string>();
    const result: MapEventData[] = [];
    const allEvents = [
      ...(heroEvent ? [heroEvent] : []),
      ...weekendEvents,
      ...networkEvents,
      ...diasporaEvents,
    ];
    for (const e of allEvents) {
      const event = e as unknown as Record<string, unknown>;
      const id = event.id as string;
      if (seen.has(id)) continue;
      seen.add(id);
      const lat = event.location_lat as number | null;
      const lng = event.location_lng as number | null;
      if (lat == null || lng == null) continue;
      result.push({
        id,
        title: event.title as string,
        slug: (event.slug as string | null) ?? null,
        start_time: event.start_time as string | null,
        end_time: (event.end_time as string | null) ?? null,
        time_confirmed: (event.time_confirmed as boolean | null) ?? null,
        date_confirmed: (event.date_confirmed as boolean | null) ?? null,
        ...pickEventPlace(event),
        location_lat: lat,
        location_lng: lng,
        cover_image_url: (event.cover_image_url as string | null) ?? null,
        event_type: (event.event_type as string | null) ?? null,
        format: (event.format as string | null) ?? null,
        max_attendees: (event.max_attendees as number | null) ?? null,
        attendee_count:
          (event.event_attendees as Array<{ count: number }> | undefined)?.[0]
            ?.count || 0,
      });
    }
    return result;
  }, [heroEvent, weekendEvents, networkEvents, diasporaEvents]);

  const sectionHeading = useMemo(() => {
    if (selectedCity) return `Events in ${selectedCity}`;
    if (userLocation?.city) return `Events near ${userLocation.city}`;
    return 'Discover Events';
  }, [selectedCity, userLocation?.city]);

  const showDiscoveryLanes = activePill === 'all';

  const totalCount = showDiscoveryLanes
    ? (heroEvent ? 1 : 0) +
      weekendEvents.length +
      networkEvents.length +
      diasporaEvents.length
    : filteredEvents.length;

  return (
    // Mobile chrome (DNA header, composer bubble, bell, avatar, tab strip)
    // comes from the shared ConveneShell — this page renders body only.
    <ConveneShell>
    <div className="w-full min-h-dvh bg-background">
      <div className="container max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-0 lg:py-6 space-y-3 md:space-y-4 lg:space-y-5">
        {/* ═══════════════════════════════════════
            MOBILE: MY EVENTS DOOR
            The fixed mobile header has no room for it, and without this
            the organizer's own events are unreachable from Convene on a
            phone.
            ═══════════════════════════════════════ */}
        {isMobile && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full"
              onClick={() => navigate('/dna/convene/my-events')}
            >
              <CalendarCheck className="w-4 h-4 mr-1.5" />
              My Events
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════
            DESKTOP HEADER: Location + Actions
            ═══════════════════════════════════════ */}
        {!isMobile && (
          <>
            <div className="flex items-center justify-between gap-3">
              <ConveneLocationSelector
                selectedCity={selectedCity}
                userCity={userLocation?.city ?? null}
                cities={cities}
                onCityChange={(city) => updateFilters({ city })}
              />
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search events"
                >
                  <Search className="w-4.5 h-4.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-full',
                    viewMode === 'map' &&
                      'bg-dna-copper/12 text-dna-copper',
                  )}
                  onClick={() =>
                    updateFilters({ view: viewMode === 'list' ? 'map' : null })
                  }
                  aria-label={viewMode === 'list' ? 'Map view' : 'List view'}
                >
                  {viewMode === 'list' ? (
                    <Map className="w-4.5 h-4.5" />
                  ) : (
                    <List className="w-4.5 h-4.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 px-4"
                  onClick={() => navigate('/dna/convene/my-events')}
                >
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  My Events
                </Button>
                <Button
                  size="sm"
                  className="bg-dna-copper hover:bg-dna-copper-dark text-white rounded-full h-9 px-4"
                  onClick={() => composer.open('event')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Host</span>
                </Button>
              </div>
            </div>

            <PillFilterBar
              active={activePill}
              onSelect={handlePillChange}
            />

            <CopperDivider />
          </>
        )}

        {/* ═══════════════════════════════════════
            MAP VIEW
            ═══════════════════════════════════════ */}
        {viewMode === 'map' ? (
          <Suspense
            fallback={
              <div className="h-[500px] md:h-[600px] animate-pulse bg-muted rounded-xl" />
            }
          >
            <LazyMapView
              events={mapEvents}
              selectedCity={selectedCity}
              onEventSelect={() => {}}
            />
          </Suspense>
        ) : showDiscoveryLanes ? (
          /* ═══════════════════════════════════════
             DISCOVERY LANES MODE
             ═══════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 md:gap-6 lg:gap-8 items-start">
            {/* LEFT — Main discovery content */}
            <div className="space-y-4 md:space-y-6 min-w-0">
              {/* Happening Now — live pulse */}
              <HappeningNowSection />

              {/* HERO — Single commanding featured event */}
              {heroEvent && <ConveneHeroEvent event={heroEvent} />}

              {heroEvent && <CopperDivider />}

              {/* DIA Discovery Card */}
              <ConveneDIADiscoveryCard
                selectedCity={selectedCity}
                eventCount={totalCount}
                onOpenComposer={() => composer.open('event')}
                onSetCategory={(cat) => updateFilters({ pill: cat })}
              />

              {/* Lane: Happening Near You */}
              {userLocation?.city && (
                <>
                  <DiscoveryLane
                    title="Happening Near You"
                    events={diasporaEvents.filter(
                      (e) =>
                        e.location_city
                          ?.toLowerCase()
                          .includes(userLocation.city?.toLowerCase() ?? '') ??
                        false,
                    )}
                    emptyMessage={`No events near ${userLocation.city} yet`}
                    onSeeAll={() =>
                      navigate(
                        `/dna/convene/events?city=${userLocation.city}`,
                      )
                    }
                  />
                  <CopperDivider />
                </>
              )}

              {/* Lane: Your Network Is Going */}
              {networkEvents.length > 0 && (
                <>
                  <DiscoveryLane
                    title="Your Network Is Going"
                    events={networkEvents}
                    showMutualAttendees
                    onSeeAll={
                      networkEvents.length > 3
                        ? () =>
                            navigate(
                              '/dna/convene/events?filter=network',
                            )
                        : undefined
                    }
                  />
                  <CopperDivider />
                </>
              )}

              {/* Lane: This Weekend */}
              {weekendEvents.length > 0 && (
                <>
                  <DiscoveryLane
                    title="This Weekend"
                    events={weekendEvents}
                    onSeeAll={
                      weekendEvents.length > 3
                        ? () =>
                            navigate(
                              '/dna/convene/events?filter=weekend',
                            )
                        : undefined
                    }
                  />
                  <CopperDivider />
                </>
              )}

              {/* Lane: Across the Diaspora */}
              <DiscoveryLane
                title="Across the Diaspora"
                events={diasporaEvents}
                onSeeAll={() => navigate('/dna/convene/events')}
                emptyMessage="No upcoming events yet. Be the first to host one!"
              />

              {/* Lane: Dates not yet announced — undated events live here,
                  never sorted into the timeline lanes above */}
              {undatedEvents.length > 0 && (
                <>
                  <CopperDivider />
                  <DiscoveryLane
                    title="Dates not yet announced"
                    events={undatedEvents}
                  />
                </>
              )}

              {/* Empty state — absolutely nothing */}
              {!heroEvent &&
                weekendEvents.length === 0 &&
                networkEvents.length === 0 &&
                diasporaEvents.length === 0 && (
                  <div className="text-center py-12 space-y-3">
                    <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      {selectedCity
                        ? `No upcoming events in ${selectedCity} yet. Be the first to host one!`
                        : 'No upcoming events found. Be the first to host one!'}
                    </p>
                    <Button
                      size="sm"
                      className="bg-dna-copper hover:bg-dna-copper-dark text-white"
                      onClick={() => composer.open('event')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Host an Event
                    </Button>
                  </div>
                )}

              <CopperDivider />

              {/* Explore Cities */}
              <ConveneCitiesSection
                cities={cities}
                onCitySelect={(city) => updateFilters({ city })}
                activeCity={selectedCity}
              />

              {/* Upcoming Events — below lanes on mobile only */}
              <div className="lg:hidden">
                <UpcomingEventsSection
                  onCreateEvent={() => composer.open('event')}
                />
              </div>
            </div>

            {/* RIGHT — Sticky sidebar (desktop only) */}
            <div className="hidden lg:block sticky space-y-6" style={{ top: 'var(--total-header-height, 80px)' }}>
              <UpcomingEventsSection
                onCreateEvent={() => composer.open('event')}
              />
              <DIAHubSection surface="convene_hub" limit={2} />
            </div>
          </div>
        ) : activePill === 'network' ? (
          /* ═══════════════════════════════════════
             MY NETWORK FILTER
             ═══════════════════════════════════════ */
          <div className="space-y-6">
            <HappeningNowSection />
            <DiscoveryLane
              title="Your Network Is Going"
              events={networkEvents}
              showMutualAttendees
              emptyMessage="None of your connections have RSVP'd to upcoming events yet."
            />
            <ConveneCitiesSection
              cities={cities}
              onCitySelect={(city) => updateFilters({ city })}
              activeCity={selectedCity}
            />
          </div>
        ) : (
          /* ═══════════════════════════════════════
             FILTERED PILL MODE (Near Me / This Week / Online / Free)
             ═══════════════════════════════════════ */
          <div className="space-y-6">
            <HappeningNowSection />
            <DiscoveryLane
              title={`${PILLS.find((p) => p.id === activePill)?.label ?? 'Filtered'} Events`}
              events={filteredEvents}
              emptyMessage={`No events found for this filter. Try another or host one!`}
              onSeeAll={() => navigate('/dna/convene/events')}
            />
            <ConveneCitiesSection
              cities={cities}
              onCitySelect={(city) => updateFilters({ city })}
              activeCity={selectedCity}
            />
          </div>
        )}
      </div>

      <ConveneSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

    </div>
    </ConveneShell>
  );
}

export default ConveneDiscovery;
