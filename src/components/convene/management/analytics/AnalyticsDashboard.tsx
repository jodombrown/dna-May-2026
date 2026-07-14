import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  Percent,
  TrendingUp,
  Share2,
  Ticket,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementLayout';
import { format, differenceInDays, eachDayOfInterval, parseISO } from 'date-fns';
import { eventEndMs, eventStartMs, DATES_TBA } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

interface AnalyticsData {
  totalRegistered: number;
  totalAttended: number;
  attendanceRate: number;
  registrationsByDay: { date: string; registrations: number; cumulative: number }[];
  registrationsBySource: { name: string; value: number }[];
  registrationsByStatus: { name: string; value: number }[];
  checkInsByHour: { hour: string; count: number }[];
}

const AnalyticsDashboard: React.FC = () => {
  const { event } = useEventManagement();

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['event-analytics', event.id],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all attendees
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('status, checked_in, checked_in_at, created_at, source')
        .eq('event_id', event.id);

      if (!attendees) {
        return {
          totalRegistered: 0,
          totalAttended: 0,
          attendanceRate: 0,
          registrationsByDay: [],
          registrationsBySource: [],
          registrationsByStatus: [],
          checkInsByHour: [],
        };
      }

      const totalRegistered = attendees.filter(a =>
        ['going', 'maybe', 'pending', 'waitlist'].includes(a.status)
      ).length;

      const totalAttended = attendees.filter(a => a.checked_in).length;

      const attendanceRate = totalRegistered > 0
        ? Math.round((totalAttended / totalRegistered) * 100)
        : 0;

      // Registrations by day
      const registrationDates: Record<string, number> = {};
      attendees
        .filter(a => ['going', 'maybe', 'pending', 'waitlist'].includes(a.status))
        .forEach(a => {
          const date = format(new Date(a.created_at), 'yyyy-MM-dd');
          registrationDates[date] = (registrationDates[date] || 0) + 1;
        });

      // Create cumulative data
      const sortedDates = Object.keys(registrationDates).sort();
      let cumulative = 0;
      const registrationsByDay = sortedDates.map(date => {
        cumulative += registrationDates[date];
        return {
          date: format(parseISO(date), 'MMM d'),
          registrations: registrationDates[date],
          cumulative,
        };
      });

      // Registrations by source
      const sourceCounts: Record<string, number> = { Direct: 0 };
      attendees
        .filter(a => ['going', 'maybe', 'pending', 'waitlist'].includes(a.status))
        .forEach(a => {
          const source = a.source || 'Direct';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

      const registrationsBySource = Object.entries(sourceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Registrations by status
      const statusCounts: Record<string, number> = {};
      attendees.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        going: 'Going',
        maybe: 'Maybe',
        pending: 'Pending',
        waitlist: 'Waitlist',
        not_going: 'Not Going',
        cancelled: 'Cancelled',
      };

      const registrationsByStatus = Object.entries(statusCounts)
        .map(([name, value]) => ({ name: statusLabels[name] || name, value }))
        .sort((a, b) => b.value - a.value);

      // Check-ins by hour
      const hourCounts: Record<number, number> = {};
      attendees
        .filter(a => a.checked_in && a.checked_in_at)
        .forEach(a => {
          const hour = new Date(a.checked_in_at!).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

      const checkInsByHour = Object.entries(hourCounts)
        .map(([hour, count]) => ({
          hour: format(new Date().setHours(parseInt(hour), 0, 0, 0), 'h a'),
          count,
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      return {
        totalRegistered,
        totalAttended,
        attendanceRate,
        registrationsByDay,
        registrationsBySource,
        registrationsByStatus,
        checkInsByHour,
      };
    },
    enabled: !!event.id,
  });

  // Calculate days until/since event — null-safe: an undated event has no
  // clock position, so it is neither upcoming, live, nor past.
  const now = new Date();
  const startMs = eventStartMs(event);
  const endMs = eventEndMs(event);
  const isUpcoming = startMs !== null && startMs > now.getTime();
  const isLive = startMs !== null && startMs <= now.getTime() && endMs !== null && endMs >= now.getTime();
  const isPast = isEventCompleted(event, now);
  const daysUntil = startMs !== null ? differenceInDays(new Date(startMs), now) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Event performance and insights</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Event performance and insights</p>
        </div>
        <Badge
          variant={isLive ? 'default' : isPast ? 'secondary' : 'outline'}
          className="self-start sm:self-auto"
        >
          {isLive
            ? 'Live Now'
            : isPast
              ? 'Event Completed'
              : startMs === null
                ? DATES_TBA
                : `${daysUntil} days until event`}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalRegistered || 0}</p>
                <p className="text-sm text-muted-foreground">Total Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalAttended || 0}</p>
                <p className="text-sm text-muted-foreground">Total Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.attendanceRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.registrationsByDay && analytics.registrationsByDay.length > 0
                    ? analytics.registrationsByDay[analytics.registrationsByDay.length - 1].registrations
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Latest Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrations Over Time</CardTitle>
            <CardDescription>Daily registrations and cumulative total</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.registrationsByDay && analytics.registrationsByDay.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.registrationsByDay}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="registrations"
                      name="Daily"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorReg)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative"
                      stroke="#82ca9d"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No registration data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Source</CardTitle>
            <CardDescription>How attendees found your event</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.registrationsBySource && analytics.registrationsBySource.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.registrationsBySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.registrationsBySource.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No source data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration by Status */}
        <Card>
          <CardHeader>
            <CardTitle>RSVP Breakdown</CardTitle>
            <CardDescription>Distribution of RSVP statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.registrationsByStatus && analytics.registrationsByStatus.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.registrationsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.registrationsByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No RSVP data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Flow by Hour */}
        {isPast && analytics?.checkInsByHour && analytics.checkInsByHour.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Check-in Flow by Hour</CardTitle>
              <CardDescription>When attendees checked in during the event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.checkInsByHour}>
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
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
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics && analytics.totalRegistered > 0 && (
              <>
                {analytics.attendanceRate >= 80 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Great attendance!</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your {analytics.attendanceRate}% attendance rate is excellent.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.attendanceRate < 50 && analytics.totalAttended > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Room for improvement</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Consider sending reminder emails closer to the event date to improve attendance.
                      </p>
                    </div>
                  </div>
                )}
                {analytics.registrationsBySource.find(s => s.name === 'referral')?.value >
                  analytics.totalRegistered * 0.2 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Share2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Strong referral rate!</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Over 20% of registrations came from referrals. Your attendees are sharing!
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            {(!analytics || analytics.totalRegistered === 0) && (
              <p className="text-muted-foreground text-center py-4">
                Analytics insights will appear once you have registrations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
