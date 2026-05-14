import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  HandHeart,
  DollarSign,
  Lightbulb,
  Clock,
  Network,
  Package,
  TrendingUp,
  CheckCircle,
  Activity,
  Users
} from 'lucide-react';
import { formatDistanceToNow, format, subMonths, startOfMonth } from 'date-fns';
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

interface ContributionStats {
  totalOpportunities: number;
  activeOpportunities: number;
  fulfilledOpportunities: number;
  totalOffers: number;
  acceptedOffers: number;
  matchRate: number;
  totalFundingRequested: number;
}

interface CreationData {
  month: string;
  count: number;
}

interface TypeDistribution {
  name: string;
  value: number;
  color: string;
}

interface TopContributor {
  id: string;
  name: string;
  email: string;
  offerCount: number;
}

interface HotOpportunity {
  id: string;
  title: string;
  space_title: string;
  type: string;
  offer_count: number;
  created_at: string;
}

interface FulfillmentTrendData {
  month: string;
  rate: number;
}

const TYPE_COLORS = {
  funding: '#10b981',
  skills: '#3b82f6',
  time: '#f97316',
  access: '#2A7A8C',
  resources: '#ec4899'
};

const TYPE_LABELS: Record<string, string> = {
  funding: 'Funding',
  skills: 'Skills',
  time: 'Time',
  access: 'Access/Network',
  resources: 'Resources'
};

