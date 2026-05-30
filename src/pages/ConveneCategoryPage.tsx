import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Globe2, Building2, Map, Calendar, Users, Filter } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';

const categoryDetails = {
  technology: {
    title: 'Technology Events',
    description: 'Connect with innovators, developers, and tech leaders across the African diaspora',
    icon: '💻',
    color: 'from-blue-500 to-copper-600',
    features: [
      {
        icon: MapPin,
        title: 'Local Tech Meetups',
        description: 'Find technology gatherings in your city - from coding bootcamps to startup pitch nights'
      },
      {
        icon: Building2,
        title: 'Regional Conferences',
        description: 'Discover major tech conferences and summits happening across your region'
      },
      {
        icon: Globe2,
        title: 'International Summits',
        description: 'Access global technology events connecting the African diaspora worldwide'
      },
      {
        icon: Calendar,
        title: 'Smart Filtering',
        description: 'Filter by date, location, event type (virtual/in-person), and specific tech topics'
      },
      {
        icon: Users,
        title: 'Attendee Insights',
        description: 'See who else is attending, connect before the event, and build your network'
      },
      {
        icon: Filter,
        title: 'Personalized Recommendations',
        description: 'Get event suggestions based on your interests, skills, and professional goals'
      }
    ],
    examples: [
      'AI & Machine Learning Workshops',
      'Blockchain & Web3 Conferences',
      'Mobile App Development Meetups',
      'Cybersecurity Forums',
      'Tech Startup Pitch Competitions',
      'Developer Hackathons'
    ]
  },
  'arts-culture': {
    title: 'Arts & Culture Events',
    description: 'Celebrate African heritage through art exhibitions, performances, and cultural gatherings',
    icon: '🎨',
    color: 'from-copper-500 to-orange-500',
    features: [
      {
        icon: MapPin,
        title: 'Local Cultural Events',
        description: 'Discover art galleries, live performances, and cultural celebrations in your area'
      },
      {
        icon: Building2,
        title: 'Regional Festivals',
        description: 'Experience major cultural festivals and artistic showcases across your region'
      },
      {
        icon: Globe2,
        title: 'International Celebrations',
        description: 'Connect with diaspora cultural events happening around the world'
      },
      {
        icon: Calendar,
        title: 'Event Discovery',
        description: 'Browse by art form - music, dance, theater, visual arts, film, and more'
      },
      {
        icon: Users,
        title: 'Artist Connections',
        description: 'Meet artists, curators, and cultural organizers in your community'
      },
      {
        icon: Filter,
        title: 'Cultural Preferences',
        description: 'Filter events by specific traditions, languages, and cultural expressions'
      }
    ],
    examples: [
      'African Art Exhibitions',
      'Afrobeats & Live Music Events',
      'Film Festival Screenings',
      'Traditional Dance Performances',
      'Poetry & Literature Readings',
      'Fashion Shows & Design Markets'
    ]
  },
  business: {
    title: 'Business & Networking Events',
    description: 'Build professional connections and explore opportunities across African markets',
    icon: '💼',
    color: 'from-green-500 to-teal-600',
    features: [
      {
        icon: MapPin,
        title: 'Local Networking',
        description: 'Join business meetups, pitch events, and professional mixers in your city'
      },
      {
        icon: Building2,
        title: 'Regional Forums',
        description: 'Attend investment forums, trade shows, and industry conferences regionally'
      },
      {
        icon: Globe2,
        title: 'Global Summits',
        description: 'Access international business summits connecting African diaspora entrepreneurs'
      },
      {
        icon: Calendar,
        title: 'Industry Focus',
        description: 'Filter by sector - fintech, real estate, healthcare, agriculture, and more'
      },
      {
        icon: Users,
        title: 'Professional Matching',
        description: 'Connect with investors, partners, and collaborators before events'
      },
      {
        icon: Filter,
        title: 'Opportunity Alerts',
        description: 'Get notified about networking events matching your business interests'
      }
    ],
    examples: [
      'Startup Pitch Competitions',
      'Investment & Funding Forums',
      'Trade Missions & Expos',
      'Professional Development Workshops',
      'Industry Roundtables',
      'Entrepreneurship Bootcamps'
    ]
  },
  education: {
    title: 'Education & Learning Events',
    description: 'Expand your knowledge through workshops, seminars, and skill-building programs',
    icon: '📚',
    color: 'from-copper-500 to-blue-600',
    features: [
      {
        icon: MapPin,
        title: 'Local Workshops',
        description: 'Find skill-building workshops, tutoring sessions, and study groups nearby'
      },
      {
        icon: Building2,
        title: 'Regional Programs',
        description: 'Access educational conferences, training programs, and academic seminars'
      },
      {
        icon: Globe2,
        title: 'Global Learning',
        description: 'Join virtual masterclasses and international educational exchanges'
      },
      {
        icon: Calendar,
        title: 'Subject Filtering',
        description: 'Browse by topic - language learning, STEM, business skills, arts, and more'
      },
      {
        icon: Users,
        title: 'Peer Learning',
        description: 'Connect with fellow learners and mentors in your areas of interest'
      },
      {
        icon: Filter,
        title: 'Learning Paths',
        description: 'Get recommendations based on your educational goals and skill level'
      }
    ],
    examples: [
      'African Language Classes',
      'Professional Certification Workshops',
      'Academic Conferences',
      'Mentorship Programs',
      'Skill Development Bootcamps',
      'Research Symposiums'
    ]
  },
  social: {
    title: 'Social & Community Events',
    description: 'Build friendships and strengthen community bonds through social gatherings',
    icon: '🎉',
    color: 'from-yellow-500 to-red-500',
    features: [
      {
        icon: MapPin,
        title: 'Neighborhood Gatherings',
        description: 'Find local meetups, game nights, and community celebrations near you'
      },
      {
        icon: Building2,
        title: 'Regional Celebrations',
        description: 'Join larger community events, cultural celebrations, and social festivals'
      },
      {
        icon: Globe2,
        title: 'Diaspora Reunions',
        description: 'Connect with global diaspora gatherings and virtual social events'
      },
      {
        icon: Calendar,
        title: 'Interest Groups',
        description: 'Filter by hobby, activity, or social focus - sports, food, music, and more'
      },
      {
        icon: Users,
        title: 'Community Building',
        description: 'Meet people with shared interests and build lasting friendships'
      },
      {
        icon: Filter,
        title: 'Social Matching',
        description: 'Get suggestions for events matching your social preferences and lifestyle'
      }
    ],
    examples: [
      'Cultural Celebrations & Holidays',
      'Sports & Recreation Meetups',
      'Food & Cooking Gatherings',
      'Music & Dance Socials',
      'Book Clubs & Discussion Groups',
      'Outdoor Adventures & Travel'
    ]
  },
  health: {
    title: 'Health & Wellness Events',
    description: 'Prioritize wellbeing through fitness activities, wellness workshops, and health forums',
    icon: '🏥',
    color: 'from-emerald-500 to-green-600',
    features: [
      {
        icon: MapPin,
        title: 'Local Wellness',
        description: 'Find yoga classes, fitness groups, and health workshops in your area'
      },
      {
        icon: Building2,
        title: 'Regional Health Forums',
        description: 'Attend health conferences, wellness retreats, and medical symposiums'
      },
      {
        icon: Globe2,
        title: 'Global Health Initiatives',
        description: 'Connect with international health organizations and wellness movements'
      },
      {
        icon: Calendar,
        title: 'Wellness Categories',
        description: 'Browse by focus - mental health, fitness, nutrition, traditional medicine, and more'
      },
      {
        icon: Users,
        title: 'Health Professionals',
        description: 'Connect with healthcare providers, wellness coaches, and fitness instructors'
      },
      {
        icon: Filter,
        title: 'Personalized Wellness',
        description: 'Get event recommendations based on your health goals and interests'
      }
    ],
    examples: [
      'Mental Health Workshops',
      'Fitness Bootcamps & Challenges',
      'Nutrition & Cooking Classes',
      'Traditional Healing Circles',
      'Medical Conferences',
      'Wellness Retreats'
    ]
  }
};

