import React from 'react';
import { cn } from '@/lib/utils';
import { PresenceStatus } from '@/types/messaging';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * PresenceIndicator - Online/offline status indicator
 *
 * Displays user presence status with a colored dot:
 * - Green: Online
 * - Yellow: Away
 * - Gray: Offline
 *
 * Per PRD: Green dot for online users, presence updates < 5 seconds
 */
const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-neutral-400',
  };

  const statusLabels = {
    online: 'Active now',
    away: 'Away',
    offline: 'Offline',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative">
        <span
          className={cn(
            'block rounded-full',
            sizeClasses[size],
            statusColors[status]
          )}
        />
        {/* Pulse animation for online status */}
        {status === 'online' && (
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75',
              sizeClasses[size]
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-xs',
            status === 'online' ? 'text-green-600' : 'text-muted-foreground'
          )}
        >
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
};

export default PresenceIndicator;

/**
 * Avatar with presence indicator overlay
 */
export const AvatarPresence: React.FC<{
  status: PresenceStatus;
  position?: 'bottom-right' | 'top-right' | 'bottom-left';
  className?: string;
}> = ({ status, position = 'bottom-right', className }) => {
  const positionClasses = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div
      className={cn(
        'absolute',
        positionClasses[position],
        'border-2 border-background rounded-full',
        className
      )}
    >
      <PresenceIndicator status={status} size="sm" />
    </div>
  );
};

/**
 * Hook to format "last seen" time
 */
export const formatLastSeen = (lastSeenAt: string): string => {
  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return lastSeen.toLocaleDateString();
};

/**
 * Last seen status component
 */
export const LastSeenStatus: React.FC<{
  status: PresenceStatus;
  lastSeenAt?: string;
  className?: string;
}> = ({ status, lastSeenAt, className }) => {
  if (status === 'online') {
    return (
      <span className={cn('text-xs text-green-600', className)}>Active now</span>
    );
  }

  if (lastSeenAt) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        Last seen {formatLastSeen(lastSeenAt)}
      </span>
    );
  }

  return null;
};
