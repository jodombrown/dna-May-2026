import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CalendarPlus, Compass, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ConveneEventCard } from '@/components/convene/ConveneEventCard';
import { EventListItem, EventType, EventFormat } from '@/types/events';
import { ProfileV2Data, ProfileV2Visibility } from '@/types/profileV2';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { GatedActionButton } from '@/components/gating/GatedActionButton';
import type { FeatureKey } from '@/config/profileGates';


interface ProfileV2EventsProps {
  profile: ProfileV2Data;
  visibility: ProfileV2Visibility;
  isOwner: boolean;
}

const ProfileV2Events: React.FC<ProfileV2EventsProps> = ({
  profile,
  visibility,
  isOwner,
}) => {
  const navigate = useNavigate();
  const composer = useUniversalComposer();
  const profileUserId = profile.id;

  // Query events the profile user is hosting
  const { data: hostingEvents = [], isLoading: hostingLoading } = useQuery({
    queryKey: ['profile-hosting-events', profileUserId, isOwner],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          id,
          organizer_id,
          title,
          description,
          event_type,
          format,
          location_name,
          location_city,
          location_country,
          meeting_url,
          start_time,
          end_time,
          timezone,
          max_attendees,
          cover_image_url,
          is_public,
          requires_approval,
          is_cancelled,
          created_at,
          profiles!events_organizer_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          event_attendees (count)
        `)
        .eq('organizer_id', profileUserId)
        .order('start_time', { ascending: false });

      // For non-owners, filter out private and cancelled events
      if (!isOwner) {
        query = query.eq('status', 'published').eq('visibility', 'public');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to EventListItem format
      type EventQueryResult = {
        id: string;
        organizer_id: string;
        title: string;
        description: string | null;
        event_type: string;
        format: string;
        location_name: string | null;
        location_city: string | null;
        location_country: string | null;
        meeting_url: string | null;
        start_time: string;
        end_time: string;
        timezone: string;
        max_attendees: number | null;
        cover_image_url: string | null;
        is_public: boolean;
        requires_approval: boolean;
        is_cancelled: boolean;
        created_at: string;
        profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
        event_attendees: { count: number }[];
      };

      return (data || []).map((event: any): EventListItem => ({
        event_id: event.id,
        organizer_id: event.organizer_id,
        organizer_username: event.profiles?.username || '',
        organizer_full_name: event.profiles?.full_name || '',
        organizer_avatar_url: event.profiles?.avatar_url || undefined,
        title: event.title,
        description: event.description || '',
        event_type: event.event_type as EventType,
        format: event.format as EventFormat,
        location_name: event.location_name,
        location_city: event.location_city,
        location_country: event.location_country,
        meeting_url: event.meeting_url,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone,
        max_attendees: event.max_attendees,
        cover_image_url: event.cover_image_url,
        is_public: event.is_public,
        requires_approval: event.requires_approval,
        created_at: event.created_at,
        attendee_count: event.event_attendees?.[0]?.count || 0,
        is_organizer: true,
      }));
    },
    enabled: !!profileUserId,
  });

  // Query events the profile user is attending
  const { data: attendingEvents = [], isLoading: attendingLoading } = useQuery({
    queryKey: ['profile-attending-events', profileUserId, isOwner],
    queryFn: async () => {
      // First get the user's registrations
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', profileUserId)
        .in('status', ['going', 'maybe']);

      if (attendeeError) throw attendeeError;
      if (!attendeeData || attendeeData.length === 0) return [];

      const eventIds = attendeeData.map(a => a.event_id);

      // Fetch the events
      let query = supabase
        .from('events')
        .select(`
          id,
          organizer_id,
          title,
          description,
          event_type,
          format,
          location_name,
          location_city,
          location_country,
          meeting_url,
          start_time,
          end_time,
          timezone,
          max_attendees,
          cover_image_url,
          is_public,
          requires_approval,
          is_cancelled,
          created_at,
          profiles!events_organizer_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          event_attendees (count)
        `)
        .in('id', eventIds)
        .neq('organizer_id', profileUserId) // Exclude events user is also hosting
        .order('start_time', { ascending: false });

      // For non-owners, filter out private and cancelled events
      if (!isOwner) {
        query = query.eq('status', 'published').eq('visibility', 'public');
      }

      const { data: events, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      type EventQueryResult = {
        id: string;
        organizer_id: string;
        title: string;
        description: string | null;
        event_type: string;
        format: string;
        location_name: string | null;
        location_city: string | null;
        location_country: string | null;
        meeting_url: string | null;
        start_time: string;
        end_time: string;
        timezone: string;
        max_attendees: number | null;
        cover_image_url: string | null;
        is_public: boolean;
        requires_approval: boolean;
        is_cancelled: boolean;
        created_at: string;
        profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
        event_attendees: { count: number }[];
      };

      // Transform to EventListItem format
      return (events || []).map((event: any): EventListItem => ({
        event_id: event.id,
        organizer_id: event.organizer_id,
        organizer_username: event.profiles?.username || '',
        organizer_full_name: event.profiles?.full_name || '',
        organizer_avatar_url: event.profiles?.avatar_url || undefined,
        title: event.title,
        description: event.description || '',
        event_type: event.event_type as EventType,
        format: event.format as EventFormat,
        location_name: event.location_name,
        location_city: event.location_city,
        location_country: event.location_country,
        meeting_url: event.meeting_url,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone,
        max_attendees: event.max_attendees,
        cover_image_url: event.cover_image_url,
        is_public: event.is_public,
        requires_approval: event.requires_approval,
        created_at: event.created_at,
        attendee_count: event.event_attendees?.[0]?.count || 0,
        user_rsvp_status: attendeeData.find(a => a.event_id === event.id)?.status,
        is_organizer: false,
      }));
    },
    enabled: !!profileUserId,
  });

  // Split events into upcoming and past
  const now = new Date();
  const upcomingHosting = hostingEvents.filter(e => new Date(e.start_time) > now);
  const pastHosting = hostingEvents.filter(e => new Date(e.start_time) <= now);
  const upcomingAttending = attendingEvents.filter(e => new Date(e.start_time) > now);
  const pastAttending = attendingEvents.filter(e => new Date(e.start_time) <= now);

  // Sort: upcoming ascending (nearest first), past descending (most recent first)
  const sortedUpcomingHosting = [...upcomingHosting].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const sortedPastHosting = [...pastHosting].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
  const sortedUpcomingAttending = [...upcomingAttending].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const sortedPastAttending = [...pastAttending].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  const totalHosting = hostingEvents.length;
  const totalAttending = attendingEvents.length;
  const totalEvents = totalHosting + totalAttending;

  const isLoading = hostingLoading || attendingLoading;
  const hasEvents = totalEvents > 0;

  // Hide if visibility is set to hidden and viewer is not owner
  if (visibility.events === 'hidden' && !isOwner) {
    return null;
  }

  // Hide if no events and not the owner
  if (!hasEvents && !isOwner && !isLoading) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderEventsList = (
    upcoming: EventListItem[],
    past: EventListItem[],
    emptyTitle: string,
    emptyDescription: string,
    emptyAction: { label: string; onClick: () => void; gateFeature?: FeatureKey }
  ) => {
    if (upcoming.length === 0 && past.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {emptyDescription}
          </p>
          {isOwner && (
            emptyAction.gateFeature ? (
              <GatedActionButton
                feature={emptyAction.gateFeature}
                onAllowed={emptyAction.onClick}
              >
                {emptyAction.label}
              </GatedActionButton>
            ) : (
              <Button onClick={emptyAction.onClick}>
                {emptyAction.label}
              </Button>
            )
          )}
        </div>
      );
    }


    return (
      <div className="space-y-6">
        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Upcoming ({upcoming.length})
              </h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {upcoming.map((event) => (
                <ConveneEventCard key={event.event_id} event={{ ...event, id: event.event_id }} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Past ({past.length})
              </h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {past.map((event) => (
                <ConveneEventCard key={event.event_id} event={{ ...event, id: event.event_id }} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Events
            <Badge variant="secondary" className="ml-2">
              {totalEvents}
            </Badge>
          </div>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => composer.open('event')}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Host an Event
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Event Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">{totalHosting}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Events Hosted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">{totalAttending}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Events Attended</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="hosting" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hosting" className="flex items-center gap-2">
              <span>Hosting</span>
              <Badge variant="outline" className="text-xs">
                {totalHosting}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="attending" className="flex items-center gap-2">
              <span>Attending</span>
              <Badge variant="outline" className="text-xs">
                {totalAttending}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hosting" className="mt-4">
            {renderEventsList(
              sortedUpcomingHosting,
              sortedPastHosting,
              'No events hosted yet',
              isOwner
                ? 'Create your first event to bring the community together!'
                : `${profile.full_name || 'This user'} hasn't hosted any events yet.`,
              { label: 'Create Event', onClick: () => composer.open('event'), gateFeature: 'event_create' }
            )}
          </TabsContent>

          <TabsContent value="attending" className="mt-4">
            {renderEventsList(
              sortedUpcomingAttending,
              sortedPastAttending,
              'No events yet',
              isOwner
                ? 'Discover and RSVP to events to see them here!'
                : `${profile.full_name || 'This user'} hasn't attended any public events yet.`,
              { label: 'Discover Events', onClick: () => navigate('/dna/convene') }
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
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
    </>
  );
};

export default ProfileV2Events;
