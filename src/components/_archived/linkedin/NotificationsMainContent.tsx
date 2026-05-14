import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Users, 
  MessageSquare, 
  Heart, 
  Share, 
  UserPlus, 
  Calendar,
  Briefcase,
  MoreVertical
} from 'lucide-react';

const NotificationsMainContent = () => {
  const [activeTab, setActiveTab] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'connection',
      user: 'Amara Okafor',
      action: 'accepted your connection request',
      time: '2 minutes ago',
      icon: UserPlus,
      unread: true
    },
    {
      id: 2,
      type: 'like',
      user: 'Kwame Asante',
      action: 'liked your post about fintech in Africa',
      time: '1 hour ago',
      icon: Heart,
      unread: true
    },
    {
      id: 3,
      type: 'comment',
      user: 'Dr. Fatima Al-Rashid',
      action: 'commented on your article',
      comment: 'Great insights on healthcare innovation!',
      time: '3 hours ago',
      icon: MessageSquare,
      unread: false
    },
    {
      id: 4,
      type: 'share',
      user: 'Marcus Johnson',
      action: 'shared your post',
      time: '5 hours ago',
      icon: Share,
      unread: false
    },
    {
      id: 5,
      type: 'event',
      user: 'African Tech Summit',
      action: 'invited you to attend',
      time: '1 day ago',
      icon: Calendar,
      unread: false
    },
    {
      id: 6,
      type: 'job',
      user: 'TechStars Africa',
      action: 'posted a job that matches your profile',
      time: '2 days ago',
      icon: Briefcase,
      unread: false
    }
  ];

  const filterNotifications = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(notification => notification.type === type);
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'connections':
        return notifications.filter(n => n.type === 'connection');
      case 'mentions':
        return notifications.filter(n => ['like', 'comment', 'share'].includes(n.type));
      case 'jobs':
        return notifications.filter(n => n.type === 'job');
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dna-forest">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-neutral-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NotificationsList notifications={getFilteredNotifications()} />
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <NotificationsList notifications={getFilteredNotifications()} />
        </TabsContent>

        <TabsContent value="mentions" className="mt-6">
          <NotificationsList notifications={getFilteredNotifications()} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <NotificationsList notifications={getFilteredNotifications()} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const NotificationsList = ({ notifications }: { notifications: any[] }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-neutral-500">No notifications in this category</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-neutral-50 transition-colors ${
                    notification.unread ? 'bg-blue-50 border-l-4 border-dna-copper' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-dna-emerald text-white">
                        {notification.user.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">
                          <span className="font-medium text-dna-forest">{notification.user}</span>
                          <span className="text-neutral-600 ml-1">{notification.action}</span>
                        </p>
                        <div className="flex items-center space-x-2">
                          <notification.icon className="w-4 h-4 text-dna-copper" />
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.comment && (
                        <p className="text-sm text-neutral-600 mt-1 italic">
                          "{notification.comment}"
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-neutral-500">{notification.time}</p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-dna-copper rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationsMainContent;