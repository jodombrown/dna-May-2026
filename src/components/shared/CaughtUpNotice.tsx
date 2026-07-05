/**
 * CaughtUpNotice - shared "You're all caught up" end-of-list marker used
 * across pagination surfaces (Discover, Feed, etc.).
 */
import React from 'react';

interface CaughtUpNoticeProps {
  title?: string;
  description?: string;
}

export function CaughtUpNotice({
  title = "You're all caught up",
  description = "You've seen everything matching your filters. Try adjusting them to discover more.",
}: CaughtUpNoticeProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        {description}
      </p>
    </div>
  );
}

export default CaughtUpNotice;
