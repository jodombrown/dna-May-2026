import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard
 *
 * Performance-tuned: prefer the profile already loaded by AuthContext
 * (avoids one extra `profiles` round-trip on every /dna/* navigation).
 * Only fall back to a direct query if AuthContext hasn't provided the
 * profile yet (race conditions during initial sign-in).
 */
export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only run the fallback query if auth is loaded but profile is missing.
  const needsFallback = !!user?.id && !profile && !authLoading;

  const { data: fallbackProfile, isLoading: fallbackLoading } = useQuery({
    queryKey: ['onboarding-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed_at, username')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: needsFallback,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const effectiveProfile = profile ?? fallbackProfile;
  const profileLoading = needsFallback && fallbackLoading;

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
      return;
    }

    // If we still don't have a profile, don't redirect - let the user proceed
    // (better than bouncing them to onboarding incorrectly).
    if (!effectiveProfile) return;

    const hasCompletedOnboarding = !!(
      effectiveProfile?.onboarding_completed_at || effectiveProfile?.username
    );

    if (!hasCompletedOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (hasCompletedOnboarding && location.pathname === '/onboarding') {
      navigate('/dna/connect/discover', { replace: true });
    }
  }, [effectiveProfile, user, authLoading, profileLoading, navigate, location.pathname]);

  // Only block render during initial auth load. Once we have a user,
  // render children immediately - the useEffect above handles redirects.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
