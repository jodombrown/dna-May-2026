/**
 * PulseCompass — Five C's pulse with a radial compass visual.
 * - Time toggle (24h / 7d / 30d)
 * - Scope toggle (Network / You)
 * - Click a module spoke to open a breakdown popover
 * - Live updates via activity_events broadcast (handled in hook)
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowUpRight, Loader2, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFiveCsPulse, usePulseBreakdown, useUserPulseTotals } from '@/hooks/useFiveCsPulse';
import { MODULE_ORDER, MODULE_VISUALS } from './moduleVisuals';
import type { CModule, PulseScope, PulseTimeRange, PulseSlice } from '@/types/right-rail';
import { cn } from '@/lib/utils';

const TIME_OPTIONS: { value: PulseTimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const SCOPE_OPTIONS: { value: PulseScope; label: string }[] = [
  { value: 'platform', label: 'Network' },
  { value: 'user', label: 'You' },
];

// Compass geometry — 200x200 SVG, 5 spokes evenly distributed.
// CONNECT top, CONVENE top-right, COLLABORATE bottom-right, CONTRIBUTE bottom-left, CONVEY top-left.
const SVG_SIZE = 200;
const CENTER = SVG_SIZE / 2;
const MAX_RADIUS = 70;
// Start at 90deg (top) and go clockwise, 72deg apart.
const SPOKE_ANGLES_DEG: Record<CModule, number> = {
  connect: 90,
  convene: 90 - 72,        // 18 (top-right)
  collaborate: 90 - 144,   // -54 (bottom-right)
  contribute: 90 - 216,    // -126 (bottom-left)
  convey: 90 - 288,        // -198 ≡ 162 (top-left)
};

function spokePoint(module: CModule, normalized: number) {
  const angleRad = (SPOKE_ANGLES_DEG[module] * Math.PI) / 180;
  const r = MAX_RADIUS * Math.max(0, Math.min(1, normalized));
  return {
    x: CENTER + r * Math.cos(angleRad),
    y: CENTER - r * Math.sin(angleRad),
  };
}

function spokeEdge(module: CModule) {
  return spokePoint(module, 1);
}

export const PulseCompass: React.FC = () => {
  const [timeRange, setTimeRange] = useState<PulseTimeRange>('24h');
  const [scope, setScope] = useState<PulseScope>('platform');
  const [openModule, setOpenModule] = useState<CModule | null>(null);

  const { data: slices, isLoading } = useFiveCsPulse(timeRange, scope);

  const byModule = useMemo(() => {
    const map = new Map<CModule, PulseSlice>();
    (slices ?? []).forEach((s) => map.set(s.c_module, s));
    return map;
  }, [slices]);

  const max = useMemo(() => Math.max(1, ...(slices ?? []).map((s) => s.event_count)), [slices]);
  const totalCount = useMemo(
    () => (slices ?? []).reduce((sum, s) => sum + s.event_count, 0),
    [slices]
  );
  const isEmpty = totalCount === 0;

  // Build polygon points (always render — empty state collapses to tiny shape at center).
  const polygonPoints = MODULE_ORDER.map((m) => {
    const count = byModule.get(m)?.event_count ?? 0;
    const normalized = isEmpty ? 0.06 : count / max;
    const p = spokePoint(m, Math.max(0.04, normalized));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  return (
    <section
      aria-label="Five C's Pulse"
      className="bg-card rounded-dna-xl shadow-dna-1 overflow-hidden"
    >
      {/* Kente top-stripe: hard color stops, no smoothing */}
      <div
        aria-hidden="true"
        className="h-1 w-full"
        style={{
          background:
            'linear-gradient(90deg,' +
            ' hsl(var(--dna-emerald)) 0%, hsl(var(--dna-emerald)) 20%,' +
            ' hsl(var(--dna-copper)) 20%, hsl(var(--dna-copper)) 28%,' +
            ' hsl(var(--dna-forest)) 28%, hsl(var(--dna-forest)) 44%,' +
            ' hsl(var(--dna-emerald)) 44%, hsl(var(--dna-emerald)) 56%,' +
            ' hsl(var(--dna-copper)) 56%, hsl(var(--dna-copper)) 66%,' +
            ' hsl(var(--dna-forest)) 66%, hsl(var(--dna-forest)) 84%,' +
            ' hsl(var(--dna-emerald)) 84%, hsl(var(--dna-emerald)) 92%,' +
            ' hsl(var(--dna-copper)) 92%, hsl(var(--dna-copper)) 100%)',
        }}
      />
      <div className="p-3.5 space-y-3">
      {/* Header */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-full bg-[hsl(var(--dna-emerald)/0.10)]">
            <Activity className="h-3.5 w-3.5 text-dna-emerald" />
          </div>
          <h3 className="font-heritage text-sm font-semibold text-foreground truncate">
            Five C&apos;s Pulse
          </h3>
        </div>
        <SegmentedToggle
          value={timeRange}
          onChange={(v) => setTimeRange(v as PulseTimeRange)}
          options={TIME_OPTIONS}
          ariaLabel="Time range"
        />
      </header>

      {/* Scope */}
      <SegmentedToggle
        value={scope}
        onChange={(v) => setScope(v as PulseScope)}
        options={SCOPE_OPTIONS}
        ariaLabel="Scope"
        full
      />

      {/* Radial compass */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            width="100%"
            height="200"
            role="img"
            aria-label="Five C's activity compass"
            className="overflow-visible"
          >
            {/* Concentric guide rings */}
            {[0.33, 0.66, 1].map((r) => (
              <circle
                key={r}
                cx={CENTER}
                cy={CENTER}
                r={MAX_RADIUS * r}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
            ))}

            {/* Spokes */}
            {MODULE_ORDER.map((m) => {
              const edge = spokeEdge(m);
              return (
                <line
                  key={m}
                  x1={CENTER}
                  y1={CENTER}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Activity polygon */}
            <polygon
              points={polygonPoints}
              fill="hsl(var(--dna-emerald) / 0.18)"
              stroke="hsl(var(--dna-emerald))"
              strokeWidth={1.5}
              strokeLinejoin="round"
              style={{ transition: 'all 500ms ease' }}
            />

            {/* Module dots + click targets */}
            {MODULE_ORDER.map((m) => {
              const slice = byModule.get(m);
              const count = slice?.event_count ?? 0;
              const normalized = isEmpty ? 0.06 : Math.max(0.04, count / max);
              const p = spokePoint(m, normalized);
              const visual = MODULE_VISUALS[m];
              const labelP = spokePoint(m, 1.18);
              return (
                <g key={m}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={`hsl(${visual.hsl})`}
                  />
                  <text
                    x={labelP.x}
                    y={labelP.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill="hsl(var(--muted-foreground))"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {visual.short}
                  </text>
                  {/* Invisible click target */}
                  <Popover
                    open={openModule === m}
                    onOpenChange={(o) => setOpenModule(o ? m : null)}
                  >
                    <PopoverTrigger asChild>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={14}
                        fill="transparent"
                        className="cursor-pointer"
                        aria-label={`${visual.label}: ${count} events`}
                      />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="w-64 p-0">
                      <BreakdownPanel
                        cModule={m}
                        timeRange={timeRange}
                        scope={scope}
                        eventCount={count}
                        uniqueUsers={slice?.unique_users ?? 0}
                      />
                    </PopoverContent>
                  </Popover>
                </g>
              );
            })}

            {/* Center marker */}
            <circle cx={CENTER} cy={CENTER} r={3} fill="hsl(var(--dna-emerald))" />
          </svg>

          {/* Empty-state overlay */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-2">
              <p className="text-[11px] text-muted-foreground text-center max-w-[160px] leading-tight">
                Take your first action to start your pulse
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compact stat strip */}
      {!isLoading && (
        <div className="grid grid-cols-5 gap-1 pt-1 border-t border-border/40">
          {MODULE_ORDER.map((m) => {
            const slice = byModule.get(m);
            const count = slice?.event_count ?? 0;
            const visual = MODULE_VISUALS[m];
            return (
              <button
                key={m}
                onClick={() => setOpenModule(m)}
                className="flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-muted/40 transition-colors"
                aria-label={`${visual.label} stats`}
              >
                <visual.Icon className="h-3 w-3" style={{ color: `hsl(${visual.hsl})` }} />
                <span className="text-[10px] font-semibold text-foreground leading-none tabular-nums">
                  {compactNumber(count)}
                </span>
                <DeltaPill delta={slice?.delta_vs_prior_period ?? 0} />
              </button>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
};

// ── Sub-components ────────────────────────────────────────────────────

function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

const DeltaPill: React.FC<{ delta: number }> = ({ delta }) => {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center text-[9px] text-muted-foreground">
        <Minus className="h-2 w-2" />
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[9px] font-medium',
        positive ? 'text-dna-emerald' : 'text-destructive'
      )}
    >
      {positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
      {Math.abs(Math.round(delta))}%
    </span>
  );
};

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  full?: boolean;
}

function SegmentedToggle<T extends string>({ value, onChange, options, ariaLabel, full }: SegmentedToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-full bg-muted p-0.5 text-[11px] font-medium',
        full && 'flex w-full'
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'px-2.5 py-1 rounded-full transition-colors',
              full && 'flex-1',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const BreakdownPanel: React.FC<{
  cModule: CModule;
  timeRange: PulseTimeRange;
  scope: PulseScope;
  eventCount: number;
  uniqueUsers: number;
}> = ({ cModule, timeRange, scope, eventCount, uniqueUsers }) => {
  const navigate = useNavigate();
  const visual = MODULE_VISUALS[cModule];
  const { data, isLoading } = usePulseBreakdown(cModule, timeRange, scope);
  const { data: userTotals } = useUserPulseTotals(cModule, scope === 'user');

  const METRIC_LABELS: Record<string, { first: string; second: string }> = {
    connect: { first: 'Connections', second: scope === 'user' ? 'Pending' : 'People' },
    convene: { first: scope === 'user' ? 'Hosting' : 'Events', second: 'RSVPs' },
    collaborate: { first: 'Spaces', second: scope === 'user' ? 'Tasks' : 'Members' },
    contribute: { first: scope === 'user' ? 'Needs' : 'Opportunities', second: scope === 'user' ? 'Offers' : 'Applicants' },
    convey: { first: 'Posts', second: 'Engagements' },
  };
  const labels = METRIC_LABELS[cModule] ?? { first: 'Events', second: 'People' };

  const firstValue = scope === 'user' && userTotals ? userTotals.first : eventCount;
  const secondValue = scope === 'user' && userTotals ? userTotals.second : uniqueUsers;

  return (
    <div className="p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <visual.Icon className="h-4 w-4" style={{ color: `hsl(${visual.hsl})` }} />
        <h4 className="text-sm font-semibold">{visual.label}</h4>
      </div>
      {(() => {
        const TILE_ROUTES: Record<string, { first: string; second: string }> = {
          connect: { first: '/dna/connect/network', second: scope === 'user' ? '/dna/connect/network?filter=pending' : '/dna/connect/discover' },
          convene: { first: scope === 'user' ? '/dna/convene/my-events' : '/dna/convene', second: '/dna/convene/my-events' },
          collaborate: { first: scope === 'user' ? '/dna/collaborate/my-spaces' : '/dna/collaborate', second: '/dna/collaborate' },
          contribute: { first: '/dna/contribute', second: '/dna/contribute/my' },
          convey: { first: '/dna/convey', second: '/dna/convey' },
        };
        const routes = TILE_ROUTES[cModule] ?? { first: '/dna/feed', second: '/dna/feed' };
        const tile = (label: string, value: number, to: string) => (
          <button
            type="button"
            onClick={() => navigate(to)}
            aria-label={`${label}: ${value}. Open details`}
            className="rounded-md bg-muted/50 hover:bg-muted p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
          >
            <p className="text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{compactNumber(value)}</p>
          </button>
        );
        return (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {tile(labels.first, firstValue, routes.first)}
            {tile(labels.second, secondValue, routes.second)}
          </div>
        );
      })()}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Top activities
        </p>
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : data && data.length > 0 ? (
          <ul className="space-y-1">
            {data.slice(0, 5).map((row) => (
              <li
                key={row.event_type}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-foreground truncate">{row.display_label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {compactNumber(row.event_count)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          (() => {
            const evergreen: Record<string, { body: string; cta: string; route: string }> = {
              connect: { body: 'Send your first connection request to spark activity here.', cta: 'Discover people →', route: '/dna/connect/discover' },
              convene: { body: 'RSVP to an upcoming event or create your own.', cta: 'Browse events →', route: '/dna/convene' },
              collaborate: { body: 'Join a space or start one with your network.', cta: 'Explore spaces →', route: '/dna/collaborate' },
              contribute: { body: 'Browse opportunities or post one for the diaspora.', cta: 'View opportunities →', route: '/dna/contribute' },
              convey: { body: 'Share an update, story, or insight to start conversation.', cta: 'Start a post →', route: '/dna/feed?compose=post' },
            };
            const e = evergreen[cModule];
            return (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground leading-snug">{e.body}</p>
                <button
                  onClick={() => navigate(e.route)}
                  className="text-xs font-medium text-dna-emerald hover:underline text-left"
                >
                  {e.cta}
                </button>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
