
import React, { useState } from 'react';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Globe, 
  Shield, 
  BookOpen,
  MessageSquare,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react';

const Services = () => {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const serviceCategories = [
    {
      id: 'consulting',
      label: 'Consulting',
      icon: <Briefcase className="w-5 h-5" />,
      services: [
        {
          id: 1,
          title: "Market Entry Strategy",
          provider: "Dr. Kwame Asante",
          description: "Strategic consulting for entering African markets with regulatory compliance guidance",
          price: "$2,500",
          duration: "4-6 weeks",
          rating: 4.9,
          reviews: 24,
          expertise: ["Market Research", "Regulatory Affairs", "Strategy"],
          deliverables: ["Market analysis report", "Entry strategy", "Risk assessment", "Regulatory roadmap"]
        },
        {
          id: 2,
          title: "Financial Modeling & Valuation",
          provider: "Sarah Mwangi, CFA",
          description: "Professional financial modeling and business valuation services for African investments",
          price: "$1,800",
          duration: "2-3 weeks",
          rating: 4.8,
          reviews: 18,
          expertise: ["Financial Modeling", "Valuation", "Investment Analysis"],
          deliverables: ["Financial model", "Valuation report", "Investment memorandum", "Due diligence checklist"]
        }
      ]
    },
    {
      id: 'advisory',
      label: 'Advisory',
      icon: <Users className="w-5 h-5" />,
      services: [
        {
          id: 3,
          title: "Board Advisory Services",
          provider: "Michael Adebayo",
          description: "Senior-level advisory for African startups and SMEs looking to scale operations",
          price: "$5,000/month",
          duration: "6-12 months",
          rating: 5.0,
          reviews: 12,
          expertise: ["Board Governance", "Strategic Planning", "Scale Operations"],
          deliverables: ["Monthly board meetings", "Strategic recommendations", "Performance metrics", "Growth roadmap"]
        },
        {
          id: 4,
          title: "Technology Advisory",
          provider: "Grace Kimani",
          description: "Technology strategy and digital transformation advisory for African businesses",
          price: "$3,200",
          duration: "3-4 weeks",
          rating: 4.7,
          reviews: 31,
          expertise: ["Technology Strategy", "Digital Transformation", "Product Development"],
          deliverables: ["Tech strategy", "Digital roadmap", "Architecture review", "Implementation plan"]
        }
      ]
    },
    {
      id: 'legal',
      label: 'Legal & Compliance',
      icon: <Shield className="w-5 h-5" />,
      services: [
        {
          id: 5,
          title: "Cross-Border Legal Services",
          provider: "Fatima Al-Rashid, Esq.",
          description: "Legal services for cross-border African business transactions and compliance",
          price: "$4,500",
          duration: "4-8 weeks",
          rating: 4.9,
          reviews: 16,
          expertise: ["International Law", "Corporate Law", "Compliance"],
          deliverables: ["Legal structure review", "Compliance framework", "Contract templates", "Risk mitigation plan"]
        }
      ]
    },
    {
      id: 'education',
      label: 'Education & Training',
      icon: <BookOpen className="w-5 h-5" />,
      services: [
        {
          id: 6,
          title: "Leadership Development Program",
          provider: "African Leadership Institute",
          description: "Comprehensive leadership development for African diaspora executives",
          price: "$3,800",
          duration: "8 weeks",
          rating: 4.8,
          reviews: 42,
          expertise: ["Leadership", "Executive Coaching", "Cultural Intelligence"],
          deliverables: ["Leadership assessment", "Personal development plan", "Coaching sessions", "Peer network access"]
        }
      ]
    }
  ];

  const handleContactProvider = (serviceId: number) => {
    // Here you would implement the contact logic
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-dna-gold fill-current' : 'text-neutral-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <UnifiedHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Professional <span className="text-dna-copper">Services</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Access world-class professional services from experienced African diaspora experts
          </p>
        </div>

        {/* Services by Category */}
        <Tabs defaultValue="consulting" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            {serviceCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {serviceCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid lg:grid-cols-2 gap-8">
                {category.services.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-neutral-900 mb-2">
                            {service.title}
                          </CardTitle>
                          <p className="text-dna-emerald font-medium">{service.provider}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-dna-copper">{service.price}</p>
                          <p className="text-sm text-neutral-500">{service.duration}</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-neutral-600">{service.description}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {renderStars(service.rating)}
                        </div>
                        <span className="text-sm text-neutral-600">
                          {service.rating} ({service.reviews} reviews)
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-neutral-900 mb-2">Expertise Areas:</h4>
                        <div className="flex flex-wrap gap-2">
                          {service.expertise.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-neutral-900 mb-2">Key Deliverables:</h4>
                        <ul className="space-y-1">
                          {service.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-center text-sm text-neutral-600">
                              <CheckCircle className="w-4 h-4 text-dna-emerald mr-2 flex-shrink-0" />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          className="flex-1 bg-dna-copper hover:bg-dna-gold"
                          onClick={() => handleContactProvider(service.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Provider
                        </Button>
                        <Button variant="outline">
                          View Profile
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Become a Service Provider CTA */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-dna-forest to-dna-emerald text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Offer Your Professional Services</h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Join our network of professional service providers and connect with African diaspora professionals and businesses seeking expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-dna-forest hover:bg-neutral-100">
                  Become a Service Provider
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-dna-forest">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-12">
            How DNA Services Work
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-dna-copper/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-dna-copper" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Browse Services</h3>
              <p className="text-neutral-600">
                Explore our curated directory of professional services from verified diaspora experts.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-dna-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-dna-emerald" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Connect & Discuss</h3>
              <p className="text-neutral-600">
                Reach out to service providers to discuss your requirements and project scope.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-dna-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-dna-gold" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Get Results</h3>
              <p className="text-neutral-600">
                Work with experienced professionals to achieve your African business objectives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
