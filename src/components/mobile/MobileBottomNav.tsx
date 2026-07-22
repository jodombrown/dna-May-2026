import React, { useState } from 'react';
import { Home, Plus, Menu } from 'lucide-react';
import { Sankofa, Nkonsonkonson, FuntunfunefuDenkyemfunefu, Adinkrahene, Mpatapo } from '@/components/icons/adinkra';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { haptic } from '@/utils/haptics';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { MateMasie } from '@/components/icons/adinkra';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Settings, Bell, LogOut, LayoutDashboard } from 'lucide-react';
import { MESSAGING_ENABLED } from '@/config/featureFlags';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useMobile();
  const { user, profile, signOut } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { data: unreadCountFromRPC = 0 } = useUnreadNotificationCount();
  const { isAdmin } = useIsAdmin();
  
  // Use the RPC count directly - it's the source of truth for unread notifications
  const unreadCount = unreadCountFromRPC;

  // Only show on mobile
  if (!isMobile) return null;

  // 5C Framework as PRIMARY navigation
  // TRUST-FIRST: All routes verified to exist and work
  const navItems = [
    { 
      label: 'Connect', 
      pillar: 'connect',
      icon: Sankofa, 
      path: '/dna/connect', 
      type: 'nav' as const,
      description: 'Build network'
    },
    { 
      label: 'Convene', 
      pillar: 'convene',
      icon: Nkonsonkonson, 
      path: '/dna/convene', 
      type: 'nav' as const,
      description: 'Join events'
    },
    { 
      label: 'Feed', 
      icon: Home, 
      path: '/dna/feed', 
      type: 'nav' as const,
      description: 'Home'
    },
    { 
      label: 'Collaborate', 
      pillar: 'collaborate',
      icon: FuntunfunefuDenkyemfunefu, 
      path: '/dna/collaborate', 
      type: 'nav' as const,
      description: 'Work together'
    },
    { 
      label: 'More', 
      icon: Menu, 
      type: 'menu' as const,
      description: 'More options'
    },
  ];

  const moreMenuItems = [
    {
      label: 'DIA',
      icon: MateMasie,
      path: '/dna/dia',
      description: 'AI-powered insights',
      highlight: true,
      isNew: true
    },
    { 
      label: 'Messages', 
      icon: MessageSquare, 
      path: '/dna/messages',
      description: 'Direct conversations'
    },
    { 
      label: 'Contribute', 
      pillar: 'contribute',
      icon: Adinkrahene, 
      path: '/dna/contribute',
      description: 'Give back & support'
    },
    { 
      label: 'Convey', 
      pillar: 'convey',
      icon: Mpatapo, 
      path: '/dna/convey',
      description: 'Share your story'
    },
    { 
      label: 'Notifications', 
      icon: Bell, 
      path: '/dna/notifications',
      description: 'Activity updates',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      label: 'Admin',
      icon: LayoutDashboard,
      path: '/dna/admin',
      description: 'Manage your DNA'
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      path: '/dna/settings',
      description: 'Account settings'
    },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.type === 'menu') {
      setShowMoreMenu(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Fixed bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
        {/*
          BD157: `pb-safe` was a phantom — tailwind.config.ts declares no
          spacing/padding scale, so it rendered NOTHING and the nav sat in the
          iPhone home-indicator strip. Replaced with the inset itself rather
          than by defining the token, so 1b can define spacing deliberately
          without this site double-padding.
        */}
        <div className="flex justify-around items-center h-16 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { haptic('light'); handleItemClick(item); }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
                isActive(item.path)
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn(item.pillar ? 'w-6 h-6' : 'w-5 h-5')} strokeWidth={isActive(item.path) ? (item.pillar ? 2 : 2.5) : (item.pillar ? 1.75 : 2)} />
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Active indicator */}
              {isActive(item.path) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-foreground/80 rounded-b-full" />
              )}
              
              {/* Notification badge for More menu */}
              {item.type === 'menu' && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Universal Composer */}

      {/* More Menu Sheet */}
      <Sheet open={showMoreMenu} onOpenChange={setShowMoreMenu}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>

          {/* Profile Section */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
              <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setShowMoreMenu(false);
                // TRUST-FIRST: Use correct profile route
                if (profile?.username) {
                  navigate(`/dna/${profile.username}`);
                }
              }}
            >
              View Profile
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Menu Items */}
          <div className="space-y-1">
            {/* BD063 hide-and-freeze: drop the Messages item while DM messaging is OUT at v0.0.
                Admin item is role-gated — only rendered for admins (page guard on /dna/admin stays as defense-in-depth). */}
            {moreMenuItems
              .filter((item) => MESSAGING_ENABLED || item.path !== '/dna/messages')
              .filter((item) => isAdmin || item.path !== '/dna/admin')
              .map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setShowMoreMenu(false);
                  navigate(item.path);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors",
                  item.highlight && "bg-emerald-500/10 hover:bg-emerald-500/20"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    (item as any).pillar || (item as any).highlight ? 'w-6 h-6' : 'w-5 h-5',
                    item.highlight ? 'text-emerald-600' : 'text-muted-foreground'
                  )} />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                  {(item as any).isNew && (
                    <Badge 
                      className="absolute -top-2 -right-4 h-4 px-1 bg-dna-copper text-white text-[9px] font-semibold"
                    >
                      New
                    </Badge>
                  )}
                  {item.highlight && !(item as any).isNew && (
                    <Badge 
                      className="absolute -top-2 -right-4 h-4 px-1 bg-emerald-600 text-[9px]"
                    >
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    "font-medium text-sm",
                    item.highlight && "text-emerald-600"
                  )}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Sign Out */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={async () => {
              await signOut();
              setShowMoreMenu(false);
              navigate('/');
            }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
