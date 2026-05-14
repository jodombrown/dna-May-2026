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
  const { isMobile } = useMobile();

  // PERF: bail BEFORE invoking useFeedbackMembership() (which hits 2 Supabase
  // queries) on every /dna/* render for users where the FAB will never show
  // (mobile users, unauthed users, non-DNA routes).
  const isDnaRoute = location.pathname.startsWith('/dna');
  if (!user || !isDnaRoute || isMobile) return null;

  return <FeedbackFABInner className={className} onOpen={onOpen} />;
}

function FeedbackFABInner({ className, onOpen }: FeedbackFABProps) {
  const { isOptedIn, isLoading } = useFeedbackMembership();
  if (isLoading || !isOptedIn) return null;

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
