/**
 * DNA | UnifiedNotificationCard — Sprint 4C
 *
 * Renders a single notification in the unified notification panel.
 * Handles both platform notifications and DIA nudge notifications
 * with visually distinct treatment.
 *
 * DIA notifications feature:
 * - MateMasie icon with module accent color
 * - "DIA * MODULE" label in accent color
 * - Left accent border (3px)
 * - Subtle background tint at 3% opacity
 * - Inline action buttons
 *
 * Platform notifications feature:
 * - Actor avatar with type icon overlay
 * - Standard notification styling
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserPlus, Heart, MessageCircle, Mail, Calendar, Users, Bell, SmilePlus, AtSign, Repeat2, Eye, X, UserCheck, AlertCircle, Target, Clock, TrendingUp, CheckCircle, Star, Share2, BookOpen, User, Award, MessageSquare, CalendarCheck, Lightbulb } from 'lucide-react';
import type { UnifiedNotification } from '@/services/unifiedNotificationService';
import type { DIACardCategory } from '@/services/diaCardService';
import { MateMasie } from '@/components/icons/adinkra';

// ============================================================
// ICON REGISTRIES
// ============================================================

const PLATFORM_ICON_MAP: Record<string, React.ReactNode> = {
  connection_request: <UserPlus className="h-4 w-4" />,
  connection_accepted: <UserCheck className="h-4 w-4" />,
  post_like: <Heart className="h-4 w-4" />,
  reaction: <SmilePlus className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  reshare: <Repeat2 className="h-4 w-4" />,
  profile_view: <Eye className="h-4 w-4" />,
  post_comment: <MessageCircle className="h-4 w-4" />,
  comment_reply: <MessageCircle className="h-4 w-4" />,
  new_message: <Mail className="h-4 w-4" />,
  event_invite: <Calendar className="h-4 w-4" />,
  event_reminder: <Calendar className="h-4 w-4" />,
  group_invite: <Users className="h-4 w-4" />,
  feedback_status_change: <MateMasie className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
};

const DIA_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  UserPlus,
  UserCheck,
  CalendarCheck,
  Clock,
  AlertCircle,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  Share2,
  BookOpen,
  User,
  Award,
  MessageSquare,
  Users,
  MateMasie,
  Lightbulb,
};

const PLATFORM_ICON_BG: Record<string, string> = {
  connection_request: 'bg-[#4A8D77]',
  connection_accepted: 'bg-[#4A8D77]',
  post_like: 'bg-rose-500',
  reaction: 'bg-rose-500',
  mention: 'bg-blue-500',
  reshare: 'bg-copper-500',
  profile_view: 'bg-amber-500',
  post_comment: 'bg-sky-500',
  comment_reply: 'bg-sky-500',
  new_message: 'bg-copper-500',
  event_invite: 'bg-[#C4942A]',
  event_reminder: 'bg-[#C4942A]',
  group_invite: 'bg-[#2D5A3D]',
  feedback_status_change: 'bg-[#1a472a]',
  system: 'bg-primary',
};

const CATEGORY_LABELS: Record<DIACardCategory, string> = {
  connect: 'CONNECT',
  convene: 'CONVENE',
  collaborate: 'COLLABORATE',
  contribute: 'CONTRIBUTE',
  convey: 'CONVEY',
  cross_c: 'CROSS-C',
};

// ============================================================
// COMPONENT
// ============================================================

interface UnifiedNotificationCardProps {
  notification: UnifiedNotification;
  onOpen: (notification: UnifiedNotification) => void;
  onDismiss: (notification: UnifiedNotification) => void;
  onAction: (notification: UnifiedNotification, route: string) => void;
}

export function UnifiedNotificationCard({
  notification,
  onOpen,
  onDismiss,
  onAction,
}: UnifiedNotificationCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const handleClick = () => {
    onOpen(notification);
    if (notification.primaryAction?.route) {
      navigate(notification.primaryAction.route);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification);
  };

  const handleActionClick = (e: React.MouseEvent, route: string) => {
    e.stopPropagation();
    onAction(notification, route);
    navigate(route);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  // DIA Notification rendering
  if (notification.type === 'dia') {
    return (
      <DiaNotificationCard
        notification={notification}
        timeAgo={timeAgo}
        onClick={handleClick}
        onDismiss={handleDismiss}
        onActionClick={handleActionClick}
      />
    );
  }

  // Platform Notification rendering
  const icon = PLATFORM_ICON_MAP[notification.sourceType] || <Bell className="h-4 w-4" />;
  const iconBg = PLATFORM_ICON_BG[notification.sourceType] || 'bg-primary';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors relative',
        'hover:bg-accent/50',
        !notification.isRead && 'bg-[#F9F7F4] dark:bg-accent/20'
      )}
    >
      {/* Avatar / Icon */}
      <div className="relative flex-shrink-0">
        {notification.actorAvatarUrl ? (
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={notification.actorAvatarUrl}
              alt={notification.actorName || 'User'}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {notification.actorName
                ? getInitials(notification.actorName)
                : '?'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center text-white',
              iconBg
            )}
          >
            {icon}
          </div>
        )}

        {/* Type icon overlay on avatar */}
        {notification.actorAvatarUrl && (
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white border-2 border-background',
              iconBg
            )}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: 'h-2.5 w-2.5',
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            !notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}
        >
          {notification.headline}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 hover:bg-muted rounded transition-opacity"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

