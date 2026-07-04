import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DiasporaStats from '@/components/DiasporaStats';
import { TYPOGRAPHY } from '@/lib/typography.config';
import PatternBackground from '@/components/ui/PatternBackground';
import heroProfessional from '@/assets/hero-professional.jpeg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Main Hero Section with Kente pattern */}
      <PatternBackground pattern="kente" intensity="subtle" className="relative bg-gradient-to-br from-dna-terra-light/20 via-white to-dna-ochre-light/10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center min-h-[60vh] py-8 lg:py-12">
            
            {/* Left Column, Main Content */}
            <div className="space-y-4 lg:space-y-8">
              {/* Main Headline */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-serif text-dna-forest mb-4 lg:mb-6 leading-[1.1] lg:leading-[1.05]">
                  Welcome to the
                  <br />
                  <span className="text-dna-copper">Diaspora Network of Africa</span>
                </h1>
                
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-muted-foreground mb-2 lg:mb-3 leading-relaxed">
                  Where the African diaspora goes from scattered potential to coordinated power.
                </p>

                <p className="text-base sm:text-lg lg:text-xl text-dna-forest/80 font-medium mb-3 lg:mb-4">
                  One platform. Five ways to move Africa forward.
                </p>

                {/* Auth Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start mb-4 lg:mb-6">
                  <Button
                    onClick={() => navigate('/auth?mode=signup')}
                    className="bg-dna-emerald text-white hover:bg-dna-forest text-sm px-4 py-2 h-9 font-medium"
                  >
                    Sign up
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/auth?mode=signin')}
                    className="border-2 border-dna-forest text-dna-forest hover:bg-dna-forest hover:text-white text-sm px-4 py-2 h-9 font-medium"
                  >
                    Sign in
                  </Button>
                </div>

                {/* Legal Disclaimer */}
                <p className="text-xs sm:text-sm text-neutral-600 text-center lg:text-left leading-relaxed">
                  By clicking Continue to join or sign in, you agree to DNA's{' '}
                  <a href="/legal/user-agreement" className="text-dna-copper hover:underline font-medium">
                    User Agreement
                  </a>
                  ,{' '}
                  <a href="/legal/privacy-policy" className="text-dna-copper hover:underline font-medium">
                    Privacy Policy
                  </a>
                  ,{' '}
                  <a href="/legal/terms" className="text-dna-copper hover:underline font-medium">
                    Terms & Conditions
                  </a>
                  , and{' '}
                  <a href="/legal/cookie-policy" className="text-dna-copper hover:underline font-medium">
                    Cookie Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Right Column, Hero Image */}
            <div className="relative h-full min-h-[400px] lg:min-h-[500px]">
              <div className="relative rounded-lg overflow-hidden shadow-2xl h-full">
                <img 
                  src={heroProfessional} 
                  alt="African diaspora professionals collaborating and working together" 
                  className="w-full h-full object-cover"
                  width={800}
                  height={600}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-dna-sunset/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-dna-terra/10 rounded-full blur-3xl"></div>
        </div>
      </PatternBackground>

      {/* Statistics Section with Mudcloth pattern */}
      <PatternBackground pattern="mudcloth" intensity="subtle" className="py-10 bg-gradient-to-r from-dna-terra/10 to-dna-sunset/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DiasporaStats />
        </div>
      </PatternBackground>


    </>
  );
};

export default HeroSection;
