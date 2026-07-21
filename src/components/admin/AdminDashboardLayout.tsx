import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FolderKanban, MessageSquare, Shield, BarChart3, Settings, ClipboardList, UserCog, ChevronDown, ChevronRight, Menu, X, LogOut, Bell, Search, Activity, ExternalLink, Boxes, Flag, HandHeart, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MateMasie } from '@/components/icons/adinkra';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Admin RPC functions use 'as any' to bypass TypeScript since they're not in auto-generated types
import { cn } from '@/lib/utils';

type AdminRoleLevel =
  | 'super_admin'
  | 'platform_admin'
  | 'content_admin'
  | 'analytics_admin'
  | 'support_admin'
  | 'event_admin';

interface AdminUser {
  userId: string;
  email: string;
  roleLevel: AdminRoleLevel;
  isSuperAdmin: boolean;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  badge?: number;
  children?: NavItem[];
  roles?: AdminRoleLevel[];
}

const navigation: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/admin/dashboard'
  },
  {
    icon: Users,
    label: 'Users',
    children: [
      { icon: Users, label: 'All Users', href: '/admin/users' },
      { icon: Users, label: 'Pending Approval', href: '/admin/users/pending' },
      { icon: Users, label: 'Suspended', href: '/admin/users/suspended' },
      { icon: Users, label: 'Segments', href: '/admin/users/segments' }
    ]
  },
  {
    icon: Calendar,
    label: 'Events',
    children: [
      { icon: Calendar, label: 'All Events', href: '/admin/events' },
      { icon: Calendar, label: 'Pending Review', href: '/admin/events/pending' },
      { icon: Calendar, label: 'Analytics', href: '/admin/events/analytics' }
    ]
  },
  {
    icon: Boxes,
    label: 'Spaces',
    children: [
      { icon: Boxes, label: 'Space Management', href: '/admin/spaces' },
      { icon: Flag, label: 'Space Moderation', href: '/admin/spaces/moderation' }
    ]
  },
  {
    icon: HandHeart,
    label: 'Contributions',
    children: [
      { icon: HandHeart, label: 'Contribution Management', href: '/admin/contributions' },
      { icon: Flag, label: 'Contribution Moderation', href: '/admin/contributions/moderation' }
    ]
  },
  {
    icon: FolderKanban,
    label: 'Projects',
    href: '/admin/projects'
  },
  {
    icon: MessageSquare,
    label: 'Feedback',
    href: '/admin/feedback',
    badge: 0
  },
  {
    icon: Shield,
    label: 'Moderation',
    href: '/admin/moderation',
    badge: 0
  },
  {
    icon: MateMasie,
    label: 'DIA',
    href: '/admin/dia'
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    children: [
      { icon: BarChart3, label: 'User Analytics', href: '/admin/analytics/users' },
      { icon: BarChart3, label: 'Engagement', href: '/admin/analytics/engagement' },
      { icon: BarChart3, label: 'Collaboration', href: '/admin/analytics/collaboration' },
      { icon: BarChart3, label: 'Contributions', href: '/admin/analytics/contributions' },
      { icon: BarChart3, label: 'Growth', href: '/admin/analytics/growth' }
    ]
  },
  {
    icon: Settings,
    label: 'Settings',
    roles: ['super_admin', 'platform_admin'],
    children: [
      { icon: Settings, label: 'Platform Settings', href: '/admin/settings' },
      { icon: Settings, label: 'Feature Flags', href: '/admin/settings/features' },
      { icon: Settings, label: 'Announcements', href: '/admin/settings/announcements' },
      { icon: Quote, label: 'Homepage Citations', href: '/admin/citations' }
    ]
  },
  {
    icon: ClipboardList,
    label: 'Audit Log',
    href: '/admin/audit-log',
    roles: ['super_admin', 'platform_admin']
  },
  {
    icon: UserCog,
    label: 'Admin Management',
    href: '/admin/admins',
    roles: ['super_admin']
  }
];

const hasAccess = (
  userRole: AdminRoleLevel,
  isSuperAdmin: boolean,
  allowedRoles?: AdminRoleLevel[]
): boolean => {
  if (isSuperAdmin) return true;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

export const AdminDashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState(0);
  const [pendingModeration, setPendingModeration] = useState(0);

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const { data, error } = await (supabase as any).rpc('get_current_admin_status');

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const result = data[0];
          setAdminUser({
            userId: result.user_id,
            email: result.email,
            roleLevel: result.role_level as AdminRoleLevel,
            isSuperAdmin: result.is_super_admin
          });
        }
      } catch (err) {
        // Failed to fetch admin user - will show loading state
      }
    };

    // v0.0: no live pending-count source — get_admin_dashboard_stats was never
    // built (see Pass 2c/2d). Skip the fetch entirely; the Feedback/Moderation nav
    // badges stay hidden (they render only when their count > 0) rather than showing
    // a fabricated 0 from a dead RPC.
    fetchAdminUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out
      await supabase.auth.signOut();

      toast({
        title: 'Signed out',
        description: 'You have been logged out of the admin portal.'
      });

      navigate('/admin-login', { replace: true });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };

  // Auto-expand parent items when a child is active
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children && isChildActive(item.children)) {
        setExpandedItems(prev =>
          prev.includes(item.label) ? prev : [...prev, item.label]
        );
      }
    });
  }, [location.pathname]);

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.roles && adminUser && !hasAccess(adminUser.roleLevel, adminUser.isSuperAdmin, item.roles)) {
      return null;
    }

    const isExpanded = expandedItems.includes(item.label);
    const active = isActive(item.href) || (!item.href && isChildActive(item.children));

    // Get badge count for specific items
    let badgeCount = item.badge;
    if (item.label === 'Feedback') badgeCount = pendingFeedback;
    if (item.label === 'Moderation') badgeCount = pendingModeration;

    if (item.children) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              active
                ? 'bg-emerald-100 text-emerald-900'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-3">
              {item.children.map(child => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        to={item.href || '#'}
        onClick={() => setIsSidebarOpen(false)}
        className={cn(
          'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
          isChild ? 'py-1.5' : '',
          active
            ? 'bg-emerald-100 text-emerald-900 font-medium'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        )}
      >
        <div className="flex items-center gap-3">
          {!isChild && <item.icon className="w-4 h-4" />}
          <span>{item.label}</span>
        </div>
        {badgeCount !== undefined && badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="h-5 min-w-5 text-xs px-1.5 flex items-center justify-center"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200 px-4 py-3"
        /* BD157 */
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">DNA Admin</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 -mr-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                    {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-neutral-200 z-50 transition-transform duration-300',
          // BD157: spans both insets.
          '[padding-top:env(safe-area-inset-top,0px)] [padding-bottom:env(safe-area-inset-bottom,0px)]',
          'lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-neutral-900">DNA Admin</h1>
                <p className="text-xs text-neutral-500">Control Panel</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map(item => renderNavItem(item))}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-neutral-200">
            <Link
              to="/dna/feed"
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Back to Platform
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-white border-b border-neutral-200 px-6 py-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search users, events..."
              className="pl-9 bg-neutral-50 border-neutral-200"
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">System Online</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-neutral-600" />
              {(pendingFeedback + pendingModeration) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {adminUser?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {adminUser?.roleLevel?.replace('_', ' ') || 'Loading...'}
                    </p>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                      {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{adminUser?.email}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {adminUser?.isSuperAdmin ? 'Super Admin' : adminUser?.roleLevel?.replace('_', ' ')}
                  </p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
