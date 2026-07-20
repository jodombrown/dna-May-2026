import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useIdentitySheetSafe } from '@/components/ui/settings-kit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Shield, Bell, Settings, ChevronRight, Hash, UserX, Flag } from 'lucide-react';

interface SettingsNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  isNew?: boolean;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    label: 'Account',
    href: '/dna/settings/account',
    icon: User,
    description: 'Email, password, and account management',
  },
  {
    label: 'Privacy',
    href: '/dna/settings/privacy',
    icon: Shield,
    description: 'Control who can see your profile',
  },
  {
    label: 'Blocked Users',
    href: '/dna/settings/blocked',
    icon: UserX,
    description: 'Manage users you\'ve blocked',
  },
  {
    label: 'My Reports',
    href: '/dna/settings/reports',
    icon: Flag,
    description: 'View reports you\'ve submitted',
  },
  {
    label: 'Notifications',
    href: '/dna/settings/notifications',
    icon: Bell,
    description: 'Email and in-app notification preferences',
  },
  {
    label: 'Preferences',
    href: '/dna/settings/preferences',
    icon: Settings,
    description: 'Display settings and module visibility',
  },
  {
    label: 'My Hashtags',
    href: '/dna/settings/hashtags',
    icon: Hash,
    description: 'Manage your personal hashtags',
    isNew: true,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function SettingsLayout({ children, title, description }: SettingsLayoutProps) {
  const location = useLocation();

  /**
   * Panel awareness (DR2 step 1) — BD135 rule 5, satisfied in one place.
   *
   * Seven settings pages wrap themselves in this layout, and seven of the eight
   * Account drawer panels render one of them. So inside a 448px panel this
   * layout was rendering `<UnifiedHeader />`, a `min-h-screen` container, a
   * Back-to-Feed button and a seven-item sidebar nav: an entire page, chrome
   * and all, inside a drawer that already has a header, a back control and a
   * close. That is the exact inverse of BD142 — there a surface carried too
   * little chrome after the shell absorbed it, here it carries too much.
   *
   * The fix lives here rather than in the seven pages because the pages wrap at
   * two to four separate sites each (loading, error and main states wrap
   * independently), so splitting content from chrome page-by-page means ~15
   * edit sites plus seven new routed wrappers. One shared layout, one detector.
   *
   * `useIdentitySheetSafe()` is that detector and it was already built and
   * already correct: it returns null outside a sheet, and the only live provider
   * of that context is `DrawerIdentityShim`, which wraps panels and nothing else
   * (`IdentitySheet` itself is rendered nowhere — asserted in
   * `accountSurface.test.tsx`). In panel context the layout renders content
   * only; on `/dna/settings/*` it renders exactly as before.
   */
  const inPanel = useIdentitySheetSafe() !== null;

  if (inPanel) {
    return (
      <div className="p-4">
        {description ? (
          <p className="mb-4 text-meta text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Mobile back button */}
        <div className="mb-6 lg:hidden">
          <Button variant="ghost" asChild>
            <Link to="/dna/feed">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-xl font-bold mb-4 hidden lg:block">Settings</h2>

              {/* Desktop navigation */}
              <nav className="hidden lg:block space-y-1">
                {settingsNavItems.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href === '/dna/settings/preferences' && location.pathname === '/dna/settings');
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {item.isNew && (
                        <Badge className="bg-dna-copper text-white text-[10px] px-1.5 py-0 h-4 font-semibold ml-auto">
                          New
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile navigation - card grid */}
              <nav className="lg:hidden grid grid-cols-2 gap-3">
                {settingsNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                        isActive
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-card border-border hover:bg-muted'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.isNew && (
                        <Badge className="absolute -top-2 -right-2 bg-dna-copper text-white text-[9px] px-1.5 py-0 h-4 font-semibold">
                          New
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Desktop: Back to Feed */}
              <div className="hidden lg:block mt-6 pt-6 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/dna/feed">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Feed
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;
