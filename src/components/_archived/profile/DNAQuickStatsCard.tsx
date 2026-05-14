
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Award, TrendingUp } from 'lucide-react';

interface DNAQuickStatsCardProps {
  profile: any;
}

const DNAQuickStatsCard: React.FC<DNAQuickStatsCardProps> = ({ profile }) => {
  const stats = [
    {
      icon: Users,
      label: 'Network',
      value: profile?.followers_count || 0,
      description: 'connections'
    },
    {
      icon: Calendar,
      label: 'Experience',
      value: profile?.years_experience || 0,
      description: 'years'
    },
    {
      icon: Award,
      label: 'Impact Areas',
      value: profile?.impact_areas?.length || 0,
      description: 'areas'
    },
    {
      icon: TrendingUp,
      label: 'Engagement',
      value: '4.8',
      description: 'rating'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-dna-forest">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center p-3 rounded-lg bg-neutral-50">
                <IconComponent className="w-6 h-6 mx-auto mb-2 text-dna-copper" />
                <div className="text-2xl font-bold text-dna-forest">{stat.value}</div>
                <div className="text-xs text-neutral-600">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DNAQuickStatsCard;
