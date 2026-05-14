
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { eventCategories } from './eventData';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const EventCategoriesSection: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCategoryClick = (category: any) => {
    // Navigate to events page with category filter
    const categorySlug = category.id.toLowerCase();
    navigate(`/dna/convene/events?category=${categorySlug}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-neutral-900">Browse by Category</h3>
        <p className="text-neutral-600">Find events that match your interests</p>
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
              {eventCategories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Card 
                         className="hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white shadow-md hover:shadow-xl h-full"
                         onClick={() => handleCategoryClick(category)}
                       >
                        <CardContent className="p-8 text-center">
                          <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-3xl">{category.icon}</span>
                          </div>
                          <h4 className="font-semibold text-neutral-900 text-base mb-2">{category.name}</h4>
                          <p className="text-sm text-neutral-500">{category.count}</p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3 bg-dna-forest text-white border-dna-emerald">
                      <p className="text-sm font-medium">{category.description}</p>
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

export default EventCategoriesSection;
