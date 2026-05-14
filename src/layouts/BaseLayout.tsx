import React, { useEffect, useState } from 'react';
import { useViewState } from '@/contexts/ViewStateContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UnifiedHeader from '@/components/UnifiedHeader';
import { PulseBar, PulseDock } from '@/components/pulse';
import { initDIAPeriodicChecks } from '@/services/dia/diaPeriodicCheck';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useAutoRegisterPush } from '@/hooks/messaging/useAutoRegisterPush';
import { FeedbackFAB } from '@/components/feedback/FeedbackFAB';

// PERF: lazy-load every global overlay so they don't block /dna/* first paint.
const AccountDrawer = React.lazy(() =>
  import('@/components/navigation/AccountDrawer').then((m) => ({ default: m.AccountDrawer })),
);
const FeedbackDrawer = React.lazy(() =>
  import('@/components/feedback/FeedbackDrawer').then((m) => ({ default: m.FeedbackDrawer })),
);
const ProfileCompletionGuide = React.lazy(() =>
  import('@/components/onboarding/ProfileCompletionGuide').then((m) => ({ default: m.ProfileCompletionGuide })),
);
const AlphaWelcomeBanner = React.lazy(() =>
  import('@/components/alpha/AlphaWelcomeBanner').then((m) => ({ default: m.AlphaWelcomeBanner })),
);
const AlphaTestGuide = React.lazy(() =>
  import('@/components/alpha/AlphaTestGuide').then((m) => ({ default: m.AlphaTestGuide })),
);
const MorningBriefBanner = React.lazy(() =>
  import('@/components/pulse/MorningBriefBanner').then((m) => ({ default: m.MorningBriefBanner })),
);

interface BaseLayoutProps {
  children: React.ReactNode;
}

/**
 * BaseLayout - The intelligent layout wrapper that adapts based on view state
 *
 * This component automatically applies the correct layout configuration
 * based on the current view state (determined by the route).
 *
 * Features:
 * - Smooth transitions between layout configurations (300ms)
 * - Responsive behavior for mobile/tablet/desktop
 * - Preserves context across view state changes
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const { viewState, layoutConfig } = useViewState();
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isTestGuideOpen, setIsTestGuideOpen] = useState(false);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);

  // Phase 20A: silently re-register push subscription if permission already granted
  useAutoRegisterPush();

  // DIA Sprint 4B: Initialize periodic checks for authenticated users
  useEffect(() => {
    if (user?.id) {
      const cleanup = initDIAPeriodicChecks(user.id);
      return cleanup;
    }
  }, [user?.id]);

  // Check if we're on routes that manage their own mobile headers
  const isConnectRoute = location.pathname.includes('/dna/connect');
  const isFeedRoute = location.pathname.includes('/dna/feed');
  const isConveneHubRoute = location.pathname === '/dna/convene';
  const isContributeHubRoute = location.pathname === '/dna/contribute';
  const isConveyHubRoute = location.pathname === '/dna/convey';
  const isCollaborateHubRoute = location.pathname === '/dna/collaborate';
  const hasCustomMobileHeader =
    isFeedRoute ||
    isConnectRoute ||
    isConveneHubRoute ||
    isContributeHubRoute ||
    isConveyHubRoute ||
    isCollaborateHubRoute;

  // Unique gradient for each of the 5 Cs + Feed when logged in
  // All using DNA brand colors: mint, terra, ochre, sunset, purple, copper
  const getAuthGradient = () => {
    if (!user) return "bg-background";

    const path = location.pathname;

    // Feed - DNA mint green
    if (path.includes('/feed')) {
      return "bg-gradient-to-br from-dna-mint/20 via-background to-dna-mint/10";
    }

    // Connect - Cultural warmth (terra/ochre)
    if (path.includes('/connect') || path.includes('/network') || path.includes('/discover')) {
      return "bg-gradient-to-br from-dna-terra/15 via-background to-dna-ochre/10";
    }

    // Convene - Sunset celebration (orange/purple)
    if (path.includes('/convene') || path.includes('/events')) {
      return "bg-gradient-to-br from-dna-sunset/15 via-background to-dna-purple/10";
    }

    // Collaborate - Earth to mint (terra/mint growth)
    if (path.includes('/collaborate') || path.includes('/spaces')) {
      return "bg-gradient-to-br from-dna-terra/15 via-background to-dna-mint/10";
    }

    // Contribute - Copper warmth (copper/ochre)
    if (path.includes('/contribute') || path.includes('/impact') || path.includes('/opportunities')) {
      return "bg-gradient-to-br from-dna-copper/15 via-background to-dna-ochre/10";
    }

    // Convey - Royal storytelling (purple/sunset)
    if (path.includes('/convey')) {
      return "bg-gradient-to-br from-dna-purple/15 via-background to-dna-sunset/10";
    }

    // Default - DNA mint green
    return "bg-gradient-to-br from-dna-mint/20 via-background to-dna-copper/10";
  };

  return (
    <>
      <UnifiedHeader />
      <React.Suspense fallback={null}>
        <AccountDrawer />
      </React.Suspense>
      <PulseBar />
      <div
        className={cn(
          "min-h-dvh w-full max-w-full",
          getAuthGradient(),
          "pb-20 lg:pb-0",
          "transition-colors duration-300 ease-in-out",
          "overflow-x-hidden"
        )}
        data-view-state={viewState}
        data-layout-type={layoutConfig.type}
      >
        <div
          aria-hidden
          style={{
            height: 'calc(var(--roadmap-banner-height, 0px) + var(--unified-header-height, 56px) + var(--pulse-bar-height, 56px))',
          }}
          className={cn(
            hasCustomMobileHeader ? 'hidden sm:block' : 'block',
          )}
        />
        {children}
      </div>
      {/* Feedback FAB - side chevron on all /dna routes */}
      <FeedbackFAB onOpen={() => setIsFeedbackDrawerOpen(true)} />
      <PulseDock />

      {/* DIA Morning brief - gated to /dna/feed */}
      {user && location.pathname.startsWith('/dna/feed') && (
        <React.Suspense fallback={null}>
          <MorningBriefBanner />
        </React.Suspense>
      )}

      {/* Profile Completion Guide - desktop only inside the component, but lazy-load anyway */}
      {user && (
        <React.Suspense fallback={null}>
          <ProfileCompletionGuide />
        </React.Suspense>
      )}

      {/* Feedback Drawer - only mount when actually opened */}
      {isFeedbackDrawerOpen && (
        <React.Suspense fallback={null}>
          <FeedbackDrawer
            isOpen={isFeedbackDrawerOpen}
            onClose={() => setIsFeedbackDrawerOpen(false)}
          />
        </React.Suspense>
      )}

      {/* Alpha Testing Infrastructure */}
      {FEATURE_FLAGS.isAlphaTest && user && isTestGuideOpen && (
        <React.Suspense fallback={null}>
          <AlphaTestGuide
            isOpen={isTestGuideOpen}
            onClose={() => setIsTestGuideOpen(false)}
            onOpenFeedback={() => {
              setIsTestGuideOpen(false);
              setIsFeedbackDrawerOpen(true);
            }}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default BaseLayout;
