import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Lightbulb, FileText, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { useEntityReferenceData } from '@/hooks/useEntityReferenceData';
import type { EntityReferenceData } from '@/services/messageTypes';
import { format } from 'date-fns';

interface EntityReferenceCardProps {
  entityReference: EntityReferenceData;
  isOwn: boolean;
}

const entityConfig = {
  event: {
    icon: Calendar,
    label: 'EVENT',
    accentClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  space: {
    icon: Users,
    label: 'SPACE',
    accentClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
  },
  opportunity: {
    icon: Lightbulb,
    label: 'OPPORTUNITY',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  post: {
    icon: FileText,
    label: 'POST',
    accentClass: 'text-copper-600 dark:text-copper-400',
    borderClass: 'border-copper-200 dark:border-copper-800',
    bgClass: 'bg-copper-50/50 dark:bg-copper-950/20',
  },
  story: {
    icon: BookOpen,
    label: 'STORY',
    accentClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-200 dark:border-rose-800',
    bgClass: 'bg-rose-50/50 dark:bg-rose-950/20',
  },
};

export const EntityReferenceCard: React.FC<EntityReferenceCardProps> = ({
  entityReference,
  isOwn,
}) => {
  const navigate = useNavigate();
  const { data: liveData, isLoading, isError } = useEntityReferenceData(
    entityReference.entityType,
    entityReference.entityId
  );

  const config = entityConfig[entityReference.entityType];
  const Icon = config.icon;

  const handleNavigate = () => {
    switch (entityReference.entityType) {
      case 'event':
        navigate(ROUTES.convene.eventDetail(liveData?.slug || entityReference.entityId));
        break;
      case 'space':
        navigate(ROUTES.collaborate.spaceDetail(liveData?.slug || entityReference.entityId));
        break;
      case 'opportunity':
        navigate(ROUTES.contribute.needDetail(entityReference.entityId));
        break;
      case 'post':
        navigate(ROUTES.publicPost(entityReference.entityId));
        break;
      case 'story':
        navigate(ROUTES.convey.storyDetail(liveData?.slug || entityReference.entityId));
        break;
    }
  };

  if (isError || (liveData && liveData.deleted)) {
    return (
      <div className={cn(
        "rounded-lg border p-3 my-1",
        "bg-muted/30 border-border/50"
      )}>
        <p className="text-xs text-muted-foreground italic">
          This {entityReference.entityType} is no longer available
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-lg border p-3 my-1",
        config.borderClass, config.bgClass
      )}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading {entityReference.entityType}...</span>
        </div>
      </div>
    );
  }

  const title = liveData?.title || entityReference.entityTitle;

  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 my-1 cursor-pointer transition-colors hover:shadow-sm",
        config.borderClass, config.bgClass
      )}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(); }}
    >
      {/* Type label */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("h-3 w-3", config.accentClass)} />
        <span className={cn("text-[10px] font-bold tracking-wider", config.accentClass)}>
          {config.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-tight mb-1">
        {title}
      </p>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        {entityReference.entityType === 'event' && liveData && (
          <>
            {liveData.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {format(new Date(liveData.startDate), 'MMM d, yyyy')}
              </span>
            )}
            {liveData.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {liveData.location}
              </span>
            )}
            {typeof liveData.attendeeCount === 'number' && (
              <span className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                {liveData.attendeeCount} attending
              </span>
            )}
          </>
        )}

        {entityReference.entityType === 'space' && liveData && (
          <>
            {liveData.category && (
              <span>{liveData.category}</span>
            )}
            {typeof liveData.memberCount === 'number' && (
              <span className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" />
                {liveData.memberCount} members
              </span>
            )}
          </>
        )}

        {entityReference.entityType === 'opportunity' && liveData && (
          <>
            {liveData.opportunityType && (
              <span className="capitalize">{liveData.opportunityType}</span>
            )}
            {liveData.category && (
              <span>{liveData.category}</span>
            )}
          </>
        )}

        {entityReference.entityType === 'post' && liveData && (
          <>
            {liveData.authorName && (
              <span>by {liveData.authorName}</span>
            )}
            {typeof liveData.likeCount === 'number' && (
              <span>{liveData.likeCount} likes</span>
            )}
          </>
        )}

        {entityReference.entityType === 'story' && liveData && (
          <>
            {liveData.authorName && (
              <span>by {liveData.authorName}</span>
            )}
          </>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-1.5 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[11px] px-2.5"
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
        >
          View {entityReference.entityType === 'event' ? 'Event' :
                entityReference.entityType === 'space' ? 'Space' :
                entityReference.entityType === 'opportunity' ? 'Details' :
                entityReference.entityType === 'post' ? 'Post' : 'Story'}
        </Button>
        {entityReference.entityType === 'event' && (
          <Button
            size="sm"
            className="h-6 text-[11px] px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            RSVP
          </Button>
        )}
        {entityReference.entityType === 'space' && (
          <Button
            size="sm"
            className="h-6 text-[11px] px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            Join
          </Button>
        )}
        {entityReference.entityType === 'opportunity' && (
          <Button
            size="sm"
            className="h-6 text-[11px] px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            Express Interest
          </Button>
        )}
      </div>
    </div>
  );
};
