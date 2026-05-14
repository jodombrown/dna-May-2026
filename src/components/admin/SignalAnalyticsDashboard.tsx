import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Signal, TrendingUp, Eye, MousePointer, Users } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface SignalMetrics {
  total_signals: number;
  active_signals: number;
  total_sent: number;
  total_seen: number;
  total_engaged: number;
  ctr_overall: number;
}

interface SignalTypeData {
  signal_type: string;
  count: number;
  sent: number;
  seen: number;
  engaged: number;
  ctr: number;
}

interface DailyData {
  date: string;
  signals_sent: number;
  engagement_rate: number;
}

const SignalAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<SignalMetrics | null>(null);
  const [typeData, setTypeData] = useState<SignalTypeData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignalAnalytics();
  }, []);

  const fetchSignalAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch overall metrics
      const { data: signals, error: signalsError } = await supabase
        .from('adin_signals')
        .select('*');

      if (signalsError) throw signalsError;

      // Calculate metrics (simplified for demo)
      const totalSignals = signals?.length || 0;
      const activeSignals = signals?.filter(s => (s.signal_data as any)?.status === 'active').length || 0;

      const mockMetrics: SignalMetrics = {
        total_signals: totalSignals,
        active_signals: activeSignals,
        total_sent: totalSignals * 50, // Mock data
        total_seen: totalSignals * 35,
        total_engaged: totalSignals * 12,
        ctr_overall: 24.5
      };

      setMetrics(mockMetrics);

      // Generate mock type data
      const signalTypes = ['opportunity', 'collaboration', 'event', 'announcement', 'policy'];
      const mockTypeData: SignalTypeData[] = signalTypes.map(type => ({
        signal_type: type,
        count: Math.floor(Math.random() * 50) + 10,
        sent: Math.floor(Math.random() * 500) + 100,
        seen: Math.floor(Math.random() * 300) + 50,
        engaged: Math.floor(Math.random() * 100) + 20,
        ctr: Math.random() * 30 + 10
      }));

      setTypeData(mockTypeData);

      // Generate mock daily data for last 7 days
      const mockDailyData: DailyData[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          signals_sent: Math.floor(Math.random() * 100) + 20,
          engagement_rate: Math.random() * 40 + 10
        };
      });

      setDailyData(mockDailyData);

    } catch (error) {
      // Error handled by UI showing no data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader label="Loading signal analytics..." />;
  }

  if (!metrics) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Signal className="h-8 w-8 text-dna-forest" />
            <div>
              <p className="text-sm text-muted-foreground">Total Signals</p>
              <p className="text-2xl font-bold">{metrics.total_signals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Signals Sent</p>
              <p className="text-2xl font-bold">{metrics.total_sent.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{metrics.total_seen.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MousePointer className="h-8 w-8 text-copper-500" />
            <div>
              <p className="text-sm text-muted-foreground">Engagements</p>
              <p className="text-2xl font-bold">{metrics.total_engaged.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">CTR</p>
              <p className="text-2xl font-bold">{metrics.ctr_overall.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signal Types Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance by Signal Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="signal_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="#16a34a" name="Sent" />
              <Bar dataKey="seen" fill="#3b82f6" name="Seen" />
              <Bar dataKey="engaged" fill="#f59e0b" name="Engaged" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Daily Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Engagement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="signals_sent" 
                stroke="#16a34a" 
                name="Signals Sent"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="engagement_rate" 
                stroke="#f59e0b" 
                name="Engagement Rate (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Signal Type Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Signal Type Breakdown</h3>
        <div className="space-y-4">
          {typeData.map((type) => (
            <div key={type.signal_type} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="capitalize">
                  {type.signal_type}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {type.count} active signals
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium">{type.sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{type.seen}</p>
                  <p className="text-xs text-muted-foreground">Seen</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{type.engaged}</p>
                  <p className="text-xs text-muted-foreground">Engaged</p>
                </div>
                <div className="w-24">
                  <p className="text-sm font-medium text-center mb-1">
                    {type.ctr.toFixed(1)}%
                  </p>
                  <Progress value={type.ctr} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SignalAnalyticsDashboard;