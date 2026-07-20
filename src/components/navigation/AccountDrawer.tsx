/**
 * AccountDrawerBody — the Account surface's CONTENT. No chrome (BD135 rule 5).
 *
 * ── DR2 step 2: one definition of the Account panels, and one source of copy ──
 *
 * This file used to declare its own eight `React.lazy` panel imports and pass
 * `subpage={{ id, title, content }}` on every row. `AccountSurface.tsx` declared
 * the SAME eight in `ACCOUNT_PANELS`, and `DrawerIdentityShim` deliberately
 * ignores the passed node and resolves by id — so this copy was dead as content
 * and still constructed on every render.
 *
 * Two definitions of one list is the drift vector BD137 exists to close, and it
 * had already drifted where a member could see it: the panel header read
 * "Sign-in and security" while the row that opened it read "Account".
 *
 * So rows now take their label, sublabel and panel id from `ACCOUNT_SURFACE` in
 * the registry, and pass no content at all. The shell resolves the panel from
 * the id, which is the id in the URL. `drawerRegistry.test.tsx` asserts every
 * push row's panel exists and that its title equals the row's label, which is
 * the assertion that would have caught the half-applied copy lock.
 *
 * Row BEHAVIOUR is still wired here rather than read from the registry. Three
 * registry rows declare `swap`, and no swap target is registered in the
 * resolvers yet (tour, alpha guide and feedback are still legacy overlays
 * opened through `AccountActionsContext`). Driving behaviour off the registry
 * before those surfaces exist would break three working rows, so full
 * registry-driven rendering — behaviour and grouping included — is DR3's.
 */
import { useMemo } from 'react';
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
import { SettingsGroup, SettingsRow, useIdentitySheet } from '@/components/ui/settings-kit';
import { accountRow, accountPanelId, accountRoute } from '@/components/drawer/registry';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { profileRoute } from '@/lib/profileRoute';
import { ChevronRight } from 'lucide-react';

/**
 * A row's copy and its panel id, both from the registry.
 *
 * `content` is deliberately omitted. The shell resolves a panel from its id
 * (`ACCOUNT_PANELS` in `AccountSurface.tsx`), so passing a node here would be a
 * second definition of the same panel that nothing renders — which is exactly
 * what this step deleted.
 */
const panelRow = (rowId: string) => {
  const row = accountRow(rowId);
  return {
    label: row.label,
    description: row.sublabel,
    subpage: { id: accountPanelId(rowId), title: row.label },
  };
};

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
  // `close` is deliberately NOT taken. It was unused after the DR1 navigate-row
  // hotfix deleted the close from `go()`, and an unused handle to a history pop
  // is an invitation to reintroduce the race that broke six rows.
  const { push } = useIdentitySheet();
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

  const openProfileEdit = () => {
    const { subpage } = panelRow('profile');
    push({ id: subpage.id, title: subpage.title });
  };

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

  /**
   * A `navigate` row: copy and destination both from the registry.
   *
   * The route matters as much as the label. `registry.test.ts` checks each
   * route (and its `paramContract`) against the destination's source; while the
   * surface kept its own copies of those strings, that gate was guarding a
   * parallel list rather than the one members actually tap.
   */
  const goRow = (rowId: string) => {
    const row = accountRow(rowId);
    return {
      label: row.label,
      description: row.sublabel,
      onClick: () => go(accountRoute(rowId)),
    };
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
          <div className="truncate text-caption text-muted-foreground">
            {user?.email || ''}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <SettingsGroup label="You">
        <SettingsRow
          icon={UserIcon}
          label={accountRow('view-public-profile').label}
          // The only row whose destination is per-member, so it resolves from
          // the profile rather than from the registry's `/dna/:username`.
          onClick={() => profile && go(profileRoute(profile))}
        />
        <SettingsRow
          icon={Share2}
          label={accountRow('share-profile').label}
          onClick={openShareSheet}
        />
      </SettingsGroup>

      <SettingsGroup label="My work">
        <SettingsRow icon={FileText} {...goRow('my-posts')} />
        <SettingsRow icon={FileText} {...goRow('my-stories')} />
        <SettingsRow icon={Bookmark} {...goRow('saved-items')} />
        <SettingsRow icon={Users} {...goRow('my-spaces')} />
        <SettingsRow icon={Calendar} {...goRow('my-events')} />
      </SettingsGroup>

      <SettingsGroup label="Account">
        <SettingsRow icon={UserCircle} {...panelRow('profile')} />
        <SettingsRow icon={UserIcon} {...panelRow('sign-in-and-security')} />
        <SettingsRow icon={Shield} {...panelRow('privacy')} />
        <SettingsRow icon={Bell} {...panelRow('notifications')} />
        <SettingsRow icon={SettingsIcon} {...panelRow('preferences')} />
      </SettingsGroup>

      <SettingsGroup label="Content & safety">
        <SettingsRow icon={Hash} {...panelRow('my-hashtags')} />
        <SettingsRow icon={Flag} {...panelRow('my-reports')} />
        <SettingsRow icon={UserX} {...panelRow('blocked-users')} />
      </SettingsGroup>

      <SettingsGroup label="About">
        {/*
          Three `swap` rows. The registry says they suspend Account and open a
          sibling surface with Back returning here; today they open legacy
          overlays through `AccountActionsContext`, because no swap target is
          registered in the resolvers yet. Labels come from the registry so the
          copy cannot drift; the behaviour is DR3's, and until then the gap is
          named here rather than papered over.
        */}
        <SettingsRow
          icon={MateMasie}
          label={accountRow('platform-tour').label}
          onClick={handlers.onTour}
        />
        <SettingsRow
          icon={ClipboardCheck}
          label={accountRow('alpha-test-guide').label}
          onClick={handlers.onTestGuide}
        />
        <SettingsRow
          icon={HelpCircle}
          label={accountRow('help-and-feedback').label}
          onClick={handlers.onFeedback}
        />
        <SettingsRow icon={Info} {...goRow('about-dna')} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          variant="destructive"
          icon={LogOut}
          label={accountRow('sign-out').label}
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
