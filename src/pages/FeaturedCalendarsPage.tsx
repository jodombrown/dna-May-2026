import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Users, Star, Eye, Bell, Share2, Filter, TrendingUp, Heart, Bookmark, Globe2 } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { MateMasie } from '@/components/icons/adinkra';

const FeaturedCalendarsPage = () => {
  useScrollToTop();
  const navigate = useNavigate();

  const sampleCalendars = [
    {
      name: 'African Tech Leaders',
      curator: 'Amara Okafor',
      followers: '12.5K',
      eventCount: '45',
      description: 'Curated selection of tech conferences, workshops, and meetups led by African innovators',
      avatar: '👩🏿‍💻',
      color: 'from-blue-500 to-copper-600'
    },
    {
      name: 'Diaspora Arts & Culture',
      curator: 'Kwame Mensah',
      followers: '8.3K',
      eventCount: '62',
      description: 'Celebrating African heritage through art exhibitions, performances, and cultural festivals',
      avatar: '🎨',
      color: 'from-copper-500 to-orange-500'
    },
    {
      name: 'Business & Investment',
      curator: 'Zainab Ahmed',
      followers: '15.2K',
      eventCount: '38',
      description: 'Investment forums, pitch competitions, and networking events for African entrepreneurs',
      avatar: '💼',
      color: 'from-green-500 to-teal-600'
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Curate Your Collection',
      description: 'Create themed event calendars around topics you\'re passionate about - technology, arts, business, wellness, or any interest area'
    },
    {
      icon: Users,
      title: 'Build Your Following',
      description: 'Grow a community of people who share your interests. Your followers get notified when you add new events to your calendar'
    },
    {
      icon: Star,
      title: 'Become a Trusted Voice',
      description: 'Establish yourself as a curator and connector in your field. Featured calendars get promoted across the platform'
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Share your calendar via direct link, embed it on your website, or promote it on social media to reach wider audiences'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Your followers receive timely updates about upcoming events, registration deadlines, and calendar highlights'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track your calendar\'s performance - see follower growth, event registrations, and engagement metrics'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Your Calendar',
      description: 'Give your calendar a name, description, and theme. Choose a visual identity that represents your curation focus.',
      icon: MateMasie
    },
    {
      step: '2',
      title: 'Add Events',
      description: 'Browse the DNA platform and add events to your calendar, or create new events. Mix your own events with others you recommend.',
      icon: Calendar
    },
    {
      step: '3',
      title: 'Grow Your Audience',
      description: 'Share your calendar and attract followers. Each time you add an event, your followers are notified.',
      icon: Users
    },
    {
      step: '4',
      title: 'Engage & Evolve',
      description: 'Interact with your community, respond to comments, and continuously refine your calendar based on feedback.',
      icon: Heart
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/convene')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-12 md:p-16 text-white mb-12">
          <div className="relative z-10 max-w-4xl">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 mb-6 text-base px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Featured Calendars
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Curate. Share. Connect.
            </h1>
            <p className="text-xl md:text-2xl opacity-95 mb-8 leading-relaxed">
              Become a trusted curator by creating your own event calendar. Share events you love, 
              build a community around your passions, and help others discover meaningful experiences.
            </p>
            <div className="flex flex-wrap gap-8 text-lg">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="font-semibold">35K+ Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span className="font-semibold">500+ Calendars</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-6 w-6" />
                <span className="font-semibold">1M+ Views/Month</span>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-white/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Value Proposition */}
        <Card className="p-8 md:p-12 mb-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Create a Featured Calendar?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Bookmark className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Event Organizers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Promote your events to targeted audiences. When influencers add your event to their calendar, 
                you gain visibility among their engaged followers.
              </p>
            </div>
            <div>
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Community Leaders</h3>
              <p className="text-muted-foreground leading-relaxed">
                Position yourself as a trusted voice in your field. Curate quality events and build 
                a reputation as the go-to source for your community.
              </p>
            </div>
            <div>
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Globe2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Event Seekers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Follow calendars that match your interests. Get personalized event recommendations 
                from curators you trust instead of endless scrolling.
              </p>
            </div>
          </div>
        </Card>

        {/* Sample Calendars */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-3">Example Featured Calendars</h2>
          <p className="text-muted-foreground text-lg mb-8">
            See how community leaders are already curating events for their audiences
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {sampleCalendars.map((calendar, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all group">
                <div className={`h-32 bg-gradient-to-br ${calendar.color} p-6 text-white relative`}>
                  <div className="text-6xl mb-2">{calendar.avatar}</div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                    Featured
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {calendar.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    by {calendar.curator}
                  </p>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {calendar.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{calendar.followers}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{calendar.eventCount} events</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Calendar Creator Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-3 text-center">How It Works</h2>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Creating and growing your featured calendar is simple. Here's how you'll get started:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {step.step}
                    </div>
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </Card>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <Card className="p-8 md:p-12 mb-12 bg-gradient-to-br from-muted/50 to-muted/30">
          <h2 className="text-3xl font-bold mb-8 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MateMasie className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Industry Experts</h3>
                <p className="text-muted-foreground">
                  Share your knowledge by curating the best conferences, workshops, and learning opportunities in your field
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Community Organizers</h3>
                <p className="text-muted-foreground">
                  Build stronger communities by highlighting local gatherings, cultural celebrations, and networking events
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Influencers & Creators</h3>
                <p className="text-muted-foreground">
                  Provide value to your audience by recommending events that align with their interests and your brand
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Organizations & Brands</h3>
                <p className="text-muted-foreground">
                  Showcase your ecosystem of events and partnerships, making it easy for stakeholders to stay engaged
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-12 text-center bg-gradient-to-br from-primary to-primary/80 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Become a Curator?</h2>
          <p className="text-xl opacity-95 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the DNA platform when we launch and start building your featured calendar. 
            Connect with your community, share your expertise, and help others discover amazing events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/convene')}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
            >
              Explore More Features
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Sign Up
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturedCalendarsPage;
