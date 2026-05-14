import { Outlet, NavLink } from 'react-router-dom';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  BarChart,
  Users,
  Settings,
  Shield,
  ArrowLeft,
  Activity,
  ListChecks,
  TrendingUp,
  Megaphone,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Admin sidebar nav. Each link's icon is unique within this surface and
 * registered in scripts/check-icon-duplicates.ts. See
 * docs/ICON_USAGE_GUIDE.md for the platform-wide reservation table.
 */
interface AdminNavItem {
  to: string;
  end?: boolean;
  icon: typeof BarChart;
  label: string;
  description: string;
}

const ADMIN_NAV: AdminNavItem[] = [
  { to: '/app/admin', end: true, icon: BarChart, label: 'Dashboard', description: 'Overview metrics and KPIs' },
  { to: '/app/admin/waitlist', icon: ListChecks, label: 'Waitlist', description: 'Pending invite requests' },
  { to: '/app/admin/users', icon: Users, label: 'Users', description: 'Member directory and roles' },
  { to: '/app/admin/health', icon: Activity, label: 'Health', description: 'Platform health monitors' },
  { to: '/app/admin/engagement', icon: TrendingUp, label: 'Engagement', description: 'Engagement analytics' },
  { to: '/app/admin/signals', icon: Settings, label: 'Signals', description: 'Signal configuration' },
  { to: '/app/admin/sponsorships', icon: Megaphone, label: 'Sponsorships', description: 'Sponsor placements' },
];

export default function AdminLayout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground hover:bg-accent'
    }`;

  return (
    <AdminGuard>
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen bg-background">
          {/* Admin Header */}
          <div className="bg-card border-b border-border">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h1 className="text-xl font-bold text-foreground">DNA Admin</h1>
                </div>
                <NavLink
                  to="/dna/feed"
                  aria-label="Back to platform"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Platform
                </NavLink>
              </div>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="bg-card border-b border-border">
            <div className="max-w-7xl mx-auto px-4">
              <nav
                className="flex gap-2 py-3 overflow-x-auto"
                role="tablist"
                aria-label="Admin sections"
              >
                {ADMIN_NAV.map(({ to, end, icon: Icon, label, description }) => (
                  <Tooltip key={to}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={to}
                        end={end}
                        className={navLinkClass}
                        aria-label={`${label}: ${description}`}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            <span aria-current={isActive ? 'page' : undefined}>{label}</span>
                          </>
                        )}
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{description}</TooltipContent>
                  </Tooltip>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Outlet />
          </div>
        </div>
      </TooltipProvider>
    </AdminGuard>
  );
}
