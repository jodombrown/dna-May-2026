import React, { useState, useMemo } from 'react';
import Footer from '@/components/Footer';
import ConnectEventsTab from '@/components/connect/tabs/ConnectEventsTab';
import EventRegistrationSidebar from '@/components/connect/EventRegistrationSidebar';
import { Event } from '@/types/search';
import { sampleConveneEvents } from '@/data/sampleConveneEvents';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { getErrorMessage } from '@/lib/errorLogger';

const Convene = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use sample events for marketing page
  const events = useMemo(() => sampleConveneEvents as Event[], []);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSidebarOpen(true);
  };

  const handleRegisterEvent = async () => {
    if (!selectedEvent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to register for events",
          variant: "destructive",
        });
        return;
      }

      // Insert registration
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: selectedEvent.id,
          user_id: user.id,
          status: 'going'
        });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: `You're registered for ${selectedEvent.title}`,
      });
      
      setSidebarOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Registration Failed",
        description: getErrorMessage(error) || "Unable to register for event",
        variant: "destructive",
      });
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    toast({
      title: "Creator Profile",
      description: "Viewing creator's profile...",
    });
  };

  const handleViewAll = () => {
    toast({
      title: "View All Events",
      description: "In the full DNA platform, this feature lets you browse all upcoming diaspora events with advanced filtering by location, date, type, and interests.",
    });
  };

  // Navigation between events in sidebar
  const currentEventIndex = selectedEvent 
    ? events.findIndex(e => e.id === selectedEvent.id)
    : -1;

  const handlePreviousEvent = () => {
    if (currentEventIndex > 0) {
      setSelectedEvent(events[currentEventIndex - 1] as Event);
    }
  };

  const handleNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setSelectedEvent(events[currentEventIndex + 1] as Event);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 pt-24">
        <ConnectEventsTab
          events={events as Event[]}
          onEventClick={handleEventClick}
          onRegisterEvent={handleEventClick}
          onCreatorClick={handleCreatorClick}
          onViewAll={handleViewAll}
        />
      </main>

      <EventRegistrationSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        event={selectedEvent}
        onRegister={handleRegisterEvent}
        onCreatorClick={handleCreatorClick}
        onPreviousEvent={handlePreviousEvent}
        onNextEvent={handleNextEvent}
        hasPreviousEvent={currentEventIndex > 0}
        hasNextEvent={currentEventIndex < events.length - 1}
      />

      <Footer />
    </div>
  );
};

export default Convene;
