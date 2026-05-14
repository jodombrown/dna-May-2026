
import React from 'react';
import { Event } from '@/types/search';

interface EventLocationSectionProps {
  event: Event;
}

const EventLocationSection: React.FC<EventLocationSectionProps> = ({ event }) => {
  const getGoogleMapsEmbedUrl = (location: string) => {
    // For demo purposes, we'll use specific locations for each event
    if (event.title === "African Tech Summit 2024") {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.2847474!2d-0.1419!3d51.5074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b2!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1234567890";
    }
    return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.2847474!2d-0.1419!3d51.5074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b2!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1234567890";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Location</h3>
      <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
        <div className="font-medium text-neutral-900">{event.location}</div>
        <div className="w-full h-48 rounded-lg overflow-hidden">
          <iframe
            src={getGoogleMapsEmbedUrl(event.location)}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing ${event.location}`}
          />
        </div>
      </div>
    </div>
  );
};

export default EventLocationSection;
