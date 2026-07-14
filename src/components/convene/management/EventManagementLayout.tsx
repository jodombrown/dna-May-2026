import React from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Mail,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useMobile';
import { Event as ConveneEvent } from '@/types/eventTypes';
import { EventTime } from '@/components/events/EventTime';
import { eventStartMs } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Overview', path: '', icon: LayoutDashboard, roles: ['owner', 'co-host', 'manager', 'promoter'] },
  { label: 'Attendees', path: 'attendees', icon: Users, roles: ['owner', 'co-host', 'manager'] },
  { label: 'Check-In', path: 'check-in', icon: QrCode, roles: ['owner', 'co-host', 'manager', 'check-in'] },
  { label: 'Communications', path: 'communications', icon: Mail, roles: ['owner', 'co-host', 'manager'] },
  { label: 'Analytics', path: 'analytics', icon: BarChart3, roles: ['owner', 'co-host', 'manager', 'promoter'] },
  { label: 'Team', path: 'team', icon: UserCog, roles: ['owner', 'co-host'] },
  // Settings folded into the unified event form — the route redirects to /edit.
  { label: 'Edit event', path: 'settings', icon: Settings, roles: ['owner', 'co-host'] },
];

export interface EventManagementContextType {
  event: ConveneEvent;
  userRole: string;
  isOrganizer: boolean;
  refetchEvent: () => void;
}

export const EventManagementContext = React.createContext<EventManagementContextType | null>(null);

export const useEventManagement = () => {
  const context = React.useContext(EventManagementContext);
  if (!context) {
    throw new Error('useEventManagement must be used within EventManagementLayout');
  }
  return context;
};

const EventManagementLayout: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Fetch event details
  const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useQuery({
    queryKey: ['event-management', eventId],
    queryFn: async () => {
      // Try UUID first, then slug
      let eventData = null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId || '');

      if (isUUID) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        eventData = data;
      }

      if (!eventData) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('slug', eventId)
          .maybeSingle();
        eventData = data;
      }

      if (!eventData) return null;

      // Fetch organizer profile
      const { data: organizer } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', eventData.organizer_id)
        .maybeSingle();

      return { ...eventData, organizer };
    },
    enabled: !!eventId,
  });

  // Fetch user's role for this event
  const { data: userRole = 'none' } = useQuery({
    queryKey: ['event-role', eventId, user?.id],
    queryFn: async () => {
      if (!user || !event) return 'none';

      // Check if user is the organizer (owner)
      if (event.organizer_id === user.id) {
        return 'owner';
      }

      // Check event_roles table
      const { data: roleData } = await supabase
        .from('event_roles')
        .select('role')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      return roleData?.role || 'none';
    },
    enabled: !!user && !!event,
  });

  const isOrganizer = user?.id === event?.organizer_id;

  // Filter nav items by user role
  const filteredNavItems = navItems.filter(item => {
    if (userRole === 'owner') return true;
    return item.roles.includes(userRole);
  });

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" onClick={() => navigate('/dna/convene/events')}>
          Back to Events
        </Button>
      </div>
    );
  }

  // Check access
  if (userRole === 'none') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] gap-4">
        <p className="text-muted-foreground">You don't have permission to manage this event</p>
        <Button variant="outline" onClick={() => navigate(`/dna/convene/events/${eventId}`)}>
          Back to Event
        </Button>
      </div>
    );
  }

  // Completed is DERIVED from the clock (status='completed' has never been
  // written in this project's life); undated events are simply 'upcoming'.
  const startMs = eventStartMs(event);
  const eventStatus = event.is_cancelled
    ? 'cancelled'
    : isEventCompleted(event)
      ? 'completed'
      : startMs !== null && startMs <= Date.now()
        ? 'live'
        : 'upcoming';

  const contextValue: EventManagementContextType = {
    event,
    userRole,
    isOrganizer,
    refetchEvent,
  };

  return (
    <EventManagementContext.Provider value={contextValue}>
      <div className="flex h-[calc(100dvh-64px)] bg-background">
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <aside className="w-64 border-r border-border bg-muted/20 flex flex-col">
            {/* Event Header with Mudcloth pattern */}
            <div className="p-4 border-b border-border relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-repeat pointer-events-none"
                style={{
                  backgroundImage: 'url("/patterns/mudcloth-pattern.svg")',
                  opacity: 0.04,
                }}
              />
              <div className="relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
                  className="mb-3 -ml-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Event
                </Button>
                <h2 className="font-semibold text-lg line-clamp-2">{event.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <EventTime event={event} variant="datetime" notifyAction={false} />
                </div>
                <Badge
                  variant={
                    eventStatus === 'live' ? 'default' :
                    eventStatus === 'cancelled' ? 'destructive' :
                    eventStatus === 'completed' ? 'secondary' :
                    'outline'
                  }
                  className="mt-2"
                >
                  {eventStatus === 'live' ? 'Happening Now' :
                   eventStatus === 'cancelled' ? 'Cancelled' :
                   eventStatus === 'completed' ? 'Completed' :
                   'Upcoming'}
                </Badge>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 overflow-y-auto">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ''}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          {isMobile && (
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
                className="mb-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="font-semibold text-lg line-clamp-1">{event.title}</h1>

              {/* Mobile Navigation Tabs */}
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-4 px-4">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === ''}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )
                    }
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </EventManagementContext.Provider>
  );
};

export default EventManagementLayout;
