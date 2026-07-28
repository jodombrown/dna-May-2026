import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import { EventAnalytics } from '@/hooks/useEventAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EventAnalyticsCardProps {
  analytics: EventAnalytics;
  eventTitle: string;
}

export const EventAnalyticsCard = ({ analytics, eventTitle }: EventAnalyticsCardProps) => {
  const { rsvp_stats, checkin_stats, event_has_passed, rsvp_timeline } = analytics;

  const rsvpChartData = [
    { name: 'Going', value: rsvp_stats.going, fill: 'hsl(var(--chart-1))' },
    { name: 'Maybe', value: rsvp_stats.maybe, fill: 'hsl(var(--chart-2))' },
    { name: 'Waitlist', value: rsvp_stats.waitlist, fill: 'hsl(var(--chart-3))' },
    { name: 'Not Going', value: rsvp_stats.not_going, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{eventTitle}</CardTitle>
            <CardDescription>Event Analytics</CardDescription>
          </div>
          {event_has_passed && (
            <Badge variant="secondary">Completed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total RSVPs</span>
            </div>
            <span className="text-2xl font-bold">{rsvp_stats.total}</span>
          </div>

          <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm">Going</span>
            </div>
            <span className="text-2xl font-bold text-dna-success dark:text-dna-success">
              {rsvp_stats.going}
            </span>
          </div>

          {event_has_passed && (
            <>
              <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Checked In</span>
                </div>
                <span className="text-2xl font-bold">{checkin_stats.checked_in}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Show-up Rate</span>
                </div>
                <span className="text-2xl font-bold text-dna-info dark:text-dna-info">
                  {checkin_stats.show_up_rate}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* RSVP Breakdown Chart */}
        <div>
          <h3 className="text-sm font-semibold mb-3">RSVP Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rsvpChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RSVP Timeline */}
        {rsvp_timeline && rsvp_timeline.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">RSVP Timeline (Going)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rsvp_timeline}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Check-in Details */}
        {event_has_passed && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Check-in Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendees who confirmed going:</span>
                <span className="font-medium">{checkin_stats.going_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actually checked in:</span>
                <span className="font-medium">{checkin_stats.checked_in}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No-shows:</span>
                <span className="font-medium text-dna-copper dark:text-dna-copper">
                  {checkin_stats.going_count - checkin_stats.checked_in}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
