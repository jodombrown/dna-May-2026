import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MateMasie } from '@/components/icons/adinkra';
import {
  AttendancePrediction,
  predictAttendance,
  AttendancePredictionInput,
} from '@/lib/diaAttendancePrediction';

interface AttendancePredictionCardProps {
  input: AttendancePredictionInput;
}

const CONFIDENCE_LABEL: Record<AttendancePrediction['confidence'], string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};

export const AttendancePredictionCard = ({ input }: AttendancePredictionCardProps) => {
  const forecast = predictAttendance(input);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: '#4A8D77' }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MateMasie className="h-6 w-6 mt-0.5 text-foreground/80" />
            <div>
              <CardTitle className="text-base">DIA forecast</CardTitle>
              <CardDescription>
                Projected attendance at event start
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{CONFIDENCE_LABEL[forecast.confidence]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Projected going</div>
            <div className="text-2xl font-medium tabular-nums">
              {forecast.predictedGoingLow}
              <span className="text-muted-foreground mx-1">-</span>
              {forecast.predictedGoingHigh}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Predicted check-ins</div>
            <div className="text-2xl font-medium tabular-nums">
              ~{forecast.predictedCheckIn}
            </div>
          </div>
        </div>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {forecast.signals.map((signal) => (
            <li key={signal} className="flex gap-2">
              <span className="text-foreground/40 mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
              <span>{signal}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
