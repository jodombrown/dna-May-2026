import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit,
  Share2,
  FileText,
  Bookmark,
  Users,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  Copy,
  MessageSquare,
  Linkedin,
  Twitter,
  Download,
  Loader2,
  ClipboardCheck,
  Shield,
  Bell,
  Hash,
  UserX,
  Flag,
  MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IdentitySheet,
  SettingsGroup,
  SettingsRow,
  useIdentitySheet,
} from '@/components/ui/settings-kit';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountDrawer } from '@/contexts/AccountDrawerContext';
import { toast } from 'sonner';
import { profileRoute } from '@/lib/profileRoute';
import { generateProfilePDF } from '@/lib/generateProfilePDF';
import { useTourProgress } from '@/hooks/useTourProgress';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { AlphaTestGuide } from '@/components/alpha/AlphaTestGuide';
import { FeedbackDrawer } from '@/components/feedback/FeedbackDrawer';
import AfricaSpinner from '@/components/ui/AfricaSpinner';

const AccountSettings = lazy(() => import('@/pages/dna/settings/AccountSettings'));
const PrivacySettings = lazy(() => import('@/pages/dna/settings/PrivacySettings'));
const NotificationSettings = lazy(() => import('@/pages/dna/settings/NotificationSettings'));
const PreferencesSettings = lazy(() => import('@/pages/dna/settings/PreferencesSettings'));
const BlockedUsersSettings = lazy(() => import('@/pages/dna/settings/BlockedUsersSettings'));
const MyReportsSettings = lazy(() => import('@/pages/dna/settings/MyReportsSettings'));
const MyHashtagsSettings = lazy(() => import('@/pages/dna/settings/MyHashtagsSettings'));
const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));

const SubpageFallback = () => (
  <div className="flex items-center justify-center py-12">
    <AfricaSpinner size="md" />
  </div>
);

const Subpage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4">
    <Suspense fallback={<SubpageFallback />}>{children}</Suspense>
  </div>
);

/* ---------------------------- Root list ---------------------------- */

interface RootProps {
  onCloseSheet: () => void;
  onOpenTour: () => void;
  onOpenTestGuide: () => void;
  onOpenFeedback: () => void;
}

