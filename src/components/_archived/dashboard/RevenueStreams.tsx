
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { platformData } from '@/data/platformData';

const chartConfig = {
  "Membership Fees": {
    label: "Membership Fees",
    color: "#183c2e",
  },
  "Transaction Fees": {
    label: "Transaction Fees", 
    color: "#d88d4e",
  },
  "Educational Services": {
    label: "Educational Services",
    color: "#459c71",
  },
  "Partnership Revenue": {
    label: "Partnership Revenue",
    color: "#abddd6",
  },
  "Premium Features": {
    label: "Premium Features",
    color: "#e6bc2e",
  },
};

// DNA brand colors for better visual consistency
const DNA_COLORS = ['#183c2e', '#d88d4e', '#459c71', '#abddd6', '#e6bc2e'];

const RevenueStreams = () => {
  const totalRevenue = platformData.revenue_streams.reduce((sum, stream) => sum + stream.monthly_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="h-64">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData.revenue_streams}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="monthly_revenue"
                nameKey="stream"
              >
                {platformData.revenue_streams.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DNA_COLORS[index % DNA_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Revenue Breakdown */}
      <div className="space-y-3">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-dna-forest">
            ${totalRevenue.toLocaleString()}/month
          </div>
          <div className="text-sm text-neutral-600">Total Monthly Revenue Target</div>
        </div>
        
        {platformData.revenue_streams.map((stream, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: DNA_COLORS[index] }}
              />
              <span className="font-medium">{stream.stream}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-dna-forest">${stream.monthly_revenue.toLocaleString()}</div>
              <div className="text-sm text-neutral-600">{stream.percentage}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-200">
        <div className="text-center p-3 bg-dna-mint/20 rounded-lg">
          <div className="text-lg font-bold text-dna-forest">85%</div>
          <div className="text-sm text-neutral-600">Project Success Rate</div>
        </div>
        <div className="text-center p-3 bg-dna-mint/20 rounded-lg">
          <div className="text-lg font-bold text-dna-forest">$52K</div>
          <div className="text-sm text-neutral-600">Avg Investment</div>
        </div>
      </div>
    </div>
  );
};

export default RevenueStreams;
