import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, X, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  Heart,
  MessageCircle,
  Mail,
  Calendar,
  Users,
  SmilePlus,
  AtSign,
  Repeat2,
  Eye,
} from 'lucide-react';

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { 
    notifications = [], 
    isLoading, 
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    clearReadNotifications
  } = useNotifications();

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
        }
        break;
      case 'new_message':
        targetRoute = '/dna/messages';
        break;
      case 'event_invite':
      case 'event_reminder':
        targetRoute = notification.entity_id 
          ? `/dna/convene/events/${notification.entity_id}` 
          : '/dna/convene';
        break;
      case 'group_invite':
        targetRoute = notification.entity_id 
          ? `/dna/collaborate/spaces/${notification.entity_id}` 
          : '/dna/collaborate';
        break;
      case 'profile_view':
        targetRoute = notification.actor_username 
          ? `/u/${notification.actor_username}` 
          : '/dna/connect';
        break;
    }
    
    navigate(targetRoute);
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Clear options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => clearReadNotifications()}
                >
                  Clear read
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs text-destructive"
                  onClick={() => clearAllNotifications()}
                >
                  Clear all
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                navigate('/dna/settings/notifications');
                setIsOpen(false);
              }}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'group flex items-start gap-3 p-3 cursor-pointer hover:bg-accent relative',
                  !notification.is_read && 'bg-primary/5'
                )}
              >
                {/* Avatar with type badge */}
                <div className="relative flex-shrink-0">
                  {notification.actor_avatar_url ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={notification.actor_avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(notification.actor_full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-white",
                      getIconBgColor(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>
                  )}
                  
                  {notification.actor_avatar_url && (
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-white border-2 border-background",
                      getIconBgColor(notification.type)
                    )}>
                      {React.cloneElement(getIcon(notification.type), { className: 'h-2 w-2' })}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm line-clamp-2",
                    !notification.is_read && "font-medium"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}

                {/* Dismiss button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.notification_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 hover:bg-muted rounded transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>

        {/* View all footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-primary"
                onClick={() => {
                  navigate('/dna/notifications');
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import React from 'react';
