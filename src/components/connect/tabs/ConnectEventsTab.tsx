
import React from 'react';
import PopularEventsSection from '../PopularEventsSection';
import EventCategoriesSection from '../EventCategoriesSection';
import FeaturedCalendarsSection from '../FeaturedCalendarsSection';
import LocalEventsSection from '../LocalEventsSection';
import { Event } from '@/types/search';

interface ConnectEventsTabProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onRegisterEvent: (event: Event) => void;
  onCreatorClick: (creatorId: string) => void;
  onViewAll: () => void;
}

const ConnectEventsTab: React.FC<ConnectEventsTabProps> = ({
  events,
  onEventClick,
  onRegisterEvent,
  onCreatorClick,
  onViewAll
}) => {
  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Discover Events</h2>
        <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
          Explore, share, and create events near you, building meaningful connections through gatherings that matter
        </p>
      </div>

      <PopularEventsSection 
        events={events}
        onEventClick={onEventClick}
        onRegisterEvent={onRegisterEvent}
        onCreatorClick={onCreatorClick}
        onViewAll={onViewAll}
      />

      <EventCategoriesSection />

      <FeaturedCalendarsSection />

      <LocalEventsSection />
    </div>
  );
};

export default ConnectEventsTab;
