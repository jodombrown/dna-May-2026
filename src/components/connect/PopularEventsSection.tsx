
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { Event } from '@/types/search';
import { ConveneEventCard } from '@/components/convene/ConveneEventCard';

interface PopularEventsSectionProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onRegisterEvent: (event: Event) => void;
  onCreatorClick?: (creatorId: string) => void;
  onViewAll?: () => void;
}

const PopularEventsSection: React.FC<PopularEventsSectionProps> = ({ 
  events, 
  onEventClick, 
  onRegisterEvent,
  onCreatorClick,
  onViewAll
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-neutral-900">
            Popular Events ({events.length})
          </h3>
          <p className="text-neutral-600">Trending events in your network</p>
        </div>
        <Button 
          variant="ghost" 
          className="text-dna-emerald hover:text-dna-forest"
          onClick={onViewAll}
        >
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="relative px-12">
        <Carousel 
          className="w-full"
          plugins={[WheelGesturesPlugin()]}
          opts={{
            align: "start",
            loop: false,
            dragFree: true,
          }}
        >
          <CarouselContent className="-ml-4">
            {events.map((event) => (
              <CarouselItem key={event.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
                <div className="h-[420px]">
                  <ConveneEventCard
                    event={event}
                    showRsvp
                    onRsvp={() => onRegisterEvent(event)}
                    onClick={() => onEventClick(event)}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 h-8 w-8 bg-white shadow-lg border-2 hover:bg-dna-emerald hover:text-white hover:border-dna-emerald transition-all duration-200" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 h-8 w-8 bg-white shadow-lg border-2 hover:bg-dna-emerald hover:text-white hover:border-dna-emerald transition-all duration-200" />
        </Carousel>
      </div>
    </div>
  );
};

export default PopularEventsSection;
