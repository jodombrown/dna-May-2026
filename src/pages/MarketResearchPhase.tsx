
import React, { useState } from 'react';
import PhaseObjectives from '@/components/phases/PhaseObjectives';
import PhaseTimeline from '@/components/phases/PhaseTimeline';
import PhaseMetrics from '@/components/phases/PhaseMetrics';
import { Search, Users, FileText, Target, TrendingUp, MessageSquare, BookOpen, BarChart3, ArrowRight } from "lucide-react";
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';
import PhaseHero from '@/components/phases/PhaseHero';

const objectives = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "Deep Diaspora Needs Analysis",
    description: "Conduct comprehensive research into diaspora motivations, behaviors, challenges, and unmet needs across different regions, demographics, and professional backgrounds.",
    status: "In Progress",
    completion: 85
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "DNA Concept Market Validation",
    description: "Test and validate our core platform concept, value propositions, and potential market fit through structured feedback sessions, surveys, and stakeholder interviews.",
    status: "Active",
    completion: 70
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Market Opportunity Quantification",
    description: "Quantify the total addressable market and specific market segments using public data sources, proprietary research, competitive analysis, and demographic studies.",
    status: "Active",
    completion: 60
  },
];

const timeline = [
  {
    quarter: "Jun 2025",
    title: "Research Foundation & Methodology",
    items: [
      "AI-powered research synthesis of global diaspora trends and patterns",
      "Comprehensive competitive landscape mapping and analysis",
      "Research methodology framework development and validation",
      "Strategic stakeholder identification and systematic outreach planning"
    ],
    status: "active" as const,
  },
  {
    quarter: "Jul-Aug 2025",
    title: "Data Collection & Stakeholder Engagement",
    items: [
      "50+ in-depth stakeholder interviews (auto-scheduled and transcribed)",
      "Advanced sentiment analysis on community surveys and feedback",
      "Detailed persona development workshops with community leaders",
      "User journey mapping sessions across different diaspora segments"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Sep 2025",
    title: "Analysis & Strategic Validation",
    items: [
      "Comprehensive research report compilation and synthesis",
      "Market size validation using multiple data sources and methodologies",
      "Strategic validation memo with actionable insights and recommendations",
      "Phase 2 planning, resource allocation, and team transition preparation"
    ],
    status: "upcoming" as const,
  }
];

const fallbackMetrics = [
  {
    id: "1",
    label: "Stakeholder Interviews",
    value: "32",
    target: "50",
    icon: "message-square",
    color: "bg-dna-emerald"
  },
  {
    id: "2", 
    label: "Survey Responses",
    value: "127",
    target: "200",
    icon: "users",
    color: "bg-dna-copper"
  },
  {
    id: "3",
    label: "Research Hours",
    value: "240",
    target: "400",
    icon: "clock",
    color: "bg-dna-gold"
  },
  {
    id: "4",
    label: "Personas Created",
    value: "3",
    target: "5",
    icon: "target",
    color: "bg-dna-forest"
  }
];

const MarketResearchPhase = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-dna-mint/10 flex flex-col">
      <UnifiedHeader />
      
      <PhaseHero
        badge="Phase 1 • Market Research"
        title="Market Research"
        description="Understanding diaspora needs, motivations, and behaviors to validate DNA's concept and market fit through comprehensive research."
        nextPhase={{ label: "Next Phase", url: "/phase-2/prototyping" }}
        gradient="relative bg-gradient-to-r from-dna-forest/90 via-dna-emerald/90 to-dna-copper/90 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-r before:from-dna-forest/80 before:via-dna-emerald/80 before:to-dna-copper/80 before:z-0"
      />

      {/* Research Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Why Research First?</h2>
            <p className="text-lg text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              Before building DNA, we're investing deeply in understanding the African diaspora's needs, challenges, and aspirations. 
              This research-first approach ensures we create a platform that truly serves our community, not just what we think they need. 
              Every feature, every interaction, every decision will be grounded in real insights from real people.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-dna-mint/10 rounded-xl border border-dna-mint/30">
              <div className="w-12 h-12 bg-dna-forest rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Deep Research</h3>
              <p className="text-neutral-600 text-sm">AI-powered analysis of diaspora trends, behaviors, and market dynamics.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-emerald/10 rounded-xl border border-dna-emerald/30">
              <div className="w-12 h-12 bg-dna-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Stakeholder Voices</h3>
              <p className="text-neutral-600 text-sm">50+ interviews with diaspora leaders, entrepreneurs, and community builders.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-copper/10 rounded-xl border border-dna-copper/30">
              <div className="w-12 h-12 bg-dna-copper rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Data Analysis</h3>
              <p className="text-neutral-600 text-sm">Quantitative validation of market size, opportunities, and growth potential.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-gold/10 rounded-xl border border-dna-gold/30">
              <div className="w-12 h-12 bg-dna-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Validation</h3>
              <p className="text-neutral-600 text-sm">Testing our core assumptions and refining our platform concept.</p>
            </div>
          </div>
        </div>
      </section>

      <PhaseObjectives objectives={objectives} color="dna-emerald" />
      <PhaseTimeline milestones={timeline} color="dna-copper" />
      <PhaseMetrics phaseSlug="market-research" fallbackMetrics={fallbackMetrics} />
      
      {/* Research Community CTA */}
      <section className="py-16 bg-gradient-to-r from-dna-mint/20 via-dna-emerald/10 to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-dna-mint/30">
            <Search className="w-16 h-16 text-dna-emerald mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Help Shape DNA Through Research
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Your voice matters in building a platform that truly serves the African diaspora. Join our research community 
              to share your experiences, insights, and vision for how we can better strengthen our global network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsBetaSignupOpen(true)}
                className="bg-dna-emerald text-white px-8 py-3 rounded-full font-semibold hover:bg-dna-forest transition-colors"
              >
                Participate in Research
              </button>
              <button className="border-2 border-dna-emerald text-dna-emerald px-8 py-3 rounded-full font-semibold hover:bg-dna-emerald/10 transition-colors">
                View Research Updates
              </button>
            </div>
          </div>
        </div>
      </section>

      <BetaSignupDialog 
        isOpen={isBetaSignupOpen} 
        onClose={() => setIsBetaSignupOpen(false)} 
      />
      
      <Footer />
    </div>
  );
};

export default MarketResearchPhase;
