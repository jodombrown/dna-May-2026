
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { platformData } from '@/data/platformData';

const chartConfig = {
  count: {
    label: "Action Count",
    color: "#459c71",
  },
};

const UserJourney = () => {
  return (
    <div className="space-y-6">
      {/* Chart showing action counts by stage */}
      <div className="h-64">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData.user_journey}>
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-4">
        {platformData.user_journey.map((stage, index) => (
          <div key={index} className="bg-dna-mint/20 p-4 rounded-lg">
            <h4 className="font-medium text-dna-forest mb-2">{stage.stage}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {stage.actions.map((action, actionIndex) => (
                <div key={actionIndex} className="text-neutral-600">
                  • {action}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserJourney;
