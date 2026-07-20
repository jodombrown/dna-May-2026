/**
 * AccountDrawer (v2) — Claude-inspired identity sheet.
 *
 * Replaces the legacy Sheet with the same IdentitySheet used by /dna/settings,
 * so the account entry point and the settings hub share one visual language
 * and one in-sheet navigation stack. Every row pushes a subpage inside the
 * sheet or triggers a lightweight action (share / tour / test guide).
 */
import React, { Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  UserCircle,
  Shield,
  Bell,
  Settings as SettingsIcon,
  Hash,
  Flag,
  UserX,
  FileText,
  Bookmark,
  Users,
  Calendar,
  Share2,
  HelpCircle,
  LogOut,
  Info,
  ClipboardCheck,
  Copy,
  Linkedin,
  Twitter,
  MessageSquare,
  Download,
  Loader2,
} from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import {
  IdentitySheet,
  SettingsGroup,
  SettingsRow,
  SheetErrorPanel,
  useIdentitySheet,
} from '@/components/ui/settings-kit';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountDrawer } from '@/contexts/AccountDrawerContext';
import { useTourProgress } from '@/hooks/useTourProgress';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { AlphaTestGuide } from '@/components/alpha/AlphaTestGuide';
import { FeedbackDrawer } from '@/components/feedback/FeedbackDrawer';
import { toast } from 'sonner';
import { profileRoute } from '@/lib/profileRoute';
import { generateProfilePDF } from '@/lib/generateProfilePDF';
import { ROUTES } from '@/config/routes';
import { ChevronRight } from 'lucide-react';

// Lazy subpages — the same panels the /dna/settings sheet uses.
const AccountSettings = React.lazy(() => import('@/pages/dna/settings/AccountSettings'));
const PrivacySettings = React.lazy(() => import('@/pages/dna/settings/PrivacySettings'));
const NotificationSettings = React.lazy(() => import('@/pages/dna/settings/NotificationSettings'));
const PreferencesSettings = React.lazy(() => import('@/pages/dna/settings/PreferencesSettings'));
const MyHashtagsSettings = React.lazy(() => import('@/pages/dna/settings/MyHashtagsSettings'));
const MyReportsSettings = React.lazy(() => import('@/pages/dna/settings/MyReportsSettings'));
const BlockedUsersSettings = React.lazy(() => import('@/pages/dna/settings/BlockedUsersSettings'));
const ProfileEdit = React.lazy(() => import('@/pages/ProfileEdit'));

