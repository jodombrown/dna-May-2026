import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTourProgress } from '@/hooks/useTourProgress';
import { MateMasie } from '@/components/icons/adinkra';

interface TourResumeBannerProps {
  onStartTour: () => void;
}

const TourResumeBanner: React.FC<TourResumeBannerProps> = ({ onStartTour }) => {
  const { wasSkipped, isCompleted, completeTour } = useTourProgress();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't show if tour is completed or wasn't skipped
  if (isCompleted || !wasSkipped || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleStartTour = () => {
    onStartTour();
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 bg-primary/20 rounded-full">
          <MateMasie className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">
            Want to learn more about DNA?
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Take our quick platform tour to discover all the ways you can connect with the African diaspora community.
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={handleStartTour}
          >
            <MateMasie className="h-4 w-4 mr-2" />
            Take the Tour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TourResumeBanner;
