import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, Award, Info } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { OrganizerAnalytics } from '@/hooks/useEventAnalytics';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { predictAttendance } from '@/lib/diaAttendancePrediction';
import { OrganizerAlertsCard } from './OrganizerAlertsCard';

interface OrganizerAnalyticsDashboardProps {
  analytics: OrganizerAnalytics;
}

export const OrganizerAnalyticsDashboard = ({ analytics }: OrganizerAnalyticsDashboardProps) => {
  const { events_hosted, avg_rsvps_per_event, avg_going_per_event, avg_show_up_rate, event_list } = analytics;

  return (
    <div className="space-y-6">
      <OrganizerAlertsCard analytics={analytics} />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Events Hosted</CardDescription>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{events_hosted.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {events_hosted.last_30_days} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Avg RSVPs/Event</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avg_rsvps_per_event}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avg_going_per_event} going per event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Avg Show-up Rate</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {avg_show_up_rate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For completed events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Upcoming Events</CardDescription>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {events_hosted.upcoming}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {events_hosted.past} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Future Conversion Tracking</AlertTitle>
        <AlertDescription>
          We're building conversion metrics to track how events drive engagement across Convene, Collaborate, and Contribute.
          Track events → group joins, spaces/projects, and opportunities coming soon.
        </AlertDescription>
      </Alert>

      {/* Event List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>Performance breakdown for each event</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <EventListTable events={event_list || []} />
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-4">
              <EventListTable
                events={(event_list || []).filter(e => new Date(e.start_time) > new Date())}
                forecastShowUpRate={avg_show_up_rate}
              />
            </TabsContent>
            
            <TabsContent value="past" className="mt-4">
              <EventListTable 
                events={(event_list || []).filter(e => new Date(e.end_time) < new Date())} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface EventListTableProps {
  events: OrganizerAnalytics['event_list'];
  forecastShowUpRate?: number;
}

const EventListTable = ({ events, forecastShowUpRate }: EventListTableProps) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events found in this category
      </div>
    );
  }

  const showForecast = typeof forecastShowUpRate === 'number';

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total RSVPs</TableHead>
            <TableHead className="text-right">Going</TableHead>
            <TableHead className="text-right">Checked In</TableHead>
            <TableHead className="text-right">Show-up Rate</TableHead>
            {showForecast && (
              <TableHead className="text-right">
                <span className="inline-flex items-center gap-1">
                  <MateMasie className="h-3.5 w-3.5" />
                  Forecast
                </span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const isPast = new Date(event.end_time) < new Date();
            const forecast = showForecast && !isPast
              ? predictAttendance({
                  eventStartIso: event.start_time,
                  goingNow: event.going_count,
                  totalRsvpsNow: event.total_rsvps,
                  rsvpTimeline: null,
                  organizerHistoricalShowUpRate: forecastShowUpRate,
                })
              : null;

            return (
              <TableRow key={event.event_id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {event.title}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {format(new Date(event.start_time), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.start_time), 'h:mm a')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{event.total_rsvps}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{event.going_count}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isPast ? (
                    <span>{event.checked_in_count}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isPast ? (
                    <span className={event.show_up_rate >= 70 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {event.show_up_rate}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {showForecast && (
                  <TableCell className="text-right text-sm tabular-nums">
                    {forecast ? (
                      <span className="text-foreground/80">
                        {forecast.predictedGoingLow}-{forecast.predictedGoingHigh}
                        <span className="text-muted-foreground ml-1">going</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
