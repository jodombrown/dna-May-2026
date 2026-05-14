/**
 * DNA | NotificationSystemCard
 *
 * Polymorphic notification card with Five C's visual coding.
 * Features:
 * - Left accent border color-coded to C module
 * - Actor avatar with type icon overlay
 * - Inline actions (Accept/Decline for connections, RSVP for events)
 * - Time-ago timestamps
 * - Unread/read visual states
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserPlus, UserCheck, Heart, MessageCircle, Repeat2, AtSign, Eye, Calendar, CalendarClock, Radio, MapPin, Users, ClipboardList, CheckSquare, AlertTriangle, Briefcase, Target, Clock, BookOpen, TrendingUp, UserRoundPlus, BarChart3, Shield, CreditCard, Bell as BellIcon, Mail, MessageSquare, X } from 'lucide-react';
import type { NotificationRecord, NotificationIconType } from '@/types/notificationSystem';
import { MateMasie } from '@/components/icons/adinkra';

// ============================================================
// ICON MAPPING
// ============================================================

const ICON_MAP: Record<NotificationIconType, React.ReactNode> = {
  connect_request: <UserPlus className="h-4 w-4" />,
  connect_accepted: <UserCheck className="h-4 w-4" />,
  like: <Heart className="h-4 w-4" />,
  comment: <MessageCircle className="h-4 w-4" />,
  reshare: <Repeat2 className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  milestone: <TrendingUp className="h-4 w-4" />,
  event_invite: <Calendar className="h-4 w-4" />,
  event_reminder: <CalendarClock className="h-4 w-4" />,
  event_update: <MapPin className="h-4 w-4" />,
  event_live: <Radio className="h-4 w-4" />,
  space_invite: <Users className="h-4 w-4" />,
  task_assign: <ClipboardList className="h-4 w-4" />,
  task_complete: <CheckSquare className="h-4 w-4" />,
  stall_alert: <AlertTriangle className="h-4 w-4" />,
  opportunity_match: <Target className="h-4 w-4" />,
  opportunity_interest: <Briefcase className="h-4 w-4" />,
  opportunity_deadline: <Clock className="h-4 w-4" />,
  story_engage: <BookOpen className="h-4 w-4" />,
  follower: <UserRoundPlus className="h-4 w-4" />,
  trending: <TrendingUp className="h-4 w-4" />,
  dia_insight: <MateMasie className="h-4 w-4" />,
  dia_digest: <BarChart3 className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  system: <BellIcon className="h-4 w-4" />,
  message: <Mail className="h-4 w-4" />,
};

// ============================================================
// ACCENT COLORS BY C MODULE
// ============================================================

const C_MODULE_ACCENT: Record<string, string> = {
  CONNECT: '#4A8D77',
  CONVENE: '#C4942A',
  COLLABORATE: '#2D5A3D',
  CONTRIBUTE: '#B87333',
  CONVEY: '#2A7A8C',
};

const C_MODULE_BG: Record<string, string> = {
  CONNECT: 'bg-[#4A8D77]',
  CONVENE: 'bg-[#C4942A]',
  COLLABORATE: 'bg-[#2D5A3D]',
  CONTRIBUTE: 'bg-[#B87333]',
  CONVEY: 'bg-[#2A7A8C]',
};

// ============================================================
// COMPONENT
// ============================================================

interface NotificationSystemCardProps {
  notification: NotificationRecord;
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
  onInlineAction?: (notificationId: string, action: 'accept' | 'dismiss') => void;
}

export function NotificationSystemCard({
  notification,
  onOpen,
  onDismiss,
  onInlineAction,
}: NotificationSystemCardProps) {
  const navigate = useNavigate();
  const isUnread = notification.status === 'delivered';
  const hasInlineActions = notification.secondaryAction !== null;

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const handleClick = () => {
    onOpen(notification.id);
    const route = notification.primaryAction?.route;
    if (route) {
      navigate(route);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInlineAction?.(notification.id, 'accept');
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInlineAction?.(notification.id, 'dismiss');
  };

  const icon = ICON_MAP[notification.iconType as NotificationIconType] || <BellIcon className="h-4 w-4" />;
  const accentColor = C_MODULE_ACCENT[notification.cModule] || '#4A8D77';
  const bgClass = C_MODULE_BG[notification.cModule] || 'bg-primary';

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors relative',
        'hover:bg-accent/50',
        isUnread && 'bg-[#F9F7F4] dark:bg-accent/20'
      )}
      style={{ borderLeft: `3px solid ${isUnread ? accentColor : 'transparent'}` }}
    >
      {/* Avatar / Icon */}
      <div className="relative flex-shrink-0">
        {notification.actorAvatarUrl && (notification as unknown as Record<string, unknown>).showAvatar !== false ? (
          <Avatar className="h-11 w-11">
            <AvatarImage src={notification.actorAvatarUrl} alt={notification.actorName || ''} />
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(notification.actorName || '')}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            'h-11 w-11 rounded-full flex items-center justify-center text-white',
            bgClass
          )}>
            {icon}
          </div>
        )}

        {/* Type icon overlay on avatar */}
        {notification.actorAvatarUrl && (
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white border-2 border-background',
              bgClass
            )}
          >
            {React.cloneElement(icon as React.ReactElement, { className: 'h-2.5 w-2.5' })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}>
          {notification.headline}
        </p>

        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Cross-C context */}
        {notification.crossCContext && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {notification.crossCContext.contextLine}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>

        {/* Inline actions */}
        {hasInlineActions && isUnread && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="h-8 text-xs px-3"
              style={{ backgroundColor: accentColor }}
              onClick={handleAccept}
            >
              {notification.primaryAction?.label || 'Accept'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-3"
              onClick={handleDecline}
            >
              {notification.secondaryAction?.label || 'Decline'}
            </Button>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div
          className="h-2 w-2 rounded-full flex-shrink-0 mt-2"
          style={{ backgroundColor: accentColor }}
        />
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
