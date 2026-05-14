import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Globe, Lightbulb, Heart, Target, Quote, Linkedin } from 'lucide-react';
import JoinDNADialog from '@/components/auth/JoinDNADialog';
import SurveyDialog from '@/components/survey/SurveyDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PageSEO, getOrganizationSchema } from '@/components/seo/PageSEO';
import { config } from '@/lib/config';
import { MateMasie } from '@/components/icons/adinkra';

const About = () => {
  useScrollToTop();
  const navigate = useNavigate();
  
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  const handleJoinPlatform = () => {
    setIsJoinDialogOpen(true);
  };

  const handleTakeSurvey = () => {
    setIsSurveyOpen(true);
  };

  const founderSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Jaûne L. Odombrown',
    jobTitle: 'Founder & CEO',
    worksFor: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
    },
    url: 'https://www.linkedin.com/in/jaunelamarr/',
  };

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="About DNA: Our Mission to Unite the African Diaspora"
        description="DNA empowers 200M+ African diaspora members to connect, collaborate, and contribute to Africa's sustainable development. Meet our founder and learn our mission."
        keywords={[
          'about diaspora network africa',
          'african diaspora mission',
          'DNA platform',
          'Jaune Odombrown',
          'diaspora unity',
          'africa development mission',
        ]}
        canonicalPath="/about"
        structuredData={[getOrganizationSchema(), founderSchema]}
      />
      <UnifiedHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-dna-copper text-white mb-6 text-sm px-6 py-2">Our Story</Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 mb-8">
              About <span className="text-dna-copper">DNA</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              Empowering the African diaspora to create meaningful connections, drive innovation, 
              and contribute to Africa's sustainable development through technology and collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-l-4 border-l-dna-emerald shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <Target className="w-8 h-8 text-dna-emerald" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 text-lg leading-relaxed">
                  To create a unified platform that connects African diaspora professionals, 
                  entrepreneurs, and innovators worldwide, enabling them to collaborate on 
                  impactful projects that drive sustainable development across Africa.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-dna-copper shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-3xl">
                  <Lightbulb className="w-8 h-8 text-dna-copper" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 text-lg leading-relaxed">
                  A thriving ecosystem where the African diaspora's collective knowledge, 
                  resources, and passion transform into tangible solutions that address 
                  Africa's most pressing challenges and unlock its vast potential.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">Our Core Values</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our platform's culture
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-dna-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-dna-emerald" />
                </div>
                <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Unity</h3>
                <p className="text-neutral-600 text-lg leading-relaxed">
                  Bringing together diverse voices and perspectives to create stronger, 
                  more innovative solutions for Africa's future.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-dna-copper/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MateMasie className="w-10 h-10 text-dna-copper" />
                </div>
                <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Innovation</h3>
                <p className="text-neutral-600 text-lg leading-relaxed">
                  Fostering creativity and technological advancement to solve complex 
                  challenges with cutting-edge solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-dna-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-dna-forest" />
                </div>
                <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Impact</h3>
                <p className="text-neutral-600 text-lg leading-relaxed">
                  Measuring success by the positive change we create in communities 
                  across Africa and the diaspora.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">Meet the Founder</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              The visionary behind the Diaspora Network of Africa
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Founder Photo */}
            <div className="text-center lg:text-left">
              <div className="w-80 h-80 mx-auto lg:mx-0 rounded-lg shadow-2xl overflow-hidden">
                <img 
                  src="/lovable-uploads/02154efb-0abe-4ed4-b41f-265e4a856e8d.png"
                  alt="Jaûne L. Odombrown - Founder & CEO"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bio Content */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                  <a 
                    href="https://www.linkedin.com/in/jaunelamarr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-dna-copper inline-flex items-center gap-2 transition-colors"
                  >
                    Jaûne L. Odombrown
                    <Linkedin className="w-6 h-6" />
                  </a>
                </h3>
                <p className="text-xl text-dna-copper font-semibold mb-6">Founder & Chief Executive Officer</p>
                
                <div className="space-y-6 text-neutral-700 text-lg leading-relaxed">
                  <p>
                    Jaûne is a visionary leader passionate about connecting Africa's diaspora to drive 
                    meaningful change across the continent. With extensive experience in technology, 
                    entrepreneurship, and community building, he recognized the untapped potential 
                    of uniting diaspora professionals for collective impact.
                  </p>
                  
                  <p>
                    His journey began with witnessing firsthand the challenges faced by both diaspora 
                    communities seeking meaningful ways to contribute to Africa's development and 
                    African communities needing access to global expertise and resources. This inspired 
                    the creation of DNA, a platform designed to bridge these gaps and unlock the 
                    transformative power of diaspora collaboration.
                  </p>
                </div>
              </div>

              {/* Quote Section */}
              <Card className="bg-gradient-to-r from-dna-emerald/5 to-dna-copper/5 border-l-4 border-l-dna-copper">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-dna-copper mb-4" />
                  <blockquote className="text-xl italic text-neutral-700 mb-4 leading-relaxed">
                    "The African diaspora represents one of the world's most powerful yet underutilized 
                    resources for positive change. By connecting our collective knowledge, passion, and 
                    resources, we can transform challenges into opportunities and unlock Africa's limitless potential."
                  </blockquote>
                  <cite className="text-dna-copper font-semibold">- Jaûne L. Odombrown</cite>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">How DNA Works</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Our three-pillar approach creates a comprehensive ecosystem for diaspora engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-dna-emerald to-dna-copper"></div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-dna-emerald">Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 text-lg mb-6 leading-relaxed">
                  Build meaningful relationships with fellow diaspora professionals, 
                  entrepreneurs, and thought leaders across industries.
                </p>
                <ul className="text-neutral-600 space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-emerald rounded-full mr-3"></span>
                    Professional networking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-emerald rounded-full mr-3"></span>
                    Mentorship opportunities
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-emerald rounded-full mr-3"></span>
                    Community events
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-emerald rounded-full mr-3"></span>
                    Knowledge sharing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-dna-copper to-dna-gold"></div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-dna-copper">Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 text-lg mb-6 leading-relaxed">
                  Work together on innovative projects that address real challenges 
                  across Africa with collective expertise and resources.
                </p>
                <ul className="text-neutral-600 space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-copper rounded-full mr-3"></span>
                    Project partnerships
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-copper rounded-full mr-3"></span>
                    Resource pooling
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-copper rounded-full mr-3"></span>
                    Cross-border initiatives
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-copper rounded-full mr-3"></span>
                    Innovation labs
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-dna-gold to-dna-forest"></div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-dna-forest">Contribute</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 text-lg mb-6 leading-relaxed">
                  Make tangible contributions to Africa's development through 
                  skills, knowledge, funding, and strategic partnerships.
                </p>
                <ul className="text-neutral-600 space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-forest rounded-full mr-3"></span>
                    Skills volunteering
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-forest rounded-full mr-3"></span>
                    Investment opportunities
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-forest rounded-full mr-3"></span>
                    Knowledge transfer
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-dna-forest rounded-full mr-3"></span>
                    Social impact projects
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-8">
            Ready to Be Part of the Movement?
          </h2>
          <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of diaspora professionals who are already making a difference. 
            Together, we can unlock Africa's potential and create lasting change.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              onClick={handleJoinPlatform}
              className="bg-dna-copper hover:bg-dna-gold text-white px-10 py-4 text-lg rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Join the Platform
            </Button>
            <Button 
              onClick={() => navigate('/contact')}
              variant="outline"
              className="border-2 border-dna-forest text-dna-forest hover:bg-dna-forest hover:text-white px-10 py-4 text-lg rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </section>

      {/* Join DNA Dialog */}
      <JoinDNADialog 
        isOpen={isJoinDialogOpen} 
        onClose={() => setIsJoinDialogOpen(false)}
        onTakeSurvey={handleTakeSurvey}
      />

      {/* Survey Dialog */}
      <SurveyDialog 
        isOpen={isSurveyOpen} 
        onClose={() => setIsSurveyOpen(false)} 
      />

      <Footer />
    </div>
  );
};

export default About;