const ConveneCategoryPage = () => {
  useScrollToTop();
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const categoryKey = category?.toLowerCase() || 'technology';
  const details = categoryDetails[categoryKey as keyof typeof categoryDetails] || categoryDetails.technology;

  const SITE_URL = 'https://diasporanetwork.africa';
  const pageUrl = `${SITE_URL}/convene/${categoryKey}`;
  const pageTitle = `${details.title} events | Convene on DNA`;
  const pageDescription = details.description.length > 160
    ? details.description.slice(0, 157).trimEnd() + '...'
    : details.description;
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    isPartOf: { '@type': 'WebSite', name: 'Diaspora Network of Africa', url: SITE_URL },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify(collectionJsonLd)}</script>
      </Helmet>
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
        <div className={`bg-gradient-to-r ${details.color} rounded-xl p-12 text-white mb-12`}>
          <div className="max-w-3xl">
            <div className="text-6xl mb-4">{details.icon}</div>
            <h1 className="text-5xl font-bold mb-4">{details.title}</h1>
            <p className="text-xl opacity-90 mb-6">{details.description}</p>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm px-4 py-2">
              Coming Soon in DNA Platform
            </Badge>
          </div>
        </div>

        {/* Preview Notice */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-2xl font-bold mb-4">What You'll Experience When We Launch</h2>
          <p className="text-lg text-muted-foreground mb-4">
            This category section will be your hub for discovering {details.title.toLowerCase()} happening across the African diaspora. 
            Once the DNA platform launches, you'll have access to a comprehensive event discovery system that connects you with 
            opportunities at every level - from your neighborhood to the global stage.
          </p>
          <p className="text-lg text-muted-foreground">
            Events will be organized by proximity and scale: <span className="font-semibold text-foreground">Local</span> (in your city), 
            <span className="font-semibold text-foreground"> Regional</span> (across your country/area), 
            <span className="font-semibold text-foreground"> National</span> (continent-wide), and 
            <span className="font-semibold text-foreground"> International</span> (global diaspora events).
          </p>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Key Features of This Section</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Examples Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Example Event Types You'll Find</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {details.examples.map((example, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="font-medium">{example}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-8 bg-gradient-to-br from-primary to-primary/80 text-white">
          <h2 className="text-3xl font-bold mb-6">How Event Discovery Will Work</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">🎯 Smart Filtering</h3>
              <p className="opacity-90">
                Use advanced filters to find exactly what you're looking for - by date range, location radius, 
                event format (virtual/in-person), price range, and specific topics within the category.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">📍 Location-Based Discovery</h3>
              <p className="opacity-90">
                Events are automatically organized by proximity to you - see what's happening locally first, 
                then expand to regional, national, and international opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">🔔 Personalized Alerts</h3>
              <p className="opacity-90">
                Set up notifications for specific event types, locations, or topics you care about. 
                Never miss an opportunity that matches your interests.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">👥 Community Connection</h3>
              <p className="opacity-90">
                See which members of your DNA network are attending, RSVP to events, and coordinate 
                meetups with people who share your interests.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={() => navigate('/convene')}
            className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6"
          >
            Explore All Event Categories
          </Button>
          <p className="mt-4 text-muted-foreground">
            Join the waitlist to be among the first to access these features when we launch
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConveneCategoryPage;
