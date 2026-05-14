/**
 * ReleaseMeta Component
 * Displays metadata for a release (date, version, category, status)
 */

import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { CategoryTag } from './CategoryTag';
import { getLifecycleStage } from '@/types/releases';
import type { ReleaseMetaProps } from '@/types/releases';

export const ReleaseMeta: React.FC<ReleaseMetaProps> = ({
  release,
  showVersion = true,
  showCategory = true,
  showDate = true,
  className,
}) => {
  const lifecycleStage = getLifecycleStage(
    release.release_date,
    release.status,
    release.archived_at
  );

  const releaseDate = new Date(release.release_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Status Badge */}
      <StatusBadge stage={lifecycleStage} />

      {/* Category Tag */}
      {showCategory && <CategoryTag category={release.category} />}

      {/* Version */}
      {showVersion && release.version && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded">
          <Tag className="w-3.5 h-3.5" />
          v{release.version}
        </span>
      )}

      {/* Date */}
      {showDate && (
        <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
          <Calendar className="w-4 h-4" />
          {releaseDate}
        </span>
      )}
    </div>
  );
};

/**
 * ReleaseMetaCompact - Single line variant for tight spaces
 */
export const ReleaseMetaCompact: React.FC<
  Omit<ReleaseMetaProps, 'showVersion' | 'showCategory' | 'showDate'>
> = ({ release, className }) => {
  const lifecycleStage = getLifecycleStage(
    release.release_date,
    release.status,
    release.archived_at
  );

  const releaseDate = new Date(release.release_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <StatusBadge stage={lifecycleStage} size="sm" />
      <span className="text-neutral-400">•</span>
      <CategoryTag category={release.category} size="sm" showIcon={false} />
      {release.version && (
        <>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-500">v{release.version}</span>
        </>
      )}
      <span className="text-neutral-400">•</span>
      <span className="text-neutral-500">{releaseDate}</span>
    </div>
  );
};

export default ReleaseMeta;
