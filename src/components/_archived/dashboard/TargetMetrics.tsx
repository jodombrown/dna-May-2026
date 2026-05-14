
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { platformData } from '@/data/platformData';

const chartConfig = {
  current: {
    label: "Current",
    color: "#459c71",
  },
  target: {
    label: "Target",
    color: "#183c2e",
  },
};

const TargetMetrics = () => {
  return (
    <div className="space-y-6">
      {/* Bar Chart Comparison */}
      <div className="h-64">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData.target_metrics} layout="horizontal">
              <XAxis type="number" />
              <YAxis 
                dataKey="metric" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={120}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString() : value, 
                  name
                ]}
              />
              <Bar dataKey="current" fill="var(--color-current)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="target" fill="var(--color-target)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Progress Breakdown */}
      <div className="space-y-4">
        {platformData.target_metrics.map((metric, index) => {
          const progress = (metric.current / metric.target) * 100;
          const isPercentageMetric = metric.metric.includes('%');
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-dna-forest">{metric.metric}</span>
                <span className="text-sm text-neutral-600">{metric.timeframe}</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-dna-emerald font-medium">
                  Current: {metric.current.toLocaleString()}{isPercentageMetric ? '%' : ''}
                </span>
                <span className="text-dna-forest font-medium">
                  Target: {metric.target.toLocaleString()}{isPercentageMetric ? '%' : ''}
                </span>
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  progress >= 80 ? 'bg-dna-emerald text-white' :
                  progress >= 60 ? 'bg-dna-gold text-dna-forest' :
                  'bg-dna-copper text-white'
                }`}>
                  {progress.toFixed(1)}% Complete
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Growth Insights */}
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="text-center p-4 bg-dna-forest/5 rounded-lg">
          <div className="text-xl font-bold text-dna-forest">12.5%</div>
          <div className="text-sm text-neutral-600">Monthly User Growth Rate</div>
        </div>
      </div>
    </div>
  );
};

export default TargetMetrics;
