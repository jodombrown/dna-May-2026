import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  BookOpen, 
  Briefcase, 
  Users, 
  GraduationCap,
  MapPin,
  Clock,
  User,
  Star,
  Download,
  Play,
  MessageCircle
} from 'lucide-react';

const CommunityConnect = () => {
  const programs = [
    {
      id: 1,
      title: "Diaspora Entrepreneur Accelerator",
      description: "12-week intensive program connecting diaspora entrepreneurs with African startups",
      category: "Accelerator",
      duration: "12 weeks",
      participants: 45,
      nextCohort: "March 2024",
      featured: true,
      tags: ["Entrepreneurship", "Mentorship", "Funding"]
    },
    {
      id: 2,
      title: "Cross-Border Investment Circle",
      description: "Monthly investment syndicate for diaspora professionals",
      category: "Investment",
      duration: "Ongoing",
      participants: 127,
      nextCohort: "Open enrollment",
      featured: false,
      tags: ["Investment", "Deal Flow", "Due Diligence"]
    },
    {
      id: 3,
      title: "Tech Skills Transfer Initiative",
      description: "Knowledge sharing program pairing diaspora tech professionals with African developers",
      category: "Skills Development",
      duration: "6 months",
      participants: 89,
      nextCohort: "January 2024",
      featured: true,
      tags: ["Technology", "Mentorship", "Skills"]
    }
  ];

  const events = [
    {
      id: 1,
      title: "African Innovation Summit 2024",
      description: "Annual gathering of diaspora professionals and African entrepreneurs",
      type: "Conference",
      date: "2024-04-15",
      time: "09:00 AM EST",
      location: "Virtual + Lagos, Nigeria",
      attendees: 1200,
      featured: true,
      speakers: ["Dr. Amina Hassan", "Samuel Okonkwo", "Sarah Kimani"],
      tags: ["Innovation", "Networking", "Investment"]
    },
    {
      id: 2,
      title: "FinTech Africa Masterclass",
      description: "Deep dive into financial technology opportunities across Africa",
      type: "Workshop",
      date: "2024-02-20",
      time: "02:00 PM EST",
      location: "Virtual",
      attendees: 450,
      featured: false,
      speakers: ["Michael Adebayo", "Grace Wanjiku"],
      tags: ["FinTech", "Education", "Opportunities"]
    },
    {
      id: 3,
      title: "Quarterly Deal Flow Review",
      description: "Investor meetup to review and discuss investment opportunities",
      type: "Meetup",
      date: "2024-03-10",
      time: "06:00 PM EST",
      location: "New York, NY + Virtual",
      attendees: 75,
      featured: false,
      speakers: ["Investment Committee"],
      tags: ["Investment", "Due Diligence", "Networking"]
    }
  ];

  const resources = [
    {
      id: 1,
      title: "African Market Entry Guide 2024",
      description: "Comprehensive guide for diaspora businesses entering African markets",
      type: "PDF Guide",
      category: "Market Research",
      downloads: 2340,
      rating: 4.8,
      featured: true,
      tags: ["Market Entry", "Business Development", "Regulations"]
    },
    {
      id: 2,
      title: "Investment Due Diligence Toolkit",
      description: "Templates and frameworks for evaluating African investment opportunities",
      type: "Template Pack",
      category: "Investment Tools",
      downloads: 1567,
      rating: 4.9,
      featured: true,
      tags: ["Due Diligence", "Investment", "Templates"]
    },
    {
      id: 3,
      title: "Cross-Border Payment Solutions Database",
      description: "Curated list of payment providers for Africa-diaspora transactions",
      type: "Database",
      category: "Financial Services",
      downloads: 892,
      rating: 4.6,
      featured: false,
      tags: ["Payments", "FinTech", "Directory"]
    }
  ];

  const knowledge = [
    {
      id: 1,
      title: "Building Sustainable Supply Chains in West Africa",
      description: "Insights from 5 years of cross-border operations",
      author: "Dr. Kwame Asante",
      type: "Case Study",
      readTime: "12 min",
      category: "Supply Chain",
      featured: true,
      tags: ["Operations", "Sustainability", "West Africa"]
    },
    {
      id: 2,
      title: "Navigating Regulatory Compliance Across 15 African Countries",
      description: "Legal framework analysis for diaspora entrepreneurs",
      author: "Sarah Johnson, JD",
      type: "Research Paper",
      readTime: "25 min",
      category: "Legal & Compliance",
      featured: false,
      tags: ["Legal", "Compliance", "Regulatory"]
    },
    {
      id: 3,
      title: "Digital Banking Infrastructure: Opportunities for Diaspora Investment",
      description: "Market analysis and investment thesis",
      author: "Michael Okafor",
      type: "Market Analysis",
      readTime: "18 min",
      category: "FinTech Analysis",
      featured: true,
      tags: ["Banking", "Digital Infrastructure", "Investment"]
    }
  ];

  const services = [
    {
      id: 1,
      title: "Cross-Border Legal Services",
      description: "Legal support for diaspora business operations in Africa",
      provider: "Adebayo & Associates",
      category: "Legal Services",
      rating: 4.9,
      reviews: 156,
      featured: true,
      tags: ["Legal", "Corporate", "Compliance"]
    },
    {
      id: 2,
      title: "Africa Market Research & Intelligence",
      description: "Custom market research and business intelligence services",
      provider: "Sahara Insights",
      category: "Research & Analytics",
      rating: 4.8,
      reviews: 203,
      featured: false,
      tags: ["Research", "Market Intelligence", "Data"]
    },
    {
      id: 3,
      title: "Investment Banking for African Deals",
      description: "M&A, capital raising, and financial advisory services",
      provider: "Baobab Capital Partners",
      category: "Financial Services",
      rating: 4.7,
      reviews: 89,
      featured: true,
      tags: ["Investment Banking", "M&A", "Capital"]
    }
  ];

  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Community <span className="text-dna-copper">Connect</span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Discover programs, events, resources, knowledge, and services that connect our diaspora community
          </p>
        </div>

        {/* Programs Section */}
        <div id="programs" className="mb-16">
          <div className="flex items-center mb-8">
            <GraduationCap className="w-6 h-6 text-dna-copper mr-3" />
            <h3 className="text-2xl font-bold text-neutral-900">Programs</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={program.featured ? "default" : "secondary"} className="mb-2">
                      {program.category}
                    </Badge>
                    {program.featured && (
                      <Badge className="bg-dna-copper text-white">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">{program.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {program.duration}
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Users className="w-4 h-4 mr-2" />
                      {program.participants} participants
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      Next: {program.nextCohort}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {program.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="default" className="w-full">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Events Section */}
        <div id="events" className="mb-16">
          <div className="flex items-center mb-8">
            <Calendar className="w-6 h-6 text-dna-copper mr-3" />
            <h3 className="text-2xl font-bold text-neutral-900">Events</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{event.type}</Badge>
                    {event.featured && (
                      <Badge className="bg-dna-copper text-white">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Users className="w-4 h-4 mr-2" />
                      {event.attendees} registered
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-neutral-700 mb-1">Speakers:</p>
                    <p className="text-sm text-neutral-600">{event.speakers.join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="default" className="w-full">
                    Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div id="resources" className="mb-16">
          <div className="flex items-center mb-8">
            <BookOpen className="w-6 h-6 text-dna-copper mr-3" />
            <h3 className="text-2xl font-bold text-neutral-900">Resources</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{resource.type}</Badge>
                    {resource.featured && (
                      <Badge className="bg-dna-copper text-white">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">{resource.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <Download className="w-4 h-4 mr-2" />
                      {resource.downloads.toLocaleString()} downloads
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                      {resource.rating}/5.0 rating
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="default" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Knowledge Section */}
        <div id="knowledge" className="mb-16">
          <div className="flex items-center mb-8">
            <Users className="w-6 h-6 text-dna-copper mr-3" />
            <h3 className="text-2xl font-bold text-neutral-900">Knowledge</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledge.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{article.type}</Badge>
                    {article.featured && (
                      <Badge className="bg-dna-copper text-white">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">{article.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <User className="w-4 h-4 mr-2" />
                      {article.author}
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {article.readTime} read
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="default" className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Read Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div id="services" className="mb-16">
          <div className="flex items-center mb-8">
            <Briefcase className="w-6 h-6 text-dna-copper mr-3" />
            <h3 className="text-2xl font-bold text-neutral-900">Services</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{service.category}</Badge>
                    {service.featured && (
                      <Badge className="bg-dna-copper text-white">Featured</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">{service.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {service.provider}
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                      {service.rating}/5.0 ({service.reviews} reviews)
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" className="flex-1">
                      Get Quote
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            variant="secondary"
          >
            Explore All Community Connections
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityConnect;