// ============================================================
// DIA NOTIFICATION CARD (VISUALLY DISTINCT)
// ============================================================

interface DiaNotificationCardProps {
  notification: UnifiedNotification;
  timeAgo: string;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
  onActionClick: (e: React.MouseEvent, route: string) => void;
}

function DiaNotificationCard({
  notification,
  timeAgo,
  onClick,
  onDismiss,
  onActionClick,
}: DiaNotificationCardProps) {
  const accentColor = notification.accentColor || '#C4942A';
  const category = notification.diaCategory || 'cross_c';
  const categoryLabel = CATEGORY_LABELS[category];
  const IconComponent = DIA_ICON_MAP[notification.icon] || Lightbulb;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative px-4 py-3 cursor-pointer transition-colors',
        'hover:bg-accent/50',
        !notification.isRead && 'dark:bg-accent/20'
      )}
      style={{
        borderLeft: `3px solid ${accentColor}`,
        backgroundColor: !notification.isRead
          ? `${accentColor}08`
          : undefined,
      }}
    >
      {/* DIA Header: sparkle icon + module label */}
      <div className="flex items-center gap-2 mb-1.5 pr-6">
        <div
          className="flex items-center justify-center w-5 h-5 rounded-full"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <MateMasie className="w-2.5 h-2.5" style={{ color: accentColor }} />
        </div>
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: accentColor }}
        >
          DIA &bull; {categoryLabel}
        </span>
      </div>

      {/* Icon + Headline */}
      <div className="flex items-start gap-2 mb-1">
        <IconComponent
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: accentColor }}
        />
        <h4
          className={cn(
            'text-sm leading-tight',
            !notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
          )}
        >
          {notification.headline}
        </h4>
      </div>

      {/* Body */}
      {notification.body && (
        <p className="text-xs text-muted-foreground leading-relaxed ml-6 line-clamp-2">
          {notification.body}
        </p>
      )}

      {/* Inline Action Buttons */}
      <div className="flex items-center gap-2 mt-2 ml-6">
        {notification.primaryAction && (
          <Button
            size="sm"
            className="h-7 text-xs text-white"
            style={{ backgroundColor: accentColor }}
            onClick={(e) =>
              handleSafeActionClick(e, notification.primaryAction!.route, onActionClick)
            }
          >
            {notification.primaryAction.label}
          </Button>
        )}
        {notification.secondaryAction && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={(e) =>
              handleSafeActionClick(e, notification.secondaryAction!.route, onActionClick)
            }
          >
            {notification.secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground mt-1.5 ml-6">{timeAgo}</p>

      {/* Unread dot */}
      {!notification.isRead && (
        <div
          className="absolute top-3 right-8 h-2 w-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 hover:bg-muted rounded transition-opacity"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

function handleSafeActionClick(
  e: React.MouseEvent,
  route: string,
  onActionClick: (e: React.MouseEvent, route: string) => void
): void {
  onActionClick(e, route);
}
