import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Notification } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { UserPlus, Heart, MessageCircle, Mail, Calendar, Users, Bell, SmilePlus, AtSign, Repeat2, X, Eye } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  showDismiss?: boolean;
  onDismiss?: (id: string) => void;
}

export function NotificationItem({ 
  notification, 
  onClose, 
  showDismiss = false,
  onDismiss 
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if this is a DNA system notification
  const isDNANotification = notification.type === 'feedback_status_change' || 
    (notification.payload && typeof notification.payload === 'object' && 'is_dna_system' in notification.payload);

  const getIcon = () => {
    // DNA system notifications get a special icon
    if (isDNANotification) {
      return <MateMasie className="h-4 w-4" />;
    }
    
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus className="h-4 w-4" />;
      case 'post_like':
        return <Heart className="h-4 w-4" />;
      case 'reaction':
        return <SmilePlus className="h-4 w-4" />;
      case 'mention':
        return <AtSign className="h-4 w-4" />;
      case 'reshare':
        return <Repeat2 className="h-4 w-4" />;
      case 'profile_view':
        return <Eye className="h-4 w-4" />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircle className="h-4 w-4" />;
      case 'new_message':
        return <Mail className="h-4 w-4" />;
      case 'event_invite':
      case 'event_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'group_invite':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconBgColor = () => {
    // DNA system notifications get the brand forest green
    if (isDNANotification) {
      return 'bg-[#1a472a]';
    }
    
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        return 'bg-emerald-500';
      case 'post_like':
      case 'reaction':
        return 'bg-rose-500';
      case 'mention':
        return 'bg-blue-500';
      case 'reshare':
        return 'bg-copper-500';
      case 'profile_view':
        return 'bg-amber-500';
      case 'post_comment':
      case 'comment_reply':
        return 'bg-sky-500';
      case 'new_message':
        return 'bg-copper-500';
      case 'event_invite':
      case 'event_reminder':
        return 'bg-orange-500';
      case 'group_invite':
        return 'bg-teal-500';
      default:
        return 'bg-primary';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
    
    // Determine navigation based on notification type
    let targetRoute = '/dna/feed';
    
    switch (notification.type) {
      case 'connection_request':
        targetRoute = '/dna/connect/network?tab=requests';
        break;
      case 'connection_accepted':
        // Go to the actor's profile if available
        if (notification.actor_username) {
          targetRoute = `/u/${notification.actor_username}`;
        } else {
          targetRoute = '/dna/connect/network';
        }
        break;
      case 'post_like':
      case 'post_comment':
      case 'comment_reply':
      case 'reaction':
      case 'mention':
      case 'reshare':
        // Prefer action_url (link_url from DB) which contains post deep-link
        if (notification.action_url && notification.action_url.includes('post=')) {
          targetRoute = notification.action_url;
        } else if (notification.entity_type === 'post' && notification.entity_id) {
          targetRoute = `/dna/feed?post=${notification.entity_id}`;
        } else if (notification.action_url && notification.action_url.startsWith('/dna')) {
          targetRoute = notification.action_url;
        } else {
          targetRoute = '/dna/feed';
        }
        break;
      case 'new_message':
        // Go to messages, ideally to the specific conversation
        if (notification.entity_id) {
          targetRoute = `/dna/messages/${notification.entity_id}`;
        } else {
          targetRoute = '/dna/messages';
        }
        break;
      case 'event_invite':
      case 'event_reminder':
        if (notification.entity_id) {
          targetRoute = `/dna/convene/events/${notification.entity_id}`;
        } else {
          targetRoute = '/dna/convene';
        }
        break;
      case 'group_invite':
        if (notification.entity_id) {
          targetRoute = `/dna/collaborate/spaces/${notification.entity_id}`;
        } else {
          targetRoute = '/dna/collaborate';
        }
        break;
      case 'profile_view':
        if (notification.actor_username) {
          targetRoute = `/u/${notification.actor_username}`;
        } else {
          targetRoute = '/dna/connect';
        }
        break;
      default:
        // Try action_url if available and valid
        if (notification.action_url && notification.action_url.startsWith('/dna')) {
          targetRoute = notification.action_url;
        } else if (notification.actor_username) {
          targetRoute = `/u/${notification.actor_username}`;
        }
    }
    
    navigate(targetRoute);
    onClose();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(notification.notification_id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors relative',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Avatar with icon badge */}
      <div className="relative flex-shrink-0">
        {notification.actor_avatar_url ? (
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={notification.actor_avatar_url}
              alt={notification.actor_full_name || 'User'}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {notification.actor_full_name
                ? getInitials(notification.actor_full_name)
                : '?'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white",
            getIconBgColor()
          )}>
            {getIcon()}
          </div>
        )}
        
        {/* Type indicator badge */}
        {notification.actor_avatar_url && (
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white border-2 border-background",
            getIconBgColor()
          )}>
            {React.cloneElement(getIcon(), { className: 'h-2.5 w-2.5' })}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notification.is_read && 'font-medium')}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}

      {/* Dismiss button - only show on hover when enabled */}
      {showDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Need to import React for cloneElement
import React from 'react';
