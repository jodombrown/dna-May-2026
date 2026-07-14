import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Send,
  QrCode,
  BarChart3,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementLayout';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { eventStartMs } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface OverviewStats {
  totalRegistered: number;
  checkedIn: number;
  registrationsToday: number;
  registrationsThisWeek: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'check-in';
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  } | null;
  timestamp: string;
}

const OverviewDashboard: React.FC = () => {
  const { event } = useEventManagement();
  const navigate = useNavigate();

  // Fetch overview stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['event-overview-stats', event.id],
    queryFn: async (): Promise<OverviewStats> => {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

      // Fetch all attendees
      const { data: attendees, error } = await supabase
        .from('event_attendees')
        .select('status, checked_in, created_at')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending', 'waitlist']);

      if (error) throw error;

      const totalRegistered = attendees?.length || 0;
      const checkedIn = attendees?.filter(a => a.checked_in).length || 0;
      const registrationsToday = attendees?.filter(a =>
        new Date(a.created_at) >= new Date(todayStart)
      ).length || 0;
      const registrationsThisWeek = attendees?.filter(a =>
        new Date(a.created_at) >= new Date(weekStart)
      ).length || 0;

      return {
        totalRegistered,
        checkedIn,
        registrationsToday,
        registrationsThisWeek,
      };
    },
    enabled: !!event.id,
  });

  // Fetch recent activity
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['event-recent-activity', event.id],
    queryFn: async (): Promise<RecentActivity[]> => {
      // Fetch recent registrations
      const { data: registrations } = await supabase
        .from('event_attendees')
        .select('id, user_id, created_at, checked_in, checked_in_at')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!registrations || registrations.length === 0) return [];

      // Fetch profiles
      const userIds = registrations.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Create activity items
      const activities: RecentActivity[] = [];

      registrations.forEach(r => {
        activities.push({
          id: `reg-${r.id}`,
          type: 'registration',
          user: profileMap.get(r.user_id) || null,
          timestamp: r.created_at,
        });

        if (r.checked_in && r.checked_in_at) {
          activities.push({
            id: `checkin-${r.id}`,
            type: 'check-in',
            user: profileMap.get(r.user_id) || null,
            timestamp: r.checked_in_at,
          });
        }
      });

      // Sort by timestamp and limit to 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!event.id,
  });

  // Fetch registration trend data
  const { data: trendData = [] } = useQuery({
    queryKey: ['event-registration-trend', event.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: registrations } = await supabase
        .from('event_attendees')
        .select('created_at')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending'])
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (!registrations) return [];

      // Group by date
      const grouped: Record<string, number> = {};
      registrations.forEach(r => {
        const date = format(new Date(r.created_at), 'MMM d');
        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Fill in missing dates
      const result = [];
      const current = new Date(thirtyDaysAgo);
      const today = new Date();

      while (current <= today) {
        const dateStr = format(current, 'MMM d');
        result.push({
          date: dateStr,
          registrations: grouped[dateStr] || 0,
        });
        current.setDate(current.getDate() + 1);
      }

      return result;
    },
    enabled: !!event.id,
  });

  // Completed is derived from the clock; an undated event has no countdown.
  const startMs = eventStartMs(event);
  const daysUntilEvent = startMs !== null ? differenceInDays(new Date(startMs), new Date()) : null;
  const eventStatus = event.is_cancelled
    ? 'Cancelled'
    : isEventCompleted(event)
      ? 'Completed'
      : startMs === null
        ? 'Dates not yet announced'
        : startMs <= Date.now()
          ? 'Happening Now'
          : daysUntilEvent === 0
            ? 'Today'
            : daysUntilEvent === 1
              ? 'Tomorrow'
              : `${daysUntilEvent} days away`;

  const checkInPercentage = stats && stats.totalRegistered > 0
    ? Math.round((stats.checkedIn / stats.totalRegistered) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Event dashboard and key metrics</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalRegistered || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.checkedIn || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({checkInPercentage}%)
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.registrationsThisWeek || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Status</p>
                <p className="text-lg font-semibold">{eventStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('communications')}>
              <Send className="h-4 w-4 mr-2" />
              Send Blast
            </Button>
            <Button variant="outline" onClick={() => navigate('check-in')}>
              <QrCode className="h-4 w-4 mr-2" />
              Check-In Mode
            </Button>
            <Button variant="outline" onClick={() => navigate('analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('attendees')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Attendee
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Trend</CardTitle>
            <CardDescription>Daily registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRegistrations)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No registration data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest registrations and check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity yet
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {activity.user?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user?.full_name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={activity.type === 'check-in' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.type === 'check-in' ? 'Checked In' : 'Registered'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewDashboard;
