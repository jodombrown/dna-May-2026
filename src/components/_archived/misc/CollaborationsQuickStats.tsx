
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Globe, DollarSign, TrendingUp } from 'lucide-react';
import { CollaborationStats } from '@/types/collaborationTypes';

interface CollaborationsQuickStatsProps {
  stats: CollaborationStats;
}

const CollaborationsQuickStats: React.FC<CollaborationsQuickStatsProps> = ({ stats }) => {
  const statItems = [
    {
      icon: <TrendingUp className="w-6 h-6 text-dna-emerald" />,
      label: "Active Projects",
      value: stats.total_projects.toString(),
      description: "High-impact initiatives"
    },
    {
      icon: <Users className="w-6 h-6 text-dna-copper" />,
      label: "Active Collaborators",
      value: stats.active_collaborators.toString(),
      description: "Diaspora members contributing"
    },
    {
      icon: <Globe className="w-6 h-6 text-dna-gold" />,
      label: "Countries Involved",
      value: stats.countries_involved.toString(),
      description: "Across Africa and diaspora"
    },
    {
      icon: <DollarSign className="w-6 h-6 text-dna-forest" />,
      label: "Total Funding",
      value: stats.total_funding,
      description: "Mobilized for impact"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-neutral-50 rounded-lg">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              <p className="text-sm font-medium text-neutral-700 mt-1">{stat.label}</p>
              <p className="text-xs text-neutral-500 mt-1">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CollaborationsQuickStats;
