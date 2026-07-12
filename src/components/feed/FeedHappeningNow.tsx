/**
 * FeedHappeningNow - Right sidebar widget showing live/imminent events
 * Creates urgency and FOMO — key engagement driver
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface HappeningEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location_name: string | null;
  is_live: boolean;
}

export const FeedHappeningNow: React.FC = () => {
  const navigate = useNavigate();

  const { data: events } = useQuery({
    queryKey: ['feed-happening-now'],
    queryFn: async (): Promise<HappeningEvent[]> => {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Events currently live OR starting within 2 hours
      const { data } = await supabase
        .from('events')
        .select('id, title, start_time, end_time, location_name')
        .eq('status', 'published')
        .lte('start_time', twoHoursFromNow.toISOString())
        .or(`end_time.gte.${now.toISOString()},end_time.is.null`)
        .order('start_time', { ascending: true })
        .limit(3);

      if (!data) return [];

      return data.map((evt) => {
        const start = new Date(evt.start_time);
        const end = evt.end_time ? new Date(evt.end_time) : null;
        const isLive = start <= now && (!end || end >= now);
        return {
          id: evt.id,
          title: evt.title,
          start_time: evt.start_time,
          end_time: evt.end_time,
          location_name: evt.location_name,
          is_live: isLive,
        };
      });
    },
    refetchInterval: 60 * 1000, // Refresh every minute
    staleTime: 30 * 1000,
  });

  if (!events || events.length === 0) return null;

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-500" />
          Happening Now
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-2.5">
          {events.map((evt) => (
            <button
              key={evt.id}
              className="w-full text-left hover:bg-muted rounded-md p-2 -mx-0.5 transition-colors group"
              onClick={() => navigate(`/dna/convene/events/${evt.id}`)}
            >
              <div className="flex items-start gap-2">
                {evt.is_live && (
                  <span className="relative flex h-2.5 w-2.5 mt-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
                {!evt.is_live && (
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                    {evt.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {evt.is_live ? 'Live now' : `Starts ${format(new Date(evt.start_time), 'h:mm a')}`}
                    </span>
                    {evt.location_name && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {evt.location_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
