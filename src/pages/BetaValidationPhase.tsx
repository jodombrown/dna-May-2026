
import React, { useState } from 'react';
import PhaseObjectives from '@/components/phases/PhaseObjectives';
import PhaseTimeline from '@/components/phases/PhaseTimeline';
import PhaseMetrics from '@/components/phases/PhaseMetrics';
import { Users, BarChart3, MessageSquare, Target, TrendingUp, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';
import PhaseHero from '@/components/phases/PhaseHero';
import { MateMasie } from '@/components/icons/adinkra';

const objectives = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "MVP Performance & Product-Market Fit Validation",
    description: "Comprehensively validate our MVP's performance metrics, user retention rates, engagement patterns, and overall product-market fit through systematic beta testing with 200-500 carefully selected users. Measure key performance indicators, user satisfaction scores, and platform adoption rates to ensure we're ready for public launch.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Beta Community Engagement & Feedback Loop",
    description: "Build and nurture a highly engaged beta user community that provides continuous feedback, reports issues, and helps refine the platform experience. Track user engagement patterns, feature adoption, satisfaction scores, and community health metrics to optimize for long-term user success and platform stickiness.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Monetization Strategy & Revenue Model Validation",
    description: "Test and validate our monetization strategies, pricing models, and revenue generation approaches with real user behavior data. Experiment with different pricing tiers, premium features, and partnership revenue streams to establish a sustainable and scalable business model that serves our community while generating growth capital.",
    status: "Planned",
    completion: 0
  },
];

const timeline = [
  {
    quarter: "Aug 2026",
    title: "Beta Launch & User Onboarding Optimization",
    items: [
      "Controlled beta launch with 200-500 carefully selected diaspora community members",
      "Advanced user onboarding process optimization with personalized experience flows",
      "AI-powered cohort tracking system implementation for detailed user behavior analysis",
      "Comprehensive usage analytics dashboard creation for real-time performance monitoring"
    ],
    status: "upcoming" as const,
  }
];

const fallbackMetrics = [
  {
    id: "1",
    label: "Beta Users",
    value: "0",
    target: "500",
    icon: "users",
    color: "bg-dna-copper"
  },
  {
    id: "2", 
    label: "NPS Score",
    value: "0",
    target: "50",
    icon: "thumbs-up",
    color: "bg-dna-gold"
  },
  {
    id: "3",
    label: "Usage Reports",
    value: "0",
    target: "20",
    icon: "bar-chart",
    color: "bg-dna-emerald"
  },
  {
    id: "4",
    label: "Feedback Sessions",
    value: "0",
    target: "25",
    icon: "message-square",
    color: "bg-dna-forest"
  }
];

const BetaValidationPhase = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 flex flex-col">
      <UnifiedHeader />
      
      <PhaseHero
        badge="Phase 5 • Beta Validation"
        title="Beta Validation"
        description="Validating MVP performance, retention, and monetization readiness through comprehensive beta testing with real users from the diaspora community."
        prevPhase={{ label: "Previous Phase", url: "/phase-4/mvp" }}
        nextPhase={{ label: "Next Phase", url: "/phase-6/go-to-market" }}
        gradient="relative bg-gradient-to-r from-dna-copper/90 via-dna-gold/90 to-dna-emerald/90 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-r before:from-dna-copper/80 before:via-dna-gold/80 before:to-dna-emerald/80 before:z-0"
      />

      {/* Beta Testing Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Real Users, Real Validation</h2>
            <p className="text-lg text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              This is where DNA meets reality. Our beta phase puts the platform in the hands of 200-500 real users from the 
              African diaspora community. We're not just testing features - we're validating our entire vision, measuring 
              real engagement, and ensuring we've built something that truly adds value to people's lives and professional networks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-dna-copper/10 rounded-xl border border-dna-copper/30">
              <div className="w-12 h-12 bg-dna-copper rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Real Users</h3>
              <p className="text-neutral-600 text-sm">500 beta testers from across the diaspora community testing real scenarios.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-gold/10 rounded-xl border border-dna-gold/30">
              <div className="w-12 h-12 bg-dna-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Performance Metrics</h3>
              <p className="text-neutral-600 text-sm">Comprehensive tracking of user engagement, retention, and satisfaction.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-emerald/10 rounded-xl border border-dna-emerald/30">
              <div className="w-12 h-12 bg-dna-emerald rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Monetization Testing</h3>
              <p className="text-neutral-600 text-sm">Validating revenue models and pricing strategies with real user data.</p>
            </div>
            
            <div className="text-center p-6 bg-dna-forest/10 rounded-xl border border-dna-forest/30">
              <div className="w-12 h-12 bg-dna-forest rounded-full flex items-center justify-center mx-auto mb-4">
                <MateMasie className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Launch Readiness</h3>
              <p className="text-neutral-600 text-sm">Ensuring platform stability and user experience before public launch.</p>
            </div>
          </div>
        </div>
      </section>

      <PhaseObjectives objectives={objectives} color="dna-copper" />
      <PhaseTimeline milestones={timeline} color="dna-gold" />
      <PhaseMetrics phaseSlug="beta-validation" fallbackMetrics={fallbackMetrics} />
      
      {/* Beta Community CTA */}
      <section className="py-16 bg-gradient-to-r from-dna-copper/20 via-dna-gold/10 to-dna-emerald/20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-dna-copper/30">
            <CheckCircle className="w-16 h-16 text-dna-copper mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Join Our Beta Testing Community
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Be among the first to experience DNA and help us perfect the platform before public launch. Beta testers get 
              exclusive access, direct input on features, and the opportunity to shape the future of diaspora networking. 
              Your participation helps us validate our approach and ensures we launch with a platform that truly serves your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsBetaSignupOpen(true)}
                className="bg-dna-copper text-white px-8 py-3 rounded-full font-semibold hover:bg-dna-gold transition-colors"
              >
                Apply for Beta Access
              </button>
              <button className="border-2 border-dna-copper text-dna-copper px-8 py-3 rounded-full font-semibold hover:bg-dna-copper/10 transition-colors">
                Learn About Beta Program
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

export default BetaValidationPhase;
