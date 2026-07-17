/**
 * SettingsSheet — Claude-inspired grouped identity sheet at /dna/settings.
 *
 * Part 1 (reversible, no schema changes):
 *  - Renders an IdentitySheet listing all settings surfaces as a grouped list.
 *  - Each row navigates to the existing subpage route (which retains its own
 *    SettingsLayout). Legacy deep-links via ?section= are honored on mount.
 *  - Closing the sheet returns the user to the feed (or previous route).
 *  - Rollback: flip SETTINGS_SHEET_V2 in featureFlags.ts to fall back to the
 *    legacy Navigate → /dna/settings/account redirect.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Settings as SettingsIcon,
  Hash,
  Flag,
  UserX,
  FileText,
  LogOut,
  Info,
} from 'lucide-react';
import { IdentitySheet, SettingsGroup, SettingsRow } from '@/components/ui/settings-kit';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROUTES } from '@/config/routes';

const SECTION_ROUTE: Record<string, string> = {
  account: ROUTES.settings.account,
  privacy: ROUTES.settings.privacy,
  blocked: ROUTES.settings.blocked,
  reports: ROUTES.settings.reports,
  notifications: ROUTES.settings.notifications,
  preferences: ROUTES.settings.preferences,
  hashtags: ROUTES.settings.hashtags,
};

export default function SettingsSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const [open, setOpen] = useState(true);

  // Legacy ?section= deep-link: route directly to the existing subpage.
  useEffect(() => {
    const section = params.get('section');
    if (section && SECTION_ROUTE[section]) {
      navigate(SECTION_ROUTE[section], { replace: true });
    }
  }, [params, navigate]);

  const initials = useMemo(() => {
    const name = profile?.full_name || user?.email || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [profile?.full_name, user?.email]);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || ROUTES.feed);
    }
  };

  const go = (path: string) => () => navigate(path);

  const identityHeader = (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3">
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
    </div>
  );

  const footer = (
    <div className="pt-2 text-center text-caption text-muted-foreground">
      DNA - Diaspora Network of Africa
    </div>
  );

  return (
    <IdentitySheet
      open={open}
      onOpenChange={handleClose}
      title="Settings"
      header={identityHeader}
      footer={footer}
    >
      <SettingsGroup label="Account">
        <SettingsRow
          icon={User}
          label="Account"
          description="Email, password, delete account"
          onClick={go(ROUTES.settings.account)}
        />
        <SettingsRow
          icon={Shield}
          label="Privacy"
          description="Who can see your profile"
          onClick={go(ROUTES.settings.privacy)}
        />
      </SettingsGroup>

      <SettingsGroup label="Notifications & display">
        <SettingsRow
          icon={Bell}
          label="Notifications"
          description="Push, email, quiet hours"
          onClick={go(ROUTES.settings.notifications)}
        />
        <SettingsRow
          icon={SettingsIcon}
          label="Preferences"
          description="Density, module visibility"
          onClick={go(ROUTES.settings.preferences)}
        />
      </SettingsGroup>

      <SettingsGroup label="Content & safety">
        <SettingsRow
          icon={Hash}
          label="My hashtags"
          description="Personal hashtag slots"
          onClick={go(ROUTES.settings.hashtags)}
        />
        <SettingsRow
          icon={Flag}
          label="My reports"
          description="Reports you have submitted"
          onClick={go(ROUTES.settings.reports)}
        />
        <SettingsRow
          icon={UserX}
          label="Blocked users"
          description="People you have blocked"
          onClick={go(ROUTES.settings.blocked)}
        />
      </SettingsGroup>

      <SettingsGroup label="About">
        <SettingsRow
          icon={Info}
          label="About DNA"
          onClick={go(ROUTES.about)}
        />
        <SettingsRow
          icon={FileText}
          label="Terms of service"
          onClick={go(ROUTES.termsOfService)}
        />
        <SettingsRow
          icon={FileText}
          label="Privacy policy"
          onClick={go(ROUTES.privacyPolicy)}
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
    </IdentitySheet>
  );
}
