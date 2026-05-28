import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingCheckProfile {
  onboarding_completed_at: string | null;
  username: string | null;
  role_declared_at?: string | null;
  place_declared_at?: string | null;
}

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['onboarding-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed_at, username, role_declared_at, place_declared_at')
        .eq('id', user.id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const effectiveProfile = (authProfile || profile) as OnboardingCheckProfile | null;

  useEffect(() => {
    // Wait for auth and profile to load
    if (authLoading || profileLoading) return;

    // If not authenticated, redirect to auth page
    if (!user) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
      return;
    }

    // Only `onboarding_completed_at` proves the wizard finished. A username
    // alone can be auto-seeded by the handle_new_user trigger and must NOT
    // be treated as completion (would skip Steps 1-5 for brand-new users).
    const hasCompletedOnboarding = !!effectiveProfile?.onboarding_completed_at;
    // D054 / BD008: every logged-in user must have role + place declared.
    const needsRole = !effectiveProfile?.role_declared_at;
    const needsPlace = !effectiveProfile?.place_declared_at;
    const onOnboarding = location.pathname === '/onboarding';
    const currentTarget = `${location.pathname}${location.search}`;

    // Brand-new user (no initial onboarding) → full wizard.
    if (!hasCompletedOnboarding && !onOnboarding && currentTarget !== '/onboarding') {
      navigate('/onboarding', { replace: true });
      return;
    }

    // Pre-D054 user with completed onboarding but missing role/place →
    // push them into the wizard at the appropriate step.
    if (hasCompletedOnboarding && (needsRole || needsPlace) && !onOnboarding) {
      const step = needsRole ? 4 : 5;
      const target = `/onboarding?step=${step}`;
      if (currentTarget !== target) {
        navigate(target, {
          replace: true,
          state: { from: location.pathname },
        });
      }
      return;
    }

    // Fully done and somehow still on /onboarding → kick to discover.
    if (hasCompletedOnboarding && !needsRole && !needsPlace && onOnboarding && currentTarget !== '/dna/connect/discover') {
      navigate('/dna/connect/discover', { replace: true });
    }
  }, [effectiveProfile, user, authLoading, profileLoading, navigate, location.pathname, location.search]);

  // Show loading spinner while checking
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};
