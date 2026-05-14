/**
 * Five C's Impact Radar — Pentagon/radar chart visualization.
 *
 * Renders a radar chart showing the user's impact score across
 * Connect, Convene, Collaborate, Contribute, and Convey.
 * Uses the color scheme from PRD Section 6.1.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FiveCImpactScore, CModule } from '@/types/profileIdentityHub';
import { PROFILE_LAYOUT } from '@/types/profileIdentityHub';

interface FiveCImpactRadarProps {
  impactScore: FiveCImpactScore;
  size?: number;
  showDetails?: boolean;
}

const C_LABELS: Record<CModule, string> = {
  connect: 'Connect',
  convene: 'Convene',
  collaborate: 'Collaborate',
  contribute: 'Contribute',
  convey: 'Convey',
};

const C_ORDER: CModule[] = ['connect', 'convene', 'collaborate', 'contribute', 'convey'];

const C_ROUTES: Record<CModule, string> = {
  connect: '/dna/connect/network',
  convene: '/dna/convene/my-events',
  collaborate: '/dna/collaborate/my-spaces',
  contribute: '/dna/contribute/my',
  convey: '/dna/convey',
};

export const FiveCImpactRadar: React.FC<FiveCImpactRadarProps> = ({
  impactScore,
  size: sizeProp,
  showDetails = true,
}) => {
  const navigate = useNavigate();
  const { impactRadar } = PROFILE_LAYOUT;
  const size = sizeProp ?? impactRadar.size.desktop;
  const center = size / 2;
  const radius = (size / 2) - 30;

  // Generate polygon points for the pentagon background levels
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2; // Top

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = startAngle + index * angleStep;
    const r = radius * value;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const levelPolygons = useMemo(() =>
    levels.map((level) => {
      const points = C_ORDER.map((_, i) => getPoint(i, level));
      return points.map((p) => `${p[0]},${p[1]}`).join(' ');
    }),
    [size]
  );

  // Data polygon
  const dataPoints = useMemo(() => {
    const scores = C_ORDER.map((c) => (impactScore[c] ?? 0) / 100);
    const points = scores.map((score, i) => getPoint(i, Math.max(score, 0.02)));
    return points.map((p) => `${p[0]},${p[1]}`).join(' ');
  }, [impactScore, size]);

  // Label positions
  const labelPositions = useMemo(() =>
    C_ORDER.map((c, i) => {
      const [x, y] = getPoint(i, 1.2);
      return { module: c, x, y, label: C_LABELS[c] };
    }),
    [size]
  );

  const trendIcon =
    impactScore.trend === 'rising' ? <TrendingUp className="w-3.5 h-3.5" /> :
    impactScore.trend === 'declining' ? <TrendingDown className="w-3.5 h-3.5" /> :
    <Minus className="w-3.5 h-3.5" />;

  const trendColor =
    impactScore.trend === 'rising' ? 'text-emerald-600' :
    impactScore.trend === 'declining' ? 'text-red-500' :
    'text-neutral-500';

  return (
    <div className="flex flex-col items-center">
      {/* Overall score */}
      <div className="text-center mb-2">
        <div className="text-3xl font-bold" style={{ color: impactRadar.colors.connect }}>
          {impactScore.overall}
        </div>
        <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
          <span>Impact Score</span>
          <span className={trendColor}>{trendIcon}</span>
        </div>
      </div>

      {/* Radar chart SVG */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid levels */}
        {levelPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {C_ORDER.map((_, i) => {
          const [x, y] = getPoint(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon fill */}
        <polygon
          points={dataPoints}
          fill={impactRadar.colors.connect}
          fillOpacity={impactRadar.fillOpacity}
          stroke={impactRadar.colors.connect}
          strokeWidth={impactRadar.strokeWidth}
        />

        {/* Data points */}
        {C_ORDER.map((c, i) => {
          const score = (impactScore[c] ?? 0) / 100;
          const [x, y] = getPoint(i, Math.max(score, 0.02));
          return (
            <circle
              key={c}
              cx={x}
              cy={y}
              r={4}
              fill={impactRadar.colors[c]}
              stroke="white"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {labelPositions.map(({ module: c, x, y, label }) => (
          <text
            key={c}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-medium cursor-pointer"
            fill={impactRadar.colors[c]}
            onClick={() => navigate(C_ROUTES[c])}
            role="link"
            aria-label={`Open ${label} hub`}
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Detail breakdown */}
      {showDetails && (
        <div className="w-full mt-3 space-y-1.5">
          {C_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`${C_LABELS[c]} score ${impactScore[c] ?? 0}, view hub`}
              onClick={() => navigate(C_ROUTES[c])}
              className="flex items-center gap-2 w-full text-left rounded-md px-1 py-1 hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[36px]"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: impactRadar.colors[c] }}
              />
              <span className="text-xs text-muted-foreground w-20">{C_LABELS[c]}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${impactScore[c] ?? 0}%`,
                    backgroundColor: impactRadar.colors[c],
                  }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">
                {impactScore[c] ?? 0}
              </span>
            </button>
          ))}

          {/* Strongest & Growth */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-100">
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: impactRadar.colors[impactScore.strongestC], color: impactRadar.colors[impactScore.strongestC] }}
            >
              Strongest: {C_LABELS[impactScore.strongestC]}
            </Badge>
            <Badge variant="outline" className="text-[10px] text-neutral-500">
              Grow: {C_LABELS[impactScore.growthOpportunityC]}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiveCImpactRadar;
