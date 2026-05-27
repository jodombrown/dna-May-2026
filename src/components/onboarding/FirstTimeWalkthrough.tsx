import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTourProgress } from '@/hooks/useTourProgress';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
  MateMasie,
} from '@/components/icons/adinkra';
import dnaLogo from '@/assets/dna-logo.png';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight: string;
  tips: string[];
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Diaspora Network of Africa',
    description: 'A global community of professionals committed to Africa\'s development. DNA is built on the Five C\'s.',
    icon: <img src={dnaLogo} alt="DNA" className="h-14 w-auto" />,
    highlight: 'Your journey starts here',
    tips: [
      'Connect, Convene, Collaborate, Contribute, and Convey',
      'Each action you take creates value that flows into your next opportunity',
      'Explore at your own pace. DIA will guide you along the way',
    ],
  },
  {
    id: 'feed',
    title: 'Feed',
    description: 'Your home base for discovering what\'s happening across the diaspora network.',
    icon: <Newspaper className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Share your story, engage with others',
    tips: [
      'Create posts to share updates, insights, and questions',
      'Use the tabs to filter: All, For You, My Network, Mine, Saved',
      'React, comment, and bookmark posts that resonate with you',
      'Share posts with your network to amplify important voices',
    ],
  },
  {
    id: 'connect',
    title: 'Connect',
    description: 'Build your professional network across borders with people who share your commitment to Africa.',
    icon: <Sankofa className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Find your people, grow your network',
    tips: [
      'Discover members by skills, location, heritage, and interests',
      'Send connection requests with personalized messages',
      'View profiles to learn about potential collaborators',
      'Your connections appear in your network feed',
    ],
  },
  {
    id: 'convene',
    title: 'Convene',
    description: 'Discover and host events that bring the diaspora together. Online, in person, or hybrid.',
    icon: <Nkonsonkonson className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Gather with purpose',
    tips: [
      'Browse events by region, focus area, and format',
      'RSVP and add events to your calendar',
      'Host your own events from the Convene hub',
      'Use event check-in to track attendance',
    ],
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    description: 'Launch and join Spaces - shared work surfaces where the diaspora builds together.',
    icon: <FuntunfunefuDenkyemfunefu className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Build together across borders',
    tips: [
      'Join Spaces aligned with your skills and interests',
      'Use boards and tasks to coordinate distributed teams',
      'Invite members from your network into Spaces',
      'Track progress and accountability in one place',
    ],
  },
  {
    id: 'contribute',
    title: 'Contribute',
    description: 'A purpose-driven marketplace where the diaspora exchanges value with Africa.',
    icon: <Adinkrahene className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Offer what you have, find what you need',
    tips: [
      'Post Needs or Offers across capital, expertise, network, and time',
      'Discover opportunities matched to your sectors',
      'Track fulfillment and impact from your profile',
      'Your contributions become part of your living record',
    ],
  },
  {
    id: 'convey',
    title: 'Convey',
    description: 'Share your diaspora story, insights, and knowledge with a community that wants to hear it.',
    icon: <Mpatapo className="h-12 w-12 text-dna-emerald" />,
    highlight: 'Your voice amplified',
    tips: [
      'Create impact stories that inspire and educate',
      'Choose from story templates: Personal Journey, Case Study, Opinion, and more',
      'Browse stories by type, region, and focus areas',
      'Engage with stories that resonate. Your engagement shapes recommendations',
    ],
  },
];


export function FirstTimeWalkthrough() {
  const { 
    isCompleted, 
    completeTour, 
    markTourShown,
    currentStep: savedStep,
    updateStep 
  } = useTourProgress();
  
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedLocally, setHasCompletedLocally] = useState(() => {
    // Check localStorage for immediate completion state
    return localStorage.getItem('dna_tour_completed') === 'true';
  });

  useEffect(() => {
    // Don't show if completed in DB or locally
    if (isCompleted || hasCompletedLocally) {
      setIsVisible(false);
      return;
    }

    // Show walkthrough after a short delay for first-time users
    const timer = setTimeout(() => {
      setIsVisible(true);
      markTourShown();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isCompleted, hasCompletedLocally, markTourShown]);

  // Sync with saved step if resuming (with bounds checking)
  useEffect(() => {
    if (savedStep > 0 && savedStep < walkthroughSteps.length) {
      setCurrentStep(savedStep);
    } else if (savedStep >= walkthroughSteps.length) {
      // Reset to 0 if savedStep is out of bounds
      setCurrentStep(0);
    }
  }, [savedStep]);
 
  const handleComplete = async () => {
    // Set local state immediately to prevent re-showing
    setHasCompletedLocally(true);
    localStorage.setItem('dna_tour_completed', 'true');
    setIsVisible(false);
    
    // Then persist to database
    completeTour();
    
    // Navigate to feed after completion
    navigate('/dna/feed');
  };

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateStep(nextStep);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStep(prevStep);
    }
  };

  if (!isVisible || hasCompletedLocally) return null;

  // Safety check: ensure step exists
  const step = walkthroughSteps[currentStep];
  if (!step) return null;
  
  const isLastStep = currentStep === walkthroughSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg"
        >
          <Card className="relative overflow-hidden border-2 border-dna-emerald/30 bg-card shadow-2xl">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-dna-emerald to-dna-amber"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Step indicator */}
              <div className="flex justify-center gap-1.5 mb-6">
                {walkthroughSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep 
                        ? 'w-6 bg-dna-emerald' 
                        : idx < currentStep 
                        ? 'w-1.5 bg-dna-emerald/50' 
                        : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Icon and title */}
              <motion.div
                key={step.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-dna-emerald/20 to-dna-amber/10">
                    {step.icon}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-dna-amber uppercase tracking-wider mb-1">
                    {step.highlight}
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {step.title}
                  </h2>
                </div>

                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>

              {/* Tips */}
              <motion.div
                key={`tips-${step.id}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6 space-y-3"
              >
                {step.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-dna-emerald/10 flex items-center justify-center flex-shrink-0">
                      <MateMasie className="h-3 w-3 text-dna-emerald" />
                    </div>
                    <span className="text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </motion.div>

              {/* Actions - No skip, must complete */}
              <div className="mt-8 flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-dna-emerald hover:bg-dna-emerald/90 text-white"
                >
                  {isLastStep ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Step count indicator */}
              <div className="mt-4 text-center">
                <span className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {walkthroughSteps.length}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
