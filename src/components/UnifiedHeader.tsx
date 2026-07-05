import React, { useState, useRef } from 'react';
import { useSetCSSHeaderHeight } from '@/hooks/useSetCSSHeaderHeight';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalDashboard } from '@/contexts/DashboardContext';
import { useAccountDrawer } from '@/contexts/AccountDrawerContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { cn } from '@/lib/utils';
import dnaLogo from '@/assets/dna-logo.png';
import { MateMasie } from '@/components/icons/adinkra';

import { Home, MessageCircle, MessageSquarePlus, Bell, User, LogOut, Menu, ChevronDown, Target, Users2, Lightbulb, TestTube, Shield, Plus, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BetaSignupDialog from '@/components/auth/BetaSignupDialog';
import { publicNavItems, aboutUsDropdown } from './header/navigationConfig';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { MESSAGING_ENABLED } from '@/config/featureFlags';
// useUnreadNotificationCount removed — UnifiedNotificationBell handles its own count
import { useMobile } from '@/hooks/useMobile';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { useHeaderVisibility } from '@/hooks/useHeaderVisibility';
import { UniversalComposer } from '@/components/composer/UniversalComposer';

const UnifiedHeader = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { open: openAccountDrawer } = useAccountDrawer();
  const { isMobile } = useMobile();
  const headerRef = useRef<HTMLElement>(null);
  useSetCSSHeaderHeight(headerRef, '--unified-header-height');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBetaSignupOpen, setIsBetaSignupOpen] = useState(false);
  
  // Universal Composer hook for global create button
  const composer = useUniversalComposer();

  // Query admin status
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        return false;
      }

      return data || false;
    },
    enabled: !!user
  });

  // Unread notification count now handled by UnifiedNotificationBell internally

  // Query unread message count
  const { data: unreadMessageCount = 0 } = useUnreadMessageCount();
  
  // Use optional dashboard context (safe when DashboardProvider is absent)
  const dashboard = useOptionalDashboard();
  const setActiveView = dashboard?.setActiveView ?? (() => {});
  const activeView = dashboard?.activeView ?? 'dashboard';
  
  // Hide UnifiedHeader on mobile for routes that ship their own mobile header
  // Also hide when header visibility is set to hidden (e.g., during mobile chat)
  // IMPORTANT: This check must be AFTER all hooks to prevent "fewer hooks" error
  const path = location.pathname;
  // On mobile, hubs that ship their own DnaMobileHeader hide UnifiedHeader
  // entirely so the Shield/avatar/bell chrome never double-renders and the
  // header layout stays uniform across modules.
  const hasOwnMobileHeader =
    path.includes('/dna/connect') ||
    path === '/dna/contribute' ||
    path.startsWith('/dna/contribute?') ||
    path === '/dna/convey' ||
    path === '/dna/collaborate' ||
    path.includes('/dna/feed') ||
    path.includes('/dna/convene');
  const { isHeaderHidden } = useHeaderVisibility();

  if (isMobile && (hasOwnMobileHeader || isHeaderHidden)) {
    return null;
  }

  const isAuthenticated = !!user;
  
  // Show skeleton/minimal header during initial load to prevent flash
  if (loading) {
    return (
      <header
        className="bg-background border-b border-border fixed left-0 right-0 z-50 shadow-sm motion-safe:transition-[top] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: 'var(--roadmap-banner-height, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/" 
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src={dnaLogo}
                  alt="DNA Logo" 
                   className="h-[80px] md:h-[80px] w-auto"
                   width={86}
                   height={48}
                />
              </NavLink>
            </div>
            <div className="flex items-center space-x-4">
              {/* Show hamburger menu during loading for mobile */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="p-1 md:hidden h-auto w-auto"
                    aria-label="Open menu"
                  >
                    <Menu className="w-10 h-10" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left" 
                  className="w-[85vw] max-w-sm p-0 [&>*]:!hidden [&>div]:!block"
                  onPointerDownOutside={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex flex-col h-full max-h-screen">
                    <div className="p-4 sm:p-6 border-b flex-shrink-0">
                      <div className="flex items-center justify-end">
                        <img 
                          src={dnaLogo}
                          alt="Logo" 
                  className="h-[80px] w-auto"
                  width={57}
                  height={32}
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 overflow-y-auto">
                      <nav className="flex flex-col space-y-1 p-4 sm:p-6 pb-20">
                        <div className="text-neutral-500 text-sm">Loading...</div>
                      </nav>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    );
  }
  const currentPath = location.pathname;

  // NOTE: 5C Framework Navigation removed from header - PulseBar is now the primary navigation
  // This consolidation reduces confusion from duplicate navigation elements

  // Utility navigation - SECONDARY
  const utilityNavigation = [
    { title: 'Feed', icon: Home, path: '/dna/feed', badge: 0 },
    // BD063 hide-and-freeze: DM/group messaging is OUT at v0.0 (see MESSAGING_ENABLED).
    ...(MESSAGING_ENABLED
      ? [{ title: 'Messages', icon: MessageCircle, path: '/dna/messages', badge: unreadMessageCount }]
      : []),
  ];

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleBetaSignup = () => {
    setIsMobileMenuOpen(false);
    setIsBetaSignupOpen(true);
  };

  const handleSignInClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/auth');
  };

  const handleNavClick = (item: { name: string; path: string }) => {
    navigate(item.path);
    setIsMobileMenuOpen(false);
  };

  // Phase icons mapping
  const phaseIcons = {
    1: MateMasie,
    2: Lightbulb,
    3: Target,
    4: TestTube,
    5: Users2,
    6: MateMasie,
  };

  const handleAuthNavigation = (view: string) => {
    // Navigate to main feature pages instead of app routes
    const viewRouteMap: { [key: string]: string } = {
      'dashboard': '/',
      'network': '/connect',
      'connections': '/network',
      'messages': '/messages',
      'messaging': '/collaborate', 
      'opportunities': '/opportunities'
    };
    navigate(viewRouteMap[view] || '/');
  };

  // Filter out current page from nav items for mobile menu
  const filteredNavItems = publicNavItems.filter(item => item.path !== currentPath);

  return (
    <>
      <header 
        ref={headerRef}
        data-unified-header
        className="bg-background border-b border-border fixed left-0 right-0 z-50 shadow-sm motion-safe:transition-[top] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ top: 'var(--roadmap-banner-height, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Logo and Search */}
            <div className="flex items-center space-x-4 -ml-8">
              <NavLink 
                to="/" 
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src={dnaLogo}
                  alt="DNA Logo" 
                   className="h-[80px] md:h-[80px] w-auto"
                   width={86}
                   height={48}
                />
              </NavLink>
              
            </div>

            {/* Right section - Navigation and Profile */}
            <div className="flex items-center space-x-4">
              {/* 5C Navigation removed - PulseBar is now the primary Five C's navigation */}

              {/* Desktop Utility Navigation - SECONDARY */}
              {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-1">
                  {utilityNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const hasBadge = item.badge && item.badge > 0;
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(item.path)}
                            className={cn(
                              "relative",
                              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            {hasBadge && (
                              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              
              {/* Global Create Button - Opens Universal Composer */}
              {isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => composer.open('post')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 hidden md:flex"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Create</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create post, story, event, space, or opportunity</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Admin Link - Only for admin users */}
              {isAuthenticated && isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/app/admin')}
                      className={cn(
                        "flex items-center gap-2",
                        location.pathname.startsWith('/app/admin') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-medium hidden lg:inline">Admin</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              )}
                  
              {/* Feedback Hub Access — Sprint 12A */}
              {isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/dna/feedback')}
                      className={cn(
                        "hidden md:flex",
                        location.pathname === '/dna/feedback' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <MessageSquarePlus className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Feedback Hub</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Notifications Center — Sprint 4C unified (platform + DIA) */}
              {isAuthenticated && user && <UnifiedNotificationBell />}
              
              {/* User Profile Dropdown */}
              {isAuthenticated && profile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openAccountDrawer}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Desktop Navigation - Public */}
              {!isAuthenticated && (
                <>
                  <nav className="hidden md:flex items-center space-x-6">
                    {/* About Us Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-neutral-700 hover:text-dna-forest transition-colors font-medium">
                          About Us
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {aboutUsDropdown.map((item) => (
                          <DropdownMenuItem
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className="cursor-pointer"
                          >
                            {item.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {publicNavItems.filter(item => item.path !== currentPath).map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        className={cn(
                          "transition-colors font-medium inline-flex items-center gap-2",
                          item.featured
                            ? "text-dna-emerald hover:text-dna-emerald-dark font-heritage tracking-[0.04em]"
                            : "text-neutral-700 hover:text-dna-forest"
                        )}
                      >
                        {item.name}
                        {item.badge && (
                          <span className="rounded-full bg-dna-copper text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                    
                    
                  </nav>
                  
                  {!isAuthenticated && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleSignInClick}
                        className="hidden md:inline-flex border-dna-copper text-dna-copper hover:bg-dna-copper hover:text-white transition-all duration-200"
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => navigate('/auth?mode=signup')}
                        className="hidden md:inline-flex bg-dna-emerald text-white hover:bg-dna-forest transition-all duration-200"
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Mobile Menu - Show only when not authenticated */}
              {!isAuthenticated && (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="p-1 md:hidden h-auto w-auto"
                      aria-label="Open menu"
                    >
                      <Menu className="w-10 h-10" />
                    </Button>
                  </SheetTrigger>
                <SheetContent
                  side="left" 
                  className="w-[85vw] max-w-sm p-0 [&>*]:!hidden [&>div]:!block"
                  onPointerDownOutside={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex flex-col h-full max-h-screen">
                    <div className="p-4 sm:p-6 border-b flex-shrink-0">
                      <div className="flex items-center justify-end">
                        <img 
                          src={dnaLogo}
                          alt="Logo" 
                          className="h-[80px] w-auto"
                          width={57}
                          height={32}
                        />
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 overflow-y-auto">
                      <nav className="flex flex-col space-y-1 p-4 sm:p-6 pb-20">
                        {!isAuthenticated ? (
                          <>
                            {/* About Us Section with submenu */}
                            <div className="border-b pb-4 mb-4">
                              <p className="text-sm text-neutral-600 mb-2 font-medium px-4">About</p>
                              {aboutUsDropdown.map((item) => (
                                <Button
                                  key={item.name}
                                  variant="ghost"
                                  className="justify-start text-left w-full hover:bg-dna-mint/20 hover:text-dna-forest transition-all duration-200 focus:ring-0 focus:ring-offset-0"
                                  onClick={() => handleNavClick(item)}
                                >
                                  {item.name}
                                </Button>
                              ))}
                            </div>

                            {/* Featured items (e.g. ROADMAP) */}
                            {filteredNavItems.some((i) => i.featured) && (
                              <div className="border-b pb-4 mb-4">
                                <p className="text-sm text-neutral-600 mb-2 font-medium px-4">Featured</p>
                                {filteredNavItems.filter((i) => i.featured).map((item) => (
                                  <Button
                                    key={item.name}
                                    variant="ghost"
                                    className="justify-start text-left w-full hover:bg-dna-emerald-subtle hover:text-dna-emerald-dark transition-all duration-200 focus:ring-0 focus:ring-offset-0 font-heritage tracking-[0.04em]"
                                    onClick={() => handleNavClick(item)}
                                  >
                                    <span className="text-dna-emerald">{item.name}</span>
                                    {item.badge && (
                                      <span className="ml-2 rounded-full bg-dna-copper text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* The 5 C's Section */}
                            <div className="border-b pb-4 mb-4">
                              <p className="text-sm text-neutral-600 mb-2 font-medium px-4">The 5 C's</p>
                              {filteredNavItems.filter((i) => !i.featured).map((item) => (
                                <Button
                                  key={item.name}
                                  variant="ghost"
                                  className="justify-start text-left w-full hover:bg-dna-mint/20 hover:text-dna-forest transition-all duration-200 focus:ring-0 focus:ring-offset-0"
                                  onClick={() => handleNavClick(item)}
                                >
                                  {item.name}
                                </Button>
                              ))}
                            </div>
                            
                            
                            
                            <Button
                              variant="outline"
                              className="justify-start text-left transition-all duration-200 focus:ring-0 focus:ring-offset-0"
                              onClick={handleSignInClick}
                            >
                              Sign In
                            </Button>
                            <Button
                              variant="default"
                              className="justify-start text-left bg-dna-emerald hover:bg-dna-forest text-white transition-all duration-200 focus:ring-0 focus:ring-offset-0"
                              onClick={() => navigate('/auth?mode=signup')}
                            >
                              Sign Up
                            </Button>
                          </>
                        ) : null}
                        
                      </nav>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Beta Signup Dialog */}
      <BetaSignupDialog 
        isOpen={isBetaSignupOpen} 
        onClose={() => setIsBetaSignupOpen(false)} 
      />

      {/* Universal Composer - Global Create */}
      <UniversalComposer
        isOpen={composer.isOpen}
        mode={composer.mode}
        context={composer.context}
        isSubmitting={composer.isSubmitting}
        onClose={composer.close}
        onModeChange={composer.switchMode}
        successData={composer.successData}
        onSubmit={composer.submit}
        onDismissSuccess={composer.dismissSuccess}
      />
    </>
  );
};

export default UnifiedHeader;