import React, { useState } from 'react';
import { Users, MapPin, Briefcase, ArrowRight, Network } from 'lucide-react';
import { Sankofa } from '@/components/icons/adinkra';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SwipeableCardStack from './SwipeableCardStack';
import PillarInfoSheet from './PillarInfoSheet';

const ConnectSection = () => {
  const [infoOpen, setInfoOpen] = useState(false);

  const professionals = [
    {
      name: 'Amara Okafor',
      title: 'CEO, AfriPay Solutions',
      bio: 'Leading fintech innovation across 12 African countries. Former VP at Stripe.',
      location: 'Lagos, Nigeria',
      interests: ['FinTech', 'Scaling', 'Leadership'],
      mutualConnections: 3,
      gradient: 'from-dna-forest to-dna-emerald',
      initials: 'AO',
      color: 'bg-dna-emerald',
      engagementType: 'Professional Matching',
      categoryTitle: 'Industry Leaders',
      categorySubtitle: 'Connect with innovators',
    },
    {
      name: 'Kwame Mensah',
      title: 'Managing Partner, Savanna Ventures',
      bio: '$50M fund investing in African climate tech and agriculture startups.',
      location: 'Accra, Ghana',
      interests: ['Venture Capital', 'Climate Tech', 'AgriTech'],
      mutualConnections: 5,
      gradient: 'from-dna-emerald to-dna-copper',
      initials: 'KM',
      color: 'bg-dna-copper',
      engagementType: 'Community Groups',
      categoryTitle: 'Meet Investors',
      categorySubtitle: 'Find funding partners',
    },
    {
      name: 'Dr. Zainab Hassan',
      title: 'Serial Entrepreneur & Advisor',
      bio: '3 successful exits. Mentored 200+ founders. 15 years building in Africa.',
      location: 'Nairobi, Kenya',
      interests: ['Mentorship', 'Strategy', 'Fundraising'],
      mutualConnections: 2,
      gradient: 'from-dna-copper to-dna-gold',
      initials: 'ZH',
      color: 'bg-dna-gold',
      engagementType: 'Mentorship Pairing',
      categoryTitle: 'Find Mentors',
      categorySubtitle: 'Learn from experts',
    },
    {
      name: 'Dr. Chioma Nwankwo',
      title: 'Blockchain Architect & Researcher',
      bio: 'PhD in Distributed Systems. Published 40+ papers. Available for consultations.',
      location: 'Austin, TX',
      interests: ['Web3', 'DeFi', 'Smart Contracts'],
      mutualConnections: 8,
      gradient: 'from-dna-gold to-dna-ochre',
      initials: 'CN',
      color: 'bg-dna-ochre',
      engagementType: 'Expert Directory',
      categoryTitle: 'Expert Network',
      categorySubtitle: 'Access specialized knowledge',
    },
    {
      name: 'Yusuf Ibrahim',
      title: 'Technical Co-Founder Seeking Business Partner',
      bio: 'Built AI education platform. Looking for commercial co-founder to scale.',
      location: 'Kigali, Rwanda',
      interests: ['EdTech', 'AI', 'Partnership'],
      mutualConnections: 4,
      gradient: 'from-dna-ochre to-dna-forest',
      initials: 'YI',
      color: 'bg-dna-forest',
      engagementType: 'Intro Requests',
      categoryTitle: 'Discover Co-Founders',
      categorySubtitle: 'Build your team',
    },
  ];

  const handleCardClick = (_index: number) => {
    setInfoOpen(true);
  };

  const renderCard = (professional: typeof professionals[0]) => (
    <div className={`bg-gradient-to-br ${professional.gradient} rounded-xl p-1.5 shadow-2xl h-full w-full`}>
      <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className={`bg-gradient-to-r ${professional.gradient} text-white p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg font-serif">{professional.categoryTitle}</h3>
            <Network className="w-5 h-5" />
          </div>
          <p className="text-sm text-white/80">{professional.categorySubtitle}</p>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className={`${professional.color} text-white text-lg font-bold`}>
                {professional.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-lg text-neutral-900 mb-1">{professional.name}</h4>
              <p className="text-sm font-medium text-neutral-700 mb-1">{professional.title}</p>
              <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{professional.bio}</p>
              <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                <MapPin className="w-3.5 h-3.5" />
                <span>{professional.location}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {professional.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary" className="bg-dna-emerald/10 text-dna-forest">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-dna-forest/5 rounded-xl p-4 border-2 border-dna-forest/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-dna-forest" />
              <span className="text-sm font-semibold text-neutral-900">
                {professional.mutualConnections} mutual connections
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              Connected through shared communities and interests
            </p>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-dna-forest to-dna-emerald hover:from-dna-emerald hover:to-dna-forest text-white font-semibold"
          >
            Connect Now
          </Button>

          <p className="text-xs text-center text-neutral-500">
            After connecting, see their upcoming events →
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="connect-section" data-section="connect" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-dna-forest to-dna-emerald rounded-xl flex items-center justify-center">
                <Sankofa className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-neutral-900">Connect</h2>
            </div>
            <p className="text-xl font-semibold text-neutral-900 mb-3">
              Build Relationships That Move Africa Forward
            </p>
            <p className="text-lg text-neutral-600 mb-6">
              Connect with verified diaspora changemakers who share your commitment to Africa's progress. Whether you need a co-founder, investor, mentor, or collaborator, strategic relationships are the foundation of impact. Your network becomes the movement's strength.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-dna-forest" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Quality Over Quantity</h3>
                  <p className="text-sm text-neutral-600">Verified members committed to action, not just conversation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Network className="w-4 h-4 text-dna-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Purpose-Driven Matching</h3>
                  <p className="text-sm text-neutral-600">Find the right people based on shared goals, not random networking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4 text-dna-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Individual Success = Collective Power</h3>
                  <p className="text-sm text-neutral-600">Your connections accelerate your goals while strengthening the entire network</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setInfoOpen(true)}
              className="bg-dna-forest hover:bg-dna-emerald text-white inline-flex items-center gap-2"
            >
              Explore Network
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Card Preview (Desktop) / Swipeable Cards (Mobile) */}
          <div>
            <SwipeableCardStack
              cards={professionals.map((professional) => renderCard(professional))}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>
      <PillarInfoSheet pillar="connect" open={infoOpen} onOpenChange={setInfoOpen} />
    </section>
  );
};

export default ConnectSection;
