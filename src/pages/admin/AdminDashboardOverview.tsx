import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, UserPlus, Link2, RefreshCw, TrendingUp, TrendingDown, MessageSquare, Shield, Calendar, Clock, CheckCircle2, Globe, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MateMasie } from '@/components/icons/adinkra';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAdminStats } from '@/hooks/useAdminStats';
import { cn } from '@/lib/utils';

// Pie chart colors
const SEGMENT_COLORS = [
  '#006B5A', // DNA Emerald
  '#008B74', // Emerald Light
  '#B87333', // Copper
  '#D4AF37', // Gold
  '#3B82F6', // Blue
  '#2A7A8C', // Deep Teal (Convey)
  '#EC4899', // Pink
  '#F59E0B'  // Amber
];

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-emerald-600' : 'text-red-500'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-neutral-400">{trend.label}</span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboardOverview: React.FC = () => {
  const { stats, userGrowth, userSegments, isLoading, refetch } = useAdminStats();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate growth percentages
  const weeklyGrowth = stats?.users.total && stats.users.new_this_week
    ? Math.round((stats.users.new_this_week / (stats.users.total - stats.users.new_this_week)) * 100)
    : 0;

  const stickinessRatio = stats?.users.dau && stats?.users.mau
    ? Math.round((stats.users.dau / stats.users.mau) * 100)
    : 0;

  // Format chart data
  const formattedGrowthData = userGrowth.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'New Users': item.new_users,
    'Total Users': item.cumulative_users
  }));

  const formattedSegmentData = userSegments.map((segment, index) => ({
    name: segment.segment,
    value: segment.count,
    percentage: segment.percentage,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
          <p className="text-neutral-500 mt-1">
            Monitor your platform's key metrics and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-neutral-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          trend={weeklyGrowth ? { value: weeklyGrowth, label: 'this week', isPositive: true } : undefined}
          isLoading={isLoading}
        />
        <MetricCard
          title="Daily Active Users"
          value={stats?.users.dau || 0}
          icon={Activity}
          subtitle={`${stickinessRatio}% stickiness ratio`}
          isLoading={isLoading}
        />
        <MetricCard
          title="New Signups Today"
          value={stats?.users.new_today || 0}
          icon={UserPlus}
          subtitle={`${stats?.users.new_this_month || 0} this month`}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Connections"
          value={stats?.connections.total || 0}
          icon={Link2}
          subtitle={`${stats?.connections.pending || 0} pending`}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>New signups and total users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="New Users"
                    stroke="#006B5A"
                    strokeWidth={2}
                    dot={{ fill: '#006B5A', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Total Users"
                    stroke="#B87333"
                    strokeWidth={2}
                    dot={{ fill: '#B87333', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Segments Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Segments</CardTitle>
            <CardDescription>Distribution by diaspora status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : formattedSegmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formattedSegmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percentage }) => `${percentage}%`}
                    labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                  >
                    {formattedSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-sm text-neutral-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-neutral-400">
                No segment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/admin/dashboard"
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">Feedback</span>
              </div>
              <Badge variant={stats?.feedback.pending ? 'destructive' : 'secondary'}>
                {stats?.feedback.pending || 0}
              </Badge>
            </Link>
            <Link
              to="/admin/moderation"
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">Content Flags</span>
              </div>
              <Badge variant={stats?.moderation.pending_flags ? 'destructive' : 'secondary'}>
                {stats?.moderation.pending_flags || 0}
              </Badge>
            </Link>
            <Link
              to="/admin/dashboard"
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">Upcoming Events</span>
              </div>
              <Badge variant="secondary">
                {stats?.events.upcoming || 0}
              </Badge>
            </Link>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">System Status</span>
                <span className="text-emerald-600 font-medium">Online</span>
              </div>
              <Progress value={100} className="h-2 bg-neutral-100" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">User Engagement</span>
                <span className="text-neutral-700 font-medium">{stickinessRatio}%</span>
              </div>
              <Progress value={stickinessRatio} className="h-2 bg-neutral-100" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">Connection Rate</span>
                <span className="text-neutral-700 font-medium">
                  {stats?.users.total && stats?.connections.total
                    ? Math.round((stats.connections.total / stats.users.total) * 100)
                    : 0}%
                </span>
              </div>
              <Progress
                value={stats?.users.total && stats?.connections.total
                  ? Math.round((stats.connections.total / stats.users.total) * 100)
                  : 0}
                className="h-2 bg-neutral-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Module Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MateMasie className="w-5 h-5 text-blue-500" />
              Module Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">CONNECT</span>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">CONVENE</span>
              </div>
              <Badge className="bg-blue-600 hover:bg-blue-700">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-copper-50 border border-copper-200">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-copper-600" />
                <span className="text-sm font-medium text-copper-700">COLLABORATE</span>
              </div>
              <Badge className="bg-copper-600 hover:bg-copper-700">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Posts</p>
                <p className="text-xl font-bold text-neutral-900">
                  {stats?.content.total_posts?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {stats?.content.posts_this_week || 0} this week
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Events</p>
                <p className="text-xl font-bold text-neutral-900">
                  {stats?.events.total?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {stats?.events.this_week || 0} this week
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-copper-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-copper-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Weekly Active</p>
                <p className="text-xl font-bold text-neutral-900">
                  {stats?.users.wau?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {stats?.users.mau || 0} monthly
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Resolved Flags</p>
                <p className="text-xl font-bold text-neutral-900">
                  {stats?.moderation.resolved_this_week?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-neutral-400 mt-1">this week</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
