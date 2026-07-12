import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errorLogger';

export interface LiveEvent {
  id: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  location_city?: string;
  event_type?: string;
  format?: string;
  attendee_count?: number;
  max_attendees?: number;
  is_featured?: boolean;
  created_at: string;
  organizer_id: string;
  // Legacy fields
  date_time?: string;
  location?: string;
  type?: string;
  is_virtual?: boolean;
  created_by?: string;
}

export const useLiveEvents = (limit: number = 10) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('start_time', { ascending: true })
          .limit(limit);

        if (fetchError) {
          setError(fetchError.message);
          setEvents([]); // Set empty array to allow graceful widget rendering
          return;
        }

        // Transform to include legacy fields
        const transformedEvents = (data || []).map(event => ({
          ...event,
          date_time: event.start_time,
          location: event.location_name || event.location_city || '',
          type: event.event_type,
          is_virtual: event.format === 'virtual' || event.format === 'hybrid',
          created_by: event.organizer_id
        }));

        setEvents(transformedEvents);
      } catch (err: unknown) {
        setError(err instanceof Error ? getErrorMessage(err) : 'Unknown error');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit]);

  return { events, loading, error, refetch: () => window.location.reload() };
};