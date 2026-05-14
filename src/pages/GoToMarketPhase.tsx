import React, { useState } from 'react';
import PhaseObjectives from '@/components/phases/PhaseObjectives';
import PhaseTimeline from '@/components/phases/PhaseTimeline';
import PhaseMetrics from '@/components/phases/PhaseMetrics';
import { Megaphone, Globe, TrendingUp, BarChart3, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import AmbassadorSignupDialog from '@/components/AmbassadorSignupDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';
import PhaseHero from '@/components/phases/PhaseHero';
import { MateMasie } from '@/components/icons/adinkra';

const objectives = [
  {
    icon: <Megaphone className="w-5 h-5" />,
    title: "Global Platform Launch & Market Penetration",
    description: "Execute a comprehensive global launch strategy to bring the DNA platform to target diaspora communities across major regions including North America, Europe, and key African markets. Implement multi-channel marketing campaigns, strategic partnerships, and community-driven growth initiatives to achieve sustainable user acquisition and engagement.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "International Expansion & Regional Adaptation",
    description: "Establish localized DNA presence in key diaspora regions through strategic partnerships, local community leaders, and region-specific features. Adapt platform functionality to serve diverse cultural contexts while maintaining our core mission of connecting, collaborating, and contributing across the African diaspora ecosystem.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Growth Optimization & Sustainable Scaling",
    description: "Implement data-driven growth optimization strategies including user acquisition funnels, retention programs, and viral growth mechanisms. Establish sustainable revenue streams, strategic partnerships, and community-driven expansion to ensure long-term platform viability and impact across the diaspora community.",
    status: "Planned",
    completion: 0
  },
];

const timeline = [
  {
    quarter: "Sep 2026",
    title: "Launch Preparation & Market Entry",
    items: [
      "Finalize global launch strategy with region-specific go-to-market approaches",
      "Complete platform internationalization with multi-language and cultural adaptations",
      "Establish strategic partnerships with diaspora organizations and community leaders",
      "Launch comprehensive marketing campaigns across digital and traditional channels"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Oct 2026",
    title: "Global Rollout & Community Expansion",
    items: [
      "Execute phased global rollout starting with key diaspora hubs and markets",
      "Implement user acquisition campaigns with performance tracking and optimization",
      "Launch ambassador programs with community leaders and influential diaspora figures",
      "Establish local community chapters and region-specific engagement initiatives"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Nov 2026+",
    title: "Scale Optimization & Sustainable Growth",
    items: [
      "Optimize platform performance and user experience based on global usage patterns",
      "Implement advanced analytics and AI-driven personalization for enhanced user engagement",
      "Expand revenue streams through premium features, partnerships, and enterprise solutions",
      "Establish long-term sustainability through community governance and strategic partnerships"
    ],
    status: "upcoming" as const,
  }
];

const fallbackMetrics = [
  {
    id: "1",
    label: "Global Users",
    value: "0",
    target: "50,000",
    icon: "globe",
    color: "bg-dna-emerald"
  },
  {
    id: "2",
    label: "Monthly Revenue",
    value: "$0",
    target: "$150K",
    icon: "trending-up",
    color: "bg-dna-copper"
  },
  {
    id: "3",
    label: "Active Countries",
    value: "0",
    target: "25",
    icon: "flag",
    color: "bg-dna-gold"
  },
  {
    id: "4",
    label: "Corporate Partners",
    value: "0",
    target: "200",
    icon: "briefcase",
    color: "bg-dna-forest"
  }
];

const GoToMarketPhase = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);
  const [isAmbassadorSignupOpen, setIsAmbassadorSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 flex flex-col">
      <UnifiedHeader />
      
      <PhaseHero
        badge="Phase 6 • Go-to-Market"
        title="Go-to-Market"
        description="Launching DNA globally to connect the African diaspora worldwide, creating sustainable growth through strategic partnerships and community-driven expansion."
        prevPhase={{ label: "Previous Phase", url: "/phase-5/beta-validation" }}
        gradient="relative bg-gradient-to-r from-dna-forest/90 via-dna-emerald/90 to-dna-copper/90 bg-[url('https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-r before:from-dna-forest/80 before:via-dna-emerald/80 before:to-dna-copper/80 before:z-0"
      />

      {/* Launch Strategy Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Global DNA Movement</h2>
            <p className="text-lg text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              This is where DNA becomes a global movement for the African diaspora. Our go-to-market strategy focuses on 
              authentic community building, strategic partnerships, and sustainable growth that honors our mission. We're not 
              just launching a platform - we're catalyzing a movement that strengthens diaspora connections and accelerates Africa's development through collective action.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-dna-mint/20 to-dna-emerald/20 rounded-lg border border-dna-emerald/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-forest rounded-lg flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Strategic Launch</h3>
              <p className="text-neutral-600 leading-relaxed">Coordinated global launch across key diaspora markets with culturally-relevant messaging and community-driven growth strategies.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg border border-dna-copper/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-copper rounded-lg flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Global Expansion</h3>
              <p className="text-neutral-600 leading-relaxed">International expansion through local partnerships, regional adaptation, and community leadership across diaspora hubs worldwide.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-copper/20 to-dna-gold/20 rounded-lg border border-dna-gold/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-copper to-dna-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Sustainable Growth</h3>
              <p className="text-neutral-600 leading-relaxed">Building sustainable revenue streams and growth mechanisms that support long-term platform viability and community impact.</p>
            </div>
          </div>
        </div>
      </section>

      <PhaseObjectives objectives={objectives} color="dna-emerald" />
      <PhaseTimeline milestones={timeline} color="dna-copper" />
      <PhaseMetrics phaseSlug="go-to-market" fallbackMetrics={fallbackMetrics} />
      
      {/* Launch Community CTA */}
      <section className="py-16 bg-gradient-to-r from-dna-mint/20 via-dna-emerald/10 to-dna-copper/20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-dna-mint/30">
            <Lightbulb className="w-16 h-16 text-dna-emerald mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Be Part of the DNA Movement
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Join our launch community to be among the first to experience DNA when we go live globally. Help us spread 
              the word, invite your networks, and become a catalyst for strengthening diaspora connections worldwide. 
              Together, we can create a movement that transforms how the African diaspora connects, collaborates, and contributes to Africa's development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsBetaSignupOpen(true)}
                className="bg-dna-emerald text-white px-8 py-3 rounded-full font-semibold hover:bg-dna-forest transition-colors"
              >
                Join Launch Community
              </button>
              <button 
                onClick={() => setIsAmbassadorSignupOpen(true)}
                className="border-2 border-dna-emerald text-dna-emerald px-8 py-3 rounded-full font-semibold hover:bg-dna-emerald/10 transition-colors"
              >
                Become an Ambassador
              </button>
            </div>
          </div>
        </div>
      </section>

      <BetaSignupDialog 
        isOpen={isBetaSignupOpen} 
        onClose={() => setIsBetaSignupOpen(false)} 
      />

      <AmbassadorSignupDialog 
        isOpen={isAmbassadorSignupOpen} 
        onClose={() => setIsAmbassadorSignupOpen(false)} 
      />
      
      <Footer />
    </div>
  );
};

export default GoToMarketPhase;
