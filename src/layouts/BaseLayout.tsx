import React, { useEffect, useState } from 'react';
import { useViewState } from '@/contexts/ViewStateContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UnifiedHeader from '@/components/UnifiedHeader';
import { AccountDrawer } from '@/components/navigation/AccountDrawer';
import { PulseBar, PulseDock } from '@/components/pulse';
import { initDIAPeriodicChecks } from '@/services/dia/diaPeriodicCheck';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { AlphaWelcomeBanner } from '@/components/alpha/AlphaWelcomeBanner';
import { AlphaTestGuide } from '@/components/alpha/AlphaTestGuide';
import { ProfileCompletionGuide } from '@/components/onboarding/ProfileCompletionGuide';
import { FeedbackFAB } from '@/components/feedback/FeedbackFAB';
import { FeedbackDrawer } from '@/components/feedback/FeedbackDrawer';
import { useAutoRegisterPush } from '@/hooks/messaging/useAutoRegisterPush';

// Phase 16 - lazy global: morning brief banner only on /dna/feed for authed users.
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

  // Global open-feedback event: header button + legacy /dna/feedback redirect dispatch this.
  useEffect(() => {
    const handler = () => setIsFeedbackDrawerOpen(true);
    window.addEventListener('dna:open-feedback', handler);
    return () => window.removeEventListener('dna:open-feedback', handler);
  }, []);

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
      <AccountDrawer />
      <PulseBar />
      <div
        className={cn(
          "min-h-dvh w-full max-w-full",
          getAuthGradient(),
          // Add bottom padding on mobile to account for PulseDock
          "pb-20 lg:pb-0",
          "transition-colors duration-300 ease-in-out",
          "overflow-x-hidden"
        )}
        style={{
          // Dynamic top padding from measured header heights
          // Skip mobile padding on feed/connect — they manage their own fixed headers
          paddingTop: hasCustomMobileHeader
            ? undefined  // mobile: managed by useMobileHeaderHeight; desktop handled below
            : undefined, // set below for all cases
        }}
        data-view-state={viewState}
        data-layout-type={layoutConfig.type}
      >
        {/* Spacer div that reads CSS vars for top padding */}
        <div
          aria-hidden
          style={{
            // Always reserve space for header + pulse bar to prevent columns
            // rendering behind the PulseBar before the measurement hook runs.
            // Mobile pages with custom headers hide this spacer via the className.
            height: 'calc(var(--unified-header-height, 56px) + var(--pulse-bar-height, 56px))',
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

      {/* Phase 16 - DIA Morning brief (gated to /dna/feed inside the component) */}
      {user && location.pathname.startsWith('/dna/feed') && (
        <React.Suspense fallback={null}>
          <MorningBriefBanner />
        </React.Suspense>
      )}

      {/* Profile Completion Guide - Sprint 12B */}
      {user && <ProfileCompletionGuide />}

      {/* Feedback Drawer - accessible from banner, test guide, and chevron FAB */}
      <FeedbackDrawer
        isOpen={isFeedbackDrawerOpen}
        onClose={() => setIsFeedbackDrawerOpen(false)}
      />

      {/* Alpha Testing Infrastructure */}
      {FEATURE_FLAGS.isAlphaTest && user && (
        <>
          <AlphaTestGuide
            isOpen={isTestGuideOpen}
            onClose={() => setIsTestGuideOpen(false)}
            onOpenFeedback={() => {
              setIsTestGuideOpen(false);
              setIsFeedbackDrawerOpen(true);
            }}
          />
        </>
      )}
    </>
  );
};

export default BaseLayout;