const AccountRoot: React.FC<RootProps> = ({
  onCloseSheet,
  onOpenTour,
  onOpenTestGuide,
  onOpenFeedback,
}) => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const sheet = useIdentitySheet();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!user || !profile) return null;

  const publicUrl = profile.username
    ? `${window.location.origin}/u/${profile.username}`
    : '';

  const navExternal = (path: string) => {
    navigate(path);
    onCloseSheet();
  };

  const pushProfileEdit = () =>
    sheet.push({
      key: 'profile-edit',
      title: 'Edit profile',
      node: (
        <Subpage>
          <ProfileEdit />
        </Subpage>
      ),
    });

  const pushSettings = () =>
    sheet.push({
      key: 'settings',
      title: 'Settings',
      node: <SettingsList />,
    });

  const pushShare = () =>
    sheet.push({
      key: 'share',
      title: 'Share profile',
      node: <ShareSubpage url={publicUrl} name={(profile as any).display_name || (profile as any).full_name || profile.username || ''} />,
    });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generateProfilePDF(profile as any, user?.email);
      toast.success('Profile PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Identity card */}
      <button
        type="button"
        onClick={pushProfileEdit}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors text-left"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || ''} />
          <AvatarFallback>
            {(profile as any).display_name?.[0] || (profile as any).full_name?.[0] || profile.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {(profile as any).display_name || (profile as any).full_name || profile.username}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            @{profile.username}
          </div>
          {(profile as any).current_location && (
            <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {(profile as any).current_location}
            </div>
          )}
        </div>
      </button>

      <SettingsGroup label="Profile">
        <SettingsRow
          icon={User}
          label="View public profile"
          onClick={() => profile.username && navExternal(profileRoute(profile))}
        />
        <SettingsRow icon={Edit} label="Edit profile" onClick={pushProfileEdit} />
        <SettingsRow icon={Share2} label="Share profile" onClick={pushShare} />
      </SettingsGroup>

      <SettingsGroup label="My activity">
        <SettingsRow
          icon={FileText}
          label="My posts & updates"
          onClick={() => navExternal('/dna/feed?tab=my_posts')}
        />
        <SettingsRow
          icon={FileText}
          label="My stories"
          onClick={() => navExternal('/dna/convey?tab=my_stories')}
        />
        <SettingsRow
          icon={Bookmark}
          label="Saved items"
          onClick={() => navExternal('/dna/feed?tab=bookmarks')}
        />
      </SettingsGroup>

      <SettingsGroup label="My work">
        <SettingsRow
          icon={Users}
          label="My spaces"
          onClick={() => navExternal('/dna/collaborate')}
        />
        <SettingsRow
          icon={Calendar}
          label="My events"
          onClick={() => navExternal('/dna/convene/events')}
        />
      </SettingsGroup>

      <SettingsGroup label="Account">
        <SettingsRow icon={Settings} label="Settings & preferences" onClick={pushSettings} />
        <SettingsRow
          icon={Download}
          label={isDownloading ? 'Generating profile PDF…' : 'Download profile PDF'}
          onClick={handleDownloadPDF}
          right={isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          chevron={false}
        />
        <SettingsRow icon={ClipboardCheck} label="Alpha test guide" onClick={onOpenTestGuide} chevron={false} />
        <SettingsRow icon={HelpCircle} label="Take platform tour" onClick={onOpenTour} chevron={false} />
        <SettingsRow icon={MessageSquare} label="Send feedback" onClick={onOpenFeedback} chevron={false} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon={LogOut}
          label="Sign out"
          destructive
          chevron={false}
          onClick={async () => {
            await signOut();
            onCloseSheet();
            navigate('/');
          }}
        />
      </SettingsGroup>
    </div>
  );
};

/* ---------------------------- Settings sub-list ---------------------------- */

const SettingsList: React.FC = () => {
  const sheet = useIdentitySheet();

  const open = (key: string, title: string, node: React.ReactNode) =>
    sheet.push({ key, title, node: <Subpage>{node}</Subpage> });

  return (
    <div className="pb-8">
      <SettingsGroup label="Preferences">
        <SettingsRow
          icon={User}
          label="Account"
          hint="Email, password, sessions"
          onClick={() => open('acct', 'Account', <AccountSettings />)}
        />
        <SettingsRow
          icon={Shield}
          label="Privacy"
          hint="Who can see your profile"
          onClick={() => open('priv', 'Privacy', <PrivacySettings />)}
        />
        <SettingsRow
          icon={Bell}
          label="Notifications"
          hint="Email and in-app alerts"
          onClick={() => open('notif', 'Notifications', <NotificationSettings />)}
        />
        <SettingsRow
          icon={Settings}
          label="Display"
          hint="Modules and layout"
          onClick={() => open('prefs', 'Display', <PreferencesSettings />)}
        />
      </SettingsGroup>

      <SettingsGroup label="Community">
        <SettingsRow
          icon={Hash}
          label="My hashtags"
          onClick={() => open('tags', 'My hashtags', <MyHashtagsSettings />)}
        />
        <SettingsRow
          icon={UserX}
          label="Blocked users"
          onClick={() => open('block', 'Blocked users', <BlockedUsersSettings />)}
        />
        <SettingsRow
          icon={Flag}
          label="My reports"
          onClick={() => open('reports', 'My reports', <MyReportsSettings />)}
        />
      </SettingsGroup>
    </div>
  );
};

/* ---------------------------- Share sub-page ---------------------------- */

const ShareSubpage: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied');
  };
  const text = `Check out ${name}'s profile on DNA - Diaspora Network of Africa`;
  return (
    <div className="pb-8">
      <SettingsGroup label="Share via">
        <SettingsRow icon={Copy} label="Copy link" onClick={copy} chevron={false} />
        <SettingsRow
          icon={MessageSquare}
          label="WhatsApp"
          chevron={false}
          onClick={() =>
            window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank')
          }
        />
        <SettingsRow
          icon={Linkedin}
          label="LinkedIn"
          chevron={false}
          onClick={() =>
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
              '_blank',
            )
          }
        />
        <SettingsRow
          icon={Twitter}
          label="X (Twitter)"
          chevron={false}
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
              '_blank',
            )
          }
        />
      </SettingsGroup>
      <div className="px-4 pt-4 text-xs text-muted-foreground break-all">{url}</div>
    </div>
  );
};

/* ---------------------------- Wrapper ---------------------------- */

export const AccountDrawer: React.FC = () => {
  const { isOpen, close } = useAccountDrawer();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [showTour, setShowTour] = useState(false);
  const [showTestGuide, setShowTestGuide] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { isCompleted: tourCompleted, resetTour } = useTourProgress();

  if (!user || !profile) return null;

  return (
    <>
      <IdentitySheet open={isOpen} onOpenChange={(o) => !o && close()} rootTitle="Account">
        <AccountRoot
          onCloseSheet={close}
          onOpenTour={() => {
            if (tourCompleted) resetTour();
            setShowTour(true);
            close();
          }}
          onOpenTestGuide={() => {
            close();
            setShowTestGuide(true);
          }}
          onOpenFeedback={() => {
            close();
            setShowFeedback(true);
          }}
        />
      </IdentitySheet>

      <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />
      <AlphaTestGuide
        isOpen={showTestGuide}
        onClose={() => setShowTestGuide(false)}
        onOpenFeedback={() => {
          setShowTestGuide(false);
          setShowFeedback(true);
        }}
      />
      <FeedbackDrawer isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
};

export default AccountDrawer;
