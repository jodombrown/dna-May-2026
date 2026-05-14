import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { X, Check, Trash2, MoreVertical, CheckCheck, Circle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  Heart,
  MessageCircle,
  Mail,
  Calendar,
  Users,
  Bell,
  SmilePlus,
  AtSign,
  Repeat2,
  Eye,
} from 'lucide-react';

interface NotificationsDropdownProps {
  onClose: () => void;
}

export function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    markAllAsUnread,
    dismissNotification,
    deleteAllNotifications,
    deleteReadNotifications,
    unreadCount
  } = useNotifications();

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications-dropdown')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const getIcon = (type: string) => {
    switch (type) {
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

  const getIconBgColor = (type: string) => {
    switch (type) {
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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.notification_id);
    
    // Route based on notification type
    let targetRoute = '/dna/feed';
    
    switch (notification.type) {
      case 'connection_request':
        targetRoute = '/dna/connect/network?tab=requests';
        break;
      case 'connection_accepted':
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
        if (notification.entity_type === 'post' && notification.entity_id) {
          targetRoute = `/dna/feed?post=${notification.entity_id}`;
        } else {
          targetRoute = '/dna/feed';
        }
        break;
      case 'new_message':
        targetRoute = '/dna/messages';
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
        if (notification.action_url?.startsWith('/dna')) {
          targetRoute = notification.action_url;
        }
    }
    
    navigate(targetRoute);
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const hasUnread = notifications?.some(n => !n.is_read);
  const hasRead = notifications?.some(n => n.is_read);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-background rounded-lg shadow-lg border border-border z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* More options menu (mark read/unread) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="More options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasUnread && (
                <DropdownMenuItem onClick={() => markAllAsRead()}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              {hasRead && (
                <DropdownMenuItem onClick={() => markAllAsUnread()}>
                  <Circle className="h-4 w-4 mr-2" />
                  Mark all as unread
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete menu (trash icon) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete notifications">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasRead && (
                <DropdownMenuItem onClick={() => deleteReadNotifications()}>
                  Delete read notifications
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => deleteAllNotifications()}
                className="text-destructive"
              >
                Delete all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : notifications?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications?.map(notification => (
            <div
              key={notification.notification_id}
              className={cn(
                'group p-4 border-b border-border hover:bg-accent cursor-pointer relative',
                !notification.is_read && 'bg-primary/5'
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with type badge */}
                <div className="relative flex-shrink-0">
                  {notification.actor_avatar_url ? (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.actor_avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(notification.actor_full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-white",
                      getIconBgColor(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>
                  )}
                  
                  {/* Type badge on avatar */}
                  {notification.actor_avatar_url && (
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white border-2 border-background",
                      getIconBgColor(notification.type)
                    )}>
                      {React.cloneElement(getIcon(notification.type), { className: 'h-2.5 w-2.5' })}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm text-foreground leading-snug",
                    !notification.is_read && "font-medium"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true
                    })}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}

                {/* Mark as read button */}
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.notification_id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 text-primary hover:text-primary/80 flex-shrink-0 transition-opacity"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.notification_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-muted-foreground hover:text-foreground flex-shrink-0 transition-opacity"
                  title="Delete notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View all link */}
      {notifications && notifications.length > 0 && (
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-sm text-primary"
            onClick={() => {
              navigate('/dna/notifications');
              onClose();
            }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
