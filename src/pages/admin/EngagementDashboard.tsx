import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingFunnel } from '@/components/admin/OnboardingFunnel';
import { RetentionMetrics } from '@/components/admin/RetentionMetrics';
import { EngagementHeatmap } from '@/components/admin/EngagementHeatmap';
import { useEngagementMetrics } from '@/hooks/useEngagementMetrics';
import { Users, TrendingUp, Target, Activity } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function EngagementDashboard() {
  const { data: metrics, isLoading } = useEngagementMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Engagement Analytics</h1>
        <p className="text-muted-foreground">
          Monitor user engagement, retention, and onboarding performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Platform members
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalUsers ? 
                    `${((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}% of total` : 
                    'No users yet'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.onboardingCompletionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed onboarding
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.avgEngagementScore}</div>
                <p className="text-xs text-muted-foreground">
                  Engagement score
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Completeness Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completeness Distribution</CardTitle>
          <CardDescription>How complete are user profiles?</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-destructive/10">
                <div className="text-3xl font-bold text-destructive">
                  {metrics?.completenessDistribution.low || 0}
                </div>
                <p className="text-sm text-muted-foreground">Low (&lt;30%)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/10">
                <div className="text-display font-bold text-dna-warning">
                  {metrics?.completenessDistribution.medium || 0}
                </div>
                <p className="text-sm text-muted-foreground">Medium (30-70%)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10">
                <div className="text-display font-bold text-dna-success">
                  {metrics?.completenessDistribution.high || 0}
                </div>
                <p className="text-sm text-muted-foreground">High (&gt;70%)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OnboardingFunnel />
        <EngagementHeatmap />
      </div>

      <RetentionMetrics />
    </div>
  );
}
