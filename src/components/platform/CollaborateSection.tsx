import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handshake, ArrowRight, Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import SwipeableCardStack from './SwipeableCardStack';
import { FuntunfunefuDenkyemfunefu } from '@/components/icons/adinkra';
import PillarInfoSheet from './PillarInfoSheet';

const CollaborateSection = () => {
  const [infoOpen, setInfoOpen] = useState(false);

  const projects = [
    {
      title: 'Solar Education Initiative',
      description: 'Bringing sustainable energy to rural schools',
      status: 'Active',
      progress: 68,
      team: 12,
      countries: 6,
      pooled: '$2.3M',
      gradient: 'from-dna-copper to-dna-gold',
      engagementType: 'Join Active Project',
      categoryTitle: 'Impact Projects',
      categorySubtitle: 'Build sustainable change',
    },
    {
      title: 'FinTech for Refugees',
      description: 'Financial inclusion platform for displaced persons',
      status: 'New Launch',
      progress: 10,
      team: 4,
      countries: 2,
      pooled: '$500K',
      gradient: 'from-dna-gold to-dna-ochre',
      engagementType: 'Start a Project',
      categoryTitle: 'Innovation Labs',
      categorySubtitle: 'Launch breakthrough solutions',
    },
    {
      title: 'Climate Data Collective',
      description: 'Open-source climate monitoring network',
      status: 'Recruiting',
      progress: 42,
      team: 15,
      countries: 8,
      pooled: '$1.2M',
      gradient: 'from-dna-ochre to-dna-emerald',
      engagementType: 'Expert Network',
      categoryTitle: 'Research Consortiums',
      categorySubtitle: 'Advance knowledge together',
    },
    {
      title: 'Shared Manufacturing Hub',
      description: 'Pooled equipment and facilities for makers',
      status: 'Active',
      progress: 55,
      team: 22,
      countries: 5,
      pooled: '$3.1M',
      gradient: 'from-dna-emerald to-dna-forest',
      engagementType: 'Resource Sharing',
      categoryTitle: 'Resource Collectives',
      categorySubtitle: 'Pool assets and expertise',
    },
    {
      title: 'Pan-African E-Commerce',
      description: 'Cross-border marketplace for African goods',
      status: 'Scaling',
      progress: 78,
      team: 34,
      countries: 12,
      pooled: '$5.8M',
      gradient: 'from-dna-forest to-dna-copper',
      engagementType: 'Cross-Border Team',
      categoryTitle: 'Joint Ventures',
      categorySubtitle: 'Scale across borders',
    },
  ];

  const handleCardClick = (_index: number) => {
    setInfoOpen(true);
  };

  const renderCard = (project: typeof projects[0]) => (
    <div className={`bg-gradient-to-br ${project.gradient} rounded-xl p-1.5 shadow-2xl h-full w-full`}>
      <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className={`bg-gradient-to-r ${project.gradient} text-white p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg font-serif">{project.categoryTitle}</h3>
            <FuntunfunefuDenkyemfunefu className="w-6 h-6" />
          </div>
          <p className="text-sm text-white/80">{project.categorySubtitle}</p>
        </div>
        
        <div className="p-6 space-y-6 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-xl text-neutral-900">{project.title}</h4>
              <Badge className="bg-dna-emerald text-white text-xs">{project.status}</Badge>
            </div>
            <p className="text-sm text-neutral-600 mb-3">{project.description}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Progress</span>
              <span className="font-semibold text-dna-copper">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-dna-copper/10 rounded-lg">
              <Users className="w-4 h-4 mx-auto mb-1 text-dna-copper" />
              <p className="text-sm font-bold text-neutral-900">{project.team}</p>
              <p className="text-xs text-neutral-500">Team</p>
            </div>
            <div className="text-center p-3 bg-dna-gold/10 rounded-lg">
              <Target className="w-4 h-4 mx-auto mb-1 text-dna-ochre" />
              <p className="text-sm font-bold text-neutral-900">{project.countries}</p>
              <p className="text-xs text-neutral-500">Countries</p>
            </div>
            <div className="text-center p-3 bg-dna-emerald/10 rounded-lg">
              <DollarSign className="w-4 h-4 mx-auto mb-1 text-dna-emerald" />
              <p className="text-sm font-bold text-neutral-900">{project.pooled}</p>
              <p className="text-xs text-neutral-500">Pooled</p>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-dna-copper to-dna-gold hover:from-dna-gold hover:to-dna-copper text-white font-semibold"
          >
            Explore Collaboration
          </Button>

          <p className="text-xs text-center text-neutral-500">
            Join the team and pool resources →
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="collaborate-section" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-dna-copper to-dna-gold rounded-xl flex items-center justify-center">
                <FuntunfunefuDenkyemfunefu className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-neutral-900">Collaborate</h2>
            </div>
            <p className="text-xl font-semibold text-neutral-900 mb-3">
              Build Solutions Together
            </p>
            <p className="text-lg text-neutral-600 mb-6">
              Transform ideas into funded ventures through structured collaboration. Co-create with fellow members, access shared resources, track milestones transparently, and participate in real initiatives solving Africa's challenges. Your contribution earns recognition, equity, and impact while building solutions that scale.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-copper/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-dna-copper" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Structured Co-Creation</h3>
                  <p className="text-sm text-neutral-600">Clear workflows, defined roles, and milestone-based progress keep projects moving</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-dna-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Transparent Value Exchange</h3>
                  <p className="text-sm text-neutral-600">Contributions are tracked and rewarded with equity, recognition, or revenue share</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dna-emerald/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-dna-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Collective Problem-Solving</h3>
                  <p className="text-sm text-neutral-600">Combine diverse expertise to tackle challenges no one could solve alone</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/collaborate')}
              className="bg-dna-copper hover:bg-dna-gold text-white inline-flex items-center gap-2"
            >
              Explore Active Collaborations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Card Preview (Desktop) / Swipeable Cards (Mobile) */}
          <div>
            <SwipeableCardStack
              cards={projects.map((project) => renderCard(project))}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollaborateSection;
