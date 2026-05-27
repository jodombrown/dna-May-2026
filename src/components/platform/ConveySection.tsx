import React, { useState } from 'react';
import { Megaphone, Share2, MessageCircle, Eye, Heart, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SwipeableCardStack from './SwipeableCardStack';
import { Mpatapo } from '@/components/icons/adinkra';
import PillarInfoSheet from './PillarInfoSheet';

const ConveySection = () => {
  const [infoOpen, setInfoOpen] = useState(false);


  const stories = [
    {
      title: 'How I Raised $2M for My FinTech Startup',
      author: { name: 'Amara Okafor', initials: 'AO' },
      category: 'Success Story',
      readTime: '6 min read',
      engagement: { views: 12400, likes: 892, comments: 143 },
      reach: '15K+ reached',
      gradient: 'from-dna-forest to-dna-emerald',
      featured: true,
      storyType: 'Success Story',
      categoryTitle: 'Success Stories',
      categorySubtitle: 'Celebrate wins together',
    },
    {
      title: 'Solar Initiative Impact: Q1 2025 Report',
      author: { name: 'DNA Team', initials: 'DNA' },
      category: 'Impact Report',
      readTime: '4 min read',
      engagement: { views: 6700, likes: 423, comments: 58 },
      reach: '9K+ reached',
      gradient: 'from-dna-emerald to-dna-copper',
      featured: false,
      storyType: 'Impact Report',
      categoryTitle: 'Impact Reports',
      categorySubtitle: 'Track collective progress',
    },
    {
      title: 'From London to Lagos: My Return Journey',
      author: { name: 'Kwame Mensah', initials: 'KM' },
      category: 'Founder Journey',
      readTime: '7 min read',
      engagement: { views: 10200, likes: 734, comments: 92 },
      reach: '13K+ reached',
      gradient: 'from-dna-copper to-dna-gold',
      featured: true,
      storyType: 'Founder Journey',
      categoryTitle: 'Founder Journeys',
      categorySubtitle: 'Share your path',
    },
    {
      title: 'Spotlight: Dr. Zainab Hassan, HealthTech Pioneer',
      author: { name: 'DNA Editorial', initials: 'DE' },
      category: 'Community Spotlight',
      readTime: '5 min read',
      engagement: { views: 8800, likes: 612, comments: 71 },
      reach: '11K+ reached',
      gradient: 'from-dna-gold to-dna-ochre',
      featured: false,
      storyType: 'Community Spotlight',
      categoryTitle: 'Community Spotlights',
      categorySubtitle: 'Highlight changemakers',
    },
    {
      title: 'The Future of African AI: A Thought Leader Perspective',
      author: { name: 'Dr. Chioma Nwankwo', initials: 'CN' },
      category: 'Thought Leadership',
      readTime: '9 min read',
      engagement: { views: 14300, likes: 1021, comments: 187 },
      reach: '18K+ reached',
      gradient: 'from-dna-ochre to-dna-forest',
      featured: true,
      storyType: 'Thought Leadership',
      categoryTitle: 'Thought Leadership',
      categorySubtitle: 'Shape the narrative',
    },
  ];

  const handleCardClick = (_index: number) => {
    setInfoOpen(true);
  };

  const renderCard = (story: typeof stories[0]) => (
    <div className={`bg-gradient-to-br ${story.gradient} rounded-xl p-1.5 shadow-2xl h-full w-full`}>
      <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className={`bg-gradient-to-r ${story.gradient} text-white p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg font-serif">{story.categoryTitle}</h3>
            <Mpatapo className="w-6 h-6" />
          </div>
          <p className="text-sm text-white/80">{story.categorySubtitle}</p>
        </div>
        
        <div className="p-6 space-y-4 flex-1">
          {story.featured && (
            <div className="flex items-center gap-1.5 text-dna-gold">
              <Mpatapo className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Featured Story</span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-dna-forest text-white text-xs">{story.category}</Badge>
              <span className="text-xs text-neutral-500">{story.readTime}</span>
            </div>
            <h4 className="font-bold text-xl text-neutral-900 leading-tight">{story.title}</h4>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-dna-emerald text-white font-bold">
                {story.author.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{story.author.name}</p>
              <p className="text-xs text-neutral-500">DNA Member</p>
            </div>
          </div>

          <div className="bg-dna-forest/5 rounded-xl p-4 border-2 border-dna-forest/20">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className="w-3.5 h-3.5 text-dna-forest" />
                </div>
                <p className="text-sm font-bold text-neutral-900">{(story.engagement.views / 1000).toFixed(1)}K</p>
                <p className="text-xs text-neutral-500">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="w-3.5 h-3.5 text-dna-copper" />
                </div>
                <p className="text-sm font-bold text-neutral-900">{story.engagement.likes}</p>
                <p className="text-xs text-neutral-500">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-dna-gold" />
                </div>
                <p className="text-sm font-bold text-neutral-900">{story.engagement.comments}</p>
                <p className="text-xs text-neutral-500">Comments</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-dna-forest/10">
              <TrendingUp className="w-4 h-4 text-dna-emerald" />
              <span className="text-xs font-semibold text-neutral-700">{story.reach}</span>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-dna-forest to-dna-emerald hover:from-dna-emerald hover:to-dna-forest text-white font-semibold"
          >
            Read Full Story
          </Button>

          <div className="flex items-center justify-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-neutral-400" />
            <p className="text-xs text-center text-neutral-500">
              Share your own success story →
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="convey-section" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-dna-forest to-dna-emerald rounded-xl flex items-center justify-center">
                <Mpatapo className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-neutral-900">Convey</h2>
            </div>
            <p className="text-xl font-semibold text-neutral-900 mb-3">
              Amplify Your Story, Inspire the Movement
            </p>
            <p className="text-lg text-neutral-600 mb-6">
              Share your wins, insights, and journey to build credibility, inspire others, and create social proof for the movement. When you convey your success, you demonstrate what's possible, attracting resources, partners, and momentum to your work while showing the world that Africa's diaspora is building at scale.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mpatapo className="w-4 h-4 text-dna-forest" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Strategic Storytelling</h3>
                  <p className="text-sm text-neutral-600">Share wins, lessons, and insights that attract opportunities and inspire action</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-dna-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Credibility Building</h3>
                  <p className="text-sm text-neutral-600">Visible success stories position you as a leader and attract resources to your work</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4 text-dna-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Movement Amplification</h3>
                  <p className="text-sm text-neutral-600">Your story becomes social proof, showing the world that DNA members deliver results</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/convey')}
              className="bg-dna-forest hover:bg-dna-emerald text-white inline-flex items-center gap-2"
            >
              Explore Impact Stories
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Card Preview (Desktop) / Swipeable Cards (Mobile) */}
          <div>
            <SwipeableCardStack
              cards={stories.map((story) => renderCard(story))}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConveySection;
