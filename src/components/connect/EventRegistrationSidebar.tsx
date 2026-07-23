
import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Event } from '@/types/search';
import EventNavigationHeader from './sidebar/EventNavigationHeader';
import EventRegistrationHeader from './sidebar/EventRegistrationHeader';
import EventTicketSection from './sidebar/EventTicketSection';
import EventDetailsSection from './sidebar/EventDetailsSection';
import EventAboutSection from './sidebar/EventAboutSection';
import { LocationMap } from '@/components/maps/LocationMap';
import EventPresenterSection from './sidebar/EventPresenterSection';
import EventHostSection from './sidebar/EventHostSection';
import EventActionsSection from './sidebar/EventActionsSection';
import EventSocialSection from './sidebar/EventSocialSection';
import EventDemoDialogs from './sidebar/EventDemoDialogs';

interface EventRegistrationSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onRegister: () => void;
  onCreatorClick?: (creatorId: string) => void;
  // New props for navigation
  onPreviousEvent?: () => void;
  onNextEvent?: () => void;
  hasPreviousEvent?: boolean;
  hasNextEvent?: boolean;
}

const EventRegistrationSidebar: React.FC<EventRegistrationSidebarProps> = ({
  open,
  onOpenChange,
  event,
  onRegister,
  onCreatorClick,
  onPreviousEvent,
  onNextEvent,
  hasPreviousEvent = true,
  hasNextEvent = true
}) => {
  const [demoExplanationOpen, setDemoExplanationOpen] = useState(false);
  const [contactHostDialogOpen, setContactHostDialogOpen] = useState(false);
  const [reportEventDialogOpen, setReportEventDialogOpen] = useState(false);
  const [viewAllEventsDialogOpen, setViewAllEventsDialogOpen] = useState(false);

  if (!event) return null;

  const handleRegisterClick = () => {
    setDemoExplanationOpen(true);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-xl p-0 overflow-hidden bg-white border-0 shadow-2xl [&>button]:hidden"
          style={{ 
            zIndex: 1000,
          }}
        >
          <div className="flex flex-col h-full bg-white">
            <EventNavigationHeader
              event={event}
              onPrevious={onPreviousEvent}
              onNext={onNextEvent}
              hasPrevious={hasPreviousEvent}
              hasNext={hasNextEvent}
              onClose={handleClose}
            />
            
            <EventRegistrationHeader event={event} />

            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              <EventTicketSection onRegister={handleRegisterClick} />
              <EventDetailsSection event={event} />
              <EventAboutSection event={event} />
              <LocationMap
                locationName={event.location_name ?? undefined}
                locationAddress={event.location_address ?? undefined}
                locality={
                  [event.location_city, event.location_state, event.location_country]
                    .filter(Boolean)
                    .join(', ') || event.location || undefined
                }
                lat={event.location_lat ?? undefined}
                lng={event.location_lng ?? undefined}
              />
              <EventPresenterSection />
              <EventHostSection event={event} onCreatorClick={onCreatorClick} />
              <EventActionsSection 
                onContactHost={() => setContactHostDialogOpen(true)}
                onReportEvent={() => setReportEventDialogOpen(true)}
              />
              <EventSocialSection event={event} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs with higher z-index to appear above the sidebar */}
      <div style={{ zIndex: 1100 }}>
        <EventDemoDialogs
          demoExplanationOpen={demoExplanationOpen}
          setDemoExplanationOpen={setDemoExplanationOpen}
          contactHostDialogOpen={contactHostDialogOpen}
          setContactHostDialogOpen={setContactHostDialogOpen}
          reportEventDialogOpen={reportEventDialogOpen}
          setReportEventDialogOpen={setReportEventDialogOpen}
          viewAllEventsDialogOpen={viewAllEventsDialogOpen}
          setViewAllEventsDialogOpen={setViewAllEventsDialogOpen}
        />
      </div>
    </>
  );
};

export default EventRegistrationSidebar;
