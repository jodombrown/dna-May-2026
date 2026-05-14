
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { featuredCalendars } from './eventData';
import { useNavigate } from 'react-router-dom';

interface FeaturedCalendarsSectionProps {
  onViewAll?: () => void;
}

const FeaturedCalendarsSection: React.FC<FeaturedCalendarsSectionProps> = ({ onViewAll }) => {
  const navigate = useNavigate();
  
  const handleViewAllCalendars = () => {
    navigate('/convene/featured-calendars');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-neutral-900">Featured Calendars</h3>
          <p className="text-neutral-600">Curated event collections from community leaders</p>
        </div>
        <Button 
          variant="ghost" 
          className="text-dna-emerald hover:text-dna-forest"
          onClick={handleViewAllCalendars}
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
          <CarouselContent className="-ml-2 md:-ml-4">
            <TooltipProvider>
              {featuredCalendars.map((calendar) => (
                <CarouselItem key={calendar.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white shadow-md hover:shadow-xl h-[220px] flex flex-col">
                    <CardContent className="p-8 flex-1 flex flex-col">
                      <div className="flex items-start gap-4 mb-4 flex-1">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={calendar.logo}
                            alt={`${calendar.name} logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 mb-2 truncate">{calendar.name}</h4>
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-3 min-h-[2.5rem]">{calendar.description}</p>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span className="font-medium">{calendar.eventCount} events</span>
                            <span>{calendar.followers} followers</span>
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg mt-auto"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleViewAllCalendars();
                             }}
                          >
                            Learn More
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Discover how featured calendars work</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardContent>
                  </Card>
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

export default FeaturedCalendarsSection;
