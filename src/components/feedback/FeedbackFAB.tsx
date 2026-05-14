import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedbackMembership } from '@/hooks/useFeedbackMembership';
import { useMobile } from '@/hooks/useMobile';

interface FeedbackFABProps {
  className?: string;
  onOpen?: () => void;
}

export function FeedbackFAB({ className, onOpen }: FeedbackFABProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { isOptedIn, isLoading } = useFeedbackMembership();
  const { isMobile } = useMobile();

  // Only show on authenticated /dna/* routes
  const isDnaRoute = location.pathname.startsWith('/dna');

  // Don't show if not authenticated, not on DNA routes, or opted out
  if (!user || !isDnaRoute || isLoading || !isOptedIn || isMobile) {
    return null;
  }

  return (
    <button
      onClick={onOpen}
      className={cn(
        'fixed right-0 top-1/2 -translate-y-1/2 z-40',
        'flex items-center justify-center',
        'w-6 h-16 md:w-8 md:h-20',
        'bg-primary/90 hover:bg-primary',
        'rounded-l-lg shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:w-8 md:hover:w-10',
        className
      )}
      aria-label="Open Feedback Hub"
    >
      <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
    </button>
  );
}
