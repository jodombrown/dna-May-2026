/**
 * DnaMobileHeader — single source of truth for the mobile top row across
 * every authenticated /dna/* route. Locks logo position, the action bubble
 * (composer/search/static), bell, and avatar so nothing shifts between
 * modules. Per-page differences are limited to the bubble + an optional
 * second row rendered by the page itself.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import dnaLogo from '@/assets/dna-logo.webp';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountDrawer } from '@/contexts/AccountDrawerContext';
import { cn } from '@/lib/utils';

export type DnaMobileHeaderBubble =
  | { kind: 'composer'; placeholder: string; onClick: () => void }
  | {
      kind: 'search';
      placeholder: string;
      value?: string;
      onChange?: (value: string) => void;
      onClick?: () => void;
      onFiltersClick?: () => void;
      activeFilterCount?: number;
    }
  | { kind: 'static'; placeholder: string; onClick?: () => void };

interface DnaMobileHeaderProps {
  bubble: DnaMobileHeaderBubble;
  isVisible?: boolean;
  className?: string;
}

export const DnaMobileHeader: React.FC<DnaMobileHeaderProps> = ({
  bubble,
  isVisible = true,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { open: openAccountDrawer } = useAccountDrawer();

  return (
    <div
      className={cn(
        'md:hidden bg-background transition-all duration-200',
        isVisible ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 overflow-hidden',
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-1.5">
          {/* Logo - matches landing page UnifiedHeader position exactly */}
          <div className="flex items-center -ml-8 -mr-4 flex-shrink-0">
            <img
              src={dnaLogo}
              alt="DNA"
              className="h-[80px] w-auto cursor-pointer"
              width={142}
              height={80}
              onClick={() => navigate('/dna/feed')}
            />
          </div>

        {/* Bubble - flexes to fill, centered, capped */}
        {bubble.kind === 'search' ? (
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              placeholder={bubble.placeholder}
              value={bubble.value ?? ''}
              onChange={(e) => bubble.onChange?.(e.target.value)}
              onFocus={bubble.onClick}
              className="w-full h-9 rounded-full bg-muted border-0 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {bubble.onFiltersClick && (
              <button
                type="button"
                onClick={bubble.onFiltersClick}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center hover:bg-background/60"
                aria-label="Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {bubble.activeFilterCount && bubble.activeFilterCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {bubble.activeFilterCount}
                  </span>
                ) : null}
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={bubble.onClick}
            role={bubble.onClick ? 'button' : undefined}
            tabIndex={bubble.onClick ? 0 : undefined}
            className={cn(
              'flex-1 min-w-0 h-9 flex items-center bg-muted rounded-full px-4 text-sm text-muted-foreground transition-colors',
              bubble.onClick && 'cursor-pointer hover:bg-muted/80',
            )}
          >
            <span className="truncate block">{bubble.placeholder}</span>
          </div>
        )}

        {/* Right cluster - locked */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <UnifiedNotificationBell />
          {user && profile && (
            <Avatar className="h-9 w-9 cursor-pointer" onClick={openAccountDrawer}>
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback>
                {profile.display_name?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
