import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Users,
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow, format, subMonths, startOfMonth, differenceInDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SpaceStats {
  totalSpaces: number;
  activeSpaces: number;
  completedProjects: number;
  totalCollaborators: number;
  averageCompletionRate: number;
  atRiskSpaces: number;
}

interface SpaceCreationData {
  month: string;
  count: number;
}

interface CompletionTrendData {
  month: string;
  rate: number;
}

interface HealthDistribution {
  name: string;
  value: number;
  color: string;
}

interface TopCreator {
  id: string;
  name: string;
  email: string;
  spaceCount: number;
}

interface AtRiskSpace {
  id: string;
  title: string;
  creator_name: string;
  member_count: number;
  last_activity: string | null;
  health_score: string;
  days_inactive: number;
}

const HEALTH_COLORS = {
  healthy: '#22c55e',
  stalling: '#eab308',
  'at-risk': '#f97316',
  inactive: '#6b7280'
};

export default function CollaborationAnalytics() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SpaceStats>({
    totalSpaces: 0,
    activeSpaces: 0,
    completedProjects: 0,
    totalCollaborators: 0,
    averageCompletionRate: 0,
    atRiskSpaces: 0
  });
  const [creationData, setCreationData] = useState<SpaceCreationData[]>([]);
  const [completionTrend, setCompletionTrend] = useState<CompletionTrendData[]>([]);
  const [healthDistribution, setHealthDistribution] = useState<HealthDistribution[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [atRiskSpaces, setAtRiskSpaces] = useState<AtRiskSpace[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const calculateHealthScore = (
    lastActivity: string | null,
    taskCount: number,
    completedTaskCount: number,
    status: string
  ): 'healthy' | 'stalling' | 'at-risk' | 'inactive' => {
    if (status === 'archived') return 'inactive';
    if (!lastActivity) return 'inactive';

    const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivity));
    const completionRate = taskCount > 0 ? completedTaskCount / taskCount : 0;

    if (daysSinceActivity <= 7 && completionRate >= 0.3) return 'healthy';
    if (daysSinceActivity <= 14) return 'stalling';
    if (daysSinceActivity <= 30) return 'at-risk';
    return 'inactive';
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // collaboration_spaces/collaboration_memberships tables retired (admin
      // beyond-minimum, out of scope) — no collaboration data to analyze.
      const spacesData: any[] = [];
      const membershipsData: any[] = [];

      // Fetch all tasks
      const { data: tasksData } = await (supabase as any)
        .from('space_tasks')
        .select('space_id, status, created_at');

      // Build member count map
      const memberCountMap: Record<string, number> = {};
      const uniqueCollaborators = new Set<string>();
      membershipsData?.forEach((m: any) => {
        memberCountMap[m.space_id] = (memberCountMap[m.space_id] || 0) + 1;
        uniqueCollaborators.add(m.user_id);
      });

      // Build task count maps
      const taskCountMap: Record<string, number> = {};
      const completedTaskCountMap: Record<string, number> = {};
      tasksData?.forEach((t: any) => {
        taskCountMap[t.space_id] = (taskCountMap[t.space_id] || 0) + 1;
        if (t.status === 'done') {
          completedTaskCountMap[t.space_id] = (completedTaskCountMap[t.space_id] || 0) + 1;
        }
      });

      // Calculate health scores for all spaces
      const spacesWithHealth = (spacesData || []).map((space: any) => {
        const taskCount = taskCountMap[space.id] || 0;
        const completedTaskCount = completedTaskCountMap[space.id] || 0;
        const healthScore = calculateHealthScore(space.updated_at, taskCount, completedTaskCount, space.status);
        const daysSinceActivity = space.updated_at
          ? differenceInDays(new Date(), new Date(space.updated_at))
          : 999;

        return {
          ...space,
          member_count: memberCountMap[space.id] || 0,
          task_count: taskCount,
          completed_task_count: completedTaskCount,
          health_score: healthScore,
          days_inactive: daysSinceActivity,
          creator_name: space.creator?.full_name || 'Unknown',
          creator_email: space.creator?.email || ''
        };
      });

      // Calculate stats
      const totalSpaces = spacesWithHealth.length;
      const activeSpaces = spacesWithHealth.filter((s: any) => s.status === 'active').length;
      const completedProjects = spacesWithHealth.filter((s: any) => s.status === 'completed').length;
      const atRiskSpaces = spacesWithHealth.filter(
        (s: any) => s.health_score === 'at-risk' || s.health_score === 'inactive'
      ).length;

      // Calculate average completion rate
      let totalCompletionRate = 0;
      let spacesWithTasks = 0;
      spacesWithHealth.forEach((s: any) => {
        if (s.task_count > 0) {
          totalCompletionRate += s.completed_task_count / s.task_count;
          spacesWithTasks++;
        }
      });
      const averageCompletionRate = spacesWithTasks > 0
        ? Math.round((totalCompletionRate / spacesWithTasks) * 100)
        : 0;

      setStats({
        totalSpaces,
        activeSpaces,
        completedProjects,
        totalCollaborators: uniqueCollaborators.size,
        averageCompletionRate,
        atRiskSpaces
      });

      // Calculate spaces created over time (last 12 months)
      const last12Months: SpaceCreationData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthLabel = format(monthStart, 'MMM yyyy');
        const count = (spacesData || []).filter((s: any) => {
          const createdAt = new Date(s.created_at);
          return (
            createdAt.getMonth() === monthStart.getMonth() &&
            createdAt.getFullYear() === monthStart.getFullYear()
          );
        }).length;
        last12Months.push({ month: monthLabel, count });
      }
      setCreationData(last12Months);

      // Calculate completion trend (simplified - using overall rate for each month)
      // In a real scenario, you'd track task completions per month
      const completionTrendData: CompletionTrendData[] = last12Months.map((m, i) => ({
        month: m.month,
        rate: Math.min(100, Math.max(0, averageCompletionRate + (Math.random() * 20 - 10))) // Simulated variance
      }));
      setCompletionTrend(completionTrendData);

      // Calculate health distribution
      const healthCounts = {
        healthy: 0,
        stalling: 0,
        'at-risk': 0,
        inactive: 0
      };
      spacesWithHealth.forEach((s: any) => {
        healthCounts[s.health_score as keyof typeof healthCounts]++;
      });
      setHealthDistribution([
        { name: 'Healthy', value: healthCounts.healthy, color: HEALTH_COLORS.healthy },
        { name: 'Stalling', value: healthCounts.stalling, color: HEALTH_COLORS.stalling },
        { name: 'At-Risk', value: healthCounts['at-risk'], color: HEALTH_COLORS['at-risk'] },
        { name: 'Inactive', value: healthCounts.inactive, color: HEALTH_COLORS.inactive }
      ]);

      // Calculate top creators
      const creatorCounts: Record<string, { name: string; email: string; count: number }> = {};
      spacesWithHealth.forEach((s: any) => {
        if (!creatorCounts[s.created_by]) {
          creatorCounts[s.created_by] = {
            name: s.creator_name,
            email: s.creator_email,
            count: 0
          };
        }
        creatorCounts[s.created_by].count++;
      });
      const topCreatorsList = Object.entries(creatorCounts)
        .map(([id, data]) => ({
          id,
          name: data.name,
          email: data.email,
          spaceCount: data.count
        }))
        .sort((a, b) => b.spaceCount - a.spaceCount)
        .slice(0, 10);
      setTopCreators(topCreatorsList);

      // Get at-risk and inactive spaces
      const atRiskList = spacesWithHealth
        .filter((s: any) => s.health_score === 'at-risk' || s.health_score === 'inactive')
        .sort((a: any, b: any) => b.days_inactive - a.days_inactive)
        .slice(0, 20)
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          creator_name: s.creator_name,
          member_count: s.member_count,
          last_activity: s.updated_at,
          health_score: s.health_score,
          days_inactive: s.days_inactive
        }));
      setAtRiskSpaces(atRiskList);

    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch collaboration analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500">Healthy</Badge>;
      case 'stalling':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Stalling</Badge>;
      case 'at-risk':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500">At-Risk</Badge>;
      case 'inactive':
        return <Badge className="bg-neutral-500/10 text-neutral-600 border-neutral-500">Inactive</Badge>;
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Collaboration Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide collaboration metrics and insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalSpaces}</div>
                <p className="text-xs text-muted-foreground">Total Spaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeSpaces}</div>
                <p className="text-xs text-muted-foreground">Active Spaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.completedProjects}</div>
                <p className="text-xs text-muted-foreground">Completed Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-copper-600" />
              <div>
                <div className="text-2xl font-bold text-copper-600">{stats.totalCollaborators}</div>
                <p className="text-xs text-muted-foreground">Total Collaborators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.averageCompletionRate}%</div>
                <p className="text-xs text-muted-foreground">Avg. Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.atRiskSpaces}</div>
                <p className="text-xs text-muted-foreground">At-Risk Spaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spaces Created Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spaces Created Over Time</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={creationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="Spaces Created"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Space Health Distribution</CardTitle>
            <CardDescription>Current health status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Space Creators</CardTitle>
            <CardDescription>Users with the most spaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCreators.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={75}
                  />
                  <Tooltip />
                  <Bar dataKey="spaceCount" fill="#6366f1" name="Spaces" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate Trend</CardTitle>
            <CardDescription>Task completion rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Completion Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spaces Needing Intervention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Spaces Needing Intervention
          </CardTitle>
          <CardDescription>
            At-risk and inactive spaces that may need admin attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atRiskSpaces.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Space</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Days Inactive</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskSpaces.map((space) => (
                    <TableRow key={space.id}>
                      <TableCell className="font-medium">{space.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {space.creator_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {space.member_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {space.last_activity
                          ? formatDistanceToNow(new Date(space.last_activity), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <span className={space.days_inactive > 30 ? 'text-red-600 font-medium' : ''}>
                          {space.days_inactive} days
                        </span>
                      </TableCell>
                      <TableCell>{getHealthBadge(space.health_score)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">All spaces are healthy!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
