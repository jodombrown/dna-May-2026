import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, BarChart3, List, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { EventCalendarView } from '@/components/convene/EventCalendarView';
import { ConveneEventCard } from '@/components/convene/ConveneEventCard';
import { MyEventCard } from '@/components/convene/MyEventCard';
import { MyEventsStatsHeader } from '@/components/convene/MyEventsStatsHeader';
import { PastEventDiaNudge } from '@/components/convene/PastEventDiaNudge';
import { ConveneShell } from '@/components/convene/ConveneShell';
import { MutualAttendeesLine } from '@/components/convene/MutualAttendeesLine';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { useOrganizerStats } from '@/hooks/convene/useOrganizerStats';
import { EventTime } from '@/components/events/EventTime';
import { eventStartMs } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { useUniversalComposer } from '@/contexts/ComposerContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const MyEvents = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const composer = useUniversalComposer();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const activeTab = searchParams.get('tab') || 'hosting';
  const [pastHostingOpen, setPastHostingOpen] = useState(false);
  const [cancelledHostingOpen, setCancelledHostingOpen] = useState(false);
  const [pastAttendingOpen, setPastAttendingOpen] = useState(false);

  // ── Organizer stats ──────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useOrganizerStats();

  // ── Hosting events ───────────────────────────────────
  const { data: hostingEvents = [], isLoading: hostingLoading } = useQuery({
    queryKey: ['hosting-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .eq('organizer_id', user.id)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // ── Attending events ─────────────────────────────────
  const { data: attendingEvents = [], isLoading: attendingLoading } = useQuery({
    queryKey: ['attending-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', user.id)
        .in('status', ['going', 'maybe']);
      if (attendeeError) throw attendeeError;
      if (!attendeeData || attendeeData.length === 0) return [];

      const eventIds = attendeeData.map((a) => a.event_id);
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*, event_attendees(count)')
        .in('id', eventIds)
        .order('start_time', { ascending: true });
      if (eventsError) throw eventsError;

      return (
        events?.map((event) => ({
          ...event,
          rsvp_status: attendeeData.find((a) => a.event_id === event.id)?.status,
        })) || []
      );
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // ── Cancel RSVP mutation ─────────────────────────────
  const cancelRsvp = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attending-events'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-stats'] });
      toast.success('RSVP cancelled');
    },
  });

  // ── Derived data ─────────────────────────────────────
  // Hosting groups keyed on canonical `status` (the source of truth — the
  // legacy boolean mirrors are not read here). Order on the page: Drafts,
  // Published, Past/Completed, Cancelled.
  // All clock math is null-safe: an undated event (start_time null or
  // date_confirmed false) has NO place on a timeline — it gets its own
  // "Dates TBA" lane instead of sorting to 1970 and reading as "past".
  // Completed is DERIVED (isEventCompleted) — no scheduler ever writes
  // status='completed', so the clock is the source of truth.
  const now = new Date();
  const statusOf = (e: { status?: string | null }) => e.status ?? 'published';
  const byStartDesc = (a: { start_time?: string | null }, b: { start_time?: string | null }) =>
    (eventStartMs(b) ?? 0) - (eventStartMs(a) ?? 0);
  const draftHosting = useMemo(
    () => hostingEvents.filter((e) => statusOf(e) === 'draft'),
    [hostingEvents]
  );
  const publishedHosting = useMemo(
    () =>
      hostingEvents.filter((e) => {
        const start = eventStartMs(e);
        return statusOf(e) === 'published' && start !== null && start > now.getTime();
      }),
    [hostingEvents]
  );
  const undatedHosting = useMemo(
    () =>
      hostingEvents.filter((e) => statusOf(e) === 'published' && eventStartMs(e) === null),
    [hostingEvents]
  );
  const pastHosting = useMemo(
    () =>
      hostingEvents
        .filter((e) => {
          if (statusOf(e) === 'cancelled' || statusOf(e) === 'draft') return false;
          const start = eventStartMs(e);
          return (
            isEventCompleted(e, now) ||
            (statusOf(e) === 'published' && start !== null && start <= now.getTime())
          );
        })
        .sort(byStartDesc),
    [hostingEvents]
  );
  const cancelledHosting = useMemo(
    () => hostingEvents.filter((e) => statusOf(e) === 'cancelled'),
    [hostingEvents]
  );
  const upcomingAttending = useMemo(
    () =>
      attendingEvents.filter((e) => {
        const start = eventStartMs(e);
        return start !== null && start > now.getTime();
      }),
    [attendingEvents]
  );
  const undatedAttending = useMemo(
    () => attendingEvents.filter((e) => eventStartMs(e) === null && statusOf(e) !== 'cancelled'),
    [attendingEvents]
  );
  const pastAttending = useMemo(
    () =>
      attendingEvents
        .filter((e) => {
          const start = eventStartMs(e);
          return start !== null && start <= now.getTime();
        })
        .sort(byStartDesc),
    [attendingEvents]
  );

  return (
    // Mobile chrome comes from the shared ConveneShell. LayoutController
    // already mounts MobileBottomNav, so the shell must not add a second one.
    <ConveneShell showBottomNav={false}>
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={
        <div className="container max-w-3xl mx-auto px-4 py-6 sm:py-8">
          {/* ── Page Header ────────────────────────── */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden rounded-xl p-5">
            <CulturalPattern pattern="kente" opacity={0.05} />
            <div className="relative z-10">
              <h1 className="text-h1 font-serif">My Events</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage events you're hosting and attending
              </p>
            </div>
            <div className="flex gap-2 relative z-10">
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">List</span>
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarDays className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Calendar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Calendar View ──────────────────────── */}
          {viewMode === 'calendar' && (
            <EventCalendarView
              events={[...hostingEvents, ...attendingEvents]}
              onCreateEvent={() => composer.open('event')}
            />
          )}

          {/* ── List View ──────────────────────────── */}
          {viewMode === 'list' && (
            <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="hosting">Hosting ({hostingEvents.length})</TabsTrigger>
                <TabsTrigger value="attending">Attending ({attendingEvents.length})</TabsTrigger>
              </TabsList>

              {/* ═══ HOSTING TAB ═══ */}
              <TabsContent value="hosting" className="space-y-5">
                {/* Stats Header */}
                {(statsLoading || (stats && stats.eventsHosted > 0)) && (
                  <MyEventsStatsHeader stats={stats ?? { eventsHosted: 0, totalAttendees: 0, upcoming: 0 }} isLoading={statsLoading} />
                )}

                {/* Quick Actions — event creation lives in the header composer */}
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => navigate('/dna/convene/analytics')}>
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Analytics
                  </Button>
                </div>

                {hostingLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading events...</p>
                ) : hostingEvents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">No events yet</p>
                      <p className="text-muted-foreground mb-4">
                        Host your first event and bring the diaspora together!
                      </p>
                      {/* dna-copper, not module-convene: white on the convene
                          gold is near-invisible, and copper is the CTA color
                          the contrast guard in index.css actually covers. */}
                      <Button
                        className="bg-dna-copper hover:bg-dna-copper-dark text-white"
                        onClick={() => composer.open('event')}
                      >
                        Create Your First Event
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Drafts — loudest group, these need the organizer */}
                    {draftHosting.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold">Drafts</h2>
                          <Badge
                            variant="outline"
                            className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold"
                          >
                            {draftHosting.length}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Not published yet — only you can see these.
                        </p>
                        <div className="space-y-3">
                          {draftHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Published (upcoming) */}
                    {publishedHosting.length > 0 && (
                      <section>
                        <h2 className="text-lg font-bold mb-3">
                          Published ({publishedHosting.length})
                        </h2>
                        <div className="space-y-3">
                          {publishedHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Dates TBA — undated events hold their own lane,
                        never sorted into the timeline above or below */}
                    {undatedHosting.length > 0 && (
                      <section>
                        <h2 className="text-lg font-bold mb-3">
                          Dates TBA ({undatedHosting.length})
                        </h2>
                        <div className="space-y-3">
                          {undatedHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Past/Completed (collapsible on mobile) */}
                    {pastHosting.length > 0 && (
                      <Collapsible open={pastHostingOpen} onOpenChange={setPastHostingOpen}>
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 w-full text-left group">
                            <h2 className="text-lg font-bold">Past ({pastHosting.length})</h2>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                pastHostingOpen && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {pastHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} isPast />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Cancelled (collapsible) */}
                    {cancelledHosting.length > 0 && (
                      <Collapsible open={cancelledHostingOpen} onOpenChange={setCancelledHostingOpen}>
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 w-full text-left group">
                            <h2 className="text-lg font-bold">
                              Cancelled ({cancelledHosting.length})
                            </h2>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                cancelledHostingOpen && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {cancelledHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ═══ ATTENDING TAB ═══ */}
              <TabsContent value="attending" className="space-y-5">
                {attendingLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading events...</p>
                ) : attendingEvents.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">No events yet</p>
                      <p className="text-muted-foreground mb-4">
                        You're not registered for any events yet.
                      </p>
                      <Button onClick={() => navigate('/dna/convene')}>Discover Events</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Upcoming attending */}
                    {upcomingAttending.length > 0 && (
                      <section>
                        <h2 className="text-lg font-bold mb-3">
                          Upcoming ({upcomingAttending.length})
                        </h2>
                        <div className="space-y-3">
                          {upcomingAttending.map((event) => (
                            <Card
                              key={event.id}
                              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-module-convene"
                              onClick={() =>
                                navigate(`/dna/convene/events/${event.slug || event.id}`)
                              }
                            >
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-base line-clamp-1">
                                    {event.title}
                                  </h3>
                                  <EventTime
                                    event={event}
                                    variant="compact"
                                    notifyAction={false}
                                    className="text-xs text-muted-foreground flex-shrink-0 ml-2"
                                  />
                                </div>
                                <MutualAttendeesLine eventId={event.id} />
                                <div className="flex items-center gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/dna/convene/events/${event.slug || event.id}`
                                      );
                                    }}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelRsvp.mutate(event.id);
                                    }}
                                  >
                                    Cancel RSVP
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Dates TBA — attending events whose dates aren't
                        announced yet; Notify me rides on the card */}
                    {undatedAttending.length > 0 && (
                      <section>
                        <h2 className="text-lg font-bold mb-3">
                          Dates TBA ({undatedAttending.length})
                        </h2>
                        <div className="space-y-3">
                          {undatedAttending.map((event) => (
                            <ConveneEventCard
                              key={event.id}
                              event={event}
                              variant="compact"
                              showMutualAttendees={false}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Past attending */}
                    {pastAttending.length > 0 && (
                      <Collapsible open={pastAttendingOpen} onOpenChange={setPastAttendingOpen}>
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 w-full text-left">
                            <h2 className="text-lg font-bold">Past ({pastAttending.length})</h2>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                pastAttendingOpen && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {pastAttending.map((event) => (
                            <div key={event.id} className="space-y-2">
                              <Card
                                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-module-convene"
                                onClick={() =>
                                  navigate(`/dna/convene/events/${event.slug || event.id}`)
                                }
                              >
                                <div className="p-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base line-clamp-1">
                                      {event.title}
                                    </h3>
                                    <EventTime
                                      event={event}
                                      variant="compact"
                                      notifyAction={false}
                                      className="text-xs text-muted-foreground flex-shrink-0 ml-2"
                                    />
                                  </div>
                                </div>
                              </Card>
                              <PastEventDiaNudge
                                eventId={event.id}
                                eventTitle={event.title}
                                variant="share_story"
                              />
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      }
      rightColumn={<RightWidgets variant="convene" />}
    >
    </LayoutController>
    </ConveneShell>
  );
};

export default MyEvents;