const PanelFallback = () => (
  <div className="flex items-center justify-center py-16 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);
const wrap = (node: React.ReactNode, surface = 'This section') => (
  <SheetErrorPanel surface={surface}>
    <Suspense fallback={<PanelFallback />}>{node}</Suspense>
  </SheetErrorPanel>
);


interface ActionHandlers {
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

export function AccountDrawerBody({
  handlers,
}: {
  handlers: ActionHandlers;
}) {
  const { push, close } = useIdentitySheet();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = profile?.full_name || profile?.username || user?.email || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [profile?.full_name, profile?.username, user?.email]);

  const openProfileEdit = () =>
    push({ id: 'profile', title: 'Profile', node: wrap(<ProfileEdit />) });

  /**
   * Navigate away from the drawer.
   *
   * This used to be `close(); navigate(path);` and that broke every navigating
   * row in DR1. The drawer is URL-bound now, so `close()` is `navigate(-depth)`
   * — a history POP. Firing a pop and a push in the same tick races: the push
   * lands, the pop then unwinds it, and the member taps a row and watches
   * nothing happen.
   *
   * The fix is to delete the close, not to sequence it. Because the drawer's
   * open state IS the `?drawer=` param, navigating to a path without that param
   * closes the drawer as a consequence rather than as a second action. One
   * navigation, no race, and the drawer cannot end up open over the new page.
   *
   * Found by founder QA on a real device (BD142): the rows rendered, the
   * handlers fired, every test passed, and the app did nothing.
   */
  const go = (path: string) => {
    navigate(path);
  };

  const openShareSheet = () =>
    push({
      id: 'share',
      title: 'Share profile',
      node: <ShareSubpage handlers={handlers} />,
    });

  return (
    <>
      {/* Identity card */}
      <button
        type="button"
        onClick={openProfileEdit}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card p-3 text-left transition-colors hover:bg-muted/50 min-h-touch"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || undefined} alt="" />
          <AvatarFallback>{initials || 'DNA'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-normal text-foreground">
            {profile?.full_name || profile?.username || 'Your profile'}
          </div>
          <div className="truncate text-meta text-muted-foreground">
            {user?.email || ''}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <SettingsGroup label="You">
        <SettingsRow
          icon={UserIcon}
          label="View public profile"
          onClick={() => profile && go(profileRoute(profile))}
        />
        <SettingsRow
          icon={Share2}
          label="Share profile"
          onClick={openShareSheet}
        />
      </SettingsGroup>

      <SettingsGroup label="My work">
        <SettingsRow
          icon={FileText}
          label="My posts & updates"
          onClick={() => go('/dna/feed?tab=my_posts')}
        />
        <SettingsRow
          icon={FileText}
          label="My stories"
          onClick={() => go('/dna/convey/my-stories')}
        />
        <SettingsRow
          icon={Bookmark}
          label="Saved items"
          onClick={() => go('/dna/feed?tab=bookmarks')}
        />
        <SettingsRow
          icon={Users}
          label="My spaces"
          onClick={() => go('/dna/collaborate')}
        />
        <SettingsRow
          icon={Calendar}
          label="My events"
          onClick={() => go('/dna/convene/events')}
        />
      </SettingsGroup>

      <SettingsGroup label="Account">
        <SettingsRow
          icon={UserCircle}
          label="Profile"
          description="Name, headline, avatar, bio"
          subpage={{ id: 'profile', title: 'Profile', content: wrap(<ProfileEdit />) }}
        />
        <SettingsRow
          icon={UserIcon}
          label="Account"
          description="Email, password, delete account"
          subpage={{ id: 'account', title: 'Account', content: wrap(<AccountSettings />) }}
        />
        <SettingsRow
          icon={Shield}
          label="Privacy"
          description="Who can see your profile"
          subpage={{ id: 'privacy', title: 'Privacy', content: wrap(<PrivacySettings />) }}
        />
        <SettingsRow
          icon={Bell}
          label="Notifications"
          description="Push, email, quiet hours"
          subpage={{ id: 'notifications', title: 'Notifications', content: wrap(<NotificationSettings />) }}
        />
        <SettingsRow
          icon={SettingsIcon}
          label="Preferences"
          description="Density, module visibility"
          subpage={{ id: 'preferences', title: 'Preferences', content: wrap(<PreferencesSettings />) }}
        />
      </SettingsGroup>

      <SettingsGroup label="Content & safety">
        <SettingsRow
          icon={Hash}
          label="My hashtags"
          subpage={{ id: 'hashtags', title: 'My hashtags', content: wrap(<MyHashtagsSettings />) }}
        />
        <SettingsRow
          icon={Flag}
          label="My reports"
          subpage={{ id: 'reports', title: 'My reports', content: wrap(<MyReportsSettings />) }}
        />
        <SettingsRow
          icon={UserX}
          label="Blocked users"
          subpage={{ id: 'blocked', title: 'Blocked users', content: wrap(<BlockedUsersSettings />) }}
        />
      </SettingsGroup>

      <SettingsGroup label="About">
        <SettingsRow icon={MateMasie} label="Take platform tour" onClick={handlers.onTour} />
        <SettingsRow icon={ClipboardCheck} label="Alpha test guide" onClick={handlers.onTestGuide} />
        <SettingsRow icon={HelpCircle} label="Help & feedback" onClick={handlers.onFeedback} />
        <SettingsRow icon={Info} label="About DNA" onClick={() => go(ROUTES.about)} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          variant="destructive"
          icon={LogOut}
          label="Sign out"
          onClick={handlers.onSignOut}
        />
      </SettingsGroup>
    </>
  );
}

function ShareSubpage({ handlers }: { handlers: ActionHandlers }) {
  const url = handlers.publicUrl;
  const text = `Check out ${handlers.displayName}'s profile on DNA - Diaspora Network of Africa`;

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied');
  };
  const wa = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
  const li = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  const tw = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${handlers.displayName} on DNA`, text, url });
      } catch {
        // user cancelled
      }
    } else {
      copy();
    }
  };

  return (
    <div className="p-4">
      <SettingsGroup label="Share">
        <SettingsRow icon={Copy} label="Copy link" onClick={copy} />
        <SettingsRow icon={MessageSquare} label="Share via WhatsApp" onClick={wa} />
        <SettingsRow icon={Linkedin} label="Share via LinkedIn" onClick={li} />
        <SettingsRow icon={Twitter} label="Share via X" onClick={tw} />
        {typeof navigator !== 'undefined' && (navigator as Navigator).share ? (
          <SettingsRow icon={Share2} label="Share via..." onClick={nativeShare} />
        ) : null}
      </SettingsGroup>
      <SettingsGroup label="Export">
        <SettingsRow
          icon={handlers.isDownloading ? Loader2 : Download}
          label={handlers.isDownloading ? 'Generating PDF...' : 'Download PDF'}
          onClick={handlers.onDownloadPDF}
        />
      </SettingsGroup>
    </div>
  );
}

/**
 * DR1 step 6: the `AccountDrawer` container is GONE.
 *
 * It used to render `<IdentitySheet>` (its own sliding container, scrim, header
 * and close), mount `FeedbackDrawer` and `AlphaTestGuide` a second time each,
 * and live at `BaseLayout` scope. All of that now belongs to `AppDrawer` and
 * `AccountActionsProvider`, both mounted once at app root.
 *
 * What remains here is `AccountDrawerBody`: content only, no chrome
 * (BD135 rule 5). It is rendered by `AccountSurface`.
 */
