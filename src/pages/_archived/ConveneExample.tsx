import React, { useState } from 'react';
import { Calendar, MapPin, Users, Plus, ArrowRight, ChevronRight, Bell, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import FeedbackPanel from '@/components/FeedbackPanel';
import PageSpecificSurvey from '@/components/survey/PageSpecificSurvey';
import { useConveneLogic } from '@/hooks/useConveneLogic';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PageSEO } from '@/components/seo/PageSEO';

const ConveneExample = () => {
  useScrollToTop();
  const {
    upcomingEvents,
    stats,
    isFeedbackPanelOpen,
    setIsFeedbackPanelOpen,
    isRegisterDialogOpen,
    setIsRegisterDialogOpen,
    isCreateEventDialogOpen,
    setIsCreateEventDialogOpen,
    selectedEvent,
    handleRegister,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory
  } = useConveneLogic();

  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

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
    },
    {
      id: 'climate-action',
      name: 'Climate Action Alliance',
      description: 'Environmental sustainability and green energy forums',
      logo: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=120&h=120&fit=crop',
      eventCount: 28,
      followers: 1650
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
    { city: 'Lagos', country: 'Nigeria', count: 23, flag: '🇳🇬', color: 'bg-green-600' },
    { city: 'Nairobi', country: 'Kenya', count: 18, flag: '🇰🇪', color: 'bg-red-600' },
    { city: 'Cape Town', country: 'South Africa', count: 15, flag: '🇿🇦', color: 'bg-blue-600' },
    { city: 'Accra', country: 'Ghana', count: 12, flag: '🇬🇭', color: 'bg-yellow-600' },
    { city: 'London', country: 'United Kingdom', count: 45, flag: '🇬🇧', color: 'bg-blue-800' },
    { city: 'New York', country: 'United States', count: 38, flag: '🇺🇸', color: 'bg-red-700' }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageSEO
        title="Convene: African Diaspora Events & Gatherings"
        description="Discover events connecting the African diaspora worldwide. Tech summits, investment forums, cultural celebrations, and professional networking across Africa and beyond."
        keywords={[
          'african diaspora events',
          'pan-african conferences',
          'diaspora networking events',
          'african tech summit',
          'diaspora investment forum',
          'african cultural events',
        ]}
        canonicalPath="/convene"
      />
      <UnifiedHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Stats */}
        <div className="pt-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Discover Events</h1>
              <p className="text-neutral-600 mt-2">
                Explore events near you, browse by category, or check out featured calendars
              </p>
            </div>
            <EnhancedButton variant="dna" size="lg" onClick={() => setIsCreateEventDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </EnhancedButton>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-dna-emerald mb-1">{stats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-dna-copper mb-1">{stats.totalAttendees.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Attendees</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-dna-forest mb-1">{stats.countriesReached}</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-dna-gold mb-1">{stats.upcomingEvents}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Popular Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Popular Events ({upcomingEvents.length})
              </h2>
              <p className="text-sm text-neutral-600">Trending events in your network</p>
            </div>
            <Button variant="ghost" className="text-dna-emerald hover:text-dna-forest">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {upcomingEvents.map((event) => (
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
                      {event.isVirtual && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-dna-emerald text-white text-xs">Virtual</Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="pt-8 pb-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-neutral-900 line-clamp-1">{event.title}</h3>
                          <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{event.description}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{event.type}</Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {event.time}</span>
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
                        
                        <EnhancedButton 
                          variant="default" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => handleRegister(event)}
                        >
                          Register for Event
                        </EnhancedButton>
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
            <h2 className="text-2xl font-bold text-neutral-900">Browse by Category</h2>
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
                        <h3 className="font-medium text-neutral-900 text-sm">{category.name}</h3>
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
              <h2 className="text-2xl font-bold text-neutral-900">Featured Calendars</h2>
              <p className="text-sm text-neutral-600">Curated event collections from community leaders</p>
            </div>
            <Button variant="ghost" className="text-dna-emerald hover:text-dna-forest">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <h3 className="font-semibold text-neutral-900 truncate">{calendar.name}</h3>
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
                                className="text-xs h-7 px-2 hover:bg-dna-emerald hover:text-white transition-colors w-full"
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
            <h2 className="text-2xl font-bold text-neutral-900">Explore Local Events</h2>
            <p className="text-sm text-neutral-600">See what's happening in major cities and diaspora hubs</p>
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
                        <h3 className="font-medium text-neutral-900 text-sm">{location.city}</h3>
                        <p className="text-xs text-neutral-500">{location.country}</p>
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

        {/* Page-specific Survey CTA */}
        <div className="mt-12 bg-gradient-to-r from-dna-emerald/10 via-dna-copper/10 to-dna-gold/10 rounded-xl p-8 text-center border border-dna-emerald/20">
          <h3 className="text-2xl font-bold text-dna-forest mb-4">
            Help Us Improve Event Experiences
          </h3>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Share your thoughts on diaspora gatherings and networking events. 
            Your feedback will shape how we bring the community together.
          </p>
          <button
            onClick={() => setIsSurveyOpen(true)}
            className="bg-dna-emerald hover:bg-dna-forest text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Share Your Convene Experience
          </button>
        </div>
      </main>

      <Footer />

      {/* Registration Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Complete your registration for this event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted rounded-lg">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{selectedEvent?.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">{selectedEvent?.time}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{selectedEvent?.location}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Type</p>
                <Badge className={selectedEvent?.type === 'Virtual' ? 'bg-dna-emerald' : ''}>
                  {selectedEvent?.type}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter your full name" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" />
              </div>
              <div>
                <Label htmlFor="company">Company/Organization (Optional)</Label>
                <Input id="company" placeholder="Your company name" />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" placeholder="Any questions or special requirements?" rows={3} />
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <EnhancedButton className="w-full" size="lg">
                Confirm Registration
              </EnhancedButton>
              <Button variant="outline" className="w-full" onClick={() => setIsRegisterDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Organize a gathering to bring the diaspora together
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="event-title">Event Title</Label>
                <Input id="event-title" placeholder="African Tech Summit 2025" />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea 
                  id="event-description" 
                  placeholder="Describe your event, its purpose, and what attendees can expect"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <Select>
                  <SelectTrigger id="event-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="forum">Forum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="event-category">Category</Label>
                <Select>
                  <SelectTrigger id="event-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business & Finance</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="culture">Arts & Culture</SelectItem>
                    <SelectItem value="climate">Climate & Environment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="event-date">Date</Label>
                <Input id="event-date" type="date" />
              </div>
              
              <div>
                <Label htmlFor="event-time">Time</Label>
                <Input id="event-time" type="time" />
              </div>
              
              <div>
                <Label htmlFor="event-format">Format</Label>
                <Select>
                  <SelectTrigger id="event-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ComprehensiveLocationInput
                id="event-location"
                label="Location/Platform"
                value=""
                onChange={() => {}}
                placeholder="Search for city and country or enter platform URL"
                required={false}
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <EnhancedButton className="flex-1" size="lg">
                Create Event
              </EnhancedButton>
              <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FeedbackPanel 
        isOpen={isFeedbackPanelOpen}
        onClose={() => setIsFeedbackPanelOpen(false)}
        pageType="convene"
      />
      
      <PageSpecificSurvey
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
        pageType="convene"
      />
    </div>
  );
};

export default ConveneExample;
