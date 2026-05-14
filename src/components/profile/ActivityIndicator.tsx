import React from 'react';
import { getActivityStatus } from '@/lib/username/validation';
import { cn } from '@/lib/utils';

interface ActivityIndicatorProps {
  lastSeen: Date | string | null;
  className?: string;
  showLabel?: boolean;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  lastSeen,
  className,
  showLabel = true,
}) => {
  const activityStatus = getActivityStatus(lastSeen);

  if (!activityStatus.label) return null;

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-neutral-400',
  };

  return (
    <div className={cn("flex items-center text-xs text-muted-foreground", className)}>
      <div className={cn("w-2 h-2 rounded-full mr-1.5", colorClasses[activityStatus.color])} />
      {showLabel && <span>{activityStatus.label}</span>}
    </div>
  );
};
