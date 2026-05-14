
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, Users, Award } from 'lucide-react';

interface DNARecentActivityCardProps {
  isOwnProfile: boolean;
  profile?: any;
}

const DNARecentActivityCard: React.FC<DNARecentActivityCardProps> = ({
  isOwnProfile,
  profile
}) => {
  // Sample recent activities - in a real app, this would come from a user activity log
  const recentActivities = [
    {
      type: 'community',
      icon: Users,
      action: 'Joined Tech Innovators community',
      time: '2 days ago'
    },
    {
      type: 'event',
      icon: Calendar,
      action: 'Registered for African Diaspora Summit',
      time: '1 week ago'
    },
    {
      type: 'achievement',
      icon: Award,
      action: 'Completed profile setup',
      time: '2 weeks ago'
    }
  ];

  if (isOwnProfile) {
    return null; // Don't show on own profile
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-dna-forest flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-dna-emerald/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-4 h-4 text-dna-emerald" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800">{activity.action}</p>
                  <span className="text-xs text-neutral-500">{activity.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DNARecentActivityCard;
