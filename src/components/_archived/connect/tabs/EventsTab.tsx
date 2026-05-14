
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Plus, ArrowRight, ChevronRight, Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface EventsTabProps {
  searchTerm: string;
}

const EventsTab: React.FC<EventsTabProps> = ({ searchTerm }) => {
  // Popular/Featured Events
  const popularEvents = [
    {
      id: '1',
      title: 'African Tech Leaders Summit 2024',
      description: 'Annual gathering of tech leaders driving innovation across Africa and the diaspora.',
      type: 'Conference',
      date: '2024-12-15',
      time: '09:00',
      location: 'Lagos, Nigeria',
      isVirtual: false,
      attendeeCount: 450,
      isFeatured: true,
      eventLogo: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=120&h=120&fit=crop',
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=200&fit=crop',
      creatorName: 'Dr. Amina Hassan',
      creatorImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: '2',
      title: 'Diaspora Investment Forum',
      description: 'Connecting diaspora investors with African startups and impact opportunities.',
      type: 'Forum',
      date: '2025-01-22',
      time: '14:00',
      location: 'Virtual Event',
      isVirtual: true,
      attendeeCount: 280,
      isFeatured: true,
      eventLogo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=120&fit=crop',
      bannerImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=200&fit=crop',
      creatorName: 'Michael Adebayo',
      creatorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: '3',
      title: 'Women in Finance Networking',
      description: 'Professional networking and mentorship event for African women in financial services.',
      type: 'Networking',
      date: '2024-12-28',
      time: '18:00',
      location: 'London, UK',
      isVirtual: false,
      attendeeCount: 120,
      isFeatured: false,
      eventLogo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop',
      bannerImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=200&fit=crop',
      creatorName: 'Grace Kimani',
      creatorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face'
    }
  ];

  // Featured Calendars/Communities
  const featuredCalendars = [
    {
      id: 'tech-innovators',
      name: 'African Tech Innovators',
      description: 'Curating the best tech events across Africa',
      logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=120&h=120&fit=crop',
      eventCount: 24,
      followers: 1200
    },
    {
      id: 'diaspora-invest',
      name: 'Diaspora Investment Circle',
      description: 'Investment opportunities and networking events',
      logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=120&fit=crop',
      eventCount: 18,
      followers: 850
    },
    {
      id: 'women-leadership',
      name: 'Women Leadership Network',
      description: 'Empowering African women in leadership',
      logo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop',
      eventCount: 32,
      followers: 2100
    }
  ];

  // Categories for browsing
  const eventCategories = [
    { 
      id: 'tech', 
      name: 'Technology', 
      icon: '💻', 
      count: '145 Events', 
      color: 'bg-blue-500',
      description: 'Tech conferences, startup events, AI summits, coding bootcamps, and digital innovation workshops'
    },
    { 
      id: 'business', 
      name: 'Business & Finance', 
      icon: '💼', 
      count: '89 Events', 
      color: 'bg-green-500',
      description: 'Investment forums, entrepreneurship workshops, trade missions, and business networking events'
    },
    { 
      id: 'culture', 
      name: 'Arts & Culture', 
      icon: '🎨', 
      count: '67 Events', 
      color: 'bg-copper-500',
      description: 'Art exhibitions, cultural festivals, music concerts, film screenings, and creative showcases'
    },
    { 
      id: 'health', 
      name: 'Health & Wellness', 
      icon: '🏥', 
      count: '45 Events', 
      color: 'bg-red-500',
      description: 'Medical conferences, wellness workshops, mental health seminars, and healthcare innovation forums'
    },
    { 
      id: 'education', 
      name: 'Education', 
      icon: '📚', 
      count: '78 Events', 
      color: 'bg-yellow-500',
      description: 'Academic conferences, skill development workshops, scholarships info sessions, and educational seminars'
    },
    { 
      id: 'climate', 
      name: 'Climate & Environment', 
      icon: '🌍', 
      count: '34 Events', 
      color: 'bg-emerald-500',
      description: 'Climate action summits, sustainability workshops, green energy forums, and environmental conservation events'
    }
  ];

  // Local/Regional Events
  const localEvents = [
    { city: 'Lagos', count: 23, flag: '🇳🇬', color: 'bg-green-600' },
    { city: 'Nairobi', count: 18, flag: '🇰🇪', color: 'bg-red-600' },
    { city: 'Cape Town', count: 15, flag: '🇿🇦', color: 'bg-blue-600' },
    { city: 'Accra', count: 12, flag: '🇬🇭', color: 'bg-yellow-600' },
    { city: 'London', count: 45, flag: '🇬🇧', color: 'bg-blue-800' },
    { city: 'New York', count: 38, flag: '🇺🇸', color: 'bg-red-700' }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Create Event Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Discover Events</h2>
          <p className="text-neutral-600 mt-1">
            Explore events near you, browse by category, or check out featured calendars
          </p>
        </div>
        <Button variant="default">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Popular Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              Popular Events ({popularEvents.length})
            </h3>
            <p className="text-sm text-neutral-600">Trending events in your network</p>
          </div>
          <Button variant="ghost" className="text-dna-emerald hover:text-dna-forest">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {popularEvents.map((event) => (
              <CarouselItem key={event.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
                  <div className="relative">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Event Logo */}
                    <div className="absolute -bottom-6 left-4">
                      <div className="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden bg-white">
                        <img
                          src={event.eventLogo}
                          alt={`${event.title} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Creator */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 shadow-sm">
                        <img
                          src={event.creatorImage}
                          alt={event.creatorName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-neutral-700 max-w-[60px] truncate">
                          {event.creatorName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="pt-8 pb-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-neutral-900 line-clamp-1">{event.title}</h4>
                        <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{event.description}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                        {event.isVirtual && (
                          <Badge className="bg-dna-emerald text-white text-xs">Virtual</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{event.date} at {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{event.attendeeCount} attending</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Browse by Category Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">Browse by Category</h3>
          <p className="text-sm text-neutral-600">Find events that match your interests</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <TooltipProvider>
            {eventCategories.map((category) => (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <h4 className="font-medium text-neutral-900 text-sm">{category.name}</h4>
                      <p className="text-xs text-neutral-500 mt-1">{category.count}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="text-sm">{category.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Featured Calendars Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Featured Calendars</h3>
            <p className="text-sm text-neutral-600">Curated event collections from community leaders</p>
          </div>
          <Button variant="ghost" className="text-dna-emerald hover:text-dna-forest">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TooltipProvider>
            {featuredCalendars.map((calendar) => (
              <Card key={calendar.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={calendar.logo}
                        alt={`${calendar.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 truncate">{calendar.name}</h4>
                      <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{calendar.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>{calendar.eventCount} events</span>
                        <span>{calendar.followers} followers</span>
                      </div>
                      <div className="mt-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-7 px-2 hover:bg-dna-emerald hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Demo functionality
                              }}
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Subscribe
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Get notified about new events from this calendar</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-dna-emerald transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Explore Local Events Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900">Explore Local Events</h3>
          <p className="text-sm text-neutral-600">Discover what's happening in major African cities and diaspora hubs</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <TooltipProvider>
            {localEvents.map((location) => (
              <Tooltip key={location.city}>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${location.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{location.flag}</span>
                      </div>
                      <h4 className="font-medium text-neutral-900 text-sm">{location.city}</h4>
                      <p className="text-xs text-neutral-500 mt-1">{location.count} Events</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Explore networking events, conferences, and community gatherings in {location.city}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default EventsTab;
