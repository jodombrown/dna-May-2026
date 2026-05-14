
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { MapPin, Calendar } from 'lucide-react';
import { localEvents } from './eventData';
import { useNavigate } from 'react-router-dom';

const LocalEventsSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCityClick = () => {
    navigate('/convene/local-events');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900">Explore Local Events</h3>
        <p className="text-neutral-600">See what's happening in major cities and diaspora hubs</p>
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
          <CarouselContent className="-ml-2 md:-ml-4">
            <TooltipProvider>
              {localEvents.map((location) => (
                <CarouselItem key={location.city} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Card 
                         className="hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white shadow-md hover:shadow-xl h-full"
                         onClick={handleCityClick}
                       >
                         <CardContent className="p-6 text-center">
                           <div className="flex flex-col items-center space-y-4">
                             {/* Flag and Country Visual */}
                             <div className="relative">
                               <div className="w-14 h-14 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                 <span className="text-2xl">{location.flag}</span>
                               </div>
                             </div>
                             
                             {/* City and Country Names */}
                             <div className="text-center space-y-1">
                               <h4 className="font-semibold text-neutral-900 text-sm">{location.city}</h4>
                               <p className="text-xs text-neutral-600">{location.country}</p>
                             </div>
                             
                             {/* Event Count with Icon */}
                             <div className="flex items-center gap-1 px-3 py-1 bg-neutral-50 rounded-full">
                               <Calendar className="w-3 h-3 text-dna-emerald" />
                               <p className="text-xs font-medium text-neutral-700">{location.count} Events</p>
                             </div>
                           </div>
                         </CardContent>
                      </Card>
                    </TooltipTrigger>
                     <TooltipContent>
                       <p className="text-sm">Explore networking events, conferences, and community gatherings in {location.city}, {location.country}</p>
                     </TooltipContent>
                  </Tooltip>
                </CarouselItem>
              ))}
            </TooltipProvider>
          </CarouselContent>
          
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 h-8 w-8 bg-white shadow-lg border-2 hover:bg-dna-emerald hover:text-white hover:border-dna-emerald transition-all duration-200" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 h-8 w-8 bg-white shadow-lg border-2 hover:bg-dna-emerald hover:text-white hover:border-dna-emerald transition-all duration-200" />
        </Carousel>
      </div>
    </div>
  );
};

export default LocalEventsSection;
