import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Navigation, Map, Clock, Users, Search, Bell, Calendar, Globe2, TrendingUp, Heart, Home, CheckCircle2, XCircle } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Nkonsonkonson } from '@/components/icons/adinkra';

const LocalEventsPage = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [activeRadius, setActiveRadius] = useState('city');

  const sampleCities = [
    { city: 'New York', count: '450+', flag: '🇺🇸', color: 'from-dna-emerald to-dna-forest' },
    { city: 'London', count: '320+', flag: '🇬🇧', color: 'from-dna-copper to-dna-gold' },
    { city: 'Lagos', count: '280+', flag: '🇳🇬', color: 'from-dna-emerald to-dna-mint' },
    { city: 'Toronto', count: '190+', flag: '🇨🇦', color: 'from-dna-copper to-cultural-sunset' },
    { city: 'Johannesburg', count: '240+', flag: '🇿🇦', color: 'from-dna-terra to-dna-sunset' },
    { city: 'Paris', count: '210+', flag: '🇫🇷', color: 'from-dna-forest to-cultural-purple' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button
          variant="ghost"
          onClick={() => navigate('/convene')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Split Hero Section - Different from Featured Calendars */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="flex flex-col justify-center space-y-6">
            <Badge className="w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-2">
              <MapPin className="h-4 w-4 mr-2" />
              Location-Based Discovery
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your Community.<br />
              <span className="text-primary">Right Where You Are.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Stop scrolling through events happening across the world. Discover diaspora gatherings 
              in your neighborhood, city, and region - all automatically filtered by distance from you.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold">200+</p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold">5,000+</p>
                  <p className="text-xs text-muted-foreground">Local Events</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold">Built for</p>
                  <p className="text-xs text-muted-foreground">Community</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Cities Grid */}
          <div className="grid grid-cols-2 gap-4">
            {sampleCities.map((city, index) => (
              <Card 
                key={index} 
                className={`p-6 bg-gradient-to-br ${city.color} hover:scale-105 transition-transform cursor-pointer group`}
              >
                <div className="text-5xl mb-3">{city.flag}</div>
                <h3 className="text-xl font-bold mb-1 text-white drop-shadow-lg">{city.city}</h3>
                <p className="text-white drop-shadow-md text-sm mb-3 font-medium">{city.count} events nearby</p>
                <Button 
                  size="sm" 
                  className="w-full bg-white/90 hover:bg-white text-neutral-900 border-0 font-semibold shadow-md"
                >
                  Explore Events
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Problem vs Solution - Alternating Layout */}
        <div className="mb-16 bg-muted/30 rounded-xl p-8 md:p-12">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Local Discovery Changes Everything</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problems */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-destructive/5 rounded-xl border border-destructive/20">
                <XCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Scrolling Through Noise</h3>
                  <p className="text-muted-foreground text-sm">
                    Seeing hundreds of events across the world while missing the amazing gathering happening just 3 miles away.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-destructive/5 rounded-xl border border-destructive/20">
                <XCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Wasting Precious Time</h3>
                  <p className="text-muted-foreground text-sm">
                    Hours spent filtering through irrelevant events in cities you'll never visit.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-destructive/5 rounded-xl border border-destructive/20">
                <XCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Missing Your Community</h3>
                  <p className="text-muted-foreground text-sm">
                    Diaspora members living nearby who you never meet because you can't find local events.
                  </p>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Location-First Discovery</h3>
                  <p className="text-muted-foreground text-sm">
                    See events sorted by distance. The closest opportunities always appear first.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Custom Travel Radius</h3>
                  <p className="text-muted-foreground text-sm">
                    Set how far you're willing to go - 5 miles, 20 miles, or your whole metro area.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-xl border border-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">Instant Local Alerts</h3>
                  <p className="text-muted-foreground text-sm">
                    Get notified when events are added in your area. Never miss local connections again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Radius Selector - Tabs Layout */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Choose Your Discovery Radius</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Control exactly how far you want to explore. Switch between views instantly to find the perfect balance.
            </p>
          </div>

          <Tabs value={activeRadius} onValueChange={setActiveRadius} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-2">
              <TabsTrigger value="hyper" className="py-4 data-[state=active]:bg-dna-emerald data-[state=active]:text-white">
                <Home className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <p className="font-bold">Hyper-Local</p>
                  <p className="text-xs opacity-70">Within 5 miles</p>
                </div>
              </TabsTrigger>
              <TabsTrigger value="city" className="py-4 data-[state=active]:bg-dna-forest data-[state=active]:text-white">
                <Map className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <p className="font-bold">City-Wide</p>
                  <p className="text-xs opacity-70">Within 20 miles</p>
                </div>
              </TabsTrigger>
              <TabsTrigger value="metro" className="py-4 data-[state=active]:bg-cultural-purple data-[state=active]:text-white">
                <Globe2 className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <p className="font-bold">Metro Area</p>
                  <p className="text-xs opacity-70">Within 50+ miles</p>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hyper" className="mt-0">
              <Card className="p-8 bg-gradient-to-br from-dna-mint/30 to-dna-emerald/20 border-dna-emerald/30">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-dna-emerald rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">Walking Distance Events</h3>
                    <p className="text-muted-foreground mb-6">
                      Perfect for busy schedules. Discover gatherings you can walk or bike to - neighborhood meetups, 
                      coffee shop conversations, and community activities right in your area.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-emerald" />
                        <span>Neighborhood meetups</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-emerald" />
                        <span>Local coffee gatherings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-emerald" />
                        <span>Community board meetings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-emerald" />
                        <span>Walking-distance events</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="city" className="mt-0">
              <Card className="p-8 bg-gradient-to-br from-dna-forest/10 to-dna-emerald/10 border-dna-forest/30">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-dna-forest rounded-lg flex items-center justify-center flex-shrink-0">
                    <Map className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">Explore Your City</h3>
                    <p className="text-muted-foreground mb-6">
                      Venture across town for worthwhile experiences. Find festivals, professional networking, 
                      cultural performances, and workshops happening throughout your city.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-forest" />
                        <span>City festivals & celebrations</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-forest" />
                        <span>Professional networking</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-forest" />
                        <span>Cultural performances</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-dna-forest" />
                        <span>Workshops & classes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="metro" className="mt-0">
              <Card className="p-8 bg-gradient-to-br from-cultural-purple/10 to-dna-copper/10 border-cultural-purple/30">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-cultural-purple rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe2 className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">Regional Connections</h3>
                    <p className="text-muted-foreground mb-6">
                      Expand your reach for major events. Discover conferences, large-scale cultural gatherings, 
                      and special celebrations happening across your metro region.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-cultural-purple" />
                        <span>Regional conferences</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-cultural-purple" />
                        <span>Major cultural events</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-cultural-purple" />
                        <span>Large-scale gatherings</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-cultural-purple" />
                        <span>Special celebrations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* How It Works - Horizontal Timeline */}
        <div className="mb-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 md:p-12">
          <h2 className="text-4xl font-bold mb-4 text-center">How It Works</h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Four simple steps to start discovering events in your area
          </p>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-primary/20" />
            
            <div className="grid lg:grid-cols-4 gap-8 relative">
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto relative z-10">
                    <MapPin className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-primary font-bold text-primary">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold">Set Your Location</h3>
                <p className="text-muted-foreground text-sm">
                  Share your location or manually enter your city. Your privacy is protected.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto relative z-10">
                    <Navigation className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-primary font-bold text-primary">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold">Choose Your Radius</h3>
                <p className="text-muted-foreground text-sm">
                  Select how far you're willing to travel - from your immediate neighborhood to metro region.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto relative z-10">
                    <Search className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-primary font-bold text-primary">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold">Browse Local Events</h3>
                <p className="text-muted-foreground text-sm">
                  See events organized by distance. Filter by date, type, and your interests.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto relative z-10">
                    <Users className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-primary font-bold text-primary">
                    4
                  </div>
                </div>
                <h3 className="text-xl font-bold">Connect & Attend</h3>
                <p className="text-muted-foreground text-sm">
                  RSVP to events, coordinate with other local attendees, and build your network.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Use Cases - Story Cards */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center">Real Stories, Real Community</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-0 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="h-48 bg-gradient-to-br from-dna-emerald to-dna-mint flex items-center justify-center">
                <TrendingUp className="h-20 w-20 text-white" />
              </div>
              <div className="p-6">
                <Badge className="mb-3">New to the City</Badge>
                <h3 className="text-xl font-bold mb-3">Finding Home in Atlanta</h3>
                <p className="text-muted-foreground italic mb-4">
                  "I just moved here and wanted to meet other young professionals. Local events showed me 
                  weekly meetups within walking distance. Now I have a whole community!"
                </p>
                <p className="text-sm text-muted-foreground">- Sarah, 28</p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="h-48 bg-gradient-to-br from-dna-copper to-cultural-sunset flex items-center justify-center">
                <Heart className="h-20 w-20 text-white" />
              </div>
              <div className="p-6">
                <Badge className="mb-3">Busy Parent</Badge>
                <h3 className="text-xl font-bold mb-3">Quality Time, Close to Home</h3>
                <p className="text-muted-foreground italic mb-4">
                  "With two kids, I can't travel far. The local filter shows family-friendly cultural events 
                  within 10 miles. We participate without the hassle."
                </p>
                <p className="text-sm text-muted-foreground">- Michael, 35</p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="h-48 bg-gradient-to-br from-dna-forest to-dna-emerald flex items-center justify-center">
                <Users className="h-20 w-20 text-white" />
              </div>
              <div className="p-6">
                <Badge className="mb-3">Community Builder</Badge>
                <h3 className="text-xl font-bold mb-3">Connecting the Dots</h3>
                <p className="text-muted-foreground italic mb-4">
                  "I organize neighborhood events and use local discovery to see what's happening nearby. 
                  It helps me coordinate and avoid scheduling conflicts."
                </p>
                <p className="text-sm text-muted-foreground">- Amara, 42</p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="h-48 bg-gradient-to-br from-cultural-purple to-dna-copper flex items-center justify-center">
                <Nkonsonkonson className="h-20 w-20 text-white" />
              </div>
              <div className="p-6">
                <Badge className="mb-3">Weekend Explorer</Badge>
                <h3 className="text-xl font-bold mb-3">Adventure Every Weekend</h3>
                <p className="text-muted-foreground italic mb-4">
                  "Every Friday I check what's happening within 30 miles. I've discovered amazing festivals 
                  and gatherings I never would have found otherwise."
                </p>
                <p className="text-sm text-muted-foreground">- James, 31</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Benefits - Icon Grid */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center">Why You'll Love Local Discovery</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Find Events Near You</h3>
              <p className="text-sm text-muted-foreground">
                Discover events in your neighborhood based on your current location
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Save Time & Energy</h3>
              <p className="text-sm text-muted-foreground">
                No endless scrolling. See only what's convenient to attend
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Build Local Connections</h3>
              <p className="text-sm text-muted-foreground">
                Meet diaspora members who live nearby for lasting relationships
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Support Your Community</h3>
              <p className="text-sm text-muted-foreground">
                Discover local organizers and community initiatives near you
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Navigation className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Smart Distance Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Set your preferred travel radius from 5 to 50+ miles
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Location-Based Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when new events are added in your area
              </p>
            </Card>
          </div>
        </div>

        {/* CTA - Full Width Banner Style */}
        <div className="relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
          
          <div className="relative z-10 p-12 md:p-16 text-white text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Community Is Waiting</h2>
            <p className="text-xl md:text-2xl opacity-95 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the DNA platform when we launch and start discovering the vibrant diaspora 
              community right in your neighborhood. Connection starts close to home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/convene')}
                className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-7 h-auto"
              >
                Explore More Features
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7 h-auto"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LocalEventsPage;
