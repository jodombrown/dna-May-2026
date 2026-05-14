import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, BarChart3, List, CalendarDays, Plus, Brain, ArrowRight } from 'lucide-react';
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
import { DiaOrganizerInsight } from '@/components/convene/DiaOrganizerInsight';
import { PastEventDiaNudge } from '@/components/convene/PastEventDiaNudge';
import { MutualAttendeesLine } from '@/components/convene/MutualAttendeesLine';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { useOrganizerStats } from '@/hooks/convene/useOrganizerStats';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
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
  const now = new Date();
  const upcomingHosting = useMemo(
    () => hostingEvents.filter((e) => !e.is_cancelled && new Date(e.start_time) > now),
    [hostingEvents]
  );
  const pastHosting = useMemo(
    () =>
      hostingEvents
        .filter((e) => new Date(e.start_time) <= now || e.is_cancelled)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()),
    [hostingEvents]
  );
  const upcomingAttending = useMemo(
    () => attendingEvents.filter((e) => new Date(e.start_time) > now),
    [attendingEvents]
  );
  const pastAttending = useMemo(
    () =>
      attendingEvents
        .filter((e) => new Date(e.start_time) <= now)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()),
    [attendingEvents]
  );

  // ── DIA insight data ─────────────────────────────────
  const lastPastEvent = pastHosting.find((e) => !e.is_cancelled);
  const daysSinceLastEvent = lastPastEvent
    ? Math.floor((now.getTime() - new Date(lastPastEvent.start_time).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  const lastEventAttendees = lastPastEvent
    ? ((lastPastEvent.event_attendees as Array<{ count: number }>)?.[0]?.count ?? 0)
    : undefined;

  // Find top category
  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    hostingEvents.forEach((e) => {
      const cat = e.event_type;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0];
  }, [hostingEvents]);

  return (
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

                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    className="bg-module-convene hover:bg-module-convene-dark text-white"
                    onClick={() => composer.open('event')}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Host an Event
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dna/convene/analytics')}>
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Analytics
                  </Button>
                </div>

                {/* DIA Organizer Insight */}
                {stats && (
                  <DiaOrganizerInsight
                    stats={stats}
                    lastEventTitle={lastPastEvent?.title}
                    lastEventAttendees={lastEventAttendees}
                    daysSinceLastEvent={daysSinceLastEvent}
                    topCategory={topCategory}
                  />
                )}

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
                      <Button
                        className="bg-module-convene hover:bg-module-convene-dark text-white"
                        onClick={() => composer.open('event')}
                      >
                        Create Your First Event
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Upcoming section */}
                    {upcomingHosting.length > 0 && (
                      <section>
                        <h2 className="text-lg font-bold mb-3">
                          Upcoming ({upcomingHosting.length})
                        </h2>
                        <div className="space-y-3">
                          {upcomingHosting.map((event) => (
                            <MyEventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Past section (collapsible on mobile) */}
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
                                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                    {new Date(event.start_time).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
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
                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                      {new Date(event.start_time).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
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
    </LayoutController>
  );
};

export default MyEvents;
