import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Users, MessageSquare, BookOpen, CheckCircle } from 'lucide-react';
import { useTourProgress } from "@/hooks/useTourProgress";
import { cn } from "@/lib/utils";
import { MateMasie } from '@/components/icons/adinkra';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to DNA!',
    description: 'Before you connect with the vibrant African diaspora, let\'s explore what DNA has to offer.',
    icon: MateMasie,
    content: (
      <ul className="list-disc pl-4 space-y-1 text-sm">
        <li><b>Fill out your profile</b> for better connection and discovery.</li>
        <li><b>Join communities</b> that match your impact areas.</li>
        <li><b>Connect with others</b> with shared passions and goals.</li>
        <li><b>Track your progress</b> as you complete onboarding steps.</li>
      </ul>
    ),
  },
  {
    id: 'feed',
    title: 'Discover the Feed',
    description: 'Your home for diaspora news, updates, and community stories.',
    icon: BookOpen,
    content: (
      <div className="space-y-2 text-sm">
        <p>The <b>Feed</b> is where you'll find:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Posts and updates from the community</li>
          <li>Stories of diaspora impact across Africa</li>
          <li>Content from people in your network</li>
          <li>Your saved and bookmarked items</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'connect',
    title: 'Build Your Network',
    description: 'Find and connect with diaspora members who share your vision.',
    icon: Users,
    content: (
      <div className="space-y-2 text-sm">
        <p><b>Connect</b> helps you discover people based on:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Shared interests and focus areas</li>
          <li>Country of origin or heritage</li>
          <li>Professional background and skills</li>
          <li>Collaboration opportunities</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'convey',
    title: 'Share Your Story',
    description: 'Tell your impact story and inspire the community.',
    icon: MessageSquare,
    content: (
      <div className="space-y-2 text-sm">
        <p><b>Convey</b> is where you can:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Share your diaspora journey and experiences</li>
          <li>Highlight projects making impact in Africa</li>
          <li>Discover inspiring stories from others</li>
          <li>Build your thought leadership</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start your DNA journey.',
    icon: CheckCircle,
    content: (
      <div className="space-y-2 text-sm">
        <p>Here's what to do next:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>Complete your profile</b> to get discovered</li>
          <li><b>Explore the feed</b> and engage with content</li>
          <li><b>Connect with members</b> who share your interests</li>
          <li><b>Share your story</b> when you're ready</li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          You can always retake this tour from your profile menu.
        </p>
      </div>
    ),
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose }) => {
  const { 
    currentStep: savedStep, 
    markTourShown, 
    updateStep,
    completeTour 
  } = useTourProgress();
  
  const totalSteps = TOUR_STEPS.length;
  
  // Ensure savedStep is within bounds to prevent accessing undefined array elements
  const getValidStep = (step: number | undefined | null): number => {
    if (step === undefined || step === null || step < 0 || step >= totalSteps) {
      return 0;
    }
    return step;
  };
  
  const [currentStep, setCurrentStep] = useState(() => getValidStep(savedStep));
  
  // Safety: ensure step is always valid even if currentStep somehow goes out of bounds
  const safeStepIndex = currentStep >= 0 && currentStep < totalSteps ? currentStep : 0;
  const step = TOUR_STEPS[safeStepIndex];
  
  // Additional safety check - if step is somehow still undefined, don't render
  if (!step) {
    return null;
  }
  
  const Icon = step.icon;

  // Mark tour as shown when opened
  useEffect(() => {
    if (open) {
      markTourShown();
    }
  }, [open, markTourShown]);

  // Sync local step with saved step on open
  useEffect(() => {
    if (open && savedStep > 0 && savedStep < totalSteps) {
      setCurrentStep(savedStep);
    }
  }, [open, savedStep, totalSteps]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateStep(nextStep);
    } else {
      // Completed last step
      completeTour();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateStep(prevStep);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Prevent closing dialog without completing - user must go through all steps
  const handleOpenChange = (isOpen: boolean) => {
    // Only allow closing if explicitly completing via handleNext on last step
    // This prevents escape key or clicking outside from closing
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {step.title}
          </DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="space-y-3 pt-1">
          <p>{step.description}</p>
          {step.content}
        </DialogDescription>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Step indicator instead of skip button */}
          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
