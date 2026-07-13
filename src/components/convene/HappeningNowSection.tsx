/**
 * DNA | CONVENE — "Happening Now" Section
 * Shows currently live events with pulsing indicator at the top of ConveneHub.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { EVENT_PLACE_SELECT, formatEventPlace, pickEventPlace } from '@/lib/events/formatPlace';

export function HappeningNowSection() {
  const navigate = useNavigate();

  const { data: liveEvents = [] } = useQuery({
    queryKey: ['happening-now-events'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, title, slug, start_time, end_time, ${EVENT_PLACE_SELECT},
          event_type, format, organizer_id,
          event_attendees(count)
        `)
        .eq('status', 'published')
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) return [];
      return data || [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (liveEvents.length === 0) return null;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Happening Now</h2>
      </div>

      {/* Live Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {liveEvents.map((event: Record<string, unknown>) => {
          const attendeeCount = (event.event_attendees as Array<{ count: number }>)?.[0]?.count || 0;
          const startDate = event.start_time ? new Date(event.start_time as string) : null;
          const placeText = formatEventPlace(
            { ...pickEventPlace(event), format: event.format as string | null },
            'compact'
          );

          return (
            <Card
              key={event.id as string}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent group"
              onClick={() => navigate(`/dna/convene/events/${(event.slug as string) || (event.id as string)}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 font-semibold">
                    <span className="relative flex h-1.5 w-1.5 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    LIVE
                  </Badge>
                  {event.event_type && (
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {event.event_type as string}
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-2 group-hover:text-[hsl(var(--module-convene))] transition-colors">
                  {event.title as string}
                </h3>

                {placeText && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    {placeText}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{attendeeCount} attending</span>
                  </div>
                  {startDate && (
                    <span>Started {format(startDate, 'h:mm a')}</span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dna/convene/events/${(event.slug as string) || (event.id as string)}`);
                  }}
                >
                  View Event <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
