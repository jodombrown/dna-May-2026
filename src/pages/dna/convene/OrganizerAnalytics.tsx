import { useNavigate } from 'react-router-dom';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useOrganizerAnalytics } from '@/hooks/useEventAnalytics';
import { OrganizerAnalyticsDashboard } from '@/components/convene/analytics/OrganizerAnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OrganizerAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<number>(90);

  const { data: analytics, isLoading, error } = useOrganizerAnalytics(user?.id, timeRange);

  if (isLoading) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  if (error) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/dna/convene/my-events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Events
            </Button>
            
            <Alert variant="destructive">
              <AlertTitle>Error Loading Analytics</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load your analytics data.'}
              </AlertDescription>
            </Alert>
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  if (!analytics) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/dna/convene/my-events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Events
            </Button>
            
            <Alert>
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                You haven't hosted any events yet. Create your first event to start tracking analytics!
              </AlertDescription>
            </Alert>

            <Button onClick={() => navigate('/dna/convene')}>
              Create Your First Event
            </Button>
          </div>
        }
        rightColumn={<RightWidgets variant="convene" />}
      />
    );
  }

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dna/convene/my-events')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                My Events
              </Button>
              <div>
                <h1 className="text-h2 font-serif">Your Event Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Track your event performance and engagement
                </p>
              </div>
            </div>

            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <OrganizerAnalyticsDashboard analytics={analytics} />
        </div>
      }
      rightColumn={<RightWidgets variant="convene" />}
    />
  );
};

export default OrganizerAnalytics;
