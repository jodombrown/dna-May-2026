/**
 * DIA Attendance Prediction
 *
 * Pure, deterministic forecast for an upcoming event's attendance.
 * Combines four signals:
 *  1. Current "going" RSVPs (anchor)
 *  2. RSVP velocity over the trailing window (slope of the timeline)
 *  3. Days remaining until event start (more days = more headroom)
 *  4. Organizer historical show-up rate (default 65 if unknown)
 *
 * Output is intentionally conservative; we surface a confidence band
 * rather than a single number so the organizer reads it as guidance.
 */

export interface AttendancePredictionInput {
  eventStartIso: string;
  goingNow: number;
  totalRsvpsNow: number;
  rsvpTimeline: Array<{ date: string; count: number }> | null;
  organizerHistoricalShowUpRate?: number; // 0-100
  organizerAvgGoingPerEvent?: number;
}

export interface AttendancePrediction {
  predictedGoingLow: number;
  predictedGoingHigh: number;
  predictedCheckIn: number;
  confidence: 'low' | 'medium' | 'high';
  daysUntilEvent: number;
  velocityPerDay: number;
  signals: string[];
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const computeVelocity = (
  timeline: Array<{ date: string; count: number }> | null,
): number => {
  if (!timeline || timeline.length < 2) return 0;
  // Average daily new "going" count over the last 7 timeline points.
  const tail = timeline.slice(-7);
  const sum = tail.reduce((acc, p) => acc + (p.count || 0), 0);
  return sum / tail.length;
};

export function predictAttendance(
  input: AttendancePredictionInput,
): AttendancePrediction {
  const now = Date.now();
  const start = new Date(input.eventStartIso).getTime();
  const daysUntilEvent = Math.max(
    0,
    Math.ceil((start - now) / (1000 * 60 * 60 * 24)),
  );

  const velocityPerDay = computeVelocity(input.rsvpTimeline);
  const showUpRate =
    typeof input.organizerHistoricalShowUpRate === 'number' &&
    input.organizerHistoricalShowUpRate > 0
      ? input.organizerHistoricalShowUpRate
      : 65;

  // Linear projection capped to avoid runaway forecasts.
  const projectedAdds = clamp(
    velocityPerDay * Math.min(daysUntilEvent, 14),
    0,
    Math.max(input.goingNow * 2, 25),
  );

  // Low/high band: low assumes 60% of projected adds, high assumes 110%.
  const predictedGoingLow = Math.round(input.goingNow + projectedAdds * 0.6);
  const predictedGoingHigh = Math.round(input.goingNow + projectedAdds * 1.1);

  const midpoint = (predictedGoingLow + predictedGoingHigh) / 2;
  const predictedCheckIn = Math.round(midpoint * (showUpRate / 100));

  // Confidence: more sample timeline points + organizer history = higher.
  const timelinePoints = input.rsvpTimeline?.length ?? 0;
  const hasHistory =
    typeof input.organizerHistoricalShowUpRate === 'number' &&
    input.organizerHistoricalShowUpRate > 0;
  let confidence: AttendancePrediction['confidence'] = 'low';
  if (timelinePoints >= 5 && hasHistory) confidence = 'high';
  else if (timelinePoints >= 3 || hasHistory) confidence = 'medium';

  const signals: string[] = [];
  if (velocityPerDay >= 1) {
    signals.push(
      `RSVPs trending up at ~${velocityPerDay.toFixed(1)}/day`,
    );
  } else if (velocityPerDay > 0) {
    signals.push('Slow but steady RSVP growth');
  } else {
    signals.push('RSVP momentum has stalled');
  }
  if (daysUntilEvent <= 3) {
    signals.push('Event is within 72 hours - momentum is locked in');
  } else if (daysUntilEvent <= 14) {
    signals.push(`${daysUntilEvent} days of runway remain`);
  } else {
    signals.push(`${daysUntilEvent} days out - early forecast only`);
  }
  if (hasHistory) {
    signals.push(
      `Your historical show-up rate: ${Math.round(showUpRate)}%`,
    );
  } else {
    signals.push('Using diaspora baseline show-up rate (65%)');
  }

  return {
    predictedGoingLow,
    predictedGoingHigh,
    predictedCheckIn,
    confidence,
    daysUntilEvent,
    velocityPerDay,
    signals,
  };
}
