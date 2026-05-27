import React, { useState } from 'react';
import { Heart, DollarSign, Clock, Users, Lightbulb, ArrowRight, Award, TrendingUp, Target } from 'lucide-react';
import { Adinkrahene } from '@/components/icons/adinkra';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SwipeableCardStack from './SwipeableCardStack';
import PillarInfoSheet from './PillarInfoSheet';

const ContributeSection = () => {
  const [infoOpen, setInfoOpen] = useState(false);

  const contributions = [
    {
      type: 'Capital',
      title: 'Seed Investment Opportunity',
      amount: '$5,000 - $50,000',
      project: 'Solar Education Initiative',
      impact: '10 schools powered',
      icon: DollarSign,
      gradient: 'from-dna-gold to-dna-ochre',
      badge: 'Investment',
      recognition: '+500 Impact Points',
      categoryTitle: 'Investment Opportunities',
      categorySubtitle: 'Fund transformative projects',
    },
    {
      type: 'Skills',
      title: 'Marketing Expertise Needed',
      commitment: '4 hours/week for 3 months',
      project: 'HealthTech Platform Launch',
      impact: 'Reach 100K users',
      icon: Lightbulb,
      gradient: 'from-dna-copper to-dna-gold',
      badge: 'Expertise',
      recognition: 'Featured Contributor Badge',
      categoryTitle: 'Skill Exchanges',
      categorySubtitle: 'Apply your expertise',
    },
    {
      type: 'Mentorship',
      title: 'Become a Startup Mentor',
      commitment: '2 sessions/month',
      project: 'Founders Mentorship Circle',
      impact: 'Guide 15 entrepreneurs',
      icon: Users,
      gradient: 'from-dna-ochre to-dna-emerald',
      badge: 'Mentorship',
      recognition: 'Community Leader Status',
      categoryTitle: 'Mentorship Programs',
      categorySubtitle: 'Guide the next generation',
    },
    {
      type: 'Knowledge',
      title: 'Share Research & Insights',
      commitment: '1 article/month',
      project: 'Diaspora Innovation Hub',
      impact: 'Educate 5K+ members',
      icon: Lightbulb,
      gradient: 'from-dna-emerald to-dna-forest',
      badge: 'Knowledge',
      recognition: 'Thought Leader Badge',
      categoryTitle: 'Knowledge Sharing',
      categorySubtitle: 'Educate and inspire',
    },
    {
      type: 'Advocacy',
      title: 'Amplify Diaspora Voices',
      commitment: 'Share & promote initiatives',
      project: 'Movement Amplification',
      impact: 'Reach 50K+ people',
      icon: TrendingUp,
      gradient: 'from-dna-forest to-dna-copper',
      badge: 'Advocacy',
      recognition: 'Ambassador Status',
      categoryTitle: 'Network Amplification',
      categorySubtitle: 'Expand our reach',
    },
  ];

  const handleCardClick = (index: number) => {
    navigate('/contribute');
  };

  const renderCard = (contribution: typeof contributions[0]) => {
    const Icon = contribution.icon;
    return (
      <div className={`bg-gradient-to-br ${contribution.gradient} rounded-xl p-1.5 shadow-2xl h-full w-full`}>
        <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
          <div className={`bg-gradient-to-r ${contribution.gradient} text-white p-6`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg font-serif">{contribution.categoryTitle}</h3>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-white/80">{contribution.categorySubtitle}</p>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-dna-gold text-white text-xs">{contribution.badge}</Badge>
                <Badge variant="outline" className="text-xs">{contribution.type}</Badge>
              </div>
              <h4 className="font-bold text-xl text-neutral-900 mb-1">{contribution.title}</h4>
            </div>

            <div className="bg-dna-gold/5 rounded-xl p-4 border-2 border-dna-gold/30">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                {contribution.type === 'Capital' ? 'Investment Range' : 'Time Commitment'}
              </p>
              <p className="text-lg font-bold text-neutral-900">
                {contribution.amount || contribution.commitment}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Contributing To</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-dna-emerald to-dna-forest rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">{contribution.project}</p>
                </div>
              </div>
            </div>

            <div className="bg-dna-emerald/5 rounded-xl p-4 border-2 border-dna-emerald/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-dna-emerald" />
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Expected Impact</p>
              </div>
              <p className="text-sm font-bold text-neutral-900">{contribution.impact}</p>
            </div>

            <div className="bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 rounded-xl p-4 border-2 border-dna-copper/30">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-dna-copper" />
                <div>
                  <p className="text-xs font-semibold text-neutral-500">You'll Earn</p>
                  <p className="text-sm font-bold text-neutral-900">{contribution.recognition}</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-dna-gold to-dna-ochre hover:from-dna-ochre hover:to-dna-gold text-white font-semibold"
            >
              Contribute Now
            </Button>

            <p className="text-xs text-center text-neutral-500">
              Track your impact and earn recognition →
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="contribute-section" className="py-16 px-12 sm:px-10 lg:px-8 bg-neutral-50">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
          {/* Left: Card Preview (Desktop) / Swipeable Cards (Mobile) */}
          <div className="order-2 lg:order-1">
            <SwipeableCardStack
              cards={contributions.map((contribution) => renderCard(contribution))}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Right: Text Content */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-dna-gold to-dna-ochre rounded-xl flex items-center justify-center">
                <Adinkrahene className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-neutral-900">Contribute</h2>
            </div>
            <p className="text-xl font-semibold text-neutral-900 mb-3">
              Give What You Have, Get What You Need
            </p>
            <p className="text-lg text-neutral-600 mb-6">
              Contribute your capital, expertise, time, knowledge, or network to the movement and watch your impact multiply. Every contribution is tracked, recognized, and often reciprocated. Whether you invest, mentor, share skills, or make connections, you strengthen the ecosystem while advancing your own goals.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-dna-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Multiple Contribution Pathways</h3>
                  <p className="text-sm text-neutral-600">Deploy capital, expertise, time, knowledge, or network based on what you can give</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-dna-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Measurable Impact</h3>
                  <p className="text-sm text-neutral-600">Track how your contributions create tangible outcomes for specific initiatives</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-dna-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Reciprocal Ecosystem</h3>
                  <p className="text-sm text-neutral-600">Today's contribution becomes tomorrow's received support. The more you give, the more you gain</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/contribute')}
              className="bg-dna-gold hover:bg-dna-ochre text-white inline-flex items-center gap-2"
            >
              Explore Pathways to Impact
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContributeSection;
