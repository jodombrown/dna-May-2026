import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import dnaLogo from '@/assets/dna-logo.webp';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
  onComposerClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'feed';
}

/**
 * Mobile Header Component
 * Adaptive header for mobile views with context-aware navigation
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  showSearch = false,
  onSearchClick,
  onComposerClick,
  actions,
  className,
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  

  // Auto-detect if we should show back button based on route depth
  const shouldShowBack = showBack || (
    location.pathname.split('/').filter(Boolean).length > 2 &&
    !location.pathname.endsWith('/feed')
  );

  // Feed variant: shared DnaMobileHeader for pixel-perfect parity across hubs
  if (variant === 'feed' && user && profile) {
    return (
      <header className={cn('sticky top-0 z-40 bg-background border-b border-border', className)}>
        <DnaMobileHeader
          bubble={{
            kind: 'composer',
            placeholder: "What's on your mind?",
            onClick: onComposerClick ?? (() => {}),
          }}
        />
      </header>
    );
  }


  // Default variant: existing header layout
  return (
    <header 
      className={cn(
        "sticky top-0 z-40 bg-background border-b border-border",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back or Logo */}
          <div className="flex items-center gap-2 -ml-8">
            {shouldShowBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="px-2 ml-8"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <img
                src={dnaLogo}
                alt="DNA"
                className="h-[80px] w-auto cursor-pointer"
                width={142}
                height={80}
                onClick={() => navigate('/dna/feed')}
              />
            )}
          </div>

        {/* Center: Title */}
        {title && (
          <h1 className="absolute left-1/2 transform -translate-x-1/2 font-semibold text-lg truncate max-w-[50%]">
            {title}
          </h1>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className="px-2"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          {actions}
          </div>
        </div>
      </div>
    </header>
  );
};
