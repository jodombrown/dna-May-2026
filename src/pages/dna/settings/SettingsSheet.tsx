/**
 * SettingsSheet — Claude-inspired grouped identity sheet at /dna/settings.
 *
 * Part 2: everything stays inside the sheet.
 *  - Every row pushes a subpage that renders the existing settings panel in
 *    bare form (SettingsLayout auto-detects the sheet and drops its chrome).
 *  - Identity header card is clickable and pushes the profile editor as a
 *    subpage. ProfileEdit hides its UnifiedHeader + Back button when in sheet.
 *  - Each subpage inherits the sheet's own back / close chrome from IdentitySheet.
 *  - Legacy ?section= deep-links auto-push the matching subpage on mount.
 *  - Rollback: flip SETTINGS_SHEET_V2 in featureFlags.ts.
 */
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  User,
  UserCircle,
  Shield,
  Bell,
  Settings as SettingsIcon,
  Hash,
  Flag,
  UserX,
  FileText,
  LogOut,
  Info,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  IdentitySheet,
  SettingsGroup,
  SettingsRow,
  useIdentitySheet,
} from '@/components/ui/settings-kit';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROUTES } from '@/config/routes';

// Lazy-load subpage content so switching the sheet doesn't pull every panel.
const AccountSettings = React.lazy(() => import('./AccountSettings'));
const PrivacySettings = React.lazy(() => import('./PrivacySettings'));
const NotificationSettings = React.lazy(() => import('./NotificationSettings'));
const PreferencesSettings = React.lazy(() => import('./PreferencesSettings'));
const MyHashtagsSettings = React.lazy(() => import('./MyHashtagsSettings'));
const MyReportsSettings = React.lazy(() => import('./MyReportsSettings'));
const BlockedUsersSettings = React.lazy(() => import('./BlockedUsersSettings'));
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


const SUBPAGES: Record<
  string,
  { id: string; title: string; content: React.ReactNode }
> = {
  profile: { id: 'profile', title: 'Profile', content: wrap(<ProfileEdit />) },
  account: { id: 'account', title: 'Account', content: wrap(<AccountSettings />) },
  privacy: { id: 'privacy', title: 'Privacy', content: wrap(<PrivacySettings />) },
  notifications: {
    id: 'notifications',
    title: 'Notifications',
    content: wrap(<NotificationSettings />),
  },
  preferences: {
    id: 'preferences',
    title: 'Preferences',
    content: wrap(<PreferencesSettings />),
  },
  hashtags: {
    id: 'hashtags',
    title: 'My hashtags',
    content: wrap(<MyHashtagsSettings />),
  },
  reports: { id: 'reports', title: 'My reports', content: wrap(<MyReportsSettings />) },
  blocked: {
    id: 'blocked',
    title: 'Blocked users',
    content: wrap(<BlockedUsersSettings />),
  },
};

const SECTION_ALIASES: Record<string, keyof typeof SUBPAGES> = {
  account: 'account',
  privacy: 'privacy',
  blocked: 'blocked',
  reports: 'reports',
  notifications: 'notifications',
  preferences: 'preferences',
  hashtags: 'hashtags',
  profile: 'profile',
};

/** Inner body — has access to useIdentitySheet (provider is in IdentitySheet). */
function SettingsSheetBody({
  initialSection,
}: {
  initialSection: keyof typeof SUBPAGES | null;
}) {
  const { push } = useIdentitySheet();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  // Honor ?section= by pushing the matching subpage once on mount.
  useEffect(() => {
    if (initialSection && SUBPAGES[initialSection]) {
      const sp = SUBPAGES[initialSection];
      push({ id: sp.id, title: sp.title, node: sp.content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = useMemo(() => {
    const name = profile?.full_name || user?.email || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [profile?.full_name, user?.email]);

  const openProfile = () =>
    push({ id: SUBPAGES.profile.id, title: SUBPAGES.profile.title, node: SUBPAGES.profile.content });

  return (
    <>
      {/* Identity card — clickable, pushes Profile subpage */}
      <button
        type="button"
        onClick={openProfile}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card p-3 text-left transition-colors hover:bg-muted/50 min-h-touch"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || undefined} alt="" />
          <AvatarFallback>{initials || 'DNA'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-normal text-foreground">
            {profile?.full_name || 'Your profile'}
          </div>
          <div className="truncate text-caption text-muted-foreground">
            {user?.email || ''}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <SettingsGroup label="Account">
        <SettingsRow
          icon={UserCircle}
          label="Profile"
          description="Name, headline, avatar, bio"
          subpage={SUBPAGES.profile}
        />
        <SettingsRow
          icon={User}
          label="Account"
          description="Email, password, delete account"
          subpage={SUBPAGES.account}
        />
        <SettingsRow
          icon={Shield}
          label="Privacy"
          description="Who can see your profile"
          subpage={SUBPAGES.privacy}
        />
      </SettingsGroup>

      <SettingsGroup label="Notifications & display">
        <SettingsRow
          icon={Bell}
          label="Notifications"
          description="Push, email, quiet hours"
          subpage={SUBPAGES.notifications}
        />
        <SettingsRow
          icon={SettingsIcon}
          label="Preferences"
          description="Density, module visibility"
          subpage={SUBPAGES.preferences}
        />
      </SettingsGroup>

      <SettingsGroup label="Content & safety">
        <SettingsRow
          icon={Hash}
          label="My hashtags"
          description="Personal hashtag slots"
          subpage={SUBPAGES.hashtags}
        />
        <SettingsRow
          icon={Flag}
          label="My reports"
          description="Reports you have submitted"
          subpage={SUBPAGES.reports}
        />
        <SettingsRow
          icon={UserX}
          label="Blocked users"
          description="People you have blocked"
          subpage={SUBPAGES.blocked}
        />
      </SettingsGroup>

      <SettingsGroup label="About">
        <SettingsRow icon={Info} label="About DNA" onClick={() => navigate(ROUTES.about)} />
        <SettingsRow
          icon={FileText}
          label="Terms of service"
          onClick={() => navigate(ROUTES.termsOfService)}
        />
        <SettingsRow
          icon={FileText}
          label="Privacy policy"
          onClick={() => navigate(ROUTES.privacyPolicy)}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          variant="destructive"
          icon={LogOut}
          label="Sign out"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        />
      </SettingsGroup>
    </>
  );
}

export default function SettingsSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(true);

  const sectionParam = params.get('section');
  const initialSection = sectionParam && SECTION_ALIASES[sectionParam]
    ? SECTION_ALIASES[sectionParam]
    : null;

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || ROUTES.feed);
    }
  };

  return (
    <IdentitySheet
      open={open}
      onOpenChange={handleClose}
      title="Settings"
      footer={
        <div className="pt-2 text-center text-caption text-muted-foreground">
          DNA - Diaspora Network of Africa
        </div>
      }
    >
      <SettingsSheetBody initialSection={initialSection} />
    </IdentitySheet>
  );
}
