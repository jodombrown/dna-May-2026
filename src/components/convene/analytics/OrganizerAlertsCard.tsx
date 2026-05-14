import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MateMasie } from '@/components/icons/adinkra';
import {
  computeOrganizerAlerts,
  type AlertSeverity,
  type OrganizerAlert,
} from '@/lib/conveneOrganizerAlerts';
import type { OrganizerAnalytics } from '@/hooks/useEventAnalytics';

interface OrganizerAlertsCardProps {
  analytics: OrganizerAnalytics;
}

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  critical: '#8B2635',
  warning: '#D4A84B',
  info: '#4A8D77',
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Needs attention',
  warning: 'Watch closely',
  info: 'Good signal',
};

const CTA_LABEL: Record<OrganizerAlert['cta'], string> = {
  invite: 'Invite more attendees',
  message: 'Message attendees',
  review: 'Open event',
};

export const OrganizerAlertsCard = ({ analytics }: OrganizerAlertsCardProps) => {
  const navigate = useNavigate();
  const alerts = computeOrganizerAlerts(analytics);

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <MateMasie className="h-6 w-6 mt-0.5 text-foreground/80" />
          <div>
            <CardTitle className="text-base">DIA needs your eyes here</CardTitle>
            <CardDescription>
              {alerts.length} upcoming event{alerts.length === 1 ? '' : 's'} flagged against your historical pace
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.eventId}
            className="border-l-4 pl-3 py-2 pr-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
            style={{ borderLeftColor: SEVERITY_BORDER[alert.severity] }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {SEVERITY_LABEL[alert.severity]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {alert.daysUntil === 0
                    ? 'Today'
                    : `In ${alert.daysUntil} day${alert.daysUntil === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="font-medium truncate">{alert.title}</div>
              <div className="text-sm text-foreground/80">{alert.headline}</div>
              <div className="text-sm text-muted-foreground">{alert.detail}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 min-h-[44px]"
              onClick={() => navigate(`/dna/convene/events/${alert.eventId}`)}
            >
              {CTA_LABEL[alert.cta]}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
