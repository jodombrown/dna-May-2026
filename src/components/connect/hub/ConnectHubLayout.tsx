import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { MESSAGING_ENABLED } from '@/config/featureFlags';

interface ConnectHubLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  expandedChat?: boolean;
  onChatExpand?: (expanded: boolean) => void;
  className?: string;
}

/**
 * ConnectHubLayout - Three-column layout for reimagined CONNECT hub
 *
 * PRD Requirements:
 * - Left (25%): Your Network (filters, stats)
 * - Center (50%): Discovery Feed + DIA Cards
 * - Right (25%): Conversations + Actions
 *
 * When chat is expanded:
 * - Left stays at 25%
 * - Center shrinks to 35%
 * - Right expands to 40%
 *
 * Responsive:
 * - Tablet (768-1024px): Two columns, messages as slide-over
 * - Mobile (<768px): Single column with bottom nav
 */
export function ConnectHubLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  expandedChat = false,
  onChatExpand,
  className,
}: ConnectHubLayoutProps) {
  const { isMobile, isTablet } = useMobile();
  const [mobileView, setMobileView] = useState<'network' | 'discover' | 'messages'>('discover');

  // Handle chat expansion toggle
  const handleChatToggle = useCallback(() => {
    onChatExpand?.(!expandedChat);
  }, [expandedChat, onChatExpand]);

  // Mobile: Single column view with bottom navigation
  if (isMobile) {
    return (
      <div className={cn('flex flex-col min-h-screen', className)}>
        {/* Mobile content area */}
        <div className="flex-1 overflow-y-auto">
          {mobileView === 'network' && leftPanel}
          {mobileView === 'discover' && centerPanel}
          {mobileView === 'messages' && rightPanel}
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav
          activeView={mobileView}
          onViewChange={setMobileView}
        />
      </div>
    );
  }

  // Tablet: Two columns with slide-over messages
  if (isTablet) {
    return (
      <div className={cn('flex min-h-screen', className)}>
        {/* Left column - 30% */}
        <div className="w-[30%] border-r border-border/40 overflow-y-auto">
          {leftPanel}
        </div>

        {/* Center column - 70% with messages overlay */}
        <div className="flex-1 relative overflow-hidden">
          <div className="h-full overflow-y-auto">
            {centerPanel}
          </div>

          {/* Messages slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: expandedChat ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-y-0 right-0 w-[80%] bg-background border-l border-border shadow-xl z-20"
          >
            {rightPanel}
          </motion.div>

          {/* Overlay backdrop when messages open */}
          {expandedChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-10"
              onClick={handleChatToggle}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop: Full three-column layout with dynamic sizing
  // Each column scrolls independently within viewport height minus header+PulseBar
  const columnHeight = 'calc(100dvh - 7.5rem)';

  return (
    <div className={cn('flex', className)} style={{ height: columnHeight }}>
      {/* Left column - Network Panel (always 25%) */}
      <motion.div
        className="border-r border-border/40 overflow-y-auto bg-background/50 backdrop-blur-sm scrollbar-thin"
        initial={false}
        animate={{ width: '25%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ height: columnHeight }}
      >
        <div className="p-4">
          {leftPanel}
        </div>
      </motion.div>

      {/* Center column - Discovery Feed */}
      <motion.div
        className="overflow-y-auto scrollbar-thin"
        initial={false}
        animate={{ width: expandedChat ? '35%' : '50%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ height: columnHeight }}
      >
        {centerPanel}
      </motion.div>

      {/* Right column - Conversations Panel (hidden entirely when no content, e.g. BD063 messaging freeze) */}
      {rightPanel ? (
        <motion.div
          className="border-l border-border/40 overflow-y-auto bg-background/50 backdrop-blur-sm scrollbar-thin"
          initial={false}
          animate={{ width: expandedChat ? '40%' : '25%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ height: columnHeight }}
        >
          {rightPanel}
        </motion.div>
      ) : null}
    </div>
  );
}

/**
 * Mobile Bottom Navigation for CONNECT hub
 */
interface MobileBottomNavProps {
  activeView: 'network' | 'discover' | 'messages';
  onViewChange: (view: 'network' | 'discover' | 'messages') => void;
}

function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  const navItems = [
    { id: 'network' as const, label: 'Network', icon: NetworkIcon },
    { id: 'discover' as const, label: 'Discover', icon: DiscoverIcon },
    // BD063 hide-and-freeze: hide the Messages tab while DM messaging is OUT at v0.0.
    ...(MESSAGING_ENABLED
      ? [{ id: 'messages' as const, label: 'Messages', icon: MessagesIcon }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-2 py-2 safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Simple icon components
function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <line x1="9.5" y1="10" x2="6.5" y2="7.5" />
      <line x1="14.5" y1="10" x2="17.5" y2="7.5" />
      <line x1="9.5" y1="14" x2="6.5" y2="16.5" />
      <line x1="14.5" y1="14" x2="17.5" y2="16.5" />
    </svg>
  );
}

function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="8" r="2" />
    </svg>
  );
}

function MessagesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default ConnectHubLayout;