export default function ContributionAnalytics() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContributionStats>({
    totalOpportunities: 0,
    activeOpportunities: 0,
    fulfilledOpportunities: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    matchRate: 0,
    totalFundingRequested: 0
  });
  const [creationData, setCreationData] = useState<CreationData[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [hotOpportunities, setHotOpportunities] = useState<HotOpportunity[]>([]);
  const [fulfillmentTrend, setFulfillmentTrend] = useState<FulfillmentTrendData[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all needs
      const { data: needsData, error: needsError } = await (supabase as any)
        .from('contribution_needs')
        .select(`
          id,
          title,
          type,
          status,
          target_amount,
          currency,
          created_at,
          space:spaces!contribution_needs_space_id_fkey(name)
        `);

      if (needsError) throw needsError;

      // Fetch all offers
      const { data: offersData, error: offersError } = await (supabase as any)
        .from('contribution_offers')
        .select(`
          id,
          need_id,
          created_by,
          status,
          offered_amount,
          created_at
        `);

      if (offersError) throw offersError;

      // Build offer count map
      const offerCountMap: Record<string, number> = {};
      (offersData || []).forEach((offer: any) => {
        offerCountMap[offer.need_id] = (offerCountMap[offer.need_id] || 0) + 1;
      });

      // Calculate stats
      const totalOpportunities = (needsData || []).length;
      const activeOpportunities = (needsData || []).filter((n: any) => n.status === 'open').length;
      const fulfilledOpportunities = (needsData || []).filter((n: any) => n.status === 'fulfilled').length;
      const totalOffers = (offersData || []).length;
      const acceptedOffers = (offersData || []).filter((o: any) => o.status === 'accepted' || o.status === 'completed').length;
      const matchRate = totalOpportunities > 0 ? Math.round((fulfilledOpportunities / totalOpportunities) * 100) : 0;

      // Calculate total funding requested
      const totalFundingRequested = (needsData || [])
        .filter((n: any) => n.type === 'funding' && n.target_amount)
        .reduce((sum: number, n: any) => sum + (n.target_amount || 0), 0);

      setStats({
        totalOpportunities,
        activeOpportunities,
        fulfilledOpportunities,
        totalOffers,
        acceptedOffers,
        matchRate,
        totalFundingRequested
      });

      // Calculate opportunities created over time (last 12 months)
      const last12Months: CreationData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthLabel = format(monthStart, 'MMM yyyy');
        const count = (needsData || []).filter((n: any) => {
          const createdAt = new Date(n.created_at);
          return (
            createdAt.getMonth() === monthStart.getMonth() &&
            createdAt.getFullYear() === monthStart.getFullYear()
          );
        }).length;
        last12Months.push({ month: monthLabel, count });
      }
      setCreationData(last12Months);

      // Calculate fulfillment trend
      const fulfillmentData: FulfillmentTrendData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthLabel = format(monthStart, 'MMM yyyy');

        // Count needs created up to this month
        const needsUpToMonth = (needsData || []).filter((n: any) => {
          return new Date(n.created_at) <= new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        });

        const fulfilledUpToMonth = needsUpToMonth.filter((n: any) => n.status === 'fulfilled').length;
        const rate = needsUpToMonth.length > 0
          ? Math.round((fulfilledUpToMonth / needsUpToMonth.length) * 100)
          : 0;

        fulfillmentData.push({ month: monthLabel, rate });
      }
      setFulfillmentTrend(fulfillmentData);

      // Calculate type distribution
      const typeCounts: Record<string, number> = {};
      (needsData || []).forEach((need: any) => {
        typeCounts[need.type] = (typeCounts[need.type] || 0) + 1;
      });
      const typeDistributionData = Object.entries(typeCounts).map(([type, count]) => ({
        name: TYPE_LABELS[type] || type,
        value: count,
        color: TYPE_COLORS[type as keyof typeof TYPE_COLORS] || '#6b7280'
      }));
      setTypeDistribution(typeDistributionData);

      // Calculate top contributors
      const contributorCounts: Record<string, { name: string; email: string; count: number }> = {};

      // Get user profiles for contributors
      const contributorIds = [...new Set((offersData || []).map((o: any) => o.created_by))];
      let profileMap: Record<string, { full_name: string; email: string }> = {};

      if (contributorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', contributorIds as string[]);

        profiles?.forEach((p: any) => {
          profileMap[p.id] = { full_name: p.full_name || 'Unknown', email: p.email || '' };
        });
      }

      (offersData || []).forEach((offer: any) => {
        if (!contributorCounts[offer.created_by]) {
          contributorCounts[offer.created_by] = {
            name: profileMap[offer.created_by]?.full_name || 'Unknown',
            email: profileMap[offer.created_by]?.email || '',
            count: 0
          };
        }
        contributorCounts[offer.created_by].count++;
      });

      const topContributorsList = Object.entries(contributorCounts)
        .map(([id, data]) => ({
          id,
          name: data.name,
          email: data.email,
          offerCount: data.count
        }))
        .sort((a, b) => b.offerCount - a.offerCount)
        .slice(0, 10);
      setTopContributors(topContributorsList);

      // Get hot opportunities (most offers)
      const hotOpportunitiesList = (needsData || [])
        .filter((n: any) => n.status === 'open')
        .map((n: any) => ({
          id: n.id,
          title: n.title,
          space_title: n.space?.name || 'Unknown Space',
          type: n.type,
          offer_count: offerCountMap[n.id] || 0,
          created_at: n.created_at
        }))
        .sort((a: any, b: any) => b.offer_count - a.offer_count)
        .slice(0, 10);
      setHotOpportunities(hotOpportunitiesList);

    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch contribution analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      funding: 'bg-emerald-500/10 text-emerald-600 border-emerald-500',
      skills: 'bg-blue-500/10 text-blue-600 border-blue-500',
      time: 'bg-orange-500/10 text-orange-600 border-orange-500',
      access: 'bg-copper-500/10 text-copper-600 border-copper-500',
      resources: 'bg-copper-500/10 text-copper-600 border-copper-500'
    };
    return (
      <Badge className={colors[type] || 'bg-neutral-500/10 text-neutral-600 border-neutral-500'}>
        {TYPE_LABELS[type] || type}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold mb-2">Contribution Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide contribution metrics and insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
                <p className="text-xs text-muted-foreground">Total Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeOpportunities}</div>
                <p className="text-xs text-muted-foreground">Active Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-copper-600" />
              <div>
                <div className="text-2xl font-bold text-copper-600">{stats.fulfilledOpportunities}</div>
                <p className="text-xs text-muted-foreground">Fulfilled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalOffers}</div>
                <p className="text-xs text-muted-foreground">Total Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.matchRate}%</div>
                <p className="text-xs text-muted-foreground">Match Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  ${stats.totalFundingRequested.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Funding Requested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunities Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opportunities Over Time</CardTitle>
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
                    name="Opportunities"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contributions by Type</CardTitle>
            <CardDescription>Distribution across contribution types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
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
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Contributors</CardTitle>
            <CardDescription>Users with the most contribution offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topContributors.slice(0, 10)}
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
                  <Bar dataKey="offerCount" fill="#6366f1" name="Offers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fulfillment Rate Trend</CardTitle>
            <CardDescription>Percentage of opportunities fulfilled over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fulfillmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#2A7A8C"
                    strokeWidth={2}
                    dot={{ fill: '#2A7A8C' }}
                    name="Fulfillment Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hot Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Hot Opportunities
          </CardTitle>
          <CardDescription>
            Active opportunities with the most engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hotOpportunities.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Space</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Offers</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell className="font-medium">{opportunity.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {opportunity.space_title}
                      </TableCell>
                      <TableCell>{getTypeBadge(opportunity.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HandHeart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{opportunity.offer_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <HandHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active opportunities yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
