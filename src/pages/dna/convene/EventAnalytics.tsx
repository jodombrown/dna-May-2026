import { useNavigate, useParams } from 'react-router-dom';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEventAnalytics, useOrganizerAnalytics } from '@/hooks/useEventAnalytics';
import { EventAnalyticsCard } from '@/components/convene/analytics/EventAnalyticsCard';
import { AttendancePredictionCard } from '@/components/convene/analytics/AttendancePredictionCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EventAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading, error } = useEventAnalytics(id);

  // Organizer historical baseline powers the DIA forecast for upcoming events.
  const { data: organizerAnalytics } = useOrganizerAnalytics(
    event?.organizer_id,
    180,
  );

  if (eventLoading || analyticsLoading) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  if (error) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Alert variant="destructive">
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'You do not have permission to view analytics for this event.'}
              </AlertDescription>
            </Alert>
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  if (!event || !analytics) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Alert>
              <AlertTitle>Event not found</AlertTitle>
              <AlertDescription>
                The event you're looking for doesn't exist or has been deleted.
              </AlertDescription>
            </Alert>
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/dna/convene/events/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Button>
          </div>

          {!analytics.event_has_passed && event.start_time && (
            <AttendancePredictionCard
              input={{
                eventStartIso: event.start_time,
                goingNow: analytics.rsvp_stats.going,
                totalRsvpsNow: analytics.rsvp_stats.total,
                rsvpTimeline: analytics.rsvp_timeline,
                organizerHistoricalShowUpRate: organizerAnalytics?.avg_show_up_rate,
                organizerAvgGoingPerEvent: organizerAnalytics?.avg_going_per_event,
              }}
            />
          )}

          <EventAnalyticsCard analytics={analytics} eventTitle={event.title} />
        </div>
      }
      rightColumn={<RightWidgets variant="convene" />}
    />
  );
};

export default EventAnalytics;
