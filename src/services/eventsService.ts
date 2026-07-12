import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/search';
import type { Database } from '@/integrations/supabase/types';

type EventType = Database['public']['Enums']['event_type'];

interface EventSearchFilters {
  type?: EventType;
  is_virtual?: boolean;
  upcoming_only?: boolean;
}

export const searchEvents = async (searchTerm: string = '', filters: EventSearchFilters = {}): Promise<Event[]> => {
  let query = supabase.from('events').select('*').eq('status', 'published');
  
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim();
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,event_type.ilike.%${term}%,location_name.ilike.%${term}%,location_city.ilike.%${term}%`);
  }
  
  if (filters.type) {
    query = query.eq('event_type', filters.type);
  }
  
  if (filters.is_virtual !== undefined) {
    if (filters.is_virtual) {
      query = query.or('format.eq.virtual,format.eq.hybrid');
    } else {
      query = query.eq('format', 'in_person');
    }
  }
  
  if (filters.upcoming_only) {
    query = query.gte('start_time', new Date().toISOString());
  }
  
  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};
