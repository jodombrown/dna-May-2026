
import { Event, EventFilters } from '@/types/eventTypes';
import { eventStartMs } from '@/lib/events/eventTime';

export const filterEvents = (events: Event[], filters: EventFilters): Event[] => {
  return events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesType = filters.typeFilter === 'all' || event.type === filters.typeFilter;
    
    const now = new Date();
    // Null-safe: an undated event is neither upcoming nor past.
    const startMs = eventStartMs({
      start_time: event.start_time ?? event.date_time,
      date_confirmed: event.date_confirmed,
    });

    let matchesTab = true;
    if (filters.activeTab === 'upcoming') {
      matchesTab = startMs !== null && startMs > now.getTime();
    } else if (filters.activeTab === 'past') {
      matchesTab = startMs !== null && startMs < now.getTime();
    } else if (filters.activeTab === 'featured') {
      matchesTab = event.is_featured;
    }
    
    return matchesSearch && matchesType && matchesTab;
  });
};
