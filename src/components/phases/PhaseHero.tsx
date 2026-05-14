
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PhaseHeroProps {
  badge: string;
  title: string;
  description: string;
  prevPhase?: { label: string; url: string };
  nextPhase?: { label: string; url: string };
  gradient: string;
}

const PhaseHero: React.FC<PhaseHeroProps> = ({
  badge,
  title,
  description,
  prevPhase,
  nextPhase,
  gradient,
}) => {
  const navigate = useNavigate();
  const [showStickyButtons, setShowStickyButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('.phase-hero-section');
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        setShowStickyButtons(heroBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationButtons = (
    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
      {prevPhase && (
        <Button
          onClick={() => navigate(prevPhase.url)}
          variant="outline"
          className="bg-white/20 text-white border-white/30 hover:bg-dna-emerald hover:text-white hover:border-dna-emerald font-medium px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {prevPhase.label}
        </Button>
      )}
      
      <Button
        onClick={() => navigate('/contact')}
        className="bg-white text-dna-emerald hover:bg-dna-mint hover:text-dna-forest font-medium px-6 py-3"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Share Feedback
      </Button>
      
      {nextPhase && (
        <Button
          onClick={() => navigate(nextPhase.url)}
          className="bg-dna-copper hover:bg-dna-gold text-white font-medium px-6 py-3"
        >
          {nextPhase.label}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );

  const stickyNavigationButtons = (
    <div className="flex justify-center gap-4">
      {prevPhase && (
        <Button
          onClick={() => navigate(prevPhase.url)}
          variant="outline"
          size="sm"
          className="border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {prevPhase.label}
        </Button>
      )}
      
      <Button
        onClick={() => navigate('/contact')}
        size="sm"
        className="bg-dna-emerald hover:bg-dna-forest text-white"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Feedback
      </Button>
      
      {nextPhase && (
        <Button
          onClick={() => navigate(nextPhase.url)}
          size="sm"
          className="bg-dna-copper hover:bg-dna-gold text-white"
        >
          {nextPhase.label}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Sticky Navigation Bar */}
      {showStickyButtons && (
        <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 py-3 z-40 transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {stickyNavigationButtons}
          </div>
        </div>
      )}

      <section className={`phase-hero-section py-12 ${gradient} text-white overflow-hidden`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white hover:bg-dna-emerald hover:text-white font-semibold px-6 py-2 rounded-full text-base shadow backdrop-blur-sm">
              {badge}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-xl">{title}</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 mb-8 leading-relaxed drop-shadow-lg">{description}</p>
            
            {/* Navigation & Engagement */}
            <div className="mb-6">
              {navigationButtons}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PhaseHero;
