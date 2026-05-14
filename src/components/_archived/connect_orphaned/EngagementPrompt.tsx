import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

interface EngagementPromptProps {
  type: 'profile_completion' | 'first_connection' | 'join_event' | 'network_growth';
  profileCompletion?: number;
  connectionCount?: number;
  className?: string;
}

export const EngagementPrompt: React.FC<EngagementPromptProps> = ({
  type,
  profileCompletion = 0,
  connectionCount = 0,
  className,
}) => {
  const navigate = useNavigate();

  const prompts = {
    profile_completion: {
      icon: Sankofa,
      title: 'Complete your profile to unlock features',
      description: `You're just ${100 - profileCompletion}% away from full platform access`,
      action: 'Complete Now',
      onClick: () => navigate('/dna/profile/edit'),
      gradient: 'from-dna-emerald/10 to-dna-forest/10',
      border: 'border-dna-emerald',
    },
    first_connection: {
      icon: Users,
      title: 'Your network is growing!',
      description: 'Connect with 3 people to unlock personalized recommendations',
      action: 'Discover People',
      onClick: () => navigate('/dna/connect'),
      gradient: 'from-dna-copper/10 to-dna-gold/10',
      border: 'border-dna-copper',
    },
    join_event: {
      icon: Calendar,
      title: 'Join your first event',
      description: 'Discover events happening in your community this week',
      action: 'Browse Events',
      onClick: () => navigate('/dna/convene/events'),
      gradient: 'from-blue-50 to-copper-50',
      border: 'border-blue-200',
    },
    network_growth: {
      icon: TrendingUp,
      title: 'Expand your network',
      description: `You have ${connectionCount} connections. Discover more professionals in your field`,
      action: 'Find Connections',
      onClick: () => navigate('/dna/connect'),
      gradient: 'from-copper-50 to-copper-50',
      border: 'border-copper-200',
    },
  };

  const prompt = prompts[type];
  const Icon = prompt.icon;

  // Don't show profile completion prompt if already high
  if (type === 'profile_completion' && profileCompletion >= 90) return null;
  
  // Don't show first connection if user has connections
  if (type === 'first_connection' && connectionCount >= 3) return null;

  return (
    <Card className={cn(
      `bg-gradient-to-r ${prompt.gradient} ${prompt.border} transition-all duration-150 hover:shadow-lg`,
      className
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 text-dna-emerald mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{prompt.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {prompt.description}
            </p>
            <Button 
              size="sm" 
              className="mt-3"
              onClick={prompt.onClick}
            >
              {prompt.action}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
