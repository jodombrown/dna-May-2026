
import React, { useState } from 'react';
import PhaseObjectives from '@/components/phases/PhaseObjectives';
import PhaseTimeline from '@/components/phases/PhaseTimeline';
import PhaseMetrics from '@/components/phases/PhaseMetrics';
import { Users, MessageSquare, TrendingUp, Target, Globe, Heart, Lightbulb, UserCheck, ArrowRight } from "lucide-react";
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';
import PhaseHero from '@/components/phases/PhaseHero';

const objectives = [
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Early Adopter Interest Validation",
    description: "Measure and validate early adopter interest through strategic outreach campaigns, landing page conversions, and community engagement metrics. This phase focuses on understanding who our most passionate early supporters are and what drives their engagement with the DNA vision across different diaspora communities.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "DNA Founders Circle Community",
    description: "Launch and nurture the DNA Founders Circle as our core community of early supporters, beta testers, and platform ambassadors. Build authentic relationships with diaspora leaders, entrepreneurs, and changemakers who can help shape the platform's development and initial user base through their expertise and networks.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Problem-Solution Fit Validation",
    description: "Conduct in-depth problem-oriented interviews to validate our core assumptions about diaspora challenges and needs. Refine our understanding of user pain points, desired solutions, and the specific ways DNA can create meaningful value for connecting, collaborating, and contributing across the African diaspora ecosystem.",
    status: "Planned",
    completion: 0
  },
];

const timeline = [
  {
    quarter: "Jan 2026",
    title: "Landing Page & Strategic Outreach",
    items: [
      "Launch A/B tested landing page with early bird membership offers",
      "Deploy targeted social media campaigns across diaspora communities",
      "Begin structured problem-oriented interviews with key stakeholders",
      "Implement advanced analytics tracking for user behavior insights"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Feb 2026",
    title: "Community Building & Validation",
    items: [
      "Launch DNA Founders Circle on WhatsApp/Slack with exclusive content",
      "Host virtual community engagement events and feedback sessions",
      "Compile comprehensive interview summaries and insights reports",
      "Analyze landing page performance and optimize conversion funnels"
    ],
    status: "upcoming" as const,
  }
];

const fallbackMetrics = [
  {
    id: "1",
    label: "Landing Page Visitors",
    value: "0",
    target: "5000",
    icon: "globe",
    color: "bg-dna-emerald"
  },
  {
    id: "2", 
    label: "Early Bird Sign-ups",
    value: "0",
    target: "500",
    icon: "users",
    color: "bg-dna-copper"
  },
  {
    id: "3",
    label: "Founder Circle Members",
    value: "0",
    target: "100",
    icon: "heart",
    color: "bg-dna-gold"
  },
  {
    id: "4",
    label: "Problem Interviews",
    value: "0",
    target: "50",
    icon: "message-square",
    color: "bg-dna-forest"
  }
];

const CustomerDiscoveryPhase = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 flex flex-col">
      <UnifiedHeader />
      
      <PhaseHero
        badge="Phase 3 • Customer Discovery"
        title="Customer Discovery"
        description="Measuring early adopter interest and validation without product build through community engagement and targeted outreach across the diaspora."
        prevPhase={{ label: "Previous Phase", url: "/phase-2/prototyping" }}
        nextPhase={{ label: "Next Phase", url: "/phase-4/mvp" }}
        gradient="relative bg-gradient-to-r from-dna-forest/90 via-dna-emerald/90 to-dna-copper/90 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-r before:from-dna-forest/80 before:via-dna-emerald/80 before:to-dna-copper/80 before:z-0"
      />

      {/* Phase Overview */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">What is Customer Discovery?</h2>
            <p className="text-lg text-neutral-600 max-w-5xl mx-auto leading-relaxed">
              This phase is about understanding our community before building. We're measuring genuine interest from the African diaspora, 
              validating our assumptions about their networking and collaboration needs, and building relationships with early adopters who will help shape DNA's future. 
              Rather than building first and hoping for users, we're listening first and building with purpose to strengthen global diaspora connections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 px-4 lg:px-16">
            <div className="text-center p-8 bg-gradient-to-br from-dna-mint/20 to-dna-emerald/20 rounded-lg border border-dna-emerald/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-forest rounded-lg flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Interest Validation</h3>
              <p className="text-neutral-600 leading-relaxed">Measuring authentic engagement from diaspora communities through strategic outreach, landing page optimization, and early bird membership validation.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg border border-dna-copper/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-copper rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Community Building</h3>
              <p className="text-neutral-600 leading-relaxed">Creating the DNA Founders Circle as our core community of early supporters, platform ambassadors, and diaspora thought leaders.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-copper/20 to-dna-gold/20 rounded-lg border border-dna-gold/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-copper to-dna-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Problem Validation</h3>
              <p className="text-neutral-600 leading-relaxed">Deep-dive interviews to validate our understanding of diaspora challenges and refine our solution approach for maximum community impact.</p>
            </div>
          </div>
        </div>
      </section>

      <PhaseObjectives objectives={objectives} color="dna-emerald" />
      <PhaseTimeline milestones={timeline} color="dna-copper" />
      <PhaseMetrics phaseSlug="customer-discovery" fallbackMetrics={fallbackMetrics} />
      
      {/* Community Engagement CTA */}
      <section className="py-16 bg-gradient-to-r from-dna-emerald/10 via-dna-mint/20 to-dna-copper/10">
        <div className="w-full text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-dna-mint/30 max-w-5xl mx-auto">
            <Lightbulb className="w-16 h-16 text-dna-emerald mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Join the DNA Founders Circle
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Be part of our founding community and help shape the future of diaspora networking. 
              Get exclusive access to our development process, early features, and direct input on platform decisions that will strengthen African diaspora connections globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsBetaSignupOpen(true)}
                className="bg-dna-emerald text-white px-8 py-3 rounded-full font-semibold hover:bg-dna-forest transition-colors"
              >
                Apply to Join Circle
              </button>
              <button className="border-2 border-dna-emerald text-dna-emerald px-8 py-3 rounded-full font-semibold hover:bg-dna-emerald/10 transition-colors">
                Learn About Benefits
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

export default CustomerDiscoveryPhase;
