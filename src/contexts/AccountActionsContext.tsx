/**
 * Account actions + the three support surfaces (DR1 step 6).
 *
 * ── Why this exists: DR0 defects 5 and 6 ──────────────────────────────────
 * `FeedbackDrawer` and `AlphaTestGuide` were each mounted TWICE — once in
 * `BaseLayout`, once inside `AccountDrawer` — with two independent `isOpen`
 * booleans for the same surface. Worse, the `AlphaTestGuide` instance mounted
 * inside Account was UNGATED, so the Account row opened a copy that bypassed
 * `FEATURE_FLAGS.isAlphaTest` entirely.
 *
 * The duplication existed because Account owned the state for surfaces it does
 * not own. Hoisting that state to app root removes the second mount by
 * construction rather than by remembering not to add one.
 *
 * ── Honest scope note ─────────────────────────────────────────────────────
 * These three still render their own chrome, so they are NOT yet BD135 rule 5
 * compliant and are NOT yet `swap` targets on the shell — the registry lists
 * them under PENDING_SURFACES and DR2 migrates them. What is fixed here is the
 * duplication and the flag bypass. Calling them migrated would be a claim the
 * code does not support.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTourProgress } from '@/hooks/useTourProgress';
import { useDrawerSafe } from '@/contexts/DrawerContext';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { AlphaTestGuide } from '@/components/alpha/AlphaTestGuide';
import { FeedbackDrawer } from '@/components/feedback/FeedbackDrawer';
import { generateProfilePDF } from '@/lib/generateProfilePDF';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export interface AccountActions {
  onShare: () => void;
  onTour: () => void;
  onTestGuide: () => void;
  onFeedback: () => void;
  onSignOut: () => void;
  publicUrl: string;
  displayName: string;
  isDownloading: boolean;
  onDownloadPDF: () => void;
}

const Ctx = React.createContext<AccountActions | null>(null);

export function useAccountActions(): AccountActions {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAccountActions must be used inside <AccountActionsProvider />');
  return ctx;
}

export function AccountActionsProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const drawer = useDrawerSafe();
  const { isCompleted: tourCompleted, resetTour } = useTourProgress();

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showTour, setShowTour] = React.useState(false);
  const [showTestGuide, setShowTestGuide] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);

  const closeDrawer = React.useCallback(() => drawer?.close(), [drawer]);

  const publicUrl =
    typeof window !== 'undefined' && profile?.username
      ? `${window.location.origin}/u/${profile.username}`
      : '';
  const displayName = profile?.full_name || profile?.username || 'DNA member';

  const value = React.useMemo<AccountActions>(
    () => ({
      publicUrl,
      displayName,
      isDownloading,
      onShare: () => {},
      onTour: () => {
        if (tourCompleted) resetTour();
        setShowTour(true);
        closeDrawer();
      },
      onTestGuide: () => {
        setShowTestGuide(true);
        closeDrawer();
      },
      onFeedback: () => {
        setShowFeedback(true);
        closeDrawer();
      },
      onSignOut: async () => {
        await signOut();
        closeDrawer();
        navigate('/');
      },
      onDownloadPDF: async () => {
        if (!profile) return;
        setIsDownloading(true);
        try {
          await generateProfilePDF(profile as never, user?.email);
          toast.success('Profile PDF downloaded');
        } catch {
          toast.error('Failed to generate PDF');
        } finally {
          setIsDownloading(false);
        }
      },
    }),
    [
      publicUrl, displayName, isDownloading, tourCompleted, resetTour,
      closeDrawer, signOut, navigate, profile, user?.email,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Mounted ONCE, here. Adding a second mount anywhere is the defect. */}
      <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />
      {/*
        The alpha gate travels WITH the mount. DR0 defect 6: the copy mounted
        inside AccountDrawer had no gate, so the Account row opened a guide that
        bypassed FEATURE_FLAGS.isAlphaTest entirely. One mount, one gate.
      */}
      {FEATURE_FLAGS.isAlphaTest && user && (
        <AlphaTestGuide
          isOpen={showTestGuide}
          onClose={() => setShowTestGuide(false)}
          onOpenFeedback={() => {
            setShowTestGuide(false);
            setShowFeedback(true);
          }}
        />
      )}
      <FeedbackDrawer isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </Ctx.Provider>
  );
}
