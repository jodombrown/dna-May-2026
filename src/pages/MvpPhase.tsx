
import React, { useState } from 'react';
import PhaseObjectives from '@/components/phases/PhaseObjectives';
import PhaseTimeline from '@/components/phases/PhaseTimeline';
import PhaseMetrics from '@/components/phases/PhaseMetrics';
import { Code, Users, Target, TrendingUp, CheckCircle, Lightbulb, Settings, ArrowRight } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';
import PhaseHero from '@/components/phases/PhaseHero';
import { MateMasie } from '@/components/icons/adinkra';

const objectives = [
  {
    icon: <Code className="w-5 h-5" />,
    title: "Core Platform Development",
    description: "Build the foundational DNA platform with essential features for connecting, collaborating, and contributing. This includes user authentication, profile management, basic messaging, and the core infrastructure needed to support our three pillars across the African diaspora community.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "User Experience Implementation",
    description: "Implement intuitive user flows and interfaces based on our prototyping and testing insights. Create seamless experiences for diaspora professionals to discover opportunities, build meaningful connections, and engage with projects that align with their skills and interests.",
    status: "Planned",
    completion: 0
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Feature Integration & Testing",
    description: "Integrate all core features into a cohesive platform experience and conduct comprehensive testing to ensure reliability, performance, and user satisfaction. This includes system integration testing, user acceptance testing, and performance optimization for launch readiness.",
    status: "Planned",
    completion: 0
  },
];

const timeline = [
  {
    quarter: "Mar 2026",
    title: "Core Development & Infrastructure",
    items: [
      "Complete backend architecture and database design for scalable user management",
      "Implement user authentication, profile creation, and core account management features",
      "Build foundational Connect features for diaspora networking and community discovery",
      "Develop basic messaging and notification systems for platform communication"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Apr-May 2026",
    title: "Feature Development & Integration",
    items: [
      "Implement Collaborate features for project discovery and team formation",
      "Build Contribute features for opportunity matching and impact tracking",
      "Create comprehensive search and filtering capabilities across all platform features",
      "Develop admin dashboard and content management systems for platform governance"
    ],
    status: "upcoming" as const,
  },
  {
    quarter: "Jun-Jul 2026",
    title: "Testing, Optimization & Launch Preparation",
    items: [
      "Conduct comprehensive system integration testing and bug resolution",
      "Implement performance optimization and security hardening measures",
      "Complete user acceptance testing with select community members",
      "Finalize launch preparation with deployment infrastructure and monitoring systems"
    ],
    status: "upcoming" as const,
  }
];

const fallbackMetrics = [
  {
    id: "1",
    label: "Features Built",
    value: "0",
    target: "30",
    icon: "code",
    color: "bg-dna-copper"
  },
  {
    id: "2", 
    label: "Alpha Testers",
    value: "0",
    target: "100",
    icon: "users",
    color: "bg-dna-gold"
  },
  {
    id: "3",
    label: "Test Cases",
    value: "0",
    target: "200",
    icon: "target",
    color: "bg-dna-emerald"
  },
  {
    id: "4",
    label: "Performance Score",
    value: "0",
    target: "95",
    icon: "zap",
    color: "bg-dna-forest"
  }
];

const MvpPhase = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 flex flex-col">
      <UnifiedHeader />
      
      <PhaseHero
        badge="Phase 4 • MVP Build"
        title="MVP Build"
        description="Building the minimum viable product with core features that enable diaspora connections, collaborations, and contributions."
        prevPhase={{ label: "Previous Phase", url: "/phase-3/customer-discovery" }}
        nextPhase={{ label: "Next Phase", url: "/phase-5/beta-validation" }}
        gradient="relative bg-gradient-to-r from-dna-forest/90 via-dna-emerald/90 to-dna-copper/90 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center before:absolute before:inset-0 before:bg-gradient-to-r before:from-dna-forest/80 before:via-dna-emerald/80 before:to-dna-copper/80 before:z-0"
      />

      {/* MVP Development Overview */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Building the Foundation</h2>
            <p className="text-lg text-neutral-600 max-w-5xl mx-auto leading-relaxed">
              This phase transforms our validated designs and research into a working platform. We're building the core DNA experience 
              that enables diaspora professionals to connect meaningfully, collaborate on impactful projects, and contribute their skills 
              to initiatives that strengthen Africa's development. Every feature is purposefully designed to serve our community's unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 px-4 lg:px-16">
            <div className="text-center p-8 bg-gradient-to-br from-dna-mint/20 to-dna-emerald/20 rounded-lg border border-dna-emerald/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-forest rounded-lg flex items-center justify-center mx-auto mb-6">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Core Development</h3>
              <p className="text-neutral-600 leading-relaxed">Building robust backend systems and user-friendly interfaces that support authentic diaspora networking and collaboration at scale.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-emerald/20 to-dna-copper/20 rounded-lg border border-dna-copper/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-emerald to-dna-copper rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">User Experience</h3>
              <p className="text-neutral-600 leading-relaxed">Implementing intuitive user flows that make it easy for diaspora professionals to discover opportunities and build meaningful connections.</p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-dna-copper/20 to-dna-gold/20 rounded-lg border border-dna-gold/30">
              <div className="w-16 h-16 bg-gradient-to-r from-dna-copper to-dna-gold rounded-lg flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Quality Assurance</h3>
              <p className="text-neutral-600 leading-relaxed">Comprehensive testing and optimization to ensure platform reliability, performance, and user satisfaction before launch.</p>
            </div>
          </div>
        </div>
      </section>

      <PhaseObjectives objectives={objectives} color="dna-emerald" />
      <PhaseTimeline milestones={timeline} color="dna-copper" />
      <PhaseMetrics phaseSlug="mvp" fallbackMetrics={fallbackMetrics} />
      
      {/* Alpha Testing CTA */}
      <section className="py-16 bg-gradient-to-r from-dna-mint/20 via-dna-emerald/10 to-dna-copper/20">
        <div className="w-full text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-dna-mint/30 max-w-5xl mx-auto">
            <Lightbulb className="w-16 h-16 text-dna-emerald mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Help Us Build DNA Together
            </h2>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Join our alpha testing community to be among the first to experience the DNA platform as we build it. 
              Your feedback helps us create features that truly serve the African diaspora's networking and collaboration needs, 
              ensuring we launch with a platform that adds real value to your professional journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsBetaSignupOpen(true)}
                className="bg-dna-emerald text-white px-8 py-3 rounded-full font-semibold hover:bg-dna-forest transition-colors"
              >
                Join Alpha Testing
              </button>
              <button className="border-2 border-dna-emerald text-dna-emerald px-8 py-3 rounded-full font-semibold hover:bg-dna-emerald/10 transition-colors">
                View Development Updates
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

export default MvpPhase;
