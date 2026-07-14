/**
 * FeedUpcomingEvents - Warm, CONVENE-branded upcoming events widget
 * Cross-C moment: CONVENE surfaces on every feed visit
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { eventStartMs, formatEventDateTime } from '@/lib/events/eventTime';

interface UpcomingEvent {
  id: string;
  title: string;
  start_time: string | null;
  time_confirmed: boolean | null;
  date_confirmed: boolean | null;
  location_name: string | null;
  location_city: string | null;
}

export const FeedUpcomingEvents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ['feed-upcoming-events', user?.id],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      if (!user?.id) return [];

      // First try events user has RSVP'd to
      const { data: rsvpData } = await supabase
        .from('event_attendees')
        .select('event_id, events!inner(id, title, start_time, time_confirmed, date_confirmed, location_name, location_city)')
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gt('events.start_time', new Date().toISOString())
        .order('events(start_time)', { ascending: true })
        .limit(3);

      const rsvpEvents = (rsvpData || []).map((row) => {
        const evt = row.events as unknown as UpcomingEvent;
        return {
          id: evt.id,
          title: evt.title,
          start_time: evt.start_time,
          time_confirmed: evt.time_confirmed,
          date_confirmed: evt.date_confirmed,
          location_name: evt.location_name,
          location_city: evt.location_city,
        };
      });

      // If user has RSVP'd events, show those
      if (rsvpEvents.length > 0) return rsvpEvents;

      // Otherwise show upcoming platform events as discovery
      const { data: discoveryData } = await supabase
        .from('events')
        .select('id, title, start_time, time_confirmed, date_confirmed, location_name, location_city')
        .eq('status', 'published')
        .gt('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      return (discoveryData || []).map((evt) => ({
        id: evt.id,
        title: evt.title,
        start_time: evt.start_time,
        time_confirmed: evt.time_confirmed,
        date_confirmed: evt.date_confirmed,
        location_name: evt.location_name,
        location_city: evt.location_city,
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // The queries filter on start_time > now, so rows here are always dated —
  // but never trust a possibly-null timestamp into new Date().
  const getDateParts = (dateStr: string | null) => {
    const ms = eventStartMs({ start_time: dateStr });
    if (ms === null) return { month: 'TBA', day: '·' };
    const date = new Date(ms);
    return {
      month: format(date, 'MMM').toUpperCase(),
      day: format(date, 'd'),
    };
  };

  if (isLoading) return null;

  // Empty state — warm invitation
  if (!events || events.length === 0) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm">
        {/* Amber accent stripe */}
        <div className="h-1 bg-[hsl(var(--dna-gold))]" />
        <div className="px-3 pt-3 pb-4 text-center">
          <Calendar className="h-8 w-8 mx-auto text-[hsl(var(--dna-gold))] opacity-60 mb-2" />
          <p className="text-sm font-medium text-foreground">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discover what's happening in the diaspora</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs border-[hsl(var(--dna-gold)/0.4)] text-[hsl(var(--dna-gold))] hover:bg-amber-50 dark:hover:bg-amber-950/20"
            onClick={() => navigate('/dna/convene')}
          >
            Explore Events
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Amber accent stripe */}
      <div className="h-1 bg-[hsl(var(--dna-gold))]" />

      {/* Header with count badge */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[hsl(var(--dna-gold))]" />
          Upcoming For You
        </h3>
        <Badge variant="convene" className="text-[10px] px-1.5 py-0">
          {events.length}
        </Badge>
      </div>

      {/* Event list */}
      <div className="px-2 pb-2 space-y-0.5">
        {events.map((evt) => {
          const dateParts = getDateParts(evt.start_time);
          return (
            <button
              key={evt.id}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group text-left"
              onClick={() => navigate(`/dna/convene/events/${evt.id}`)}
            >
              {/* Luma-style date box — 48x48 */}
              <div className="shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--dna-gold)/0.12)] border border-[hsl(var(--dna-gold)/0.25)] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-[hsl(var(--dna-gold))] leading-none">
                  {dateParts.month}
                </span>
                <span className="text-base font-bold text-foreground leading-none mt-0.5">
                  {dateParts.day}
                </span>
              </div>
              {/* Event info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1 group-hover:text-[hsl(var(--dna-gold))] transition-colors">
                  {evt.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <span>{formatEventDateTime(evt, 'compact')}</span>
                  {(evt.location_name || evt.location_city) && (
                    <>
                      <span>·</span>
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{evt.location_name || evt.location_city}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer link */}
      <button
        className="w-full flex items-center justify-center gap-1 py-2 border-t border-border/50 text-xs font-medium text-muted-foreground hover:text-[hsl(var(--dna-gold))] hover:bg-amber-50/60 dark:hover:bg-amber-950/10 transition-colors"
        onClick={() => navigate('/dna/convene')}
      >
        View All Events
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
};
