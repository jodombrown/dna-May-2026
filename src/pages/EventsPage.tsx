import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import UnifiedHeader from '@/components/UnifiedHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { EventCard } from '@/components/events/EventCard';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EventListItem, EventType, EventFormat } from '@/types/events';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EVENTS_REFETCH_INTERVAL_MS = 60_000;

type EventFilter = 'upcoming' | 'past' | 'my_events' | 'attending';

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EventFilter>('upcoming');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<EventFormat | 'all'>('all');

  // Realtime removed: 60s refetch sufficient for events discovery
  // (Phase 2 audit). Events are infrequent compared to reactions/comments,
  // so the cost of an unfiltered realtime channel is not justified.
  const { data: events, refetch, isLoading } = useQuery({
    queryKey: ['events', user?.id, activeTab, typeFilter, formatFilter],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_events', {
        p_user_id: user.id,
        p_filter: activeTab,
        p_event_type: typeFilter === 'all' ? null : typeFilter,
        p_format: formatFilter === 'all' ? null : formatFilter,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;
      return (data || []) as EventListItem[];
    },
    enabled: !!user,
    refetchInterval: EVENTS_REFETCH_INTERVAL_MS,
  });

  const filteredEvents = events?.filter((event) =>
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">
              Discover and organize diaspora gatherings
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Host an Event
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as EventFilter)}
          >
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="my_events">My Events</TabsTrigger>
              <TabsTrigger value="attending">Attending</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EventType | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as EventFormat | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading events...
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try a different search term'
                : activeTab === 'my_events'
                ? "You haven't created any events yet"
                : activeTab === 'attending'
                ? "You're not attending any events yet"
                : 'Be the first to organize an event!'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Host an Event
              </Button>
            )}
          </div>
        )}
        </div>
      </div>

      <CreateEventDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        currentUserId={user?.id || ''}
        onSuccess={(eventId) => {
          refetch();
          navigate(`/dna/convene/events/${eventId}`);
        }}
      />
      <MobileBottomNav />
    </>
  );
}
